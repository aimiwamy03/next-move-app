# Telephonic / recorded-voice signatures for CalFresh: findings for Next Move

Checked Oct 24, 2026. Read-only research. Nothing was submitted, no accounts were created. Anything I couldn't confirm in a primary source is marked **UNVERIFIED**.

## TL;DR
- **Yes, California takes recorded-voice (telephonic) signatures on CalFresh applications.** Since 2023 (CalSAWS counties) and 2024 (CalWIN counties), every county is *required* to offer a phone application with an electronic signature, such as a telephonic signature (WIC 18900.4; CDSS ACL 22-20).
- **But the rules describe a county's own system ("CWDs must record…") or a CBO working in a partnership the county agreed to (the San Diego 2-1-1 model).** No source says an unaffiliated app can record a voice "yes" and send it to a county as a valid signature, and a county fax line can't take an audio file. Treat "our app records the signature and files it" as **not legal yet without a county partnership**.
- **Two legal routes we could demo tomorrow:** (A) the caller signs on their phone from the text link, and the app faxes the signed CF 285 to the county; or (B) warm-transfer the caller to the county's phone application line, where the county records the telephonic signature. Option A is the closest thing to "call and it's filed." Option B is the most clearly legal route.

## 1. Does CA allow telephonic signatures? Yes (verified)
| Source | Date | What it says |
|---|---|---|
| 7 CFR 273.2(c)(7)(iii) and (viii), eCFR current text, https://www.ecfr.gov/current/title-7/section-273.2 | current as of check | State may accept unwritten signatures, "including… recorded telephonic signatures." (viii)(A) state must elect the option in its State plan; (B) "the State agency's telephonic signature system must make an audio recording of the household's verbal assent and a summary of the information to which the household assents"; (C) audio must be linked to the application/case file; (D) promptly give the household a written copy of the completed application, with a simple way to correct it. |
| 7 CFR 273.2(c)(1)(iv) | same | "For telephonic applications, the date of application is the date on which the household member provides verbal assent." |
| CDSS ACIN I-60-13, "Electronic Records and Telephonic Signatures in the CalFresh and CalWORKs Programs," https://www.cdss.ca.gov/lettersnotices/entres/getinfo/acin/2013/I-60_13.pdf | Sep 26, 2013 | First CA guidance. Telephonic signature = electronic signature under UETA (Civ. Code 1633.7(c), 1633.2(h)). Was optional for counties then. |
| CA Welfare & Institutions Code 18900.4 (AB 135, Stats. 2021 ch. 85, sec. 78), https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=WIC&sectionNum=18900.4. | eff. Jul 16, 2021 | "An individual shall have the option to complete an application… and provide the required client signature by telephone." Counties "may implement any method of electronic signature, including telephonic signature." Deadline: C-IV/LRS (now CalSAWS) counties by Jan 1, 2023; CalWIN counties by Jan 1, 2024. |
| CDSS ACL 22-20, "CalFresh Implementation of AB 135 Section 78(a): Electronic Signature Requirements," https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2022/22-20.pdf | Mar 4, 2022 | Puts WIC 18900.4 into effect. Requirements are listed in section 2 below. Also references ACL 17-57 (Jun 9, 2017), which defines a telephonic signature as a type of electronic signature (ACL 17-57 itself not opened, so **UNVERIFIED** beyond ACL 22-20's description). |
| Santa Clara County CalFresh handbook, "Electronic Signature," https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Electronic_Signature/Electronic_Signature.htm | undated, checked Oct 24, 2026 | County policy: accepted e-signature methods are typed name, "electronically recorded sound (i.e. telephonic signatures, voice recording)," and digital signature (e.g. DocuSign). Repeats the ACL 22-20 requirements. |
| CalSAWS design doc CA-226838 "Telephonic Signatures," http://www.calsaws.org/wp-content/uploads/2022/01/CA-226838-Telephonic-Signatures-1.pdf, and CalSAWS CCB SCR summary Jan 18, 2024 | Jan 2022 / Jan 2024 | CalSAWS added audio capture of telephonic signatures inside the system, with a worker-triggered Telephonic Signature IVR that reads set wording. Shows the county system does the recording. (Only search excerpts read; details **UNVERIFIED**.) |

MPP: ACL 22-20 cites MPP 40-131 (telephone interviews in place of face-to-face). I did not find an MPP section that sets telephonic-signature rules; they come from the CFR, WIC 18900.4, and the ACL/ACIN. **UNVERIFIED** whether an MPP section exists.

## 2. What the recorded signature must contain, and who records it
From ACL 22-20 (Mar 4, 2022) and ACIN I-60-13 (Sep 26, 2013):
1. **An affirmative act of assent**, e.g. "providing verbal affirmation" (ACL 22-20).
2. **Understanding and intent.** Per ACIN I-60-13, the signer must "provide a verbal affirmation as to their understanding that the recording will carry the same weight and effect as a signature." A telephonic signature counts only if the signer "understands that a telephonic signature is being used, consents to the use of a telephonic signature, and intends the signature to have the same force and effect as a written signature."
3. **An audio recording of the assent plus a summary of the information assented to**, e.g. read back the household details and then record the "yes" (ACL 22-20; 7 CFR 273.2(c)(7)(viii)(B)). The whole call doesn't have to be recorded (FNS memo, May 12, 2014, "SNAP Telephonic Signature Guidance," seen only as a search excerpt of https://www.fns.usda.gov/snap/snap-telephonic-signature-guidance; the page body did not render for me).
4. **A script is recommended.** CDSS points to sample scripts on the CalFresh county extranet, which is not public (ACIN I-60-13). The exact state script is **UNVERIFIED**. The CalSAWS IVR reads fixed Rights & Responsibilities wording.
5. **Linkage and retention.** The record must be kept electronically, linked to the application, and retrievable for quality control and state hearings (ACL 22-20; ACIN I-60-13). All existing MPP records-retention rules still apply (ACIN I-60-13). I found no specific retention period for audio. **UNVERIFIED**.
6. **Identity safeguards.** Protect against impersonation, identity theft, and privacy invasion. Identity is the one thing every household must verify (ACIN I-60-13; 7 CFR 273.2(f)(1)(vii)).
7. **A written copy to the household**, with a simple way to correct errors within 10 days (ACL 22-20).
8. **Must be a legal signature under CA UETA** (Civil Code 1633.1 to 1633.17) (ACL 22-20).
9. **Filing date** = the date of the telephonic signature (ACIN I-60-13; 7 CFR 273.2(c)(1)(iv)).

**Who records it?** The rules are written for the county: "CWDs must record…" (ACIN I-60-13), and "the State agency's telephonic signature system" (7 CFR). **Third parties are allowed only by arrangement with the county:**
- FNS memo (May 12, 2014, search excerpt): "In San Diego County, a CBO has partnered with the county to conduct application assistance and capture telephonic signatures." The rest of the passage is **UNVERIFIED** (I couldn't open the PDF).
- 2-1-1 San Diego slide deck on the CDSS outreach site, "Telephonic Signatures: The Whole Truth" (undated), https://www.cdss.ca.gov/calfreshoutreach/res/pdf/2-1-1%20SD%20Tele-Sign%20Presentation.pdf. The CBO records with call-recording software, uploads the file to the county, and the county reviews it and stores it. Other 2-1-1s (SF, San Bernardino, Imperial) rename files to the county's naming rules. The deck's top best practice is "Partnership – Work with your County first."
- CBPP "SNAP & Medicaid Telephonic Signature Toolkit" (2026), https://www.cbpp.org/sites/default/files/2-5-26health-fillable.pdf: "FNS has also indicated in multiple guidance documents that third parties, such as community-based organizations, are able to use these same telephonic signature processes," and states should formalize these through contracts.

**Conclusion:** a CBO/app-captured voice signature is a recognized model, **but only inside a county partnership** with an agreed upload path, file naming, and retrieval. No source supports an unaffiliated app faxing or emailing an audio "yes" to a county as a signed application. Partnering with BFP alone doesn't change that, because the county has to agree.

## 3. Legitimate ways for a third party to get an application to a county
| Route | Status | Notes |
|---|---|---|
| **Fax / mail / drop-off of a signed CF 285** | Verified | Federal: households may file "in person, through an authorized representative, by mail, by completing an on-line electronic application, or, if available, by fax, telephone, or other electronic transmission" (7 CFR 273.2(c)(1)(i)). A handwritten signature sent by fax is valid (7 CFR 273.2(c)(7)(vi)). Example: SF HSA takes fax at (415) 355-2300 and mail at P.O. Box 7988, SF 94120 (https://www.sfhsa.org/services/food/calfresh/apply-calfresh). San Benito and Yuba counties also list fax numbers. Nothing stops a helper or app from sending a fax the applicant signed. |
| **E-signature (finger-drawn or typed) put on the PDF, then faxed** | Partly verified | CA treats typed names and DocuSign-style digital signatures as valid e-signatures (Santa Clara handbook; ACL 22-20 via UETA). **UNVERIFIED**: whether a county intake worker accepts a faxed CF 285 with a drawn e-signature without question. Likely, since faxes arrive as images anyway, but it's unconfirmed. |
| **Email** | County-specific | SF lists sfbncfmc@sfgov.org as a contact email. **UNVERIFIED** whether it's accepted for filing applications. |
| **BenefitsCal CBO account** | Verified, but not possible by tomorrow | A CBO Manager requests access, the county approves (LA DPSS also requires a User & Confidentiality Agreement), and then assisters "may submit applications on behalf of customers in any County" (CalSAWS QRG, Oct 2025, https://www.calsaws.org/wp-content/uploads/2025/10/Quick-Guide-Community-Based-Organization-Request-Access.pdf). It's a web UI, not an API, and CBO users must never log in to a client's account. This is BFP's real long-term path. |
| **Authorized representative** | Verified (federal) | An AR may sign (7 CFR 273.2(c)(7)(iv)(B)). The AR must be an adult the household designates *in writing*, and the AR's identity is also verified (7 CFR 273.2(f)(1)(vii)). Not a fit for an app. |
| **GetCalFresh-style app submission** | Gone | Code for America's GetCalFresh submission tools were retired after Jun 30, 2025, and CBOs were redirected to the BenefitsCal CBO platform (CDSS, https://cdss.ca.gov/inforesources/cdss-programs/calfresh-outreach/getcalfresh-transition). That's the precedent: third-party submission was done under a state contract. |
| **CalSAWS partner/API access** | None found | **UNVERIFIED / not found.** |

**Minimum to set a filing date:** the applicant's name, address (unless homeless), and the signature of an adult household member or authorized representative. The date is when the right county office *receives* it, or the next business day if it arrives after hours (7 CFR 273.2(c)(1)(iii) and (iv); 273.2(g)(1); SF HSA page). For telephonic applications, it's the date of verbal assent. For someone applying from an institution before release, it's the release date (7 CFR 273.2(c)(1)(vi)(A)).

## 4. Recommendation for the 1-day hackathon build
**Recommended flow: "call, sign on your phone, we fax it to your county."**
1. The caller talks to the ElevenLabs agent (as now). No SSN.
2. At the end, the agent reads back a summary and asks: "Do you want to send this to the county as your application?" Record this as consent to *send*, **not** as the legal signature.
3. A text arrives with the private link. That page shows the filled CF 285 summary, a **finger-draw signature box** with the CF 285 penalty-of-perjury statement shown above it, and a "Sign and send to [County]" button.
4. The app stamps the signature and date into CF 285 fields 35 and 36, then **faxes the PDF to the county's published fax number** through a fax API. Keep the transmission receipt. Also notify the BFP helper.
5. Confirmation text and screen (wording below), plus a copy of the filed application. This matches the "written copy" principle in ACL 22-20.
6. For the demo: **fax to a test number you own, not a real county.** Show "would send to SF HSA (415) 355-2300." Sending fake applications to a real county is not OK.

**Fallback and judge talking point: warm transfer.** "Press 1 and we'll connect you to the county to sign by voice." This transfers the call to the county line (SF: (855) 355-5757), where the county records the telephonic signature on its own system. It's fully legal (WIC 18900.4 makes counties offer this), but the county redoes intake, and hold times are **UNVERIFIED**.

**Don't build tomorrow:** app-recorded voice signatures sent to the county. That needs a county partnership like San Diego 2-1-1's. Pitch it as the roadmap: "Next step: partner with SF HSA so BFP can capture telephonic signatures the way 2-1-1 San Diego does."

| Piece | Verified? |
|---|---|
| Counties accept telephonic signatures recorded by the county | Verified (WIC 18900.4; ACL 22-20) |
| CBO-captured telephonic signatures, with a county partnership | Verified as a model (FNS 2014 excerpt; 2-1-1 SD deck; CBPP 2026) |
| An unaffiliated app's voice recording counts as a signature | **Not supported. Treat as not valid.** |
| Faxed, signed CF 285 starts the filing date on receipt | Verified (7 CFR 273.2(c)(1), (c)(7)(vi), (g)(1)) |
| Finger-drawn e-signature on a faxed CF 285 accepted by the county | **UNVERIFIED** (legal under UETA; county practice unconfirmed) |
| County email accepted for applications | **UNVERIFIED** |
| Fax API availability and cost | **UNVERIFIED** (not researched) |

## 5. Timeline wording for the confirmation message
Sources: 7 CFR 273.2(g)(1) (30 days); 273.2(e)(3) (interview scheduled within 30 days); CA 3-day expedited service per SF HSA ("Expedited Services within three days") and Yuba County ("within 3 days"). Federal law allows 7 days; California uses 3. The MPP section for the 3-day rule was not opened (**UNVERIFIED** cite; commonly MPP 63-301.5). SF HSA: "Receive approval or denial… within 30 days by mail"; EBT card "by mail in one week once approved"; interview "by phone or in person."

Suggested text (doesn't name CalFresh, per spec):
> "Sent. Your form went to [County] on [date]. That date counts. The county will call you to set up a short interview. They decide within 30 days. If you have little or no money, you may get food money within 3 days. The county decides. Questions: [county phone]. A Next Move helper will also check in."

Without fax (helper path):
> "Got it. A Next Move helper will call you within [X days from BFP] to sign and send it in. The day the county gets your signed form is the day that counts."

Don't promise our own timeline for county actions. No interview timeframe is promised above because none was verified (the federal rule only says it must be scheduled so benefits can be given within 30 days).
