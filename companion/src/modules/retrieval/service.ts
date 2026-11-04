import type { EmbeddingProvider } from "./embedding-provider";
import { embeddingsForRecords, listRetrievalRecords } from "./repository";
import type { RetrievalFilters, RetrievalHit, RetrievalRecord } from "./types";

const stopWords = new Set([
  "a", "about", "an", "and", "are", "can", "do", "for", "i", "in",
  "is", "me", "my", "need", "of", "please", "the", "to", "want", "with",
]);

const genericTerms = new Set([
  "apply", "application", "assistance", "california", "county", "find",
  "get", "help", "how", "local", "los", "angeles", "official", "request",
  "resource", "resources", "service", "services", "start", "where",
]);

const MIN_LEXICAL_SCORE = 0.12;
const MIN_SEMANTIC_SCORE = 0.62;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

export function lexicalScore(query: string, record: RetrievalRecord): number {
  const allQueryTerms = new Set(tokenize(query));
  if (allQueryTerms.size === 0) return 0;
  const specificTerms = [...allQueryTerms].filter((term) => !genericTerms.has(term));
  const queryTerms = new Set(specificTerms.length > 0 ? specificTerms : allQueryTerms);

  const title = new Set(tokenize(`${record.sourceTitle} ${record.sectionLabel}`));
  const tags = new Set(record.topicTags.flatMap(tokenize));
  const body = new Set(tokenize(record.text));
  let score = 0;
  for (const term of queryTerms) {
    if (title.has(term)) score += 3;
    if (tags.has(term)) score += 2;
    if (body.has(term)) score += 1;
  }
  const aliases = Array.isArray(record.metadata.aliases)
    ? record.metadata.aliases.filter((value): value is string => typeof value === "string")
    : [];
  const normalizedQuery = tokenize(query).join(" ");
  const aliasMatched = aliases.some((alias) => {
    const normalizedAlias = tokenize(alias).join(" ");
    return normalizedAlias.length > 2 && (
      normalizedQuery.includes(normalizedAlias) ||
      normalizedAlias.includes(normalizedQuery)
    );
  });
  return Math.min(1, score / (queryTerms.size * 6) + (aliasMatched ? 0.5 : 0));
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

export async function retrieve(
  query: string,
  filters: RetrievalFilters,
  options: { limit?: number; embeddingProvider?: EmbeddingProvider | null } = {},
): Promise<RetrievalHit[]> {
  const limit = Math.max(1, Math.min(options.limit ?? 5, 20));
  const records = listRetrievalRecords(filters);
  const lexical = new Map(records.map((record) => [record.id, lexicalScore(query, record)]));

  const provider = options.embeddingProvider;
  if (!provider) {
    return records
      .map((record) => ({ record, score: lexical.get(record.id) ?? 0, matchMode: "lexical" as const }))
      .filter((hit) => hit.score >= MIN_LEXICAL_SCORE)
      .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
      .slice(0, limit);
  }

  const stored = embeddingsForRecords(
    records.map((record) => record.id),
    provider.provider,
    provider.model,
  );
  const [queryVector] = await provider.embed([query]);
  return records
    .map((record) => {
      const embedding = stored.get(record.id);
      const semantic = embedding && embedding.textHash === record.textHash
        ? Math.max(0, cosineSimilarity(queryVector, embedding.vector))
        : 0;
      const lexicalValue = lexical.get(record.id) ?? 0;
      const semanticRelevant = semantic >= MIN_SEMANTIC_SCORE;
      return {
        record,
        score: semantic * 0.7 + lexicalValue * 0.3,
        matchMode: semantic > 0 ? "hybrid" as const : "lexical" as const,
        relevant: lexicalValue >= MIN_LEXICAL_SCORE || semanticRelevant,
      };
    })
    .filter((hit) => hit.relevant)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .slice(0, limit);
}
