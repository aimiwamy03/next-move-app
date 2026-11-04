# Next Move

Next Move is a calm home base for people recently released in California. Built with Boundless Freedom Project, 1st Place at Hack for Social Good.

| Folder | What it is |
|---|---|
| `mobile/` | React Native (Expo) app for applying to CalFresh, tracking check-ins, and connecting to support |
| `companion/` | iMessage-style text companion that plans each reply with checklist state, approved memories, and a reviewed resource catalog |
| `designs/` | Calm screen PNGs and HTML sources |
| `spec/` | Hotline spec, CF 285 form, personas, field map |
| `BUILD_PROMPT.md` | Original Next.js build brief (reference) |

The mobile app gives participants a visual interface to start their CalFresh application and see their progress. The companion is a text-based conversational support system that answers questions, tracks personal memories, and guides people through reentry tasks. Both share the same design language and values: calm, respectful, and jargon-free.

## Mobile app (React Native)

```bash
cd mobile
npm install
npm start
```

Demo login code: **123456**. Full notes: [`mobile/README.md`](mobile/README.md).

Backend is mocked behind `SmsProvider`, `FaxProvider`, and `api` so you can wire a real API later without rewriting screens.

## Companion (Next.js)

```bash
cd companion
pnpm install --frozen-lockfile
# Add OPENAI_API_KEY to .env.local for chat and safety.
# Ollama is optional but keeps semantic resource retrieval local:
ollama serve
ollama pull embeddinggemma
pnpm db:migrate
pnpm db:seed
pnpm content:index
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The demo PIN is `1937`. Full notes: [`companion/README.md`](companion/README.md).

## Golden demo journey (mobile)

1. Welcome → Get started
2. Enter any valid 10-digit phone (e.g. `5105550100`)
3. Code: **123456**
4. Finish name → privacy → reminders
5. Home: tap "Start your CalFresh application"
6. Read "What to Expect" screens, then tap "Call now"
7. Simulated call runs (opens phone dialer in production)
8. After call simulation ends, tap "Sign your form"
9. Draw signature with finger, tap "Use this signature"
10. PDF viewer shows filled CF 285 with signature stamped on page 1
11. Tap "Send it in" (fax is mocked)
12. See "Sent. Your date is locked." confirmation

## Golden demo journey (companion)

1. Enter the four-digit PIN (1937) in the conversational prompt.
2. Trigger the morning check-in.
3. Send `I'm nervous about tomorrow` to receive a complete text practice.
4. Send `Remember that I prefer text messages` and explicitly approve the memory.
5. Send `I have my release ID or DMV receipt` and confirm the first checklist step.
6. Open the plan and verify that only that first step is complete; no earlier progress is prefilled.
7. Send `How do I apply for CalFresh food benefits?` to receive concise application steps and an official link.
8. Send `I don't have an address or photo ID. Can I still start?` and verify the conversation stays on CalFresh and shows the reviewed DPSS note.
9. Send `What are the steps to request a birth certificate?` to switch to the LA County procedure and official source.
10. Send `How do I clear my criminal record in California?` to receive the California Courts Self-Help guide without an eligibility promise.
11. Reset the demo and verify that it returns to the PIN prompt.

## Verification

**Mobile**
```bash
cd mobile
npm run typecheck
```

**Companion**
```bash
cd companion
pnpm test
pnpm build
pnpm test:e2e
pnpm demo:preflight
```

The Playwright journey uses installed Google Chrome and captures traces, screenshots, and video when a test fails.

## Current boundary

### Mobile app
- All backend calls (auth, PDF submission, helper handoff) are mocked. No data persists between sessions.
- SMS code verification accepts 123456 in demo mode.
- Fax transmission logs to console only.
- Voice hotline integration is not implemented. `spec/spec.md` describes an ElevenLabs agent with webhook-driven form filling, but no code exists for that flow. The mobile app simulates the call with a local timer and sample questions.
- CF 285 form filling uses pdf-lib with the field map in `spec/pdf-field-map.md`. SSN fields are never filled.
- Demo persona is Marcus Reyes (38, homeless, Oakland, $40, no income, no ID). Data lives in `mobile/src/mock/data.ts`.
- Designed for 390x844px viewport (iPhone 12/13). No responsive breakpoints for larger screens.
- Design tokens: Lora + DM Sans, 17px minimum, no em dashes, no pill buttons, terracotta accent. Lock screen copy never says prison, parole, or CalFresh. Full rules in [`BUILD_PROMPT.md`](BUILD_PROMPT.md).

### Companion
- The participant profile is fictional. Resource guides are source-backed summaries of official pages, carry review dates and canonical links, and should still be rechecked before a pilot.
- `LLM_PROVIDER=openai` uses the OpenAI Responses API with strict Structured Outputs. `gpt-6-luna` handles both the narrow safety gate and participant-facing response with reasoning disabled for demo latency. There is no regex or keyword intent router and no hidden deterministic conversation fallback. Safe turns receive checklist state, accepted memories, up to three mindfulness candidates, and retrieved records. The server owns reviewed practice instructions and validates every proposed task, memory, practice, and citation.
- All 21 normalized practices work completely over text. The demo does not emit a companion-app link because this repo does not implement a meditation player.
- Ollama writes the concise participant-facing answer plus typed references to any cited resource, checklist task, memory proposal, or reviewed practice. State changes, citations, mindfulness instructions, emergency copy, and UI actions remain server-owned and validated. The live system prompts are in [`companion/src/modules/model/conversation-prompt.ts`](companion/src/modules/model/conversation-prompt.ts).
- Resource retrieval uses the small local `embeddinggemma` model when Ollama is available and automatically falls back to lexical retrieval when it is not. Each current guide is a small coherent record, so its full normalized text is embedded as one unit. The response model answers one step at a time and the server attaches the reviewed source and direct official action link.
- Personal memory is opt-in: the participant must ask the assistant to remember something and then approve the memory card. Sensitive credentials and medical/legal details are rejected.
- Current SMS support is only a channel contract and plain-text renderer; it is not a live SMS integration. Before enabling SMS, add provider webhook signature verification and a persisted, idempotent pending-action resolver so replies such as `YES` or a numbered choice can safely complete the intended action exactly once.
- The handoff path is demo-only and does not notify Boundless Freedom Project staff.
- Local Ollama models (qwen2.5:14b) produce stronger responses but incur 10-13 second latency on warm turns; first cold turn may take 25 seconds.

[`companion/TECHNICAL_ARCHITECTURE_V2.md`](companion/TECHNICAL_ARCHITECTURE_V2.md) is the current source of truth. [`companion/TECHNICAL_ARCHITECTURE.md`](companion/TECHNICAL_ARCHITECTURE.md) is retained only as archived design history and may describe superseded choices.

## Design rules (from BUILD_PROMPT)

- Type ≥ 17px, Lora + DM Sans
- Cream / green / one terracotta accent
- No em dashes, no pill buttons
- Lock-screen copy never says prison, parole, or CalFresh
- Never collect an SSN
