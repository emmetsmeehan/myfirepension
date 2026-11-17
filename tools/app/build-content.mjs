#!/usr/bin/env node
/* Build app/content.json: everything the iPhone app downloads from myfirepension.com at launch besides rules.js.
 *
 *   node tools/build-content.mjs path/to/myfirepension [basics-dir] [out-file]
 *
 * Reads the site (read-only): version.js, each tier's Pension basics (already exported to JSON by
 * tools/export-basics.py into basics-dir), each tier's BILLS list and SESSION_END line from its page script, and the
 * "Status last checked" line on Bills in Albany. Writes one strict-JSON file (default MyFirePension/Content/content.json,
 * the copy built into the app). The site publishes the same file at https://myfirepension.com/app/content.json,
 * made by this same script, so the two can't drift in shape.
 *
 * Shape (format 1):
 *   { "format": 1, "siteVersion": "2.97",
 *     "tier2": { "basics": {title, intro, keys, tiles, questions}, "bills": [ ...BILLS ], "sessionEnd": "...", "billsChecked": "Nov. 5, 2026" },
 *     "tier3": { ... } }
 * Needs Node 18+ and acorn (same as copy-rules.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const acorn = require('acorn');

const [site, basicsDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'MyFirePension', 'Content'),
       outFile = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'MyFirePension', 'Content', 'content.json')] = process.argv.slice(2);
if (!site) { console.error('Usage: node tools/build-content.mjs path/to/myfirepension [basics-dir] [out-file]'); process.exit(1); }

const read = f => fs.readFileSync(path.join(site, f), 'utf8');
const siteVersion = (read('version.js').match(/SITE_VERSION\s*=\s*"([^"]+)"/) || [])[1];
if (!siteVersion) throw new Error('No SITE_VERSION in version.js');

/* Pull the named top-level declarations out of a page's main script and evaluate just those. */
function pageValues(tier, names) {
  const html = read(`${tier}/index.html`);
  const src = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).reduce((a, b) => (b.length > a.length ? b : a), '');
  const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script' });
  const pick = [];
  for (const node of ast.body) {
    if (node.type !== 'VariableDeclaration') continue;
    for (const d of node.declarations) if (names.includes(d.id.name)) pick.push(`var ${src.slice(d.start, d.end)};`);
  }
  const ctx = vm.createContext({});
  vm.runInContext(pick.join('\n') + `\nthis.__out={${names.join(',')}};`, ctx);
  return JSON.parse(JSON.stringify(ctx.__out));
}

const out = { format: 1, siteVersion };
for (const tier of ['tier2', 'tier3']) {
  const basics = JSON.parse(fs.readFileSync(path.join(basicsDir, `${tier}-basics.json`), 'utf8'));
  const { BILLS, SESSION_END } = pageValues(tier, ['BILLS', 'SESSION_END']);
  const checked = (read(`${tier}/index.html`).match(/Status last checked ([^<]+?)\.?<\/p>/) || [])[1];
  if (!Array.isArray(BILLS) || !BILLS.length) throw new Error(`${tier}: no BILLS`);
  if (!checked) throw new Error(`${tier}: no "Status last checked" line`);
  out[tier] = { basics, bills: BILLS, sessionEnd: SESSION_END, billsChecked: checked.replace(/\.$/, '') };
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${outFile}: site ${siteVersion}, ${out.tier2.bills.length} + ${out.tier3.bills.length} bills`);
