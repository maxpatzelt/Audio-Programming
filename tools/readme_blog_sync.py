#!/usr/bin/env python3
"""Generate synth-blog post markdown from project README files.

No build/compile/deploy actions. File generation only.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")


def load_manifest(path: Path) -> Dict:
    return json.loads(path.read_text(encoding="utf-8"))


def slug_ok(slug: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9-]+", slug))


def extract_section(markdown: str, heading_text: str) -> Tuple[str, bool]:
    lines = markdown.splitlines()
    target_idx = None
    target_level = None

    for i, line in enumerate(lines):
        m = HEADING_RE.match(line)
        if not m:
            continue
        level = len(m.group(1))
        text = m.group(2).strip()
        if text == heading_text.strip().lstrip("#").strip():
            target_idx = i
            target_level = level
            break

    if target_idx is None:
        return markdown, False

    end = len(lines)
    for i in range(target_idx + 1, len(lines)):
        m = HEADING_RE.match(lines[i])
        if m and len(m.group(1)) <= target_level:
            end = i
            break

    section = "\n".join(lines[target_idx:end]).strip() + "\n"
    return section, True


def post_frontmatter(item: Dict, source_readme: str, generated_at: str) -> str:
    fm = {
        "title": item["title"],
        "slug": item["slug"],
        "project_type": item["project_type"],
        "github_url": item.get("github_url", ""),
        "repo_path": item["repo_path"],
        "source_readme": source_readme,
        "generated_at_utc": generated_at,
    }
    lines = ["---"]
    for key, value in fm.items():
        escaped = str(value).replace('"', '\\"')
        lines.append(f'{key}: "{escaped}"')
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def build_post(item: Dict, workspace_root: Path, generated_at: str) -> Tuple[str, Dict]:
    readme_rel = item["readme_path"]
    readme_path = workspace_root / readme_rel
    if not readme_path.exists():
        raise FileNotFoundError(f"Missing README: {readme_rel}")

    content = readme_path.read_text(encoding="utf-8", errors="replace").strip() + "\n"
    used_section = False
    section_heading = item.get("section_heading")
    if section_heading:
        content, used_section = extract_section(content, section_heading)

    # Avoid duplicate H1 when mirroring full README.
    content_lines = content.splitlines()
    if content_lines and content_lines[0].startswith("# "):
        content = "\n".join(content_lines[1:]).lstrip() + "\n"

    preamble = [
        f"# {item['title']}",
        "",
        "> Synced from project README.",
    ]
    if item.get("github_url"):
        preamble.append(f"> Repo: {item['github_url']}")
    preamble.append("")
    preamble.append("")

    body = "\n".join(preamble) + content
    out = post_frontmatter(item, readme_rel, generated_at) + body

    summary = {
        "slug": item["slug"],
        "title": item["title"],
        "project_type": item["project_type"],
        "repo_path": item["repo_path"],
        "source_readme": readme_rel,
        "github_url": item.get("github_url", ""),
        "used_section_heading": section_heading if used_section else "",
    }
    return out, summary


def generate(workspace_root: Path, manifest_path: Path) -> Dict:
    manifest = load_manifest(manifest_path)
    blog_cfg = manifest.get("blog", {})
    projects: List[Dict] = manifest["projects"]

    output_dir = workspace_root / blog_cfg.get("output_dir", "blog/posts")
    output_dir.mkdir(parents=True, exist_ok=True)

    generated_at = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    index: Dict = {
        "generated_at_utc": generated_at,
        "site_name": blog_cfg.get("site_name", ""),
        "site_base_url": blog_cfg.get("site_base_url", ""),
        "posts": [],
    }

    for item in projects:
        for required in ("title", "slug", "project_type", "repo_path", "readme_path"):
            if required not in item:
                raise ValueError(f"Manifest item missing '{required}': {item}")
        if not slug_ok(item["slug"]):
            raise ValueError(f"Invalid slug '{item['slug']}' (use lowercase letters/numbers/hyphens)")

        post_md, summary = build_post(item, workspace_root, generated_at)
        out_path = output_dir / f"{item['slug']}.md"
        out_path.write_text(post_md, encoding="utf-8")
        summary["output_path"] = str(out_path.relative_to(workspace_root))
        index["posts"].append(summary)

    index_path = workspace_root / "blog" / "index.json"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")

    posts_index_md = workspace_root / "blog" / "posts" / "_index.md"
    lines = ["# Synth Blog Posts", "", f"Generated: {generated_at}", ""]
    for post in sorted(index["posts"], key=lambda p: (p["project_type"], p["title"])):
        lines.append(f"- [{post['title']}](./{post['slug']}.md) — `{post['project_type']}`")
    lines.append("")
    posts_index_md.write_text("\n".join(lines), encoding="utf-8")

    return {
        "generated": len(index["posts"]),
        "index_path": str(index_path),
        "posts_index_markdown": str(posts_index_md),
        "output_dir": str(output_dir),
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Sync blog post markdown from README files")
    p.add_argument(
        "--workspace-root",
        default=".",
        help="Path to Audio Programming workspace root",
    )
    p.add_argument(
        "--manifest",
        default="blog/PROJECTS.json",
        help="Manifest path relative to workspace root",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.workspace_root).resolve()
    manifest = (root / args.manifest).resolve()
    result = generate(root, manifest)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
