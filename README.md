# garciajp.com

Personal site of Juan Pablo García, served by GitHub Pages from the root of `main`.

## How it's put together

- `src/index.html` is the source of the whole site: styles, content and code in one file. All the text lives in the JSON block near the bottom (`<script type="application/json" id="content">`).
- `build.py` turns it into the published site in the repo root. For every address (`/projects/research-agent/`, `/resume/` and so on) it:
  - writes a page with its own title, description, link preview and structured data,
  - pre-renders it in a headless browser, so Google, link previews and AI crawlers see the full text without running JavaScript.
  It also renders the link-preview image `og.png` from `src/og.html` and writes `404.html`, `sitemap.xml` and `robots.txt`.
- Everything in the root except `build.py`, `README.md`, `resume.pdf` and `CNAME` is generated. Edit `src/`, never the generated pages.

## Updating the site

```
pip install playwright                    # once
python -m playwright install chromium     # once

# edit the JSON in src/index.html, then:
python build.py
git add -A
git commit -m "Update site"
git push
```

GitHub Pages publishes it in about a minute. Preview first with `python -m http.server 8000` and open http://localhost:8000.

## Editing the content

| Field | What it does |
| --- | --- |
| `booked` | Months that are full, as `"YYYY-MM"`. The home page shows the next three months as Booked or Available. |
| `calUser` | Your cal.com username. Empty: "Book a call" opens an email with the meeting and day filled in. |
| `links.x` | Your X profile URL. Empty hides the icon. |
| `person` | Facts used in the structured data Google reads (job title, city, schools, topics). |
| `projects` | One entry per project page. `slug` becomes the address. `flows` are the architecture diagrams: each step is `["Name", "detail"]`. `code` and `demo` are optional links; when `code` is empty, `codeNote` is shown instead. |
| `posts` | Blog entries. `kind` is `"article"`, `"interview"` or `"note"`. `body` is a list of paragraphs; in interviews, a question is `{"q": "..."}`. |
| `shipped` | Stack items marked as used in client work. |

A post looks like this:

```json
{ "slug": "hybrid-retrieval", "kind": "article", "date": "2026-10-20", "read": 6,
  "title": "Why I use hybrid retrieval", "excerpt": "One line that appears in the list and in search results.",
  "body": ["First paragraph.", "Second paragraph."] }
```

## Live demos

GitHub Pages only serves static files, so a demo that runs Python or a model is hosted elsewhere (Hugging Face Spaces, Streamlit Community Cloud, Render, Fly.io) and linked from the project's `demo` field. For an address like `demo.garciajp.com`, add a CNAME record for `demo` at your DNS provider pointing to that host, and set the custom domain on the host's side.
