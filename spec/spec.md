# Next Move: CalFresh prep by phone (MVP spec)

Hackathon build, Oct 24 to 25, 2026. Owner: Amy Wang. Partner org: Boundless Freedom Project (BFP).

One phone call. The caller answers about 30 short questions. They get a text with a private link. The link shows a one-page summary, the official CF 285 already filled in, and a "Clear my answers" button. The caller signs and submits on BenefitsCal or with a named BFP helper. Nothing is ever sent to the government by the app.

## 1. Non-negotiables

1. No login for the caller.
2. No SSN asked, heard, stored, or printed. SSN fields on the PDF stay blank (code refuses to fill them).
3. Nothing submitted to any government system. No BenefitsCal automation.
4. "Clear my answers" on the call and on the page.
5. Language is always "you may qualify". The county decides.
6. Delete answers after the helper handoff, or after 7 days, whichever comes first.
7. Plain language, one question at a time, each under 15 words. No em dashes in any UI copy.

## 2. User flow

1. **Call.** Person dials the Twilio number (or uses the web widget on `/demo`). ElevenLabs agent "Next Move" runs the intake (intake-script.md, agent-prompt.md).
2. **Read-back.** Agent reads answers back in 3 chunks. Caller confirms or fixes.
3. **Confirmation on the call.** Agent says: "This isn't sent yet. When you sign and send it, that day counts. Name, address, and signature are enough to start." Then the fast-help result ("you may qualify for fast help" or "the county will check").
4. **End-of-call text** (only if `ok_to_text` is true and `call_outcome` is confirmed, handoff, or incomplete):
   `Next Move: your answers are ready. Private link: https://<app>/s/<token> Reply STOP to opt out.`
   No name, no "CalFresh", no "prison", no "parole" in the text body (shared phones are common).
5. **Summary page** `/s/<token>` (no login, unguessable token):
   - "Your CalFresh answers" in plain words, grouped like the read-back.
   - Fast-help banner if flagged: "You may qualify for food money within 3 days. The county decides."
   - "What to do next": (a) Download your filled form (PDF). (b) Open BenefitsCal (no account needed). (c) Call your BFP helper. Each with one line of help.
   - "Filing today locks your date" box.
   - "Before you sign" box: you still answer questions 17 to 22 yourself, and you sign and date page 1.
   - "You may also qualify" cards (eligibility-rules.md): Medi-Cal "check your exit papers", $6 or free state ID, LifeLine after approval.
   - Heads-up card if 18 to 64: work rules, the county will explain.
   - "Clear my answers" button (confirm dialog, then deletes and shows "Your answers are gone.").
   - Footer: "We delete this in 7 days or when your helper takes over." Expiry date shown in PT.
6. **BFP helper handoff** (only if `ok_bfp_helper` is true):
   - Helper gets an SMS (or email) to a configured BFP helper number: `Next Move: new CalFresh prep ready. https://<app>/s/<token>`.
   - Helper opens the same page, enters `HELPER_PIN` to reveal helper tools: "Download PDF", notes on blanks to fill (SSN in person, signature, Q17 to 22), and "Mark handed off".
   - "Mark handed off" deletes the record immediately. Page then shows "Handed off to BFP. Answers deleted."

## 3. Architecture

```
Caller phone ──> Twilio number ──(native integration)──> ElevenLabs Agent "Next Move"
Demo laptop ──> /demo (ElevenLabs widget) ───────────────┘
                                                          │ post_call_transcription webhook (HMAC)
                                                          v
                                   Next.js on Vercel  /api/elevenlabs/post-call
                                     ├─ verify signature, dedupe by conversation_id
                                     ├─ parse data_collection_results -> Answers
                                     ├─ computeFlags(Answers)
                                     ├─ store {answers, flags} in Redis, TTL 7 days
                                     └─ Twilio SMS: link to caller (+ helper if consented)
                                   /s/[token]            summary page (server component)
                                   /api/intake/[token]/pdf    fills CF285_unlocked.pdf on demand (pdf-lib)
                                   /api/intake/[token]/clear  delete now
                                   /api/intake/[token]/handoff  helper PIN, delete now
```

- **Storage:** Upstash Redis from the Vercel Marketplace (`@upstash/redis`). One key per intake: `intake:<token>` with `EX 604800` (7 days). Second key `conv:<conversation_id>` -> token, same TTL, for webhook dedupe. Nothing else is stored. The PDF is generated on each request and never saved.
- **Token:** 32 random bytes, base64url. Never derived from phone or name.
- **No transcript storage.** The webhook ignores `data.transcript`. Do not log request bodies.
- **PDF:** `forms/CF285_unlocked.pdf` bundled in the app (e.g. `public/` is NOT ok; put it in `lib/forms/` and read with `fs` at runtime, add to `outputFileTracingIncludes`). Fill logic: port `reference/cf285.mjs`.

## 4. Endpoints

| Method and path | Auth | Does |
|---|---|---|
| `POST /api/elevenlabs/post-call` | `ElevenLabs-Signature` HMAC | Read raw body with `await req.text()`. Verify with `elevenlabs.webhooks.constructEvent(rawBody, signature, ELEVENLABS_WEBHOOK_SECRET)` from `@elevenlabs/elevenlabs-js`. Ignore types other than `post_call_transcription`. Dedupe on `data.conversation_id`. Map `data.analysis.data_collection_results[<id>].value` for each schema id (missing = null). Apply section 5 outcome rules. Always return 200 quickly after verification (ElevenLabs disables webhooks after repeated failures). |
| `GET /s/[token]` | token | Summary page. 404 page "This link expired or was cleared" if missing. `noindex`, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`. |
| `GET /api/intake/[token]/pdf` | token | Returns filled CF 285 as `application/pdf`, filename `CF285-prep.pdf`. `no-store`. |
| `POST /api/intake/[token]/clear` | token | Deletes `intake:<token>` and its `conv:` key. Returns 200 even if already gone. |
| `POST /api/intake/[token]/handoff` | token + `HELPER_PIN` | Deletes record. Logs only `{event: "handoff", at}` without token or PII. |
| `GET /demo` | `DEMO_PIN` query or cookie | Widget embed + "latest intake" panel for the stage screen (reads a `demo:latest` key that stores only the latest token, TTL 1 hour). |
| `POST /api/twilio/sms-inbound` (stretch) | Twilio signature | If body is `DELETE` or `CLEAR`, delete all intakes created for that number in the last 7 days (needs a `phone:<hash>` -> tokens set). |

## 5. Outcome rules in the webhook

| `call_outcome` | Store | Text caller | Text helper |
|---|---|---|---|
| confirmed | yes | if `ok_to_text` | if `ok_bfp_helper` |
| handoff | yes | if `ok_to_text` | yes if `ok_bfp_helper` |
| incomplete | yes (page shows "partly done, call back to finish") | if `ok_to_text` | no |
| cleared | NO | NO | NO |
| crisis | NO (unless the caller later confirmed, then treat as confirmed but never mention crisis anywhere) | NO automated text | NO |
| null / unknown | treat as incomplete | | |

Phone for SMS: `answers.phone_number` if present, else `data.metadata` caller number (verify the exact path on the first test call), else `conversation_initiation_client_data.dynamic_variables.system__caller_id`. Normalize to E.164 (+1).

## 6. Retention rule

- App data: delete on "Clear my answers", on helper "Mark handed off", or automatically after 7 days (Redis TTL). No backups.
- ElevenLabs: set agent `retention_days` to 7 (default is 2 years). Use Zero Retention Mode if the plan supports it (UNVERIFIED).
- Twilio: no call recording. SMS bodies contain only the link. Message logs still exist in Twilio for the account's retention period; note it on the privacy line.
- Vercel logs: never log answers, tokens, or phone numbers.
- What we tell the caller: "We delete your answers after a helper takes over, or in seven days."

## 7. Env vars

`ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`, `ELEVENLABS_AGENT_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `BFP_HELPER_SMS_TO`, `HELPER_PIN`, `DEMO_PIN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `APP_BASE_URL`.

## 8. SMS risk for the demo

US A2P 10DLC registration can take days. Twilio trial accounts can only text verified numbers (UNVERIFIED for the current account type). For the stage: text Amy's verified phone, and also show the link on `/demo` so the demo never depends on SMS delivery. ElevenLabs post-call analysis can take a little while after hang-up (exact delay UNVERIFIED); the `/demo` panel polls every 2 seconds.

## 9. Stage demo script (about 3 minutes)

Setup: laptop on `/demo?pin=...`, projector. Amy's phone on speaker. Persona 2 card in hand (Marcus, shelter, no income, $40).

1. (15 s) "Marcus got out last week. He's in a shelter in Oakland. He has forty dollars and a prepaid phone. Getting food help means an 18-page form."
2. (90 s) Amy calls the number on speaker, answers as Marcus (persona 2 script, shortened). Show: one question at a time, no SSN, "where are you sleeping", the fast-help line "you may qualify for fast help", the read-back, "filing today locks your date".
3. (20 s) Hang up. Phone buzzes with the text. Tap the link on the projector.
4. (40 s) Summary page: fast-help banner, "What to do next", tap "Download your filled form": the real CF 285 opens with page 1 filled, expedited boxes checked, SSN and signature blank. Show "You may also qualify": Medi-Cal exit papers, free state ID (homeless), LifeLine after approval.
5. (15 s) Tap "Clear my answers". Page shows "Your answers are gone." Reload: expired page.
6. (10 s) Close: "Nothing was sent to the government. Marcus signs it himself, today, with a BFP helper. His date is locked."

Fallback if the phone line fails: same flow in the widget on `/demo`. Fallback if the webhook is slow: open `samples/persona2-homeless-expedited.CF285.pdf` and a seeded summary (`/s/demo-seed`, created by a seed script, TTL 1 hour).

## 10. Acceptance tests

1. Webhook with a bad signature returns 401 and stores nothing.
2. Same `conversation_id` posted twice creates one record and one SMS.
3. `call_outcome = cleared` stores nothing and sends nothing.
4. `call_outcome = crisis` sends no SMS and the stored record (if any) never contains the word crisis.
5. `ok_to_text = false` sends no SMS to the caller.
6. Redis key TTL is <= 604800 seconds right after creation.
7. `/api/intake/<token>/clear` then `/s/<token>` shows the expired page; PDF route returns 404.
8. Helper handoff with a wrong PIN returns 403; with the right PIN deletes the record.
9. Filled PDF: SSN fields (6, 109, 1018, 1026, 1034, 1042), signature (35), and date (36) are empty; Q17 to Q22 boxes (523 to 540) are unchecked. Test reads fields back with pdf-lib.
10. Persona 2 input: fields 554 (Yes) and 20 (homeless Yes) are checked; 553 unchecked.
11. Persona 1 input: 553 (No) checked; 556 and 555 both blank (county checks utilities).
12. Every summary-page string says "may" for eligibility. A test greps rendered HTML for "you will get", "approved", "guaranteed" and fails if found.
13. SMS body matches `/^Next Move: .* https:\/\/\S+\/s\/[A-Za-z0-9_-]{40,} Reply STOP to opt out\.$/` and contains no name, address, or dollar amount from the answers.
14. No request body, phone, or token appears in Vercel function logs (search logs after a test call).
15. Live call: agent never asks for SSN; when the tester offers one, it interrupts (guardrail tests in agent-prompt.md).
16. Live call: the 3 persona scripts (personas.md) each produce the expected JSON within the tolerances listed there.
17. Page passes a 375 px wide phone check: all actions reachable without horizontal scroll; buttons at least 44 px tall.
18. No em dash characters in any UI string (grep for U+2014).

## 11. Out of scope for the MVP

Spanish (next), Medi-Cal application, LifeLine application, BenefitsCal automation, authorized representative forms, document upload, accounts, SMS inbound commands (stretch).
