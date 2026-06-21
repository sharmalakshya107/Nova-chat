export type KnowledgeCategory =
  | "shipping"
  | "returns"
  | "warranty"
  | "payments"
  | "orders"
  | "products"
  | "policies"
  | "support";

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  question: string;
  answer: string;
  keywords: string[];
}
