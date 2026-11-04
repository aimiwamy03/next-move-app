# Next Move

Next Move is a calm home base for people recently released in California. Built with Boundless Freedom Project, 1st Place at Hack for Social Good.

| Folder | What it is |
|---|---|
| `mobile/` | React Native (Expo) app for applying to CalFresh, tracking check-ins, and connecting to support |
| `companion/` | iMessage-style text companion that plans each reply with checklist state, approved memories, and a reviewed resource catalog |
| `designs/` | Calm screen PNGs and HTML sources (Grok / design system) |
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

## Design rules (from BUILD_PROMPT)

- Type ≥ 17px, Lora + DM Sans  
- Cream / green / one terracotta accent  
- No em dashes, no pill buttons  
- Lock-screen copy never says prison, parole, or CalFresh  
- Never collect an SSN  
