# Redraws the three 1200x630 link preview images (preview.png, preview-tier2.png, preview-tier3.png) in Barlow.
# Needs Playwright for Python and the Barlow files: npm i @fontsource/barlow somewhere, then
#   python3 tests/make-previews.py /path/to/node_modules/@fontsource/barlow/files
import sys, base64, os
from playwright.sync_api import sync_playwright
D = sys.argv[1].rstrip('/') + '/'
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
face = ''.join("@font-face{font-family:'Barlow';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2')}" % (
    w, base64.b64encode(open(D + 'barlow-latin-%d-normal.woff2' % w, 'rb').read()).decode()) for w in (400, 600, 700, 800))
CSS = face + '''
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f3f5f8;color:#16202b;font-family:Barlow,sans-serif;padding:0 72px;display:flex;flex-direction:column;justify-content:center}
.main{display:flex;align-items:center;gap:56px;flex:1;padding-top:40px}
.l{flex:1}
.chip{display:inline-block;background:#fbe4e2;border:2px solid #f0bdb9;color:#b3261e;font-weight:600;font-size:25px;padding:8px 22px;border-radius:999px;margin-bottom:26px}
h1{font-size:98px;line-height:1.02;font-weight:800;letter-spacing:-.01em}
.sub{font-size:35px;line-height:1.3;color:#5a6776;margin-top:26px;max-width:640px}
.r{width:360px;display:grid;gap:24px}
.card{background:#fff;border:3px solid #dce2e8;border-radius:22px;padding:22px 32px 26px;box-shadow:0 10px 26px rgba(22,32,43,.08)}
.card b{display:block;font-weight:800;font-size:66px;line-height:1.05}
.card span{display:block;font-weight:600;font-size:25px;line-height:1.3;margin-top:6px}
.one .card{padding:36px 34px 40px}.one .card b{font-size:112px}.one .card span{font-size:27px;margin-top:10px}
.foot{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid #dce2e8;padding:26px 0 52px}
.foot b{font-size:30px;font-weight:700}.foot span{font-size:22px;color:#5a6776}
'''
def page(chip, sub, cards, url):
    one = ' one' if len(cards) == 1 else ''
    c = ''.join('<div class="card"><b style="color:%s">%s</b><span>%s</span></div>' % x for x in cards)
    return ('<!doctype html><meta charset="utf-8"><style>%s</style><div class="main"><div class="l"><div class="chip">%s</div>'
            '<h1>Learn about your pension.</h1><p class="sub">%s</p></div><div class="r%s">%s</div></div>'
            '<div class="foot"><b>%s</b><span>Unofficial planning tool</span></div>') % (CSS, chip, sub, one, c, url)
STEEL, RED = '#2f5d8a', '#b3261e'
P = {
 'preview.png': page('For FDNY uniformed members', 'Tier 2 and Tier 3 calculators: see what you’ll collect in retirement.',
                     [(STEEL, 'Tier 2', 'Appointed 1973 to 2009'), (RED, 'Tier 3', 'Appointed 2009 or later')], 'myfirepension.com'),
 'preview-tier2.png': page('For FDNY Tier 2 members', 'Half pay at 20, the 1/60th, ITHP and the VSF, worked out for you.',
                     [(STEEL, 'Tier 2', 'Appointed July 1, 1973<br>to June 30, 2009')], 'myfirepension.com/tier2'),
 'preview-tier3.png': page('For FDNY Tier 3 members', 'Half pay at 20, escalation, the longevity bonus and the VSF, worked out for you.',
                     [(RED, 'Tier 3', 'Appointed on or after<br>July 1, 2009')], 'myfirepension.com/tier3'),
}
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1200, 'height': 630})
    for name, html in P.items():
        pg.set_content(html); pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(root, name))
    b.close()
