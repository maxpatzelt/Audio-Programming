#!/usr/bin/env python3
"""Render README-synced markdown posts into static HTML for synthblog.

Usage:
  python3 tools/publish_synthblog.py --workspace-root .
"""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
UL_RE = re.compile(r"^\s*-\s+(.*)$")
OL_RE = re.compile(r"^\s*\d+\.\s+(.*)$")


def parse_frontmatter(text: str) -> Tuple[Dict[str, str], str]:
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    raw = text[4:end]
    body = text[end + 5 :]
    meta: Dict[str, str] = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip().strip('"')
    return meta, body


def inline_md(text: str, meta: Dict[str, str]) -> str:
    def repl_code(m):
        return f"<code>{html.escape(m.group(1))}</code>"

    def repl_link(m):
        label = html.escape(m.group(1))
        href = m.group(2).strip()
        if href.startswith(("http://", "https://", "mailto:", "#", "/")):
            full = href
        elif meta.get("github_url"):
            full = meta["github_url"].rstrip("/") + "/" + href.lstrip("./")
        else:
            full = href
        return f'<a href="{html.escape(full)}">{label}</a>'

    safe = html.escape(text)
    safe = re.sub(r"`([^`]+)`", repl_code, safe)
    safe = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repl_link, safe)
    safe = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", safe)
    safe = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", safe)
    return safe


def markdown_to_html(body: str, meta: Dict[str, str]) -> str:
    lines = body.splitlines()
    out: List[str] = []
    paragraph: List[str] = []
    in_code = False
    in_ul = False
    in_ol = False

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            joined = " ".join(s.strip() for s in paragraph).strip()
            if joined:
                out.append(f"<p>{inline_md(joined, meta)}</p>")
        paragraph = []

    def close_lists() -> None:
        nonlocal in_ul, in_ol
        if in_ul:
            out.append("</ul>")
            in_ul = False
        if in_ol:
            out.append("</ol>")
            in_ol = False

    for raw in lines:
        line = raw.rstrip("\n")

        if line.strip().startswith("```"):
            flush_paragraph()
            close_lists()
            if in_code:
                out.append("</code></pre>")
                in_code = False
            else:
                out.append("<pre><code>")
                in_code = True
            continue

        if in_code:
            out.append(html.escape(line))
            continue

        if not line.strip():
            flush_paragraph()
            close_lists()
            continue

        hm = HEADING_RE.match(line)
        if hm:
            flush_paragraph()
            close_lists()
            level = len(hm.group(1))
            text = inline_md(hm.group(2).strip(), meta)
            out.append(f"<h{level}>{text}</h{level}>")
            continue

        if line.startswith(">"):
            flush_paragraph()
            close_lists()
            quote = inline_md(line.lstrip("> "), meta)
            out.append(f"<blockquote>{quote}</blockquote>")
            continue

        um = UL_RE.match(line)
        if um:
            flush_paragraph()
            if in_ol:
                out.append("</ol>")
                in_ol = False
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append(f"<li>{inline_md(um.group(1), meta)}</li>")
            continue

        om = OL_RE.match(line)
        if om:
            flush_paragraph()
            if in_ul:
                out.append("</ul>")
                in_ul = False
            if not in_ol:
                out.append("<ol>")
                in_ol = True
            out.append(f"<li>{inline_md(om.group(1), meta)}</li>")
            continue

        paragraph.append(line)

    flush_paragraph()
    close_lists()
    if in_code:
        out.append("</code></pre>")

    return "\n".join(out)


def post_template(title: str, content_html: str, github_url: str) -> str:
    repo_link = f'<a class="btn" href="{html.escape(github_url)}">View on GitHub</a>' if github_url else ""
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
  <title>{html.escape(title)} · maxpat.ch synth blog</title>
  <link rel=\"stylesheet\" href=\"../styles.css\" />
</head>
<body>
  <main class=\"page\">
    <header class=\"header\">
      <a class=\"btn\" href=\"../index.html\">← all posts</a>
      <a class=\"btn\" href=\"https://maxpat.ch/\">radio</a>
      <a class=\"btn\" href=\"https://maxpat.ch/stream\">listen live</a>
      {repo_link}
    </header>
    <article class=\"post\">
      {content_html}
    </article>
  </main>
</body>
</html>
"""


def index_template(posts: List[Dict], site_name: str) -> str:
    cards = []
    for p in posts:
        cards.append(
            f"""<article class=\"card\">
  <h2><a href=\"posts/{p['slug']}.html\">{html.escape(p['title'])}</a></h2>
  <p class=\"meta\">{html.escape(p['project_type'])} · <code>{html.escape(p['repo_path'])}</code></p>
  <p><a href=\"posts/{p['slug']}.html\">read post →</a></p>
</article>"""
        )
    cards_html = "\n".join(cards)
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
  <title>{html.escape(site_name)}</title>
  <link rel=\"stylesheet\" href=\"styles.css\" />
</head>
<body>
  <main class=\"page\">
    <header class=\"header\">
      <h1>{html.escape(site_name)}</h1>
      <p>README-synced posts for VCV Rack, Max4Live, and VST projects.</p>
      <p><a class=\"btn\" href=\"https://maxpat.ch/\">← back to radio</a></p>
    </header>
    <section class=\"grid\">
      {cards_html}
    </section>
  </main>
</body>
</html>
"""


def stylesheet() -> str:
    return """*{box-sizing:border-box}body{margin:0;background:#0f1113;color:#ececec;font-family:Verdana,Arial,sans-serif;line-height:1.5}a{color:#7fd4ff}.page{max-width:960px;margin:0 auto;padding:20px}.header{margin-bottom:24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.card{border:1px solid #2b3239;background:#171b20;padding:14px}.card h2{margin:0 0 8px;font-size:1.05rem}.meta{color:#a9b4bf;font-size:.9rem}.btn{display:inline-block;border:1px solid #3f4d59;background:#1f2730;color:#fff;text-decoration:none;padding:6px 10px;margin-right:8px}.post h1,.post h2,.post h3{color:#fff}.post pre{overflow:auto;background:#0a0d10;border:1px solid #333;padding:10px}.post code{background:#1c2228;padding:1px 4px}.post blockquote{margin:10px 0;padding:8px 12px;border-left:3px solid #4f6a80;background:#141a20}ul,ol{padding-left:24px}"""


def render_site(workspace_root: Path, site_dir: Path) -> Dict[str, int]:
    index_path = workspace_root / "blog" / "index.json"
    if not index_path.exists():
        raise FileNotFoundError("Missing blog/index.json. Run readme_blog_sync.py first.")

    index = json.loads(index_path.read_text(encoding="utf-8"))
    posts = index.get("posts", [])

    site_posts = site_dir / "posts"
    site_posts.mkdir(parents=True, exist_ok=True)

    written = 0
    for post in posts:
        md_path = workspace_root / post["output_path"]
        if not md_path.exists():
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        meta, body = parse_frontmatter(text)
        title = meta.get("title") or post.get("title") or post["slug"]
        rendered = markdown_to_html(body, meta)
        html_doc = post_template(title, rendered, meta.get("github_url", ""))
        (site_posts / f"{post['slug']}.html").write_text(html_doc, encoding="utf-8")
        written += 1

    (site_dir / "styles.css").write_text(stylesheet(), encoding="utf-8")
    site_name = index.get("site_name", "maxpat.ch synth blog")
    (site_dir / "index.html").write_text(index_template(posts, site_name), encoding="utf-8")

    return {"posts_written": written}


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish synthblog static HTML from README-synced markdown")
    parser.add_argument("--workspace-root", default=".", help="Audio Programming workspace root")
    parser.add_argument("--site-dir", default="blog/site", help="Output directory relative to workspace root")
    args = parser.parse_args()

    root = Path(args.workspace_root).resolve()
    site_dir = (root / args.site_dir).resolve()
    result = render_site(root, site_dir)
    print(json.dumps({"site_dir": str(site_dir), **result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
