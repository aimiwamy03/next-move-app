import {
  getPracticeCatalog,
  type MindfulnessPractice,
} from "./catalog";

export type PracticeSelectionInput = {
  /** Free-form participant message. */
  userText?: string;
  /** Strong preferences supplied by the orchestrator. */
  desiredTags?: readonly string[];
  /** Weaker situational hints, such as "morning" or "transition". */
  contextTags?: readonly string[];
  /** Most-recent id first. Known ids are excluded while unused choices exist. */
  recentPracticeIds?: readonly string[];
  /** Practices containing any of these tags are avoided when alternatives exist. */
  excludedTags?: readonly string[];
};

export type PracticeSelection = {
  practice: MindfulnessPractice;
  matchedTags: string[];
  fallbackUsed: boolean;
};

export type TextPracticeDelivery = PracticeSelection & {
  practiceId: string;
  title: string;
  durationSeconds: number;
  instructionText: string;
  safetyIntro: string;
  fullText: string;
  /** Plain-text messages in send order, each within maxSegmentCharacters. */
  smsMessages: string[];
  catalogStatus: string;
};

type TextCue = {
  pattern: RegExp;
  tags: readonly string[];
};

const textCues: readonly TextCue[] = [
  {
    pattern: /\b(anxious|anxiety|nervous|overwhelmed|panic|panicking)\b/i,
    tags: ["overwhelm", "grounding"],
  },
  {
    pattern: /\b(stress|stressed|pressure)\b/i,
    tags: ["stress"],
  },
  {
    pattern: /\b(ashamed|shame|guilt|guilty|hard on myself)\b/i,
    tags: ["shame", "kindness"],
  },
  {
    pattern: /\b(alone|isolated|lonely|loneliness|miss someone)\b/i,
    tags: ["loneliness", "connection", "kindness"],
  },
  {
    pattern: /\b(sleep|sleeping|bedtime|restless)\b/i,
    tags: ["sleep"],
  },
  {
    pattern: /\b(focus|distracted|concentrate|one thing)\b/i,
    tags: ["focus"],
  },
  {
    pattern: /\b(tense|tension|tight|stiff|stretch)\b/i,
    tags: ["tension", "body", "movement"],
  },
  {
    pattern: /\b(walk|walking|appointment|on my way|going somewhere)\b/i,
    tags: ["walking", "transition", "appointment"],
  },
  {
    pattern: /\b(morning|start (?:my|the) day|today's intention)\b/i,
    tags: ["morning", "intention"],
  },
  {
    pattern: /\b(decide|decision|next step|what should i do|planning)\b/i,
    tags: ["decision", "planning"],
  },
  {
    pattern: /\b(eat|eating|food|meal|snack)\b/i,
    tags: ["food", "senses"],
  },
  {
    pattern: /\b(outside|nature|cloud|bird|tree)\b/i,
    tags: ["nature", "senses"],
  },
  {
    pattern: /\b(listen|listening|music|sound|sounds)\b/i,
    tags: ["listening", "senses"],
  },
  {
    pattern: /\b(grateful|gratitude|appreciate|thankful)\b/i,
    tags: ["gratitude"],
  },
  {
    pattern: /\b(breath|breathe|breathing)\b/i,
    tags: ["breathing"],
  },
  {
    pattern: /\b(wash|washing|soap|sink)\b/i,
    tags: ["routine", "senses"],
  },
];

// These make the no-context choice grounding-oriented and avoid breath holds.
const neutralFallbackOrder = [
  "sit-and-observe",
  "body-scan",
  "focus",
  "door-reset",
  "wash-your-hands",
  "set-an-intention",
] as const;

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagsInText(text: string): Set<string> {
  const tags = new Set<string>();
  for (const cue of textCues) {
    if (cue.pattern.test(text)) {
      cue.tags.forEach((tag) => tags.add(tag));
    }
  }
  return tags;
}

function normalizedTagSet(tags: readonly string[] | undefined): Set<string> {
  return new Set(
    (tags ?? []).map(normalizeTag).filter((tag) => tag.length > 0),
  );
}

function hasAnyTag(
  practice: MindfulnessPractice,
  tags: ReadonlySet<string>,
): boolean {
  return practice.tags.some((tag) => tags.has(normalizeTag(tag)));
}

function chooseCandidatePool(
  practices: MindfulnessPractice[],
  recentPracticeIds: readonly string[],
  excludedTags: ReadonlySet<string>,
): MindfulnessPractice[] {
  const withoutExcluded = practices.filter(
    (practice) => !hasAnyTag(practice, excludedTags),
  );
  const eligible = withoutExcluded.length > 0 ? withoutExcluded : practices;
  const recentIds = new Set(recentPracticeIds);
  const unused = eligible.filter((practice) => !recentIds.has(practice.id));

  if (unused.length > 0) return unused;

  // If the caller has cycled through every eligible practice, still avoid an
  // immediate repeat. The remaining score/tie-breakers choose deterministically.
  const mostRecentId = recentPracticeIds[0];
  const notMostRecent = eligible.filter(
    (practice) => practice.id !== mostRecentId,
  );
  return notMostRecent.length > 0 ? notMostRecent : eligible;
}

function titleOrIdMentioned(
  practice: MindfulnessPractice,
  normalizedUserText: string,
): boolean {
  if (!normalizedUserText) return false;
  const title = normalizeText(practice.title);
  const idAsWords = practice.id.replaceAll("-", " ");
  return (
    normalizedUserText.includes(title) ||
    normalizedUserText.includes(idAsWords)
  );
}

export function selectPractice(
  input: PracticeSelectionInput = {},
): PracticeSelection {
  const catalog = getPracticeCatalog();
  const practices = [...catalog.practices];
  const normalizedUserText = normalizeText(input.userText ?? "");
  const desiredTags = normalizedTagSet(input.desiredTags);
  const contextTags = normalizedTagSet(input.contextTags);
  const inferredTags = tagsInText(normalizedUserText);
  const excludedTags = normalizedTagSet(input.excludedTags);
  const candidates = chooseCandidatePool(
    practices,
    input.recentPracticeIds ?? [],
    excludedTags,
  );

  const fallbackRank = new Map<string, number>(
    neutralFallbackOrder.map((practiceId, index) => [practiceId, index]),
  );
  const catalogRank = new Map(
    practices.map((practice, index) => [practice.id, index]),
  );

  const ranked = candidates
    .map((practice) => {
      const practiceTags = new Set(practice.tags.map(normalizeTag));
      const matchedTags = new Set<string>();
      let score = 0;

      for (const tag of desiredTags) {
        if (practiceTags.has(tag)) {
          score += 10;
          matchedTags.add(tag);
        }
        if (
          normalizeTag(practice.id) === tag ||
          normalizeTag(practice.title) === tag
        ) {
          score += 50;
        }
      }
      for (const tag of contextTags) {
        if (practiceTags.has(tag)) {
          score += 6;
          matchedTags.add(tag);
        }
      }
      for (const tag of inferredTags) {
        if (practiceTags.has(tag)) {
          score += 4;
          matchedTags.add(tag);
        }
      }
      if (titleOrIdMentioned(practice, normalizedUserText)) score += 50;

      return {
        practice,
        matchedTags: [...matchedTags].sort(),
        score,
        fallbackRank:
          fallbackRank.get(practice.id) ?? neutralFallbackOrder.length,
        catalogRank: catalogRank.get(practice.id) ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.fallbackRank - right.fallbackRank ||
        left.catalogRank - right.catalogRank,
    );

  const selected = ranked[0];
  if (!selected) {
    // Catalog validation requires at least one practice, so this indicates a
    // programming error rather than a participant-facing condition.
    throw new Error("No mindfulness practice is available for selection.");
  }

  return {
    practice: selected.practice,
    matchedTags: selected.matchedTags,
    fallbackUsed: selected.score === 0,
  };
}

function plainSmsText(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split at word boundaries so every returned message fits the requested cap. */
export function splitSmsMessages(text: string, maxCharacters = 160): string[] {
  if (!Number.isInteger(maxCharacters) || maxCharacters < 20) {
    throw new RangeError("maxCharacters must be an integer of at least 20.");
  }

  const words = plainSmsText(text).split(" ").filter(Boolean);
  const messages: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxCharacters) {
      if (current) {
        messages.push(current);
        current = "";
      }
      for (let offset = 0; offset < word.length; offset += maxCharacters) {
        messages.push(word.slice(offset, offset + maxCharacters));
      }
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharacters) {
      current = next;
    } else {
      messages.push(current);
      current = word;
    }
  }

  if (current) messages.push(current);
  return messages;
}

export function formatPracticeForText(
  selection: PracticeSelection,
  options: { maxSegmentCharacters?: number } = {},
): TextPracticeDelivery {
  const catalog = getPracticeCatalog();
  const maxCharacters = options.maxSegmentCharacters ?? 160;
  const safetyIntro = plainSmsText(catalog.delivery.safetyIntro);
  const instructionText = plainSmsText(selection.practice.smsText);
  const minutes = Math.max(1, Math.round(selection.practice.durationSeconds / 60));
  const practiceMessage = `${selection.practice.title} (${minutes} min): ${instructionText}`;
  const smsMessages = [
    ...splitSmsMessages(safetyIntro, maxCharacters),
    ...splitSmsMessages(practiceMessage, maxCharacters),
  ];

  return {
    ...selection,
    practiceId: selection.practice.id,
    title: selection.practice.title,
    durationSeconds: selection.practice.durationSeconds,
    instructionText,
    safetyIntro,
    fullText: `${safetyIntro}\n\n${practiceMessage}`,
    smsMessages,
    catalogStatus: catalog.status,
  };
}

export function selectPracticeForText(
  input: PracticeSelectionInput = {},
  options: { maxSegmentCharacters?: number } = {},
): TextPracticeDelivery {
  return formatPracticeForText(selectPractice(input), options);
}
