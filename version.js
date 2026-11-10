/* Site version, shown under "See latest updates" on the three home pages. Bump it on every change to the site:
   node tests/bump.mjs (the tests fail if the site changed and this didn't). */
window.SITE_VERSION = "2.3.7";
document.querySelectorAll('.ver b').forEach(b => {b.textContent = window.SITE_VERSION; b.parentNode.hidden = false});
