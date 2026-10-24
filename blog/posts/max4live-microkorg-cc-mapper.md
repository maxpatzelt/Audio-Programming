---
title: "MicroKorgCCMapper (Max for Live)"
slug: "max4live-microkorg-cc-mapper"
project_type: "max4live"
github_url: "https://github.com/maxpatzelt/Audio-Programming/tree/main/Max4Live"
repo_path: "Max4Live"
source_readme: "Max4Live/README.md"
generated_at_utc: "2026-10-24T19:07:18Z"
---

# MicroKorgCCMapper (Max for Live)

> Synced from project README.
> Repo: https://github.com/maxpatzelt/Audio-Programming/tree/main/Max4Live

### 4. MicroKorgCCMapper (MIDI Effect)
- Provides one Map/Unmap row for every one of the guide's 47 named MicroKorg CC entries.
- Shared CC aliases remain separate rows and share their underlying incoming CC stream; there are 40 unique CC numbers.
- Mapping uses Live's `live.map` and normalized `live.remote~`, with CC values scaled from 0-127 to 0-1. Original MIDI is forwarded through the Live device chain; no external MIDI destination is configured.
- Source list is adapted from the MIDI Guide dataset, licensed CC BY-SA 4.0. See [docs/microkorg-cc-mapper.md](docs/microkorg-cc-mapper.md).
- Installed in the User Library's `Presets/MIDI Effects/Max MIDI Effect` folder; the previous mapper and its linked preset were removed after verifying the replacement.
