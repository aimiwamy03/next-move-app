import { z } from "zod";

import rawCatalog from "../../../content/mindfulness-practices.json";

const practiceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1),
    durationSeconds: z.number().int().positive().max(30 * 60),
    smsText: z.string().trim().min(1).max(1_000),
    tags: z.array(z.string().trim().min(1)).min(1),
    adaptationNote: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((practice, context) => {
    const normalizedTags = practice.tags.map((tag) => tag.toLowerCase());
    if (new Set(normalizedTags).size !== normalizedTags.length) {
      context.addIssue({
        code: "custom",
        path: ["tags"],
        message: "Practice tags must be unique (case-insensitive).",
      });
    }
  });

export const practiceCatalogSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    status: z.string().trim().min(1),
    source: z
      .object({
        title: z.string().trim().min(1),
        fileId: z.string().trim().min(1),
        url: z.string().url(),
        modifiedTime: z.string().datetime(),
      })
      .strict(),
    delivery: z
      .object({
        channel: z.literal("sms"),
        defaultDurationSeconds: z.number().int().positive(),
        safetyIntro: z.string().trim().min(1),
        instructions: z.string().trim().min(1),
      })
      .strict(),
    practices: z.array(practiceSchema).min(1),
  })
  .strict()
  .superRefine((catalog, context) => {
    const ids = new Set<string>();
    catalog.practices.forEach((practice, index) => {
      if (ids.has(practice.id)) {
        context.addIssue({
          code: "custom",
          path: ["practices", index, "id"],
          message: `Duplicate practice id: ${practice.id}`,
        });
      }
      ids.add(practice.id);
    });
  });

export type MindfulnessPractice = z.infer<typeof practiceSchema>;
export type PracticeCatalog = z.infer<typeof practiceCatalogSchema>;

export function parsePracticeCatalog(input: unknown): PracticeCatalog {
  return practiceCatalogSchema.parse(input);
}

const catalog = parsePracticeCatalog(rawCatalog);

/**
 * Returns the startup-validated, curated practice catalog.
 *
 * Callers should treat this value as immutable. Validation happens once when
 * the server module is loaded so a malformed content artifact fails loudly.
 */
export function getPracticeCatalog(): Readonly<PracticeCatalog> {
  return catalog;
}

export function getPracticeById(
  practiceId: string,
): MindfulnessPractice | undefined {
  return catalog.practices.find((practice) => practice.id === practiceId);
}
