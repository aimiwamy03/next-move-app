# CF 285 field map

## The form

- **Form:** CF 285 (8/21) "Application for CalFresh Benefits", California Department of Social Services. Footer: "REQUIRED FORM - SUBSTITUTES NOT PERMITTED". So we fill the real form; our summary page is a helper, never a replacement.
- **Downloaded:** Oct 24, 2026 from https://www.cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF285.pdf (782,414 bytes) -> `forms/CF285.pdf`. The older `cdssweb/entres/forms/English/CF285.pdf` URL now redirects to a 404.
- **UNVERIFIED:** whether CDSS has a post-H.R. 1 revision coming. 8/21 is still the posted version as of Oct 24, 2026.

## Is it fillable? Yes.

- AcroForm, 538 fields (293 text, 245 checkbox), no XFA, 18 PDF pages.
- PDF pages 1 to 8: coversheet and program rules (no fields to fill). PDF pages 9 to 18 = form pages 1 to 10.
- Encrypted (RC4) with an EMPTY user password. Permissions allow printing and form filling, not editing content. Filling is within the form's permissions.
- pdf-lib 1.17.1 cannot open the encrypted file (throws; with `ignoreEncryption` it sees 0 fields). Fix: decrypt once with pypdf -> `forms/CF285_unlocked.pdf` (`reference/decrypt-cf285.py`). Ship the unlocked copy in the app.
- Tested Oct 24, 2026: `reference/cf285.mjs` filled all 3 personas; pages rendered and checked visually (`samples/*.CF285.pdf`).
- **Field names have TWO spaces:** `'CF 285  4'`, not `'CF 285 4'`. One checkbox is `'CF 285  393b'`.
- Yes/No pairs are two separate checkboxes, not radio groups. Check only one.
- The form prints its own `$` in money cells. Fill numbers only.
- Do not flatten. The person or helper may need to edit before signing.
- Full inventory with page, rect, tooltip: `forms/cf285-fields.json`. Regenerate with `reference/list-fields.py`.

No overlay or answer-sheet fallback is needed. If a future revision ships without fields, fall back to drawing text at the rects in `cf285-fields.json` with pdf-lib `page.drawText`.

## Never fill (code throws if attempted)

| Field | What |
|---|---|
| 6 | Applicant SSN |
| 109, 1018, 1026, 1034, 1042 | Household SSN column |
| 35 | Signature (wet or e-sign by the person) |
| 36 | Signature date |
| 158 to 197 | Q6b noncitizen details, Q6c sponsor (county or helper) |
| 523 to 540 | Q17 to Q22 (duplicate benefits, trafficking, fleeing felon, probation or parole violation). The person answers these when signing. |
| 25 to 30 | Optional disability, accommodation, domestic violence questions (not asked) |
| 52 to 79 | Optional race and ethnicity (not asked) |

## Schema field -> PDF field

Page numbers are PDF pages. `n` means field name `'CF 285  n'`.

### Page 9 (form page 1), Q1 Applicant information

| Schema id | PDF field(s) | Rule |
|---|---|---|
| full_name | 4 | "First Middle Last" as said |
| home_address | 7 street or directions, 8 city, 9 state, 10 ZIP | split on `|`; 9 always "CA". "No fixed address" goes in 7 |
| mailing_address | 11, 12, 13, 14 | skip if "same" or "needs help" |
| phone_number | 16 cell phone | 15 home phone and 18 work phone unused |
| ok_to_text | 17 checkbox "check box for text" | only if true |
| sleeping_situation | 20 homeless Yes / 21 No | shelter or outside_or_vehicle -> 20; own_place or transitional_or_sober_living -> 21; else blank |
| preferred_language | 22 read, 23 speak | blank if English |
| wants_medi_cal | 552 Yes / 1011 No | |
| computed expedited_a | 554 Yes / 553 No | income < $150 and cash+bank <= $100 |
| computed expedited_b | 556 Yes / 555 No | blank when the answer depends on the utility allowance |
| (not asked) | 557 No | migrant or seasonal farmworker |
| (never) | 35, 36 | signature, date |

### Page 10 (form page 2), Q2 to Q5

Not filled in the MVP. Available: 42/43 authorized representative Yes/No (39 name, 40 phone); 44/45 someone else to use the EBT card; interview preference 82 to 94 (82 today, 83 next available, 84 any day, 90 to 94 times); Q5 prior aid 95/96.

### Page 11 (form page 3), Q6a Household

| Line | Applying Y/N | Name (Last, First MI) | Relation | DOB | Citizen Y/N | SSN (never) |
|---|---|---|---|---|---|---|
| 1 (applicant) | 101/102 | 103 | 104 (pre-printed "Self", leave) | 105 | 107/108 | 109 |
| 2 | 1010/1012 | 1013 | 111 | 1014 | 1016/1017 | 1018 |
| 3 | 1019/1020 | 1021 | 112 | 1022 | 1024/1025 | 1026 |
| 4 | 1027/1028 | 1029 | 113 | 1030 | 1032/1033 | 1034 |
| 5 | 1035/1036 | 1037 | 114 | 1038 | 1040/1041 | 1042 |

- Line 1: 101 checked, 103 from full_name, 105 from date_of_birth, 107/108 from citizenship (skip -> blank).
- household_json items with `buys_and_cooks_together: true` -> lines 2 to 5.
- Items with `false` -> "lives with you but buys and cooks separately" names 154, 155, 156, 157.
- Gender (106, 1015, 1023, 1031, 1039) not collected; the person fills it.

### Page 12 (form page 4), Q7 Unearned income

| Schema id | PDF field(s) |
|---|---|
| other_income_month > 0 | 219 Yes; 243 person; 244 from where (details text); 245 amount; 246 how often |
| other_income_month = 0 | 220 No |
| other_income_details keywords | 221 Social Security, 222 SSI/SSP, 224 CalWORKs/GA/GR/CAPI, 231 gift of money, 232 UI/SDI, 236 help with rent/food/clothing, 240 other + 241 list |
| (continue Y/N) | 247/248 (left for the helper; details text says if it continues) |

Rows 2 to 4: 249 to 254, 255 to 260, 261 to 266. 267 explanation.

### Page 13 (form page 5), Q8 Earned income

| Schema id | PDF field(s) |
|---|---|
| earned_income_month > 0 | 269 Yes; 271 person; 272 employer (details text); 277 total gross this month |
| earned_income_month = 0 | 270 No |
| (optional, if parsed) | 273 employer phone, 274 hourly rate, 275 hours/week, 276 how often paid, 278/279 continue |

Lost job in last 60 days 308/309, strike 314/315, self-employment 320 to 354: not asked.

### Page 14 (form page 6), Q11 Household expenses

| Schema id | PDF field(s) |
|---|---|
| any expense | 393 Yes / 393b No |
| housing_cost_month > 0, not shelter | 395 rent Yes, 397 who pays, 398 amount, 399 how often |
| housing_cost_month > 0, shelter | 418 homeless shelter expense Yes, 420 who pays, 421 how often (amount written in) ; 396 rent No |
| housing_cost_month = 0 | 396 rent No |
| utilities has heating_cooling | 408 Yes, 4010 who pays, 411 how often (no amount: it's an allowance) ; else 409 No |
| utilities has phone | 413 Yes, 415, 416 ; else 414 No |
| utilities has water_trash | 423 Yes, 425, 426 ; else 424 No |

Property tax 401/402, outside help paying 427/429, LIHEAP 428/433: not asked. Q9 care costs (355/356) and Q10 child support (383/384): not asked.

### Page 15 (form page 7), Q12 to Q15

Medical costs, meals, institutions. Not filled in the MVP.

### Page 16 (form page 8), Q16 Resources

| Schema id | PDF field(s) |
|---|---|
| cash_and_bank > 0 | 490 Yes; 499 cash on hand; row 1: 505 whose name, 509 type, 5010 amount, 5011 where |
| cash_and_bank = 0 | 491 No |

Other types 492 checking, 493 savings, 494 to 508. Rows 2 to 4: 5012 to 5015, 5016 to 5019, 5020 to 5023. Gave away resources 521/522: not asked.

### Pages 17 to 18 (form pages 9 to 10)

Additional writing space (541 and up). Not used.

## Not on the form (summary page only)

county, release_date, has_cal_id, has_medi_cal, has_ss_card, ok_bfp_helper, call_outcome.

## Files

- `forms/CF285.pdf`: official blank, as downloaded.
- `forms/CF285_unlocked.pdf`: decrypted copy for pdf-lib.
- `forms/cf285-fields.json`: all 538 fields with page, rect, tooltip.
- `reference/cf285.mjs`: `fillCf285(bytes, answers)` and `computeFlags(answers)`. Tested.
- `reference/run-samples.mjs`: fills `samples/*.json` -> `samples/*.CF285.pdf`.
- `reference/decrypt-cf285.py`, `reference/list-fields.py`.
- `reference/check-samples.mjs`: asserts acceptance tests 9 to 11 on the sample PDFs (passed Oct 24, 2026).
