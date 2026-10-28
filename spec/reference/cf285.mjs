// Reference implementation: answers (data-schema.json shape) -> filled CF 285 bytes.
// Tested Oct 24, 2026 with pdf-lib 1.17.1 on forms/CF285_unlocked.pdf.
// Port to TypeScript in the Next.js app (lib/cf285.ts). Field names have TWO spaces: 'CF 285  <n>'.
import { PDFDocument } from 'pdf-lib';

const NEVER_FILL = new Set(['6', '109', '1018', '1026', '1034', '1042', '35', '36']); // SSNs, signature, date

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const money = (v) => String(Math.round(Number(v))); // form prints its own "$"
const splitAddr = (s) => {
  if (!s || s === 'same' || s === 'needs help') return null;
  const [street = '', city = '', zip = ''] = String(s).split('|').map((x) => x.trim());
  return { street, city, zip };
};
const lastFirst = (full) => {
  const p = String(full || '').trim().split(/\s+/);
  if (p.length < 2) return full || '';
  const last = p.pop();
  const first = p.shift();
  const mi = p.length ? ' ' + p[0][0].toUpperCase() : '';
  return `${last}, ${first}${mi}`;
};
const parseHousehold = (s) => {
  try { const a = JSON.parse(s || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
};
const utilList = (u) => (u ? String(u).split(',').map((x) => x.trim()).filter(Boolean) : null);

export function computeFlags(a) {
  const earned = num(a.earned_income_month);
  const other = num(a.other_income_month);
  const cash = num(a.cash_and_bank);
  const housing = num(a.housing_cost_month);
  const utils = utilList(a.utilities);
  const income = earned === null && other === null ? null : (earned || 0) + (other || 0);

  // Expedited test A (CF 285 p.9; 7 CFR 273.2(i)(1)(i)): income < $150 AND liquid <= $100
  const expA = income === null || cash === null ? null : income < 150 && cash <= 100;
  // Expedited test B: income + liquid < rent/mortgage + utilities. We do not know the county utility
  // allowance amount, so only answer when the result does not depend on utilities.
  let expB = null;
  if (income !== null && cash !== null && housing !== null) {
    if (income + cash < housing) expB = true;
    else if (!utils || utils.includes('heating_cooling') || utils.includes('phone') || utils.includes('water_trash')) expB = null; // county checks
    else expB = false;
  }
  const household = parseHousehold(a.household_json);
  const foodHousehold = household.filter((m) => m.buys_and_cooks_together === true);
  const sleeping = a.sleeping_situation;
  return {
    expedited_a: expA,
    expedited_b: expB,
    may_qualify_expedited: expA === true || expB === true,
    household_size: 1 + foodHousehold.length,
    homeless: sleeping === 'shelter' || sleeping === 'outside_or_vehicle' ? true
      : sleeping === 'own_place' || sleeping === 'transitional_or_sober_living' ? false : null,
    medi_cal_check_exit_papers: a.has_medi_cal !== 'yes',
    reduced_fee_id: a.has_cal_id !== 'yes',
    no_fee_id_if_homeless: a.has_cal_id !== 'yes' && (sleeping === 'shelter' || sleeping === 'outside_or_vehicle'),
    lifeline_after_approval: true,
    immigration_check: a.citizenship === 'no',
    ss_card_todo: a.has_ss_card !== 'yes',
  };
}

export async function fillCf285(pdfBytes, a) {
  const doc = await PDFDocument.load(pdfBytes); // must be the decrypted copy
  const form = doc.getForm();
  const T = (n, v) => {
    if (NEVER_FILL.has(String(n))) throw new Error(`refusing to fill protected field ${n}`);
    if (v === null || v === undefined || v === '') return;
    form.getTextField(`CF 285  ${n}`).setText(String(v));
  };
  const C = (n) => {
    if (NEVER_FILL.has(String(n))) throw new Error(`refusing to fill protected field ${n}`);
    form.getCheckBox(`CF 285  ${n}`).check();
  };
  const YN = (val, yes, no) => { if (val === true) C(yes); else if (val === false) C(no); };
  const f = computeFlags(a);
  const name = a.full_name || '';

  // Page 9 (form page 1): Q1
  T(4, name);
  const home = splitAddr(a.home_address);
  if (home) { T(7, home.street); T(8, home.city); T(9, 'CA'); T(10, home.zip); }
  const mail = splitAddr(a.mailing_address);
  if (mail) { T(11, mail.street); T(12, mail.city); T(13, 'CA'); T(14, mail.zip); }
  const d = String(a.phone_number || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  T(16, d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : a.phone_number);
  if (a.ok_to_text === true) C(17);
  YN(f.homeless, 20, 21);
  T(22, a.preferred_language); T(23, a.preferred_language);
  YN(a.wants_medi_cal, 552, 1011);
  YN(f.expedited_a, 554, 553);
  YN(f.expedited_b, 556, 555);
  C(557); // migrant/seasonal farmworker: No (not asked; helper can change)

  // Page 11: Q6a household. Line 1 = applicant.
  C(101); T(103, lastFirst(name)); T(105, a.date_of_birth);
  if (a.citizenship === 'yes') C(107); else if (a.citizenship === 'no') C(108);
  const lines = [
    { applying: [1010, 1012], name: 1013, rel: 111, dob: 1014, cit: [1016, 1017] },
    { applying: [1019, 1020], name: 1021, rel: 112, dob: 1022, cit: [1024, 1025] },
    { applying: [1027, 1028], name: 1029, rel: 113, dob: 1030, cit: [1032, 1033] },
    { applying: [1035, 1036], name: 1037, rel: 114, dob: 1038, cit: [1040, 1041] },
  ];
  const hh = parseHousehold(a.household_json);
  const together = hh.filter((m) => m.buys_and_cooks_together === true);
  const apart = hh.filter((m) => m.buys_and_cooks_together === false);
  together.slice(0, 4).forEach((m, i) => {
    const L = lines[i];
    YN(m.applying === null || m.applying === undefined ? null : !!m.applying, ...L.applying);
    T(L.name, lastFirst(m.name)); T(L.rel, m.relationship); T(L.dob, m.dob);
    if (m.us_citizen === 'yes') C(L.cit[0]); else if (m.us_citizen === 'no') C(L.cit[1]);
  });
  apart.slice(0, 4).forEach((m, i) => T([154, 155, 156, 157][i], m.name));

  // Page 12: Q7 unearned income
  const other = num(a.other_income_month);
  if (other !== null) {
    if (other > 0) {
      C(219);
      const d = String(a.other_income_details || '').toLowerCase();
      if (/\bssi\b/.test(d)) C(222);
      else if (/social security/.test(d)) C(221);
      if (/general assistance|\bga\b|\bgr\b|calworks/.test(d)) C(224);
      if (/unemploy|\bsdi\b/.test(d)) C(232);
      if (/gift|family|cousin|aunt|uncle|grand|mom|dad|mother|father|sister|brother|friend|girlfriend|boyfriend|partner/.test(d)) C(231);
      T(243, name); T(244, a.other_income_details); T(245, money(other)); T(246, 'see details');
    } else C(220);
  }

  // Page 13: Q8 earned income
  const earned = num(a.earned_income_month);
  if (earned !== null) {
    if (earned > 0) { C(269); T(271, name); T(272, a.earned_income_details); T(277, money(earned)); }
    else C(270);
  }

  // Page 14: Q11 expenses
  const housing = num(a.housing_cost_month);
  const utils = utilList(a.utilities);
  const anyExpense = (housing !== null && housing > 0) || (utils && !utils.includes('none') && utils.length > 0);
  if (housing !== null || utils) { if (anyExpense) C(393); else C('393b'); }
  if (housing !== null) {
    const shelter = a.sleeping_situation === 'shelter';
    if (housing > 0 && shelter) { C(418); T(420, name); T(421, `monthly, $${money(housing)}`); C(396); }
    else if (housing > 0) { C(395); T(397, name); T(398, money(housing)); T(399, 'monthly'); }
    else { C(396); }
  }
  if (utils) {
    const has = (k) => utils.includes(k);
    if (has('heating_cooling')) { C(408); T(4010, name); T(411, 'monthly'); } else C(409);
    if (has('phone')) { C(413); T(415, name); T(416, 'monthly'); } else C(414);
    if (has('water_trash')) { C(423); T(425, name); T(426, 'monthly'); } else C(424);
  }

  // Page 16: Q16 resources
  const cash = num(a.cash_and_bank);
  if (cash !== null) {
    if (cash > 0) { C(490); C(499); T(505, name); T(509, 'Cash and bank, total'); T(5010, money(cash)); T(5011, 'Cash on hand / bank (see helper notes)'); }
    else C(491);
  }

  // Deliberately blank: SSNs (6,109,1018...), signature 35, date 36, Q6b/6c immigration details,
  // Q17-Q22 (523-540) which the applicant answers when signing, optional disability/DV questions.
  return doc.save();
}
