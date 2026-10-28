# Next Move (React Native)

Calm, phone-first Expo app for people recently home. Demo persona is **Marcus Reyes**.

Designs live in `../designs/`. Specs live in `../spec/`.

## Run

```bash
cd mobile
npm install
npm start
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR with Expo Go.

## Demo login

1. Welcome → Get started  
2. Enter any valid 10-digit phone (e.g. `5105550100`)  
3. Code: **123456**  
4. Finish name → privacy → reminders  

## Edge cases covered

| Case | Where |
|---|---|
| Wrong SMS code | `/sign-in/code` |
| Invalid / short phone | `/sign-in` |
| Resend code / wrong number | `/sign-in/code` |
| Empty name | `/onboarding/name` |
| Skip check-in steps | Check-in nav + swipe |
| Multi-select "weighing on you" | `/check-in/4` |
| I'm overwhelmed → breathe → resume | Call + form → `/breathe` |
| Empty signature | `/apply/sign` |
| Offline send / call instead | `/offline`, guarded send |
| Delete confirm (Keep is primary) | `/me/delete` |
| Sign out without delete | `/me/delete` |
| Call without an account | Welcome + sign-in |
| First-day vs day-5 home | After onboarding / Me demo controls |
| Lock screen copy never says prison / parole / CalFresh | `/demo/lockscreen/[1-3]` |
| Never collects SSN | PDF viewer note + privacy copy |

## Home layouts

Default is option **B** ("one next thing"). Cycle in **Me → Demo controls**, or open:

`/(tabs)/home?home=a` (also `b`, `c`, `d`)

## Backend later

Mocks live in:

- `src/providers/sms.ts` (`SmsProvider`)
- `src/providers/fax.ts` (`FaxProvider`)
- `src/providers/api.ts` (profile, resources, handoff, delete)
- `src/mock/data.ts` (Marcus + sample content)

Set `EXPO_PUBLIC_API_URL` in `.env.local` (see `.env.example`) when the API is ready. Keep SMS and fax behind the provider interfaces.

## Guardrails

- No SSN collection  
- Fictional data only  
- No paid services / deploys without asking Amy  
- Text ≥ 17px, no em dashes, no pill buttons  
