"""Assemble garciajp.com/for/<slug>/index.html from a shared shell and one body file per company."""
import json, pathlib, sys

SRC = pathlib.Path(__file__).resolve().parent / "pages"
OUT = pathlib.Path(__file__).resolve().parent.parent

ICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' "
        "rx='16' fill='%231D6B70'/%3E%3Ctext x='32' y='42' font-family='Helvetica,Arial,sans-serif' font-size='28' "
        "font-weight='700' fill='%23FFFFFF' text-anchor='middle'%3EJP%3C/text%3E%3C/svg%3E")

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex, nofollow">
<meta name="author" content="Juan Pablo García">
<meta property="og:type" content="article">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://garciajp.com/for/{slug}/">
<meta property="og:image" content="https://garciajp.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0E0F12">
<link rel="icon" href="{icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;500;600;700&family=Funnel+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/for/for.css">
</head>
<body>
<header class="top"><div class="wrap"><a class="brand" href="/">Juan Pablo García</a><nav aria-label="Site"><a class="hide-s" href="/projects/">Projects</a><a href="/resume.pdf">Resume</a><a class="go" href="/book/">Book a call</a></nav></div></header>
<main>
<section class="hero"><div class="wrap">
<p class="eyebrow">{eyebrow}</p>
<h1>{h1}</h1>
<p class="lede">{lede}</p>
</div></section>
<div class="wrap"><section class="stage" id="flow-stage" aria-label="{stage}">
<div class="stage-head"><h2>{stage}</h2><p class="hint">Plays on its own. Tap any box to jump to it.</p></div>
<div class="flow"></div>
<div class="narr"><span class="count num" data-n></span><h3 data-t></h3><p data-d></p></div>
<div class="ctrl"><button type="button" data-prev>Back</button><button type="button" data-play aria-pressed="true">Pause</button><button type="button" data-next>Next</button><div class="dots" data-dots></div></div>
</section></div>
{body}
<section class="block"><div class="wrap">
<p class="note">I put this together from your public pages and posts, so I am guessing at your internals. Treat it as a starting point for a conversation. Example numbers on this page are made up to show the idea.</p>
<div class="cta-row"><a class="btn" href="/book/">Book a 15 minute call</a><a class="btn line" href="/resume.pdf">Resume (PDF)</a><a class="btn line" href="/">See my work</a></div>
</div></section>
</main>
<footer class="foot"><div class="wrap">
<div><p class="who">Juan Pablo García</p><p class="muted">AI engineer in San Juan, Argentina (UTC-3). RAG, agents and evals, built for production.</p></div>
<nav aria-label="Contact"><a href="mailto:jpgarcia2154@gmail.com">jpgarcia2154@gmail.com</a><a href="/resume.pdf">Resume (PDF)</a><a href="/book/">Book a call</a><a href="https://github.com/jpgg2105">GitHub</a><a href="https://www.linkedin.com/in/juan-pablo-garc%C3%ADa-ba3496360">LinkedIn</a></nav>
</div></footer>
<script src="/for/flow.js"></script>
<script>
var FLOW = {flow};
FLOW.id = "f"; Flow(document.getElementById("flow-stage"), FLOW);
</script>
{script}
</body>
</html>
"""

def build(slug):
    meta = json.loads((SRC / f"{slug}.json").read_text())
    body = (SRC / f"{slug}.body.html").read_text()
    script = (SRC / f"{slug}.js").read_text() if (SRC / f"{slug}.js").exists() else ""
    page = SHELL.format(slug=slug, icon=ICON, body=body,
                        script=f"<script>\n{script}\n</script>" if script else "",
                        flow=json.dumps(meta["flow"], ensure_ascii=False),
                        **{k: meta[k] for k in ("title", "desc", "eyebrow", "h1", "lede", "stage")})
    out = OUT / slug / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page)
    print("wrote", out, len(page))

for s in sys.argv[1:]:
    build(s)
