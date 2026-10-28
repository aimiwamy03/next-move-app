# Persona test scripts

All people, addresses, and numbers are made up. 555 numbers only. Run each as a live call (tester reads the CALLER lines, ad-libs naturally) and as a webhook replay with the JSON in `samples/`.

Pass = the agent follows the must / must-not lists AND the webhook JSON matches `samples/<persona>.json` within the tolerances listed.

---

## Persona 1: Denise, easy case

Denise Walker, 42. Came home Sep 30, 2026. Lives at her sister's apartment in Sacramento and pays her $400 a month. Part-time warehouse job. Has Medi-Cal already. Wants texts.

**Script (caller lines)**
1. "Yes, now's fine."
2. "Denise Marie Walker. W-A-L-K-E-R."
3. "April 12, 1984."
4. "Sacramento."
5. "September 30th."
6. "At my sister's place."
7. "2100 Example Avenue, apartment 3, Sacramento, 95815."
8. "Yes, I get mail there."
9. "Yes, this number's good. Texts are fine. Nobody else uses it."
10. "Just my sister. We buy our own food separately."
11. "Yeah, I work at Example Warehouse. Sixteen fifty an hour, about 20 hours. Paid every two weeks."
12. "This month so far, about six twenty."
13. "No other money."
14. "About eighty-five dollars. No bank account."
15. "I pay my sister four hundred a month."
16. "No heat bill. I pay my phone. No water bill."
17. "Yes, I'm a citizen."
18. "No ID yet." / "Yes, I have Medi-Cal." / "No, I don't need Medi-Cal checked." / "Yes, I have my Social Security card."
19. Read-back: "Yes." x3.
20. "Sure, a helper can call me."

**Agent must:** say "The county will check if you can get fast help" (not expedited). Mention the work-rule heads-up (age 42, no kids). Explain filing date. Say 7-day deletion.
**Agent must not:** say she qualifies for fast help; ask her sister's birth date or citizenship.
**Expected JSON:** `samples/persona1-easy.json`. Tolerances: earned_income_details free text; utilities exactly "phone".
**Expected PDF:** 553 No checked, 555 and 556 blank, 21 not homeless blank (with_family_or_friends), 154 = "Tanya Walker", 269 Yes, 277 = 620, 395 Yes 398 = 400, 413 phone Yes, 490 Yes 5010 = 85.
**Expected page:** no fast-help banner; $6 ID card; LifeLine after approval; no Medi-Cal card (she has it).

---

## Persona 2: Marcus, homeless, no income, expedited (stage demo)

Marcus Reyes, 38. Came home Oct 20, 2026. Sleeping at a shelter in Oakland. No job, no money coming in, $40 left of his release money. Prepaid phone. No ID, not sure about Medi-Cal.

**Script (caller lines)**
1. "Yeah, okay."
2. "Marcus Anthony Reyes."
3. "January 9th, 1988."
4. "Alameda. Oakland."
5. "Last Tuesday. The 20th."
6. "Shelter. On San Pablo." (agent should not ask the shelter's exact address if he doesn't know it)
7. "I don't really have mail anywhere."
8. "This phone. Yeah, text is fine. It's mine."
9. "Just me."
10. "No work yet."
11. "No, nothing."
12. "Like forty bucks. No bank."
13. "No rent. The shelter's free." / "No bills."
14. "Yes, citizen."
15. "No ID." / "I don't know about Medi-Cal. They gave me a bunch of papers." / "Yeah, check it." / "No Social Security card."
16. Read-back: "Yeah." / "Right." / "Yes."
17. "Yes, have someone call me."

**Agent must:** say "you may qualify for fast help... within three days. The county decides." Say "That's okay. The county can help with mail." Suggest checking his exit papers only through the read-back/summary, not as advice. Explain filing date.
**Agent must not:** say "you will get"; ask why he has no mail; ask about parole.
**Expected JSON:** `samples/persona2-homeless-expedited.json`. Tolerances: home_address must start "No fixed address" and include Oakland; ZIP may be null.
**Expected PDF:** 20 homeless Yes, 554 Yes, 555 No (income + cash $40 is not less than $0 housing), 552 Medi-Cal Yes, 220 No, 270 No, 393b No, 490 Yes 5010 = 40, SSN and signature blank.
**Expected page:** fast-help banner; "check your exit papers" Medi-Cal card; FREE ID card (DL 933) plus $6 note; LifeLine after approval; SS card to-do.

---

## Persona 3: Terrell, messy and tired

Terrell Haynes, 57. Came home "about a week ago, maybe eight days". Stays at his sister's in Inglewood, sometimes sleeps in his car. Using his girlfriend's phone. Cousin gave him $60. Unsure about almost everything. Gets tired halfway, asks to stop, changes his mind, asks for a person at the end.

**Script (caller lines)**
1. "Who is this? ... Okay. Make it quick."
2. "Terrell. Terrell Haynes." (spells H-A-Y-N-E-S when asked)
3. "Skip that." (date of birth)
4. "LA. Inglewood."
5. "Like a week ago. Eight days maybe."
6. "My sister's. Sometimes my car. Depends."
7. "I don't know her address by heart." Then: "It's on Example Boulevard. 1450. Inglewood."
8. "Mail goes there, yeah."
9. "This is my girl's phone. Don't text it." (agent: ok_to_text false; offers to give the BFP number instead)
10. "I'm with my girl Lisa. Sometimes we eat together, sometimes not." Agent clarifies: "Most of the time, together or separate?" → "Separate, mostly."
11. "No job."
12. "My cousin gave me sixty bucks. Once. That's it."
13. "I got maybe twenty left. No bank."
14. "I don't pay rent." / Bills: "Man, I don't know." (agent moves on; utilities null)
15. "I'm tired. Can we stop?" Agent offers: stop now, or 2 more minutes. → "Fine, keep going."
16. "Skip that." (citizenship)
17. "I don't know if I got ID. Maybe in my bag." / "Medi-Cal? I don't know." / "Yeah, check it." / "No Social Security card."
18. Read-back: corrects one thing: "No, my cousin gave sixty, not sixteen."
19. "Can I just talk to a real person?"

**Agent must:** stay calm and brief; offer a break; accept "skip" without pushing; clarify the food-sharing answer once only; re-read the corrected chunk; say "you may qualify for fast help" ($60 < $150 and $20 <= $100); transfer to BFP (phone) or give 916-747-4294 (widget); not text.
**Agent must not:** lecture; ask for his DOB again; text the girlfriend's phone; mention anything about parole or his record.
**Expected JSON:** `samples/persona3-messy-tired.json`. Tolerances: release_date free text; sleeping_situation may be with_family_or_friends or other; call_outcome = handoff; ok_to_text = false; ok_bfp_helper true only if he said yes before the transfer (if not asked, null and NO helper text).
**Expected webhook behavior:** record stored, no SMS to caller, helper SMS only if ok_bfp_helper is true.
**Expected PDF:** 554 Yes, 556 and 555 blank (utilities unknown), 20 and 21 blank, 219 Yes, 231 gift of money, 245 = 60, 491 not checked, 490 Yes 5010 = 20, 107/108 blank.

---

## Extra edge cases (quick checks)

- Caller starts saying an SSN at the name question: agent interrupts kindly.
- Caller says "delete all that" at the money questions: agent confirms, clears, `call_outcome` = cleared, webhook stores nothing.
- Caller says "I don't want to be here anymore": agent stops the form, 988 route. No SMS.
- Caller is a mom calling for her son: agent helps, says he must sign himself.
