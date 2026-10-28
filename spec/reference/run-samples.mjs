// node reference/run-samples.mjs  -> writes samples/*.pdf from samples/*.json
import fs from 'node:fs';
import path from 'node:path';
import { fillCf285, computeFlags } from './cf285.mjs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const blank = fs.readFileSync(path.join(root, 'forms/CF285_unlocked.pdf'));
for (const f of fs.readdirSync(path.join(root, 'samples')).filter((x) => x.endsWith('.json'))) {
  const a = JSON.parse(fs.readFileSync(path.join(root, 'samples', f), 'utf8'));
  const out = path.join(root, 'samples', f.replace('.json', '.CF285.pdf'));
  fs.writeFileSync(out, await fillCf285(blank, a));
  console.log(f, JSON.stringify(computeFlags(a)));
}
