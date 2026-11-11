// Copies the updates drop-down (the <details class="news"> block on the home page, index.html) into every other page that
// carries it, so the five visible entries only need editing in index.html. Run after changing that list, before bump.mjs.
import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const re = /<details class="news">[\s\S]*?<\/details>/;
const block = readFileSync(root + 'index.html', 'utf8').match(re)[0];
for (const f of ['tier2/index.html', 'tier3/index.html', 'accounts/index.html', 'updates/index.html', 'suggest/index.html', 'privacy/index.html', '404.html']) {
  const h = readFileSync(root + f, 'utf8');
  if (!re.test(h)) throw new Error(f + ': no updates drop-down found');
  writeFileSync(root + f, h.replace(re, () => block));
}
console.log('Updates drop-down copied to 7 pages');
