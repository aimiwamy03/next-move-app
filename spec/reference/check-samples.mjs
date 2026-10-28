// Asserts acceptance tests 9 to 11 against samples/*.CF285.pdf
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = async (f) => (await PDFDocument.load(fs.readFileSync(path.join(root, 'samples', f)))).getForm();
const txt = (form, n) => form.getTextField(`CF 285  ${n}`).getText() || '';
const chk = (form, n) => form.getCheckBox(`CF 285  ${n}`).isChecked();
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
for (const f of fs.readdirSync(path.join(root, 'samples')).filter((x) => x.endsWith('.CF285.pdf'))) {
  const form = await load(f);
  for (const n of [6, 109, 1018, 1026, 1034, 1042, 35, 36]) ok(txt(form, n) === '', `${f} field ${n} must be blank`);
  for (const n of [523, 524, 526, 527, 529, 530, 532, 533, 535, 536, 538, 539]) ok(!chk(form, n), `${f} Q17-22 box ${n} must be unchecked`);
}
const p1 = await load('persona1-easy.CF285.pdf');
ok(chk(p1, 553) && !chk(p1, 554), 'p1 553 No'); ok(!chk(p1, 555) && !chk(p1, 556), 'p1 555/556 blank');
ok(txt(p1, 277) === '620' && txt(p1, 398) === '400' && txt(p1, 154) === 'Tanya Walker', 'p1 amounts');
const p2 = await load('persona2-homeless-expedited.CF285.pdf');
ok(chk(p2, 554) && !chk(p2, 553) && chk(p2, 20) && chk(p2, 555) && chk(p2, 552) && chk(p2, '393b'), 'p2 boxes');
const p3 = await load('persona3-messy-tired.CF285.pdf');
ok(chk(p3, 554) && !chk(p3, 555) && !chk(p3, 556) && !chk(p3, 20) && !chk(p3, 21) && chk(p3, 231) && txt(p3, 245) === '60', 'p3 boxes');
console.log(fail ? `${fail} failures` : 'all checks passed');
process.exit(fail ? 1 : 0);
