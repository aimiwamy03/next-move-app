# Build prompt: Next Move app (paste this into Cursor's agent)

You are building the Next Move demo app in this folder. Read this whole file first. Then work through the build order below one step at a time. Stop after each step, show me what you built, and wait for my go before starting the next step.

## 1. What we are building

Next Move is a calm, phone-first web app plus a voice hotline. It helps people who were recently released from prison apply for CalFresh (food money) using California's CF 285 application form.

- The hotline is an ElevenLabs voice agent. A friendly voice asks one question at a time and fills the CF 285 from the answers.
- The app is the person's calm home base: a daily check-in, their next step, applying by phone, signing with a finger, seeing their filled form as a PDF, and a hand-off to a helper from Boundless Freedom Project (BFP), our partner org.
- The demo is for a hackathon (Hack for Social Impact, San Francisco). Demo day is Oct 25, 2026. Aim for a clickable demo where the main path works end to end with mock data.
- The demo person is **Marcus Reyes** (Marcus Anthony Reyes, 38), Persona 2 in `spec/personas.md`. Use only his fictional data.

Filing path for the demo: the person signs with a finger on screen, the app stamps that signature on the filled CF 285, and "sends" it by fax. In this build the fax is a mock only. Note: `spec/spec.md` was written before this choice and says nothing is sent. The finger signature plus mock fax flow replaces that part. Background is in `spec/telephonic-signature-findings.md`.

## 2. Stack

- Next.js (App Router) with TypeScript and Tailwind CSS.
- Mobile first. Render every screen inside a centered 390 x 844 phone frame on desktop, and full width on a real phone.
- pdf-lib for the CF 285 fill. Reuse `spec/reference/cf285.mjs` (it exports `computeFlags(answers)` and `fillCf285(pdfBytes, answers)`, tested with pdf-lib 1.17.1). Copy `spec/forms/CF285_unlocked.pdf` into the app (for example `public/forms/` or a server-only folder) and fill it in an API route. Field mapping is in `spec/pdf-field-map.md`. The answer shape is in `spec/data-schema.json`. A sample answer set for Marcus is `spec/samples/persona2-homeless-expedited.json`.
- Mock data in a single `lib/mock/` folder: Marcus's profile, check-in history, resources, events, announcements, the BFP helper (placeholder name "Jordan", placeholder hours).
- Fonts from Google Fonts via `next/font`: Lora (headings) and DM Sans (everything else).

## 3. Design tokens (taken from the calm HTML in `designs/source/`)

The exact CSS lives in `designs/source/build_calm.py` (the shared `<style>` block at the top) and in every `designs/source/*.html` file. Read those when you need a precise value.

Colors:

| Token | Hex | Use |
|---|---|---|
| cream (page bg) | #F4EFE6 | page background |
| card | #FEFBF5 | cards, inputs, tab bar |
| green | #35493B | main buttons, selected state, links |
| sage | #E3E9DC | selected option fill, avatar, icon tiles |
| sage-light | #EAEFE4 | outer breathing ring |
| green-mid | #7E9A84 | inner breathing ring, sprig art |
| green-dark-ring | #3F5747 / #4C6654 | breathing rings on the dark green screen |
| terracotta | #B66947 | the one warm accent (progress "current", tab underline, stone top) |
| terracotta-button | #A65B3B | warm button fill and the "I'm overwhelmed" button |
| terracotta-text | #8E4A2C | small eyebrow labels |
| peach | #E8B49A | sun art |
| heading ink | #2E3A31 | h1, h2 |
| ink | #2B2A26 | body text |
| muted | #5E5B53 | secondary text |
| faint | #6B675E | small centered helper text |
| line | #E6DED0 | borders and dividers |
| card-line | #ECE4D6 | card border |
| track | #DCD3C3 | empty progress segment |
| checkbox-line | #B9B0A0 | unchecked box border |

Type:

- h1: Lora 500, 30px, line height 1.25 (hero lines on home use 34px).
- h2: Lora 500, 22px, line height 1.3.
- Option title: DM Sans 500, 20px.
- Buttons: DM Sans 500, 18px. List rows: 18px.
- Body, labels, captions, tab bar: DM Sans, 17px, line height 1.5. Nothing smaller than 17px, ever.

Shape and spacing:

- Screen padding: 16px top, 28px left and right, 26px bottom.
- Buttons and options: 12px radius. Cards: 16px radius. Checkbox: 24px square, 6px radius.
- Main button: 60px tall, green fill, white text, label left and arrow right. Secondary button: 56px tall, 1.5px green outline.
- Options: at least 72px tall, card fill, 1.5px #E6DED0 border. Selected: sage fill, green border, filled green check box.
- Links: green, underlined with a 4px offset, at least 44px tap height.
- List rows: at least 64px tall with a bottom divider.
- Progress: thin 4px segments with 6px gaps (done = green, current = terracotta, rest = track).
- Tab bar: 80px, card fill, top divider, four tabs as drawn in the designs (Home, Apply, Help, Me). Community and Resources open from Home and Help. The active tab is green text with a 2px terracotta underline.
- Tap targets at least 44px.

Art: stacked stones (cairn), a sprig, a soft sun, and concentric breathing rings. The SVG code is in `designs/source/art.py`. Port these to small React components.

## 4. Hard rules (check every screen against these)

1. All text is 17px or larger. No exceptions, including captions, tab labels and helper text.
2. No em dashes anywhere in the copy. Use periods, commas or "to".
3. No pill buttons (no fully rounded ends). Corners are 12px.
4. Selected state is a check box or an underline, never a filled pill.
5. Calm and quiet: 3 to 5 blocks per screen, lots of space, one question per screen.
6. Terracotta is the one warm accent per screen. Everything else is green and cream.
7. The stacked stones are the main motif. Use them on home and on "done" moments.
8. Warm, not bureaucratic. Friendly words, few labels and fields, paperwork tucked out of sight.
9. No recap screens. Wherever a recap would go, show one button: "See your form (PDF)" that opens the filled form.
10. The "I'm overwhelmed" button sits in the same fixed bottom spot on the call screen and on any form screen. One tap pauses (the call or the form), keeps every answer, and opens the breathing screen. From breathing, "I'm ready" returns to exactly where they were.
11. Plain language. "You may qualify", never "you qualify". The county decides.
12. Lock screen and push text never mention prison, parole or CalFresh by name.

## 5. Screen map

All PNGs are in `designs/`. Each has a matching HTML file in `designs/source/` with the exact layout. `designs/00-calm-overview.png` shows them all together, and `designs/annotated-*.png` explain the key interactions.

Sign in and onboarding (see `designs/board-signin.png`):

| Design | Route |
|---|---|
| 40a-welcome.png | `/welcome` |
| 40b-phone.png | `/sign-in` (phone number) |
| 40c-code.png | `/sign-in/code` |
| 40d-code-wrong.png | `/sign-in/code` (wrong code state) |
| 40e-name.png | `/onboarding/name` |
| 40f-privacy-promise.png | `/onboarding/privacy` |
| 40g-reminders.png | `/onboarding/reminders` |
| 40h-home-first-day.png | `/home` (first day state) |

Home:

| Design | Route |
|---|---|
| 20-home-option-b.png | `/home` (build this first) |
| 20-home-option-a.png, 20-home-option-c.png, 20-home-option-d.png | alternate home layouts, same route |
| 20-home-options.png | all four side by side |
| annotated-home.png | notes |

Check-in (one breath, then five one-question screens; see annotated-checkin.png):

| Design | Route |
|---|---|
| 11-checkin-breathe.png | `/check-in` |
| 12a-checkin-q1.png | `/check-in/1` How are you feeling right now? |
| 12b-checkin-q2.png | `/check-in/2` How did you sleep? |
| 12c-checkin-q3.png | `/check-in/3` How much energy do you have today? |
| 12d-checkin-q4.png | `/check-in/4` Is anything weighing on you? |
| 12e-checkin-q5.png | `/check-in/5` Do you want to talk to a person today? |
| 13-checkin-done.png | `/check-in/done` (a new stone for today) |

Apply by phone (see annotated-what-to-expect.png and annotated-overwhelmed.png):

| Design | Route |
|---|---|
| 14-applications-call.png | `/apply` (call first) |
| 14b-expect-1.png to 14f-expect-5.png | `/apply/expect/1` to `/apply/expect/5` (Have these nearby, About 10 minutes, You're in charge, Then you get a text, We send it in) |
| 15-on-call-overwhelmed.png | `/apply/call` |
| 15b-form-overwhelmed.png | `/apply/form/[step]` (fill by hand, one question per screen) |
| 16-overwhelmed-breathe.png | `/breathe` (dark green, "Your call is paused. Nothing is lost.") |
| 03-sign-your-form.png | `/apply/sign` |
| 04-pdf-viewer.png | `/apply/pdf` (viewer for the generated PDF) |
| 05-filed-done.png | `/apply/sent` ("Sent. Your date is locked.") |
| 44-helper-handoff.png | `/apply/helper` |

Resources, reading, community:

| Design | Route |
|---|---|
| 41a-resources.png | `/resources` |
| 41b-resource-food.png | `/resources/food` |
| 42-reading-session.png | `/reading` |
| 43a-community-events.png | `/community` (Events) |
| 43b-community-announcements.png | `/community/announcements` |
| 43c-event-saved.png | `/community/events/[id]/saved` |

Me and system states (see `designs/board-help.png`):

| Design | Route |
|---|---|
| 17-profile.png | `/me` |
| 17b-profile-privacy.png | `/me/privacy` |
| 46-delete-confirm.png | `/me/delete` ("Keep my info" is the main button, delete is the quiet one) |
| 45-offline.png | offline fallback (offers calling the line) |

Notifications (static mock pages for the demo, not real push):

| Design | Route |
|---|---|
| 30-lockscreen-1-morning.png, 30-lockscreen-2-sent.png, 30-lockscreen-3-private.png | `/demo/lockscreen/[1-3]` |
| 31-push-banner.png | `/demo/push` |

Reference only (do not build): `designs/reference/ref-original-style.png` (Amy's original style) and `designs/reference/ref-calm-checkin.png` (the calm one-question feel Amy wants).

## 6. Home direction

Build home option B ("One next thing": a greeting, one sun or stone, one next step, a Start button, and a "See everything else" link) first. Make the home screen a thin route that renders one of four layout components (`HomeA`, `HomeB`, `HomeC`, `HomeD`) chosen by a single config value or a `?home=a` query param, so Amy can swap directions in seconds. Build A, C and D only after B is approved.

## 7. Build order (small steps you can check)

After every step: run `npm run dev`, open the screens on localhost at 390px wide, put each one next to its PNG, fix differences, and run a check that no rendered text is under 17px (a small script or a dev-only overlay that scans computed font sizes is fine). Also grep the code for the em dash character and remove any. Then stop and report.

1. **Scaffold.** Next.js App Router, TypeScript, Tailwind. Put the tokens above in the Tailwind config and CSS variables. Load Lora and DM Sans. Build shared components: PhoneFrame, StatusRow, Heading, Body, MainButton, SecondaryButton, TextLink, Option (with check box), ProgressSegments, Card, ListRow, TabBar, OverwhelmedButton, and the art (Stones, Sprig, Sun, BreathingRings). Add a `/dev/components` page showing them all.
2. **Sign in and onboarding.** Screens 40a to 40h. Mock the SMS code behind an `SmsProvider` interface (mock prints the code to the server log and accepts 123456). Keep "Call without an account" on the first two screens. Store the session in a cookie or localStorage, mock only.
3. **Home and check-in.** Home option B plus the tab bar, then 11, 12a to 12e and 13. One question per screen, centered, tap an answer then move on (swipe left or right to go next or back is a nice extra). Save answers to mock storage and add a stone on done.
4. **Apply by phone.** 14, then the five what-to-expect steps (14b to 14f) ending in "Call now". "Call now" opens a `tel:` link to a placeholder hotline number and also opens `/apply/call`, which simulates the call (timer, gentle status lines, sample questions). Add the "I'm overwhelmed" button in the fixed bottom spot on the call screen and on the by-hand form screens (15b). One tap pauses, keeps answers, and opens `/breathe` (16). "I'm ready" goes back to the same spot.
5. **Sign and send.** 03: a finger signature canvas (pointer events, clear button). Then generate the filled CF 285 for Marcus with pdf-lib and `spec/reference/cf285.mjs`, stamp the signature image on the signature line, and show it in the viewer (04) behind "See your form (PDF)". "Send it in" calls a `FaxProvider` interface whose default is a mock that logs and returns success. Then show 05. Never fill SSN fields.
6. **Everything else with sample data.** Resources (41a, 41b), community events, announcements and saved (43a to 43c), reading session (42), helper handoff (44), offline (45), profile, privacy and delete (17, 17b, 46), and the notification mock pages (30, 31).

## 8. Guardrails

- No deploys of any kind (Vercel or elsewhere) without asking Amy first.
- No paid services and no new accounts (Twilio, Upstash, a fax service, anything else) without asking Amy first. Do not ask for or add real API keys.
- SMS and fax stay behind mock interfaces (`SmsProvider`, `FaxProvider`). The mock is the default. Any future real fax may only go to a test number.
- Never ask for, collect, store or print a Social Security number. SSN fields on the PDF stay blank.
- Fictional data only. Marcus Reyes and the other personas are made up. The BFP helper name, hours, places, events and phone numbers are placeholders until BFP gives real ones.
- Keep secrets out of the repo. Use `.env.local` with an `.env.example` that lists names only.

## 9. Later phase (not now)

The real hotline backend is described in `spec/spec.md`: the ElevenLabs agent (`spec/agent-prompt.md`, `spec/intake-script.md`), the HMAC-verified post-call webhook to a Next.js route, answers stored with a 7 day expiry, the private summary link by text, the BFP helper handoff, and the acceptance tests. Do not build this until Amy says so. When she does, start from `spec/spec.md` and `spec/README.md`.
