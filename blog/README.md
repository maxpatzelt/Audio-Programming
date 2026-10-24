# README → Synth Blog Sync

This workflow makes each project post track its GitHub README content.

## Canonical rule
- Project README is the source of truth.
- Blog post markdown is generated from README using `tools/readme_blog_sync.py`.

## Files
- `blog/PROJECTS.json` — manifest of project→post mapping.
- `blog/posts/*.md` — generated posts (safe to publish to your synth blog site).
- `blog/index.json` — generated machine-readable index.

## Generate posts
From `Audio Programming/` root:

```bash
python3 tools/readme_blog_sync.py --workspace-root . --manifest blog/PROJECTS.json
```

## Publish HTML site from generated posts

```bash
python3 tools/publish_synthblog.py --workspace-root . --site-dir blog/site
```

This writes:
- `blog/site/index.html`
- `blog/site/styles.css`
- `blog/site/posts/*.html`

## Add a new project
1. Add/update that project's `README.md`.
2. Add an entry in `blog/PROJECTS.json` with:
   - `title`
   - `slug`
   - `project_type` (`max4live`, `vcv`, or `vst`)
   - `repo_path`
   - `readme_path`
   - `github_url`
   - optional `section_heading` (if one README contains multiple devices)
3. Re-run sync script.

## Notes
- This does not build, compile, test, install, or deploy.
- It only generates markdown + index files.
- If `section_heading` is not found, the script falls back to full README content.
