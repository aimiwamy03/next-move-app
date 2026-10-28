# Next Move

Calm home-base app for people recently released in California, focused on applying for CalFresh with Boundless Freedom Project (BFP).

| Folder | What it is |
|---|---|
| `designs/` | Calm screen PNGs + HTML sources (Grok / design system) |
| `spec/` | Hotline spec, CF 285 form, personas, field map |
| `mobile/` | **React Native (Expo) app** built from those designs |
| `BUILD_PROMPT.md` | Original Next.js build brief (reference) |

## App (React Native)

```bash
cd mobile
npm install
npm start
```

Demo login code: **123456**. Full notes: [`mobile/README.md`](mobile/README.md).

Backend is mocked behind `SmsProvider`, `FaxProvider`, and `api` so you can wire a real API later without rewriting screens.

## Design rules (from BUILD_PROMPT)

- Type ≥ 17px, Lora + DM Sans  
- Cream / green / one terracotta accent  
- No em dashes, no pill buttons  
- Lock-screen copy never says prison, parole, or CalFresh  
- Never collect an SSN  
