import { describe, expect, it } from "vitest";

import {
  getPracticeById,
  getPracticeCatalog,
  parsePracticeCatalog,
} from "@/modules/practices";

describe("mindfulness practice catalog", () => {
  it("loads and validates all 21 curated practices", () => {
    const catalog = getPracticeCatalog();

    expect(catalog.delivery.channel).toBe("sms");
    expect(catalog.practices).toHaveLength(21);
    expect(new Set(catalog.practices.map((practice) => practice.id)).size).toBe(
      21,
    );
    expect(getPracticeById("sit-and-observe")?.title).toBe("Sit and Observe");
  });

  it("rejects duplicate practice identifiers", () => {
    const catalog = getPracticeCatalog();
    const duplicate = {
      ...catalog,
      practices: [catalog.practices[0], catalog.practices[0]],
    };

    expect(() => parsePracticeCatalog(duplicate)).toThrow(/Duplicate practice id/);
  });
});
