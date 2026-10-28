# calfresh-mvp: build package for "Next Move" CalFresh prep call

Prepared Oct 24, 2026 (PT). Start here.

| File | What it is |
|---|---|
| spec.md | User flow, architecture, endpoints, retention, env vars, stage demo script, acceptance tests |
| intake-script.md | The spoken question flow from CF 285, with fast-help screen, read-back, filing-date line, clear, handoff, 988 |
| agent-prompt.md | ElevenLabs settings, first message, system prompt, tool config, guardrail tests |
| data-schema.json | 25 ElevenLabs data-collection items with PDF field mapping and server rules |
| pdf-field-map.md | CF 285 fillability findings and the full field map |
| eligibility-rules.md | Sourced fast-help and "you may also qualify" rules, each with "checked on Oct 24, 2026" |
| personas.md | 3 persona test scripts with expected JSON, PDF, and page results |
| forms/ | CF285.pdf (official), CF285_unlocked.pdf (use this), cf285-fields.json |
| reference/ | Tested pdf-lib fill + flags code (cf285.mjs), sample runner, decrypt and field-list scripts |
| samples/ | Persona JSON inputs and their filled CF 285 PDFs (fictional data) |

Run the reference: `npm i pdf-lib && node reference/run-samples.mjs && node reference/check-samples.mjs` (last one asserts SSN, signature, Q17 to 22 blank and persona boxes; passed Oct 24, 2026).
