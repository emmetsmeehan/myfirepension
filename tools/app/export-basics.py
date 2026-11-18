#!/usr/bin/env python3
"""Export the website's Pension basics screen to JSON for the iPhone app.

Usage: python3 tools/export-basics.py path/to/myfirepension MyFirePension/Content
Writes tier2-basics.json, tier3-basics.json and updates.json.

The site is the source of truth for the wording. Rerun this whenever Pension basics changes on the site,
so the app shows the same tiles, questions and fine print. Inline formatting becomes Markdown
(bold, italics, links); links to other screens become mfp:// links the app opens itself. Two of the site's styles
carry over: a key line's big green figure is written ==50%==, and a grey example box is an "ex" block.
"""
import json, os, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag

SITE = "https://myfirepension.com/"
SCREENS = {"#bills": "mfp://bills", "#personal": "mfp://personal", "#quick": "mfp://quick",
           "#basics": "mfp://basics", "#home": "mfp://home"}
COLORS = {"accent", "steel", "sage", "gold", "orange"}


def link(href):
    if href in SCREENS:
        return SCREENS[href]
    if href.startswith(("tel:", "mailto:", "http")):
        return href
    if href.startswith("../tier2/") or href.startswith("../tier3/"):
        tier = href[3:8]
        frag = href.split("#", 1)[1] if "#" in href else "home"
        return f"mfp://{tier}/{frag}"
    if href.startswith("../"):
        return SITE + href[3:]
    if href.startswith("/"):
        return SITE + href[1:]
    raise SystemExit(f"Unknown link in Pension basics: {href}")


def esc(text):
    return re.sub(r"([\\*_\[\]`])", r"\\\1", text)


def inline(node):
    """Markdown for a node's inline content."""
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(esc(str(c)))
        elif isinstance(c, Tag):
            inner = inline(c)
            if c.name in ("b", "strong"):
                out.append(f"**{inner.strip()}**" if inner.strip() else inner)
            elif c.name in ("i", "em"):
                out.append(f"*{inner.strip()}*" if inner.strip() else inner)
            elif c.name == "a":
                out.append(f"[{inner}]({link(c.get('href', ''))})")
            elif c.name == "br":
                out.append("\n")
            elif c.name in ("svg",):
                continue
            else:
                out.append(inner)
    return re.sub(r"[ \t\r\n]+", " ", "".join(out)).strip()


def blocks(container):
    """Paragraphs, lists and headings, in order."""
    out = []
    loose = []

    def flush():
        if loose:
            t = re.sub(r"\s+", " ", "".join(loose)).strip()
            if t:
                out.append({"p": t})
            loose.clear()

    for c in container.children:
        if isinstance(c, NavigableString):
            if str(c).strip():
                loose.append(esc(str(c)))
            continue
        if not isinstance(c, Tag):
            continue
        if c.name in ("b", "strong", "i", "em", "a"):
            wrapper = BeautifulSoup("<x></x>", "html.parser").x
            wrapper.append(c.__copy__())
            loose.append(" " + inline(wrapper) + " ")
            continue
        flush()
        if c.name == "p":
            t = inline(c)
            if t:
                # .ex: the site's grey example box ("Example: you made $100,000 ...").
                out.append({"ex": t} if "ex" in (c.get("class") or []) else {"p": t})
        elif c.name in ("ul", "ol"):
            items = [inline(li) for li in c.find_all("li", recursive=False)]
            out.append({"ol" if c.name == "ol" else "ul": items})
        elif re.fullmatch(r"h[1-6]", c.name):
            out.append({"h": inline(c)})
        elif c.name in ("div", "section"):
            out.extend(blocks(c))
        else:
            t = inline(c)
            if t:
                out.append({"p": t})
    flush()
    return out


def updates(site, dst):
    soup = BeautifulSoup(open(os.path.join(site, "updates", "index.html"), encoding="utf-8").read(), "html.parser")
    items = []
    for li in soup.select("li"):
        t = li.find("time")
        if not t: continue
        date = t.get_text(strip=True)
        t.extract()
        items.append({"date": date, "iso": t.get("datetime", ""), "text": inline(li)})
    if not items: raise SystemExit("No updates found")
    with open(dst, "w", encoding="utf-8") as f:
        json.dump({"items": items}, f, ensure_ascii=False, indent=1)
    print(f"Wrote {dst}: {len(items)} updates")


def main(site, outdir):
    os.makedirs(outdir, exist_ok=True)  # CI passes a fresh temp path that doesn't exist yet
    for tier in ("tier2", "tier3"):
        basics(os.path.join(site, tier, "index.html"), os.path.join(outdir, f"{tier}-basics.json"))
    updates(site, os.path.join(outdir, "updates.json"))


def basics(src, dst):
    soup = BeautifulSoup(open(src, encoding="utf-8").read(), "html.parser")
    v = soup.find(id="v-basics")
    head = v.find(class_="vhead")
    # The site's key lines (Nov. 2026): a list with the figure in big green; a line may carry a folded explainer.
    # The big green figure (span.big) is written ==like this== so the app can draw it big and green.
    keys = []
    for li in v.select("ul.keys > li"):
        for big in li.select("span.big"): big.replace_with(NavigableString("==" + big.get_text() + "=="))
        more = li.find("details")
        if more: more.extract()
        k = {"text": inline(li.find("p") or li)}
        if more:
            k["moreTitle"] = more.find("summary").get_text(" ", strip=True)
            k["more"] = blocks(more.find(class_="lb") or more)
        keys.append(k)
    tiles = []
    for t in v.select(".tiles .tile"):
        m = re.search(r"--c:var\(--(\w+)\)", t.get("style", ""))
        color = m.group(1) if m and m.group(1) in COLORS else "accent"
        tiles.append({"value": t.find("b").get_text(strip=True), "text": t.find("span").get_text(" ", strip=True), "color": color})
    questions = []
    for d in v.select(".qa > details"):
        q = d.find("summary").get_text(" ", strip=True)
        questions.append({"q": q, "a": blocks(d.find(class_="ans"))})
    fine = v.find(class_="fineprint")  # removed from the site in Nov. 2026; kept here in case it comes back
    intro = head.find("p")
    for badge in head.find("h1").select(".tierb"): badge.extract()  # the "Tier 3" badge; the app shows its own title
    data = {
        "title": head.find("h1").get_text(" ", strip=True),
        "intro": intro.get_text(" ", strip=True) if intro else "",
        "keys": keys,
        "tiles": tiles,
        "questions": questions,
    }
    if fine:
        data["finePrint"] = {"title": fine.find_parent("details").find("summary").get_text(" ", strip=True), "blocks": blocks(fine)}
    if not (keys or len(tiles) == 4) or len(questions) < 15:
        raise SystemExit(f"Unexpected shape: {len(keys)} key lines, {len(tiles)} tiles, {len(questions)} questions")
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"Wrote {dst}: {len(keys)} key lines, {len(tiles)} tiles, {len(questions)} questions")


if __name__ == "__main__":
    main(*sys.argv[1:3])
