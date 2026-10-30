"""Build garciajp.com.

src/index.html is the only file you edit. This script:

  1. copies it to every address (projects/<slug>/, resume/, writing/<slug>/ ...)
     with the right title, description, link preview and structured data,
  2. pre-renders each page in a headless browser, so search engines, link
     previews and AI crawlers see the full text without running JavaScript,
  3. renders the link-preview image og.png from src/og.html, plus one per
     explainer (writing/<slug>/og.png) showing a frame of its animation,
  4. writes 404.html, sitemap.xml, robots.txt, feed.xml (RSS) and llms.txt.

The finished pages land in the repo root, which is what GitHub Pages serves.
After editing src/index.html:

    pip install playwright && python -m playwright install chromium   # once
    python build.py
    git add -A && git commit -m "Update site" && git push

Preview with `python -m http.server 8000` and open http://localhost:8000.
`python build.py --no-prerender` skips the browser steps if Playwright isn't installed.
"""
import functools
import html
import json
import re
import sys
import threading
from datetime import date
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT
MANIFEST = ROOT / ".routes"

src = (SRC / "index.html").read_text(encoding="utf-8")
match = re.search(r'<script type="application/json" id="content">(.*?)</script>', src, re.S)
if not match:
    raise SystemExit("Could not find the content block in index.html")
try:
    site = json.loads(match.group(1))
except json.JSONDecodeError as err:
    raise SystemExit(f"The content block in index.html is not valid JSON: {err}")

name = site["name"]
domain = site["domain"].rstrip("/")
default_desc = site["description"]
info = site.get("person", {})
home_title = f"{name} · AI Developer, RAG, Agents and LLM Evaluation"

# Shared styles, content and code go to /assets so every page is small and its text comes first.
import hashlib
ASSETS = OUT / "assets"
ASSETS.mkdir(exist_ok=True)
def _asset(name, text):
    (ASSETS / name).write_text(text, encoding="utf-8")
    return f"/assets/{name}?v={hashlib.sha1(text.encode()).hexdigest()[:10]}"
_style = re.search(r"<style>(.*?)</style>", src, re.S)
_content = re.search(r'<script type="application/json" id="content">(.*?)</script>', src, re.S)
_main = list(re.finditer(r"<script>(.*?)</script>", src, re.S))[-1]
css_url = _asset("site.css", _style.group(1).strip() + "\n")
data_url = _asset("content.js", "window.__CONTENT__ = " + json.dumps(site, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";\n")
js_url = _asset("site.js", _main.group(1).strip() + "\n")
template = (src[:_style.start()] + f'<link rel="stylesheet" href="{css_url}">'
            + src[_style.end():_content.start()] + f'<script src="{data_url}"></script>'
            + src[_content.end():_main.start()] + f'<script src="{js_url}"></script>' + src[_main.end():])

person = {
    "@type": "Person",
    "@id": f"{domain}/#person",
    "name": name,
    "url": f"{domain}/",
    "image": f"{domain}/og.png",
    "jobTitle": info.get("jobTitle"),
    "description": default_desc,
    "email": f"mailto:{site['email']}",
    "address": {"@type": "PostalAddress", "addressLocality": info.get("locality"),
                "addressRegion": info.get("region"), "addressCountry": info.get("country")},
    "alumniOf": [{"@type": "CollegeOrUniversity", "name": n} for n in info.get("alumniOf", [])],
    "worksFor": {"@type": "Organization", "name": info["worksFor"]} if info.get("worksFor") else None,
    "knowsAbout": info.get("knowsAbout", []),
    "sameAs": [u for u in site["links"].values() if u],
}
person = {k: v for k, v in person.items() if v}
author = {"@id": f"{domain}/#person"}

# path -> (title, description, structured data)
pages = {
    "/": (home_title, default_desc, [
        {"@type": "ProfilePage", "url": f"{domain}/", "name": home_title, "mainEntity": person},
        {"@type": "WebSite", "url": f"{domain}/", "name": name, "author": author},
    ]),
    "/projects/": (f"Projects · {name}", "AI projects by Juan Pablo García: RAG pipelines, agents, evaluation and the products around them.", [
        {"@type": "CollectionPage", "url": f"{domain}/projects/", "name": "Projects", "author": person,
         "hasPart": [{"@type": "CreativeWork", "name": p["title"], "url": f"{domain}/projects/{p['slug']}/"} for p in site["projects"]]},
    ]),
    "/services/": (f"Services · {name}", "Add AI to your product, build the whole product, or automate a workflow.", [
        {"@type": "WebPage", "url": f"{domain}/services/", "name": "Services", "author": person},
    ]),
    "/resume/": (f"Resume · {name}", site["resume"]["summary"], [
        {"@type": "ProfilePage", "url": f"{domain}/resume/", "name": "Resume", "mainEntity": person},
    ]),
    "/stack/": (f"Stack · {name}", "The languages, frameworks and AI tools I work with.", [
        {"@type": "WebPage", "url": f"{domain}/stack/", "name": "Stack", "author": person},
    ]),
    "/writing/": (f"Writing · {name}", "Articles, interviews and notes on building with AI.", [
        {"@type": "Blog", "url": f"{domain}/writing/", "name": f"{name} · Writing", "author": person},
    ]),
    "/book/": (f"Book a call · {name}", "Book a 15-minute intro call, a project scoping session or a technical consult.", [
        {"@type": "ContactPage", "url": f"{domain}/book/", "name": "Book a call", "about": person},
    ]),
}
for p in site["projects"]:
    work = {"@type": "CreativeWork", "url": f"{domain}/projects/{p['slug']}/", "name": p["title"],
            "description": p["summary"], "author": person, "keywords": ", ".join(p["stack"])}
    if p.get("code"):
        work["codeRepository"] = p["code"]
        work["@type"] = "SoftwareSourceCode"
    pages[f"/projects/{p['slug']}/"] = (f"{p['title']} · {name}", p["summary"], [work])
for p in site.get("posts", []):
    pages[f"/writing/{p['slug']}/"] = (f"{p['title']} · {name}", p.get("excerpt", default_desc), [
        {"@type": "BlogPosting", "url": f"{domain}/writing/{p['slug']}/", "headline": p["title"],
         "description": p.get("excerpt", ""), "datePublished": p["date"], "author": person,
         "genre": site["labels"].get(p["kind"], p["kind"]),
         **({"isBasedOn": p["source"]["url"]} if p.get("source") else {}),
         **({"citation": [{"@type": "CreativeWork", "name": t, **({"url": u} if u else {})} for t, u in p["refs"]]} if p.get("refs") else {})},
    ])


explainers = [p for p in site.get("posts", []) if p.get("kind") == "explainer" and p.get("scene")]
og_images = {f"/writing/{p['slug']}/": (f"{domain}/writing/{p['slug']}/og.png", f"{p['title']}, an animated explainer by {name}")
             for p in explainers}


def head_for(path, title, desc, ld, noindex=False):
    t, d = html.escape(title), html.escape(desc, quote=True)
    u = html.escape(domain + path, quote=True)
    img = og_images.get(path)
    out = re.sub(r"<title>.*?</title>", f"<title>{t}</title>", template, count=1, flags=re.S)
    out = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{d}">', out, count=1)
    out = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{u}">', out, count=1)
    out = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{u}">', out, count=1)
    out = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{t}">', out, count=1)
    out = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{d}">', out, count=1)
    if img:
        out = out.replace(f'content="{domain}/og.png"', f'content="{html.escape(img[0], quote=True)}"')
        out = re.sub(r'<meta property="og:image:alt" content="[^"]*">', f'<meta property="og:image:alt" content="{html.escape(img[1], quote=True)}">', out, count=1)
        out = out.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">', 1)
    graph = json.dumps({"@context": "https://schema.org", "@graph": ld}, ensure_ascii=False).replace("</", "<\\/")
    out = out.replace('<script type="application/ld+json" id="ld">{}</script>',
                      f'<script type="application/ld+json" id="ld">{graph}</script>', 1)
    if noindex:
        out = out.replace('<meta name="color-scheme"', '<meta name="robots" content="noindex">\n<meta name="color-scheme"', 1)
    return out


def target(path):
    return OUT / "index.html" if path == "/" else OUT / path.strip("/") / "index.html"


# 1. write every page, and remove pages from an earlier build whose route is gone
old = set(MANIFEST.read_text(encoding="utf-8").split()) if MANIFEST.exists() else set()
for path in old - set(pages):
    f = target(path)
    if path != "/" and f.exists():
        f.unlink()
        try:
            f.parent.rmdir()
        except OSError:
            pass
        print(f"removed {path}")
MANIFEST.write_text("\n".join(sorted(pages)) + "\n", encoding="utf-8")
for path, (title, desc, ld) in pages.items():
    f = target(path)
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(head_for(path, title, desc, ld), encoding="utf-8")
(OUT / "404.html").write_text(head_for("/404.html", f"Not found · {name}", default_desc, [], noindex=True), encoding="utf-8")
(OUT / ".nojekyll").write_text("", encoding="utf-8")
today = date.today().isoformat()
(OUT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{domain}{u}</loc><lastmod>{today}</lastmod></url>\n" for u in pages)
    + "</urlset>\n", encoding="utf-8")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {domain}/sitemap.xml\n", encoding="utf-8")

# RSS feed of the writing, newest first
from email.utils import format_datetime
from datetime import datetime, timezone
posts_sorted = sorted(site.get("posts", []), key=lambda p: p["date"], reverse=True)
def _rfc822(d):
    return format_datetime(datetime.fromisoformat(d).replace(hour=12, tzinfo=timezone.utc))
x = html.escape
(OUT / "feed.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
    f"  <title>{x(name)} · Writing</title>\n  <link>{domain}/writing/</link>\n"
    f'  <atom:link href="{domain}/feed.xml" rel="self" type="application/rss+xml"/>\n'
    "  <description>Animated explainers and notes on building with AI: RAG, agents, evaluation, alignment and problem solving.</description>\n"
    "  <language>en</language>\n"
    + (f"  <lastBuildDate>{_rfc822(posts_sorted[0]['date'])}</lastBuildDate>\n" if posts_sorted else "")
    + "".join(
        f"  <item>\n    <title>{x(p['title'])}</title>\n    <link>{domain}/writing/{p['slug']}/</link>\n"
        f"    <guid isPermaLink=\"true\">{domain}/writing/{p['slug']}/</guid>\n    <pubDate>{_rfc822(p['date'])}</pubDate>\n"
        f"    <description>{x(p.get('excerpt', ''))}</description>\n  </item>\n" for p in posts_sorted)
    + "</channel>\n</rss>\n", encoding="utf-8")

# llms.txt: a plain-text map of the site for AI assistants and answer engines (llmstxt.org)
def _line(title, path, note):
    return f"- [{title}]({domain}{path}): {note}"
llms = [f"# {name}", "", f"> {site['resume']['summary']}", "",
        f"Contact: {site['email']} · Book a call: {domain}/book/ · Resume (PDF): {domain}/{site['resumePdf'].split('?')[0]}",
        "Profiles: " + " · ".join(u for u in site["links"].values() if u), "",
        "## Main pages",
        _line("Projects", "/projects/", "client work and personal projects, each with the problem, the system and the result"),
        _line("Services", "/services/", "adding AI to a product, building a whole product, or automating a workflow"),
        _line("Resume", "/resume/", "experience, education and skills"),
        _line("Stack", "/stack/", "languages, frameworks and AI tools in use"),
        "", "## Projects"]
llms += [_line(p["title"], f"/projects/{p['slug']}/", p["summary"]) for p in site["projects"]]
llms += ["", "## Explainers (animated, step by step, with references)"]
llms += [_line(p["title"], f"/writing/{p['slug']}/", p.get("excerpt", "")) for p in posts_sorted if p.get("kind") == "explainer"]
other = [p for p in posts_sorted if p.get("kind") != "explainer"]
if other:
    llms += ["", "## Other writing"] + [_line(p["title"], f"/writing/{p['slug']}/", p.get("excerpt", "")) for p in other]
(OUT / "llms.txt").write_text("\n".join(llms) + "\n", encoding="utf-8")


# 2. pre-render: run each page in a headless browser and keep the HTML it produces
OG_CARD = """([scene, S, title, n, excerpt]) => {
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;background:#0E0F12;overflow:hidden';
  const esc = s => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
  const c = document.createElement('div');
  c.style.cssText = 'position:fixed;inset:0;width:1200px;height:630px;box-sizing:border-box;padding:64px 0 60px 72px;display:grid;grid-template-columns:520px 1fr;gap:40px;font-family:var(--f-body);color:#ECEDF1;background:#0E0F12';
  c.innerHTML = `
    <div style="display:flex;flex-direction:column;justify-content:space-between;min-width:0">
      <div style="display:flex;align-items:center;gap:14px;font:500 22px var(--f-body);color:#9EA2AD"><b style="width:44px;height:44px;border-radius:12px;background:#1D6B70;color:#fff;display:grid;place-items:center;font:700 19px var(--f-display)">JP</b>garciajp.com</div>
      <div>
        <div style="font:500 20px var(--f-body);color:#7FD6CB;margin-bottom:18px">Animated explainer · ${n} steps</div>
        <h1 style="margin:0;font:600 ${title.length > 48 ? 50 : title.length > 30 ? 58 : 66}px/1.04 var(--f-display);letter-spacing:-.03em;color:#F1FBFA">${esc(title)}</h1>
      </div>
      <div style="font:500 22px var(--f-body);color:#ECEDF1">Juan Pablo García <span style="color:#9EA2AD">· AI developer</span></div>
    </div>
    <div style="position:relative">
      <div style="position:absolute;left:0;top:-4px;width:700px;height:640px;background:#0F3338;border-radius:36px 0 0 36px"></div>
      <div style="position:absolute;left:44px;top:62px;width:500px;background:#17181D;border:1px solid #24575C;border-radius:18px;overflow:hidden;box-shadow:0 30px 70px -24px rgba(0,0,0,.7)">
        <div style="height:40px;border-bottom:1px solid #2A2C33;display:flex;align-items:center;gap:8px;padding:0 16px"><i style="width:10px;height:10px;border-radius:50%;background:#3A3D46"></i><i style="width:10px;height:10px;border-radius:50%;background:#3A3D46"></i><i style="width:10px;height:10px;border-radius:50%;background:#3A3D46"></i></div>
        <canvas id="ogc" style="display:block;width:500px;height:417px;background:#17181D"></canvas>
      </div>
    </div>`;
  document.body.appendChild(c);
  exDraw(document.getElementById('ogc'), scene, S, 1.7, exColors());
}"""


def prerender():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright is not installed, so pages were not pre-rendered.\n"
              "  pip install playwright && python -m playwright install chromium")
        return False
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    handler = functools.partial(Quiet, directory=str(OUT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    grab = """() => ({
        view: document.getElementById('view').innerHTML,
        nav: document.getElementById('nav').innerHTML,
        foot: document.querySelector('footer').innerHTML })"""
    jobs = [(p, target(p)) for p in pages] + [("/404.html", OUT / "404.html")]
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            for path, f in jobs:
                page.goto(base + path, wait_until="load")
                page.wait_for_selector("#view .page", timeout=15000)
                got = page.evaluate(grab)
                doc = f.read_text(encoding="utf-8")
                doc = doc.replace('<nav class="nav" id="nav" aria-label="Main"></nav>',
                                  f'<nav class="nav" id="nav" aria-label="Main">{got["nav"]}</nav>', 1)
                doc = doc.replace('<main class="wrap" id="view" tabindex="-1"></main>',
                                  f'<main class="wrap" id="view" tabindex="-1">{got["view"]}</main>', 1)
                doc = re.sub(r"<footer>.*?</footer>", lambda m: f'<footer>{got["foot"]}</footer>', doc, count=1, flags=re.S)
                f.write_text(doc, encoding="utf-8")
            # link-preview image, rendered from og.html with the site's fonts
            if (SRC / "og.html").exists():
                card = browser.new_page(viewport={"width": 1200, "height": 630})
                card.goto(base + "/src/og.html", wait_until="networkidle")
                card.evaluate("document.fonts.ready")
                card.screenshot(path=str(OUT / "og.png"))
            # one link-preview image per explainer: its title and a frame of its animation
            if explainers:
                card = browser.new_page(viewport={"width": 1200, "height": 630})
                card.goto(base + "/writing/", wait_until="networkidle")
                card.evaluate("document.fonts.ready")
                for p in explainers:
                    n = len(p["steps"])
                    S = p.get("ogFrame", min(n - .1, 2.85))
                    card.evaluate(OG_CARD, [p["scene"], S, p["title"], n, p.get("excerpt", "")])
                    card.wait_for_timeout(120)
                    card.screenshot(path=str(OUT / "writing" / p["slug"] / "og.png"))
            browser.close()
    finally:
        server.shutdown()
    return True


done = "--no-prerender" not in sys.argv and prerender()
print(f"Built {len(pages)} pages" + (", pre-rendered" if done else ", not pre-rendered"))
