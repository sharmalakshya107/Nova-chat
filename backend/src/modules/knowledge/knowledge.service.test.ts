import { describe, expect, it } from "vitest";
import { KNOWLEDGE_BASE } from "./knowledge.data";
import {
  buildKnowledgeContext,
  findRelevantEntries,
} from "./knowledge.service";

describe("findRelevantEntries", () => {
  it("matches a shipping question to a shipping entry", () => {
    const results = findRelevantEntries("how long does delivery take?");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].category).toBe("shipping");
  });

  it("matches the assignment examples to the right category", () => {
    expect(
      findRelevantEntries("Do you ship to the USA?").some(
        (entry) => entry.category === "shipping"
      )
    ).toBe(true);
    expect(
      findRelevantEntries("What's your return policy?").some(
        (entry) => entry.category === "returns"
      )
    ).toBe(true);
  });

  it("matches a keyword by word stem rather than raw substring", () => {
    const results = findRelevantEntries("can I ship internationally?");
    expect(results.some((entry) => entry.category === "shipping")).toBe(true);
  });

  it("does not match on incidental substrings like 'us' inside other words", () => {
    const results = findRelevantEntries("I have many questions because");
    expect(results).toEqual([]);
  });

  it("matches a returns question to a returns entry", () => {
    const results = findRelevantEntries("how do I send an item back for a refund?");
    expect(results.some((entry) => entry.category === "returns")).toBe(true);
  });

  it("matches a payment question to a payments entry", () => {
    const results = findRelevantEntries("which credit cards can I pay with?");
    expect(results[0].category).toBe("payments");
  });

  it("matches a 'what do you sell' question to the product catalog", () => {
    const results = findRelevantEntries("what do you sell?");
    expect(results.some((entry) => entry.category === "products")).toBe(true);
  });

  it("matches a specific product query to a product entry", () => {
    const results = findRelevantEntries("do you have a portable speaker?");
    expect(results.some((entry) => entry.id === "products-pulse-speaker")).toBe(
      true
    );
  });

  it("matches a privacy question to a policies entry", () => {
    const results = findRelevantEntries("what is your privacy policy?");
    expect(results.some((entry) => entry.id === "policies-privacy")).toBe(true);
  });

  it("matches a terms and conditions question to a policies entry", () => {
    const results = findRelevantEntries("show me your terms and conditions");
    expect(results.some((entry) => entry.id === "policies-terms")).toBe(true);
  });

  it("respects the result limit", () => {
    const results = findRelevantEntries("shipping returns warranty payment order", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns an empty array when nothing matches", () => {
    const results = findRelevantEntries("what is the meaning of life");
    expect(results).toEqual([]);
  });

  it("still matches a keyword when the query has a typo", () => {
    const results = findRelevantEntries("how long does shippng take?");
    expect(results.some((entry) => entry.category === "shipping")).toBe(true);
  });

  it("tolerates a typo in a returns query", () => {
    const results = findRelevantEntries("what is your retrun policy?");
    expect(results.some((entry) => entry.category === "returns")).toBe(true);
  });

  it("does not fuzzy-match short, distinct words", () => {
    const results = findRelevantEntries("shop");
    expect(results.every((entry) => entry.category !== "shipping")).toBe(true);
  });
});

describe("buildKnowledgeContext", () => {
  it("formats entries as question and answer pairs", () => {
    const entry = KNOWLEDGE_BASE[0];
    const context = buildKnowledgeContext([entry]);
    expect(context).toContain(entry.question);
    expect(context).toContain(entry.answer);
  });

  it("falls back to the full knowledge base when no entries are given", () => {
    const context = buildKnowledgeContext([]);
    expect(context).toContain(KNOWLEDGE_BASE[0].answer);
  });
});
