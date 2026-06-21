import { type Message } from "@prisma/client";
import createHttpError from "http-errors";
import {
  FRIENDLY_LLM_TIMEOUT_MESSAGE,
  FRIENDLY_LLM_UNAVAILABLE_MESSAGE,
  HISTORY_LIMIT,
} from "@config/constants";
import { prisma } from "@shared/services/prisma.service";
import { resolveLlmProvider } from "@shared/llm";
import { logger, toErrorMessage } from "@shared/utils/logger";
import { type ChatTurn } from "@shared/llm/llm.types";
import {
  buildKnowledgeContext,
  findRelevantEntries,
} from "@modules/knowledge/knowledge.service";
import { SUPPORT_EMAIL } from "@modules/knowledge/knowledge.data";
import { type KnowledgeEntry } from "@modules/knowledge/knowledge.types";
import { buildChatMessages } from "./chat.prompt";
import {
  type ConversationHistory,
  type SendMessageResult,
  type StreamEvent,
} from "./chat.types";

const toChatTurns = (messages: Message[]): ChatTurn[] =>
  messages.map((message) => ({
    role: message.sender,
    content: message.content,
  }));

const GREETING_PATTERN =
  /^(hi+|hey+|hello+|hiya|howdy|yo|sup|greetings|good\s+(morning|afternoon|evening|day))(\s+(there|everyone|all|folks|team|guys))?[\s!.,]*$/i;

const THANKS_PATTERN =
  /^(thanks|thank\s+you|thx|ty|cheers|much\s+appreciated|appreciate\s+it)[\s!.,]*$/i;

const GREETING_REPLY =
  "Hi there! 👋 I'm the Nova Gear support assistant. I can help with shipping, returns, refunds, warranty, payments, and order questions. What can I help you with?";

const THANKS_REPLY =
  "You're welcome! Is there anything else I can help you with — shipping, returns, or an order question?";

const NO_MATCH_REPLY =
  `I'm not sure about that one specifically, but I can help with our products, shipping, returns and refunds, warranty, payments, and tracking or changing an order. Try asking about one of those, or email our team at ${SUPPORT_EMAIL} and they'll be glad to help.`;

const composeOfflineReply = (
  message: string,
  entries: KnowledgeEntry[]
): string => {
  const trimmed = message.trim();
  if (GREETING_PATTERN.test(trimmed)) return GREETING_REPLY;
  if (THANKS_PATTERN.test(trimmed)) return THANKS_REPLY;
  if (entries.length === 0) return NO_MATCH_REPLY;
  return entries[0].answer;
};

const TITLE_MAX_LENGTH = 60;

const deriveTitle = (message: string): string => {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (cleaned.length <= TITLE_MAX_LENGTH) return cleaned;
  return `${cleaned.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`;
};

const findOrCreateConversation = async (message: string, sessionId?: string) => {
  if (sessionId) {
    const existing = await prisma.conversation.findUnique({
      where: { id: sessionId },
    });
    if (existing) return existing;
  }
  return prisma.conversation.create({
    data: { title: deriveTitle(message) || null },
  });
};

interface ChatContext {
  conversationId: string;
  history: Message[];
  knowledgeContext: string;
  relevantEntries: KnowledgeEntry[];
}

const prepareContext = async (
  message: string,
  sessionId?: string
): Promise<ChatContext> => {
  const conversation = await findOrCreateConversation(message, sessionId);
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  const relevantEntries = findRelevantEntries(message);
  return {
    conversationId: conversation.id,
    history,
    knowledgeContext: buildKnowledgeContext(relevantEntries),
    relevantEntries,
  };
};

const persistTurn = (
  conversationId: string,
  userMessage: string,
  assistantReply: string
): Promise<unknown> =>
  prisma.$transaction([
    prisma.message.create({
      data: { conversationId, sender: "user", content: userMessage },
    }),
    prisma.message.create({
      data: { conversationId, sender: "assistant", content: assistantReply },
    }),
  ]);

const safePersistTurn = async (
  conversationId: string,
  userMessage: string,
  assistantReply: string
): Promise<void> => {
  try {
    await persistTurn(conversationId, userMessage, assistantReply);
  } catch (error) {
    logger.error("Failed to persist streamed turn after delivery", {
      conversationId,
      error: toErrorMessage(error),
    });
  }
};

export const sendMessage = async (
  rawMessage: string,
  sessionId?: string
): Promise<SendMessageResult> => {
  const message = rawMessage.trim();
  const { conversationId, history, knowledgeContext, relevantEntries } =
    await prepareContext(message, sessionId);

  const provider = resolveLlmProvider();
  let reply: string;
  let degraded = false;

  if (!provider) {
    reply = composeOfflineReply(message, relevantEntries);
    degraded = true;
  } else {
    const result = await provider.generateReply(
      buildChatMessages(knowledgeContext, toChatTurns(history), message)
    );
    if (result.status !== "ok") {
      throw createHttpError(503, {
        message:
          result.status === "timeout"
            ? FRIENDLY_LLM_TIMEOUT_MESSAGE
            : FRIENDLY_LLM_UNAVAILABLE_MESSAGE,
      });
    }
    reply = result.reply;
  }

  await persistTurn(conversationId, message, reply);
  return { reply, sessionId: conversationId, degraded };
};

const OFFLINE_CHUNK_SIZE = 3;

async function* streamOfflineReply(
  reply: string
): AsyncGenerator<string> {
  const words = reply.split(" ");
  for (let i = 0; i < words.length; i += OFFLINE_CHUNK_SIZE) {
    const chunk = words.slice(i, i + OFFLINE_CHUNK_SIZE).join(" ");
    yield i === 0 ? chunk : ` ${chunk}`;
    await new Promise((resolve) => setTimeout(resolve, 24));
  }
}

export async function* streamMessage(
  rawMessage: string,
  sessionId?: string
): AsyncGenerator<StreamEvent> {
  const message = rawMessage.trim();
  const { conversationId, history, knowledgeContext, relevantEntries } =
    await prepareContext(message, sessionId);

  yield { type: "session", sessionId: conversationId };

  const provider = resolveLlmProvider();
  let reply = "";

  if (!provider) {
    const offline = composeOfflineReply(message, relevantEntries);
    for await (const chunk of streamOfflineReply(offline)) {
      reply += chunk;
      yield { type: "token", value: chunk };
    }
    await safePersistTurn(conversationId, message, reply);
    yield { type: "done", degraded: true };
    return;
  }

  const llmStream = provider.streamReply(
    buildChatMessages(knowledgeContext, toChatTurns(history), message)
  );

  for await (const chunk of llmStream) {
    if (chunk.type === "token") {
      reply += chunk.value;
      yield { type: "token", value: chunk.value };
    } else if (chunk.type === "timeout" || chunk.type === "error") {
      yield {
        type: "error",
        message:
          chunk.type === "timeout"
            ? FRIENDLY_LLM_TIMEOUT_MESSAGE
            : FRIENDLY_LLM_UNAVAILABLE_MESSAGE,
      };
      return;
    }
  }

  if (reply.trim().length === 0) {
    yield { type: "error", message: FRIENDLY_LLM_UNAVAILABLE_MESSAGE };
    return;
  }

  await safePersistTurn(conversationId, message, reply);
  yield { type: "done", degraded: false };
}

export const getConversationHistory = async (
  sessionId: string
): Promise<ConversationHistory> => {
  const recent = await prisma.message.findMany({
    where: { conversationId: sessionId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  return { messages: recent.reverse(), sessionId };
};
