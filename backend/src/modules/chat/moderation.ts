import { type LlmProvider } from "@shared/llm/llm.types";
import { logger } from "@shared/utils/logger";

/**
 * A lightweight, prompt-based safety classifier that runs before the main
 * support reply. It reuses the existing LLM provider (no extra API key) and
 * asks the model one focused question: is this message abusive?
 *
 * Why a separate classifier instead of relying on the support prompt alone:
 * the support agent is optimised to be warm and helpful, and that goal
 * conflicts with moderation — it will sometimes rationalise abuse (e.g. accept
 * an offensive phrase as a "name" and echo it back). A classifier with a single
 * job, no competing persona, judges the text far more reliably, including
 * misspelled or transliterated profanity in any language.
 *
 * It is deliberately fail-open: if the classifier errors, times out, or returns
 * anything unexpected, we let the message through to the normal flow. A safety
 * check must never become a way to block real customers.
 */

const CLASSIFIER_SYSTEM_PROMPT = `You are a content-safety classifier for a customer support chat.

Decide whether the user's message contains sexually explicit, harassing, hateful, or abusive language, or profanity/insults directed at a person — in ANY language, including romanized Hindi or other transliterations (for example phrases written in English letters). Treat content as unsafe even when it is misspelled, spaced out, obfuscated, or presented as a "name", nickname, or signature.

Ordinary customer messages — questions, complaints about products or orders, frustration expressed without slurs, casual chat, or genuine personal names — are SAFE.

Respond with exactly one word and nothing else:
- "BLOCK" if the message contains such content.
- "SAFE" otherwise.`;

export const SAFE_DECLINE_REPLY =
  "Let's keep things respectful. I'm here to help with anything about Nova Gear — products, orders, shipping, returns, or payments. What can I do for you?";

/**
 * Returns true only when the classifier clearly flags the message as abusive.
 * Any error or unexpected response resolves to false (fail-open).
 */
export const isMessageAbusive = async (
  provider: LlmProvider,
  message: string
): Promise<boolean> => {
  try {
    const result = await provider.generateReply([
      { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
      { role: "user", content: message },
    ]);

    if (!result || result.status !== "ok") return false;

    return result.reply.trim().toUpperCase().startsWith("BLOCK");
  } catch (error) {
    logger.warn("Moderation check failed; allowing message through", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};
