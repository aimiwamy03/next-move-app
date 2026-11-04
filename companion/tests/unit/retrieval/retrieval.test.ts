import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { closeDatabase } from "@/infrastructure/db/client";
import { searchResources } from "@/modules/resources/service";
import {
  listRetrievalRecords,
  upsertEmbeddings,
  upsertRetrievalRecords,
} from "@/modules/retrieval/repository";
import {
  cosineSimilarity,
  lexicalScore,
  retrieve,
} from "@/modules/retrieval/service";
import type {
  RetrievalRecord,
  StoredEmbedding,
} from "@/modules/retrieval/types";

const indexedAt = "2026-10-24T12:00:00.000Z";

function record(
  id: string,
  overrides: Partial<RetrievalRecord> = {},
): RetrievalRecord {
  return {
    id,
    namespace: "community_resources",
    sourceId: `source-${id}`,
    sourceTitle: `Source ${id}`,
    sourceUrl: `https://example.org/${id}`,
    contentType: "structured_resource",
    language: "en",
    audience: "participant",
    topicTags: [],
    sectionLabel: "Details",
    approvalStatus: "approved",
    reviewedAt: "2026-10-24",
    jurisdiction: "Los Angeles County, CA",
    serviceArea: "Los Angeles County, CA",
    text: "General information",
    textHash: `hash-${id}`,
    metadata: {},
    indexedAt,
    ...overrides,
  };
}

describe("retrieval scoring primitives", () => {
  it("weights a title match above an equivalent tag or body-only match", () => {
    const titleMatch = record("title", { sourceTitle: "Housing navigator" });
    const tagMatch = record("tag", { topicTags: ["housing"] });
    const bodyMatch = record("body", { text: "Housing options are available." });

    expect(lexicalScore("housing", titleMatch)).toBe(0.5);
    expect(lexicalScore("housing", tagMatch)).toBeCloseTo(1 / 3);
    expect(lexicalScore("housing", bodyMatch)).toBeCloseTo(1 / 6);
  });

  it("uses generic help words only when no specific need is present", () => {
    const genericHelp = record("help", {
      sourceTitle: "Community help desk",
      text: "General assistance",
    });
    const employment = record("employment", {
      sourceTitle: "Employment center",
      topicTags: ["employment"],
      text: "Job search and resume support",
    });

    expect(lexicalScore("Find local job help", employment)).toBeGreaterThan(
      lexicalScore("Find local job help", genericHelp),
    );
    expect(lexicalScore("I need help", genericHelp)).toBeGreaterThan(0);
  });

  it("handles zero, orthogonal, opposite, and mismatched vectors", () => {
    expect(cosineSimilarity([3, 4], [3, 4])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1], [1, 2])).toBe(0);
  });
});

describe("retrieval repository and ranking", () => {
  let databaseDirectory: string;
  let originalDatabasePath: string | undefined;
  let originalDemoMode: string | undefined;
  let originalEmbeddingProvider: string | undefined;

  beforeEach(() => {
    closeDatabase();
    originalDatabasePath = process.env.DATABASE_PATH;
    originalDemoMode = process.env.DEMO_MODE;
    originalEmbeddingProvider = process.env.EMBEDDING_PROVIDER;
    databaseDirectory = mkdtempSync(join(tmpdir(), "mindful-reentry-retrieval-"));
    process.env.DATABASE_PATH = join(databaseDirectory, "test.sqlite");
    process.env.DEMO_MODE = "false";
    delete process.env.EMBEDDING_PROVIDER;
  });

  afterEach(() => {
    closeDatabase();
    if (originalDatabasePath === undefined) {
      delete process.env.DATABASE_PATH;
    } else {
      process.env.DATABASE_PATH = originalDatabasePath;
    }
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
    if (originalEmbeddingProvider === undefined) {
      delete process.env.EMBEDDING_PROVIDER;
    } else {
      process.env.EMBEDDING_PROVIDER = originalEmbeddingProvider;
    }
    rmSync(databaseDirectory, { force: true, recursive: true });
  });

  it("returns lexical results in weighted rank order and omits pending content", async () => {
    upsertRetrievalRecords([
      record("title", { sourceTitle: "Housing navigator" }),
      record("tag", { topicTags: ["housing"] }),
      record("body", { text: "Housing options are available." }),
      record("pending", {
        sourceTitle: "Housing crisis response",
        topicTags: ["housing"],
        text: "Housing support",
        approvalStatus: "pending_review",
      }),
      record("demo", {
        sourceId: "demo-resource",
        sourceTitle: "Fictional housing option",
        text: "Housing support for demo purposes.",
        approvalStatus: "demo_only",
        metadata: {
          resourceId: "demo-resource",
          summary: "Fictional demo content.",
          category: "housing",
        },
      }),
    ]);

    const hits = await retrieve(
      "housing",
      { namespace: "community_resources", language: "en" },
      { limit: 10, embeddingProvider: null },
    );

    expect(hits.map((hit) => hit.record.id)).toEqual(["title", "tag", "body"]);
    expect(hits.every((hit) => hit.matchMode === "lexical")).toBe(true);
    expect(hits.every((hit) => hit.record.approvalStatus !== "pending_review")).toBe(
      true,
    );
  });

  it("enforces the requested approval allowlist, including an empty allowlist", () => {
    upsertRetrievalRecords([
      record("approved"),
      record("demo", { approvalStatus: "demo_only" }),
      record("pending", { approvalStatus: "pending_review" }),
    ]);

    const defaults = listRetrievalRecords({ namespace: "community_resources" });
    expect(defaults.map((item) => item.id)).not.toContain("pending");
    expect(
      listRetrievalRecords({
        namespace: "community_resources",
        allowedApprovalStatuses: ["approved", "demo_only"],
      }).map((item) => item.id),
    ).toEqual(["approved", "demo"]);
    expect(
      listRetrievalRecords({
        namespace: "community_resources",
        allowedApprovalStatuses: ["approved"],
      }).map((item) => item.id),
    ).toEqual(["approved"]);
    expect(
      listRetrievalRecords({
        namespace: "community_resources",
        allowedApprovalStatuses: [],
      }),
    ).toEqual([]);
  });

  it("uses only current embeddings and falls back safely for a stale text hash", async () => {
    const current = record("current", {
      text: "No lexical overlap",
      textHash: "current-hash",
    });
    const stale = record("stale", {
      text: "Still no lexical overlap",
      textHash: "new-hash",
    });
    upsertRetrievalRecords([current, stale]);

    const embeddings: StoredEmbedding[] = [
      {
        recordId: current.id,
        provider: "test",
        model: "two-dimensional",
        dimensions: 2,
        vector: [1, 0],
        textHash: current.textHash,
        createdAt: indexedAt,
      },
      {
        recordId: stale.id,
        provider: "test",
        model: "two-dimensional",
        dimensions: 2,
        vector: [1, 0],
        textHash: "old-hash",
        createdAt: indexedAt,
      },
    ];
    upsertEmbeddings(embeddings);

    const hits = await retrieve(
      "unrelated query",
      { namespace: "community_resources" },
      {
        embeddingProvider: {
          provider: "test",
          model: "two-dimensional",
          async embed() {
            return [[1, 0]];
          },
        },
      },
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      record: { id: "current" },
      score: 0.7,
      matchMode: "hybrid",
    });
  });

  it("does not expose a pending resource through the resource service", async () => {
    upsertRetrievalRecords([
      record("approved", {
        sourceId: "approved-resource",
        sourceTitle: "Reviewed housing navigator",
        text: "Housing navigation for participants.",
        metadata: {
          resourceId: "approved-resource",
          summary: "Reviewed housing help.",
          category: "housing",
        },
      }),
      record("pending", {
        sourceId: "pending-resource",
        sourceTitle: "Pending housing option",
        text: "Housing support that has not been reviewed.",
        approvalStatus: "pending_review",
        metadata: {
          resourceId: "pending-resource",
          summary: "Not approved for participants.",
          category: "housing",
        },
      }),
      record("demo-only", {
        sourceId: "demo-resource",
        sourceTitle: "Fictional housing option",
        text: "Housing support for demo purposes.",
        approvalStatus: "demo_only",
        metadata: {
          resourceId: "demo-resource",
          summary: "Fictional demo content.",
          category: "housing",
        },
      }),
    ]);

    const result = await searchResources("housing", 5);

    expect(result.resources.map((item) => item.id)).toEqual([
      "approved-resource",
    ]);
    expect(result.citations.map((item) => item.resourceId)).toEqual([
      "approved-resource",
    ]);
  });

  it("returns food-benefit steps for a food-stamp query and fails closed for unrelated text", async () => {
    process.env.DEMO_MODE = "true";
    const { seedDemoData } = await import("@/infrastructure/db/seed");
    seedDemoData({ pin: "1937" });

    const food = await searchResources("how to request California food stamps");
    expect(food.resources).toHaveLength(1);
    expect(food.resources[0]).toMatchObject({
      id: "calfresh-los-angeles",
      url: "https://benefitscal.com/",
    });
    expect(food.resources[0].steps?.[0]).toContain("BenefitsCal.com");
    expect(food.citations[0].sourceUri).toBe(
      "https://dpss.lacounty.gov/en/food/calfresh.html",
    );

    const unrelated = await searchResources("purple telescope repair manual");
    expect(unrelated.resources).toEqual([]);
  });

  it("returns the birth-certificate procedure rather than a generic document listing", async () => {
    process.env.DEMO_MODE = "true";
    const { seedDemoData } = await import("@/infrastructure/db/seed");
    seedDemoData({ pin: "1937" });

    const result = await searchResources("Request a birth certificate");
    expect(result.resources[0]).toMatchObject({
      id: "birth-certificate-los-angeles",
      title: "Request a Los Angeles County birth certificate",
    });
    expect(result.resources[0].steps).toEqual(
      expect.arrayContaining([
        expect.stringContaining("authorized VitalChek"),
      ]),
    );
  });

  it("returns the official California record-cleaning guide for an expungement question", async () => {
    process.env.DEMO_MODE = "true";
    const { seedDemoData } = await import("@/infrastructure/db/seed");
    seedDemoData({ pin: "1937" });

    const result = await searchResources(
      "How do I clear my criminal record in California?",
    );
    expect(result.resources[0]).toMatchObject({
      id: "california-record-cleaning",
      url: "https://selfhelp.courts.ca.gov/clean-your-record",
    });
    expect(result.resources[0].steps).toEqual(
      expect.arrayContaining([
        expect.stringContaining("case-specific instructions"),
      ]),
    );
  });

  it("retrieves the official California DMV identification-card procedure", async () => {
    process.env.DEMO_MODE = "true";
    const { seedDemoData } = await import("@/infrastructure/db/seed");
    seedDemoData({ pin: "1937" });

    const result = await searchResources(
      "How do I get a California state ID with a reduced fee?",
    );
    expect(result.resources[0]).toMatchObject({
      id: "california-identification-card",
      url: "https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/identification-id-cards/",
    });
    expect(result.resources[0].steps).toEqual(
      expect.arrayContaining([expect.stringContaining("DL 937")]),
    );
  });

  it("retrieves the official Social Security reentry-benefits procedure", async () => {
    process.env.DEMO_MODE = "true";
    const { seedDemoData } = await import("@/infrastructure/db/seed");
    seedDemoData({ pin: "1937" });

    const result = await searchResources(
      "How do I restart SSI after I am released?",
    );
    expect(result.resources[0]).toMatchObject({
      id: "social-security-after-incarceration",
      url: "https://www.ssa.gov/reentry/benefits.htm",
    });
    expect(result.resources[0].steps).toEqual(
      expect.arrayContaining([
        expect.stringContaining("official release papers"),
      ]),
    );
    expect(result.citations[0].sourceUri).toBe(
      "https://www.ssa.gov/life-events/incarceration",
    );
  });
});
