# One-repo workflow (Hermes + NAS + PC)

## Ground rules
- Work happens in NAS workspace: `.../Audio Programming/`.
- You run all builds/tests/compiles on your Windows PC.
- Hermes edits source/docs only.

## Single-repo cycle
1. You send: `HERMES_CAN_EDIT <repo> <task>`
2. Hermes edits files in that repo.
3. Hermes runs README→blog sync:
   ```bash
   python3 tools/readme_blog_sync.py --workspace-root . --manifest blog/PROJECTS.json
   ```
4. Hermes reports exact changed files.
5. You send: `PC_TAKES_OVER`
6. You build/test locally on PC from the same NAS workspace.

## Add a new project post mapping
- Add project README (or update existing README).
- Add one entry in `blog/PROJECTS.json`.
- Re-run sync script.

## Correlation model
- One project/repo maps to one slug in `blog/PROJECTS.json`.
- Blog markdown lives in `blog/posts/<slug>.md`.
- `github_url` in each mapping is the canonical repo link used in the post preamble.
