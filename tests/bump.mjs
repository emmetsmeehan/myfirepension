// Bumps the site version by one (2.41 -> 2.42) in version.js and every page. Run once per change, before pushing.
// One decimal point only (owner, Nov. 9, 2026): the number after the dot just keeps counting up.
import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const vf = root + 'version.js', t = readFileSync(vf, 'utf8');
const m = t.match(/SITE_VERSION = "(\d+)\.(\d+)"/);
const v = `${m[1]}.${+m[2] + 1}`;
writeFileSync(vf, t.replace(m[0], `SITE_VERSION = "${v}"`));
for (const f of ['index.html', 'tier2/index.html', 'tier3/index.html', 'updates/index.html', 'suggest/index.html', 'privacy/index.html', 'accounts/index.html', '404.html']) {
  const h = readFileSync(root + f, 'utf8');
  writeFileSync(root + f, h.replace(/(<span class="ver">You are running on version <b>)[\d.]+(<\/b>)/g, `$1${v}$2`));
}
console.log('Version ' + v);
