# Eligibility rules and "you may also qualify" flags

All sources below were checked on Oct 24, 2026 unless marked otherwise. The app never decides eligibility. Every flag is worded "you may qualify" and points to who decides (the county, DMV, the LifeLine administrator).

Server code: `reference/cf285.mjs` `computeFlags()`. Inputs are the data-schema.json fields.

## 1. Expedited CalFresh (food money within 3 days)

| Rule | Logic in app | Source (checked on Oct 24, 2026) |
|---|---|---|
| Test A | income this month < $150 AND cash + bank <= $100 | CF 285 (8/21) page 1 checkbox question, https://www.cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF285.pdf ; ACL 16-14, https://www.cdss.ca.gov/lettersnotices/entres/getinfo/acl/2016/16-14.pdf ; 7 CFR 273.2(i), https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-B/section-273.2 |
| Test B | income this month + cash + bank < rent or mortgage + utilities | same sources |
| Test C | destitute migrant or seasonal farmworker household | same sources. Not asked; form box set to No; helper can change. |
| Timeline | California: benefits within 3 calendar days if eligible. Federal floor is 7 days. | CF 285 coversheet; ACL 16-14 |
| To be screened | Answer CF 285 questions 1, 6, 7, 8, 11, 16 and give ID proof if you have it | CF 285 coversheet |

Test B caveat: utilities are counted using a county standard allowance, not the actual bill. The app does not know that dollar amount, so if Test B only passes once utilities are added, the app leaves the box blank and the summary says "the county checks this". UNVERIFIED: the current California utility allowance amount (not looked up).

What the agent may say: "Based on what you told me, you may qualify for fast help. The county decides." Never "you will get".

## 2. "Filing today locks your date"

- Minimum to file: name, address, signature. Source: CF 285 coversheet; ACL 16-14 (checked on Oct 24, 2026).
- The processing clock starts the day the county gets the signed application. If the person applies from an institution, it starts the day they leave. Source: CF 285 coversheet.
- People with no address can still apply. The county helps with an address for notices. Source: CF 285 page 1 ("If yes, please let the County know right away if you are homeless...").
- BenefitsCal does not require an account to apply; the person saves the confirmation receipt with the application number. Sources: CalSAWS quick guide and GetCalFresh FAQ, https://www.getcalfresh.org/en/faq/ (checked on Oct 24, 2026). GetCalFresh itself no longer accepts applications and sends people to BenefitsCal.

Agent wording: "When you sign and send it, that day counts. Name, address, and signature are enough to start."

## 3. Medi-Cal: "check your exit papers"

- Flag when `has_medi_cal` is no or unsure.
- Many people leaving state prison had a Medi-Cal application filed for them before release (CalAIM justice-involved pre-release services, up to 90 days of services, application started as early as about 135 days before release). Sources: CCHCS CalAIM https://cchcs.ca.gov/calaim/ (opened in earlier research today; returns 403 to scripts), DHCS JI toolkit https://www.dhcs.ca.gov/calaim-transforming-medi-cal/dhcs-justice-involved-waiver-stakeholder-toolkit/ ; CDCR TCMP https://www.cdcr.ca.gov/law-enforcement-resources/home/prcs/prcs-resources/
- The CF 285 has a "Are you interested in Medi-Cal?" box (field 552). Yes means the county uses the CalFresh answers to see if the person can get Medi-Cal.
- Summary text: "You may already have Medi-Cal. Check the papers you got when you left. If not, the county can check when it reviews this form."

## 4. California LifeLine (phone discount)

- Flag always, worded as "after approval".
- Program-based route: anyone in the household on CalFresh (SNAP) or Medi-Cal qualifies; proof is the approval letter. Income-based route also exists (1 person: $24,600 a year, Jun 1, 2026 to May 31, 2027). Source: CPUC https://www.cpuc.ca.gov/lifeline/ (checked on Oct 24, 2026).
- Discount up to $19.00 a month on cell or home phone; one per household. Source: same CPUC page.
- Apply through a LifeLine phone company; administrator site https://www.californialifeline.com/en (blocks scripts; content not re-opened today).
- Summary text: "When your CalFresh or Medi-Cal letter comes, you may qualify for a cheaper phone plan. Keep the letter."
- Note: CPUC lists "missing last four digits of SSN" as a reason LifeLine forms get denied. Our app never collects it. The person handles that with the phone company.

## 5. State ID: $6 or free

- Flag when `has_cal_id` is no or unsure.
- Reduced fee ($6) ID card for people eligible for CalFresh and other county aid; the county or a registered nonprofit verifies on form DL 937. Free ID for people who are homeless under McKinney-Vento, verified on form DL 933. ID cards only, not driver licenses. Forms must reach DMV within 90 days. Sources: DMV https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/reduced-no-fee-id-card-program-information-for-organizations/ (checked on Oct 24, 2026) and Vehicle Code 14902 https://california.public.law/codes/vehicle%5Fcode%5Fsection%5F14902 . The $6 amount comes from earlier research today on the DMV ID page; the DMV organizations page does not state a dollar amount.
- The DMV page says individuals get the voucher from their county public assistance office.
- Only government agencies and 501(c)(3)s that serve low-income or unhoused people can register to hand out DL 933 or DL 937. UNVERIFIED: whether BFP has registered.
- Summary text (housed): "You may qualify for a $6 state ID. Ask the county for form DL 937."
- Summary text (homeless): "You may qualify for a free state ID. A homeless service provider can give you form DL 933."

## 6. Things the county decides that the agent should only mention

| Topic | What the agent says | Source (checked on Oct 24, 2026) |
|---|---|---|
| Work rules (H.R. 1, from Jun 1, 2026) | "Some adults 18 to 64 may need about 20 hours a week of work, school, or volunteering. The county will explain if it applies to you." Do not screen. Exemptions include disability, pregnancy, caring for a child under 14, and others. | CDSS H.R. 1 FAQ https://cdss.ca.gov/benefits-services/food-nutrition-services/calfresh/frequently-asked-questions ; CDSS ABAWD https://www.cdss.ca.gov/inforesources/calfresh/abawd |
| Noncitizens (H.R. 1, from Apr 1, 2026) | Ask only "Are you a U.S. citizen? You can skip this." If no: "Okay. The county will go over it. A helper can talk it through." Do not screen status. Some lawfully present groups (for example refugees, asylees, most parolees) are no longer eligible. | CDSS H.R. 1 FAQ (same URL); LA DPSS 63-405 https://my.dpss.lacounty.gov/public/en/home/epolicy/program/calfresh/63-405-citizenship-or-eligible-non-citizen-status.html |
| Utility deduction (from Nov 1, 2025) | Ask about heating or cooling bills separately from rent. | CDSS H.R. 1 FAQ |
| Drug felony | California ended the drug felony ban on Apr 1, 2015. Never ask about convictions. | ACL 14-100 (from earlier research, not re-opened today); WIC 18901.36 https://california.public.law/codes/welfare_and_institutions_code_section_18901.36 |
| Fleeing felon, probation or parole violation | These are CF 285 Q21 and Q22. The applicant answers them when signing. The agent never asks. | CF 285 page 8 |

## 7. Crisis

- 988 Suicide and Crisis Lifeline: call or text 988. For immediate danger, 911. Source: https://988lifeline.org/ (blocks scripts; well-established number).

## 8. Contacts used in the app

| Who | Contact | Status |
|---|---|---|
| Statewide CalFresh info line | 1-877-847-3663 | From CDSS page, checked earlier today |
| Boundless Freedom Project | 916-747-4294 | From boundlessfreedom.org earlier today. UNVERIFIED: hours and who answers |
| BFP named helper | PLACEHOLDER "Maria" | UNVERIFIED: Amy must get a real name and number from BFP before any real call |
| BFP Virtual Sangha | 1st and 3rd Wednesdays, 5pm PT (next: Nov 4 and Nov 18, 2026) | https://boundlessfreedom.org/sangha |
