import { z } from "zod";

import rawCrisisSupport from "../../../content/crisis-support.json";

import type { Citation, CrisisAction } from "@/contracts/api";
import type { AssistantDraft } from "@/modules/conversation/repository";
import type { SafetyAssessment } from "@/modules/model";

const crisisSupportSchema = z.object({
  country: z.literal("US"),
  reviewedAt: z.string().date(),
  emergency: z.object({
    name: z.string().trim().min(1),
    phone: z.literal("911"),
  }).strict(),
  crisisLine: z.object({
    name: z.string().trim().min(1),
    phone: z.literal("988"),
    text: z.literal("988"),
    chatUrl: z.string().url(),
    websiteUrl: z.string().url(),
  }).strict(),
  source: z.object({
    title: z.string().trim().min(1),
    url: z.string().url(),
  }).strict(),
}).strict();

const crisisSupport = crisisSupportSchema.parse(rawCrisisSupport);

function guidanceFor(assessment: SafetyAssessment): string {
  const immediate = assessment.urgency === "imminent";

  if (assessment.kind === "harm_to_others") {
    return immediate
      ? "Move away from the person and any weapon. Call 911 now. If safe, stay near someone you trust until help arrives."
      : "Move away from the person and any weapon. Call or text 988 now. If anyone may be in immediate danger, call 911.";
  }

  if (assessment.kind === "self_harm") {
    return immediate
      ? "Move away from anything you could use to hurt yourself. Call 911 now. If safe, stay near someone you trust until help arrives."
      : "Move away from anything you could use to hurt yourself. Call or text 988 now. If you may act soon, call 911.";
  }

  return immediate
    ? "Call 911 now. If safe, stay near someone you trust until help arrives."
    : "Call or text 988 now. If you or anyone else may be in immediate danger, call 911.";
}

export function crisisDraft(assessment: SafetyAssessment): AssistantDraft {
  const action: CrisisAction = {
    type: "crisis",
    kind: assessment.kind,
    urgency: assessment.urgency,
    emergencyPhone: crisisSupport.emergency.phone,
    crisisLineName: crisisSupport.crisisLine.name,
    crisisPhone: crisisSupport.crisisLine.phone,
    crisisText: crisisSupport.crisisLine.text,
    chatUrl: crisisSupport.crisisLine.chatUrl,
  };
  const citation: Citation = {
    resourceId: "us-crisis-support",
    title: crisisSupport.source.title,
    sourceUri: crisisSupport.source.url,
    reviewedAt: crisisSupport.reviewedAt,
  };

  return {
    text: guidanceFor(assessment),
    actions: [action],
    citations: [citation],
    fallbackUsed: false,
  };
}

export function unavailableCrisisText(): string {
  return "If anyone may be in danger, call 911 or call or text 988.";
}
