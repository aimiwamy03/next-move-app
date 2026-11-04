# Mindful Reentry Conversation Demo

A browser-based, iMessage-style companion for a fictional participant returning to society. Every inbound chat turn is planned by a local Ollama model using conversation history, checklist state, accepted memories, and the reviewed resource catalog.

## Local setup

```bash
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

Open [http://localhost:3000](http://localhost:3000). The fictional PIN is read from `.env.local`; the checked-in example uses `1937` only as demo data.

For the local/LAN HTTP demo, `.env.local` sets `COOKIE_SECURE=false`. Set
`COOKIE_SECURE=true` for every HTTPS deployment; if the variable is omitted,
production defaults to secure cookies. Sessions expire after 60 minutes by
default, and the conversation header includes an **Exit** control that locks the
screen and invalidates the current server session.

## Golden demo journey

1. Enter the four-digit PIN in the conversational prompt.
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

```bash
pnpm test
pnpm build
pnpm test:e2e
pnpm demo:preflight
```

The Playwright journey uses installed Google Chrome and captures traces, screenshots, and video when a test fails.

## Current boundary

- The participant profile is fictional. Resource guides are source-backed summaries of official pages, carry review dates and canonical links, and should still be rechecked before a pilot.
- `LLM_PROVIDER=openai` uses the OpenAI Responses API with strict Structured Outputs. `gpt-6-luna` handles both the narrow safety gate and participant-facing response with reasoning disabled for demo latency. There is no regex or keyword intent router and no hidden deterministic conversation fallback. Safe turns receive checklist state, accepted memories, up to three mindfulness candidates, and retrieved records. The server owns reviewed practice instructions and validates every proposed task, memory, practice, and citation.
- All 21 normalized practices work completely over text. The demo does not emit a companion-app link because this repo does not implement a meditation player.
- Ollama writes the concise participant-facing answer plus typed references to any cited resource, checklist task, memory proposal, or reviewed practice. State changes, citations, mindfulness instructions, emergency copy, and UI actions remain server-owned and validated. The live system prompts are in [`src/modules/model/conversation-prompt.ts`](./src/modules/model/conversation-prompt.ts).
- Resource retrieval still uses the small local `embeddinggemma` model when Ollama is available and automatically falls back to lexical retrieval when it is not. Each current guide is a small coherent record, so its full normalized text is embedded as one unit. The response model answers one step at a time and the server attaches the reviewed source and direct official action link.
- Personal memory is opt-in: the participant must ask the assistant to remember something and then approve the memory card. Sensitive credentials and medical/legal details are rejected.
- Current SMS support is only a channel contract and plain-text renderer; it is not a live SMS integration. Before enabling SMS, add provider webhook signature verification and a persisted, idempotent pending-action resolver so replies such as `YES` or a numbered choice can safely complete the intended action exactly once.
- The handoff path is demo-only and does not notify Boundless Freedom Project staff.

[TECHNICAL_ARCHITECTURE_V2.md](./TECHNICAL_ARCHITECTURE_V2.md) is the current source of truth. [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) is retained only as archived design history and may describe superseded choices.
