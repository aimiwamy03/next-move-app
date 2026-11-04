import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

const manifestSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  sourceType: z.string().min(1),
  language: z.string().min(2),
  handling: z.string().min(1),
  embed: z.boolean(),
  namespace: z.enum([
    "mindfulness_practices",
    "bfp_program_information",
    "community_resources",
  ]).nullable(),
  status: z.string().min(1),
  derivedArtifact: z.string().optional(),
  notes: z.string().optional(),
});

const retrievalManifestSchema = z.object({
  schemaVersion: z.number().int().positive(),
  status: z.string(),
  registrySource: z.object({
    title: z.string(),
    documentId: z.string(),
    tabId: z.string(),
    url: z.string().url(),
    runtimeTreatment: z.literal("source_registry_only"),
    embed: z.literal(false),
    reason: z.string(),
  }),
  sources: z.array(manifestSourceSchema),
});

export type RetrievalManifest = z.infer<typeof retrievalManifestSchema>;

export function loadRetrievalManifest(
  path = resolve(process.cwd(), "content/retrieval-manifest.json"),
): RetrievalManifest {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return retrievalManifestSchema.parse(raw);
}

export function approvedEmbeddableSources(manifest: RetrievalManifest) {
  return manifest.sources.filter(
    (source) =>
      source.embed &&
      source.namespace !== null &&
      ["approved", "reviewed", "approved_for_runtime"].includes(source.status),
  );
}
