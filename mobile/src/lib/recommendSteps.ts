import { dummyJobs } from '@/mock/data';

export type StepAction = {
  id: string;
  title: string;
  cta: string;
  done: boolean;
  /** Higher = show first in Suggested */
  score: number;
  onKind:
    | 'ss'
    | 'bank'
    | 'calfresh'
    | 'helper'
    | 'housing'
    | 'officer'
    | 'employment';
};

type SessionBits = {
  hasSSCard: boolean;
  hasBankCard: boolean;
  applyProgress: string;
  appliedJobIds: string[];
};

function has(answers: string[] | undefined, label: string) {
  return (answers ?? []).includes(label);
}

/**
 * Rank today's steps from check-in answers.
 * Weighing-on-you drives the strongest matches (food → CalFresh, housing → shelter, etc.).
 */
export function recommendSteps(
  checkInAnswers: Record<number, string[]>,
  session: SessionBits,
): { suggested: StepAction[]; more: StepAction[] } {
  const feeling = checkInAnswers[1]?.[0];
  const sleep = checkInAnswers[2]?.[0];
  const energy = checkInAnswers[3]?.[0];
  const weighing = checkInAnswers[4] ?? [];
  const talk = checkInAnswers[5]?.[0];

  const lowBand =
    feeling === 'Heavy' || sleep === 'Not much' || energy === 'A little';
  const highEnergy = energy === 'A lot';

  const actions: StepAction[] = [];

  // —— Core life tasks ——
  actions.push({
    id: 'calfresh',
    title: 'CalFresh food help',
    cta: session.applyProgress === 'sent' ? 'Review' : 'Start',
    done: false,
    score:
      (has(weighing, 'Food') ? 12 : 0) +
      (has(weighing, 'Money') ? 4 : 0) +
      (lowBand ? 2 : 0) +
      1,
    onKind: 'calfresh',
  });

  actions.push({
    id: 'housing',
    title: 'A place to stay',
    cta: 'Open',
    done: false,
    score: (has(weighing, 'Housing') ? 12 : 0) + (feeling === 'Heavy' ? 1 : 0),
    onKind: 'housing',
  });

  actions.push({
    id: 'officer',
    title: 'Your officer',
    cta: 'Open',
    done: false,
    score: has(weighing, 'Parole or probation') ? 12 : 0,
    onKind: 'officer',
  });

  actions.push({
    id: 'helper',
    title: 'Talk to a helper',
    cta: 'Call',
    done: false,
    score:
      (talk === 'Yes, call me' ? 14 : 0) +
      (has(weighing, 'Family') ? 7 : 0) +
      (feeling === 'Heavy' ? 3 : 0) +
      (lowBand ? 2 : 0),
    onKind: 'helper',
  });

  actions.push({
    id: 'ss',
    title: 'Social Security card',
    cta: session.hasSSCard ? 'Review' : 'Start',
    done: session.hasSSCard,
    score:
      (session.hasSSCard ? -20 : 0) +
      (has(weighing, 'Money') ? 5 : 0) +
      (has(weighing, 'Food') ? 3 : 0) +
      2,
    onKind: 'ss',
  });

  actions.push({
    id: 'bank',
    title: 'Bank card',
    cta: session.hasBankCard ? 'Review' : 'Start',
    done: session.hasBankCard,
    score:
      (session.hasBankCard ? -20 : 0) +
      (has(weighing, 'Money') ? 6 : 0) +
      (highEnergy ? 2 : 0) +
      1,
    onKind: 'bank',
  });

  // —— Employment (openings combined into one entry) ——
  const allJobsApplied = dummyJobs.every((j) => session.appliedJobIds.includes(j.id));
  const anyJobApplied = session.appliedJobIds.length > 0;
  actions.push({
    id: 'employment',
    title: 'Employment',
    cta: allJobsApplied ? 'Done' : 'Open',
    done: allJobsApplied,
    score:
      (allJobsApplied ? -20 : 0) +
      (has(weighing, 'Money') ? 12 : 0) +
      (highEnergy ? 7 : 0) +
      (energy === 'Some' ? 4 : 0) +
      (energy === 'A little' ? -2 : 0) +
      (lowBand && !has(weighing, 'Money') ? -3 : 0) +
      (anyJobApplied && !allJobsApplied ? 2 : 0) +
      1,
    onKind: 'employment',
  });

  // Drop zero-relevance soft resources unless they scored
  const ranked = actions
    .filter((a) => {
      if (a.onKind === 'housing' || a.onKind === 'officer') {
        return a.score > 0;
      }
      if (a.onKind === 'helper') return a.score > 0;
      return true;
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  // Top matches that aren't already done → Suggested; rest → More
  const pending = ranked.filter((a) => !a.done);
  const doneOnes = ranked.filter((a) => a.done);
  const suggested = pending.filter((a) => a.score >= 5).slice(0, 3);
  const suggestedIds = new Set(suggested.map((a) => a.id));
  const more = [...pending.filter((a) => !suggestedIds.has(a.id)), ...doneOnes];

  // If nothing scored high (light check-in), still surface 2 gentle defaults
  if (suggested.length === 0) {
    return {
      suggested: pending.slice(0, 2),
      more: [...pending.slice(2), ...doneOnes],
    };
  }

  return { suggested, more };
}
