import { KNOWLEDGE_RESULT_LIMIT } from "@config/constants";
import { KNOWLEDGE_BASE } from "./knowledge.data";
import { type KnowledgeEntry } from "./knowledge.types";

const MIN_TOKEN_LENGTH = 3;
const FUZZY_MIN_LENGTH = 4;

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

const withinOneEdit = (a: string, b: string): boolean => {
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < lenA && j < lenB) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (lenA > lenB) i += 1;
    else if (lenB > lenA) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  if (i < lenA || j < lenB) edits += 1;
  return edits <= 1;
};

const isAdjacentTransposition = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  const diffs: number[] = [];
  for (let k = 0; k < a.length; k += 1) {
    if (a[k] !== b[k]) diffs.push(k);
    if (diffs.length > 2) return false;
  }
  if (diffs.length !== 2) return false;
  const [x, y] = diffs;
  return y === x + 1 && a[x] === b[y] && a[y] === b[x];
};

const tokensMatch = (a: string, b: string): boolean => {
  if (a === b || a.startsWith(b) || b.startsWith(a)) return true;
  if (a.length >= FUZZY_MIN_LENGTH && b.length >= FUZZY_MIN_LENGTH) {
    return withinOneEdit(a, b) || isAdjacentTransposition(a, b);
  }
  return false;
};

const matchesToken = (queryTokens: string[], term: string): boolean =>
  queryTokens.some((queryToken) => tokensMatch(queryToken, term));

const matchesKeyword = (queryTokens: string[], keyword: string): boolean =>
  tokenize(keyword).every((term) => matchesToken(queryTokens, term));

const scoreEntry = (entry: KnowledgeEntry, queryTokens: string[]): number => {
  let score = 0;
  for (const keyword of entry.keywords) {
    if (matchesKeyword(queryTokens, keyword)) {
      score += keyword.includes(" ") ? 3 : 1;
    }
  }
  if (matchesToken(queryTokens, entry.category)) {
    score += 2;
  }
  return score;
};

export const findRelevantEntries = (
  message: string,
  limit: number = KNOWLEDGE_RESULT_LIMIT
): KnowledgeEntry[] => {
  const queryTokens = tokenize(message);
  if (queryTokens.length === 0) return [];

  return KNOWLEDGE_BASE.map((entry) => ({
    entry,
    score: scoreEntry(entry, queryTokens),
  }))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => scored.entry);
};

export const buildKnowledgeContext = (entries: KnowledgeEntry[]): string => {
  const source = entries.length > 0 ? entries : KNOWLEDGE_BASE;
  return source
    .map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`)
    .join("\n\n");
};
