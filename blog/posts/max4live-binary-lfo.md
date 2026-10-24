---
title: "BinaryLFO (Max for Live)"
slug: "max4live-binary-lfo"
project_type: "max4live"
github_url: "https://github.com/maxpatzelt/Audio-Programming/tree/main/Max4Live"
repo_path: "Max4Live"
source_readme: "Max4Live/README.md"
generated_at_utc: "2026-10-24T19:07:18Z"
---

# BinaryLFO (Max for Live)

> Synced from project README.
> Repo: https://github.com/maxpatzelt/Audio-Programming/tree/main/Max4Live

### 3. BinaryLFO (Audio Effect)
- Generates randomized binary values at a free-running or tempo-synced rate and remotely controls up to eight mapped Live parameters.
- Each output `0`/`1` selects the mapped parameter's normalized minimum/maximum. Amount drops some generated high events: `0%` forces low, `100%` preserves the normal 50/50 binary pattern.
- **Controls:** Rate, Hz/Sync mode, Sync division, Hz-only x10, Amount, Map/Unmap, and expandable Multimap slots. No modulation mode, Offset, Shape, Steps, Jitter, or Smooth controls.
- Uses Max's `live.map` and normalized `live.remote~` objects. **User-reported Live smoke test (2026-10-12):** works "pretty good"; exact control-by-control checks were not recorded.
- See [docs/binary-lfo.md](docs/binary-lfo.md) for behavior details and follow-up checks.
