"""Build garciajp.com.

src/index.html is the only file you edit. This script:

  1. copies it to every address (projects/<slug>/, resume/, writing/<slug>/ ...)
     with the right title, description, link preview and structured data,
  2. pre-renders each page in a headless browser, so search engines, link
     previews and AI crawlers see the full text without running JavaScript,
  3. renders the link-preview image og.png from src/og.html,
  4. writes 404.html, sitemap.xml and robots.txt.

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
home_title = f"{name} · AI Developer, RAG and Multi-Agent Systems"

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
         "genre": site["labels"].get(p["kind"], p["kind"])},
    ])


def head_for(path, title, desc, ld, noindex=False):
    t, d = html.escape(title), html.escape(desc, quote=True)
    u = html.escape(domain + path, quote=True)
    out = re.sub(r"<title>.*?</title>", f"<title>{t}</title>", src, count=1, flags=re.S)
    out = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{d}">', out, count=1)
    out = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{u}">', out, count=1)
    out = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{u}">', out, count=1)
    out = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{t}">', out, count=1)
    out = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{d}">', out, count=1)
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


# 2. pre-render: run each page in a headless browser and keep the HTML it produces
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
            browser.close()
    finally:
        server.shutdown()
    return True


done = "--no-prerender" not in sys.argv and prerender()
print(f"Built {len(pages)} pages" + (", pre-rendered" if done else ", not pre-rendered"))
