// Bumps the site version in version.js by one (2.3.6 -> 2.3.7). Run once per change, before pushing.
import {readFileSync, writeFileSync} from 'node:fs';
const f = new URL('../version.js', import.meta.url).pathname, t = readFileSync(f, 'utf8');
const m = t.match(/SITE_VERSION = "(\d+)\.(\d+)\.(\d+)"/);
const v = `${m[1]}.${m[2]}.${+m[3] + 1}`;
writeFileSync(f, t.replace(m[0], `SITE_VERSION = "${v}"`));
console.log('Version ' + v);
