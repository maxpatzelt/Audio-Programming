# Max for Live Vibe Coding Environment

A code-first development environment for authoring, testing, and packaging Ableton Live Max for Live (`.amxd`) devices and Cycling '74 Max patchers (`.maxpat`) programmatically using JavaScript, Node.js, and Max 9's V8 engine.

---

## Features

- **Code-First Patcher AST:** Define Max objects, audio signal paths, MIDI processors, and UI controls in pure JavaScript instead of visual patch cords.
- **Binary AMXD Packager:** Direct serialization and deserialization of Ableton Live's 32-byte `ampf` container format without needing to open the Max editor.
- **Ableton Device Rack Presentation Engine:** Automatic layout and parameter configuration for `live.dial`, `live.slider`, `live.toggle`, and `live.numbox` widgets.
- **Cycling '74 Max 9 V8 Runtime:** Modern ES6+ JavaScript runs inside devices using Max's `v8` object, with support for algorithmic generation and Live Object Model (`LiveAPI`) interaction.
- **Instant Deployment to Ableton Live 12:** Deploy compiled `.amxd` devices directly into Ableton's `User Library` presets with a single command.
- **Automated Validation & Test Suite:** Fast verification of object IDs, inlet/outlet bounds, and container integrity before launching Ableton.

---

## Directory Structure

```
Max4Live/
├── package.json               # Project manifest & npm scripts
├── README.md                  # Project overview and quickstart
├── PROJECT_CONTEXT.md         # Persistent context and environment facts
├── docs/                      # Architectural specs and decisions
│   ├── PROJECT_CONTEXT.md     # Detailed environment inspection & history
│   ├── architecture.md        # System architecture and Mermaid diagrams
│   ├── decisions.md           # Architecture Decision Records (ADRs)
│   ├── binary-lfo.md          # BinaryLFO behavior and next-session checks
│   ├── microkorg-cc-mapper.md # MicroKorg CC mapping behavior and setup
│   └── changelog.md           # Project version history
├── src/
│   ├── core/                  # AST, Box, Patchline, Patcher, and AMXD packager
│   ├── templates/             # Scaffolding for Audio Effects and MIDI Effects
│   ├── devices/               # Device definitions (VibeDelay, VibeEuclid, BinaryLFO, MicroKorgCCMapper)
│   └── cli/                   # Developer CLI (build, deploy, inspect, watch)
├── runtime/                   # JavaScript files executed inside Max 9 V8 engine
│   └── v8/
│       ├── euclid_core.js     # Bjorklund Euclidean rhythm generator
│       ├── binary_lfo.js      # Binary random Live-parameter controller
│       └── lom_bridge.js      # Live Object Model (LOM) bridge
├── test/                      # Automated unit test suite (node:test)
└── dist/                      # Compiled .amxd and .maxpat devices
```

---

## Quickstart

### 1. Build Devices
Compile JavaScript device definitions into production `.amxd` binary containers and `.maxpat` JSON patchers:
```powershell
npm run build
```

Generated files in `dist/`:
- `VibeDelay.amxd` (Stereo Drift Delay audio effect)
- `VibeDelay.maxpat`
- `VibeEuclid.amxd` (Euclidean MIDI sequencer)
- `VibeEuclid.maxpat`
- `euclid_core.js` (V8 engine runtime)
- `BinaryLFO.amxd` (binary random Live parameter controller)
- `BinaryLFO.maxpat`
- `binary_lfo.js` (V8 engine runtime)
- `MicroKorgCCMapper.amxd` (MicroKorg MIDI CC-to-Live parameter mapper)
- `MicroKorgCCMapper.maxpat`

`BinaryLFO` and its runtime have been installed in the Ableton User Library Audio Effects folder. See [docs/binary-lfo.md](docs/binary-lfo.md) for controls, behavior, and the current test handoff.

### 2. Run Test Suite
Run the automated validation test suite:
```powershell
npm test
```

### 3. Deploy to Ableton Live 12
Deploy compiled devices straight to your Ableton Live 12 User Library (`Presets/Audio Effects` and `Presets/MIDI Effects`):
```powershell
npm run deploy
```
After deploying, open Ableton Live 12, open the browser pane under **User Library > Presets**, and drag `VibeDelay` onto an audio track or `VibeEuclid` o MIDI track.

### 4. Inspect an AMXD Device
Inspect headers, chunk sizes, and exposed parameters of any `.amxd` file:
```powershell
npm run inspect dist/VibeDelay.amxd
```

### 5. Watch Mode (Vibe Coding)
Auto-recompile devices as you code:
```powershell
npm run watch
```

---

## Prototype Devices

### 1. VibeDelay (Audio Effect)
- **Stereo modulated delay line** with feedback loop and resonant lowpass filter (`lores~`).
- **Drift LFO** with depth and rate controls creating subtle analog tape wow & flutter.
- **Controls:** Delay Time (ms), Feedback (%), Drift Rate (Hz), Drift Depth (ms), Filter Cutoff (Hz), Dry/Wet (%).

### 2. VibeEuclid (MIDI Effect)
- **Algorithmic Euclidean rhythm generator** executing via Max 9's embedded V8 engine (`euclid_core.js`).
- Computes optimal beat distributions across $N$ steps using the Bjorklund algorithm.
- **Controls:** Run/Stop toggle, Steps (1..32), Hits (0..32), Rotation (0..31), Pitch (MIDI note), Velocity, Gate Duration (ms).

### 3. BinaryLFO (Audio Effect)
- Generates randomized binary values at a free-running or tempo-synced rate and remotely controls up to eight mapped Live parameters.
- Each output `0`/`1` selects the mapped parameter's normalized minimum/maximum. Amount drops some generated high events: `0%` forces low, `100%` preserves the normal 50/50 binary pattern.
- **Controls:** Rate, Hz/Sync mode, Sync division, Hz-only x10, Amount, Map/Unmap, and expandable Multimap slots. No modulation mode, Offset, Shape, Steps, Jitter, or Smooth controls.
- Uses Max's `live.map` and normalized `live.remote~` objects. **User-reported Live smoke test (2026-10-12):** works "pretty good"; exact control-by-control checks were not recorded.
- See [docs/binary-lfo.md](docs/binary-lfo.md) for behavior details and follow-up checks.

### 4. MicroKorgCCMapper (MIDI Effect)
- Provides one Map/Unmap row for every one of the guide's 47 named MicroKorg CC entries.
- Shared CC aliases remain separate rows and share their underlying incoming CC stream; there are 40 unique CC numbers.
- Mapping uses Live's `live.map` and normalized `live.remote~`, with CC values scaled from 0-127 to 0-1. Original MIDI is forwarded through the Live device chain; no external MIDI destination is configured.
- Source list is adapted from the MIDI Guide dataset, licensed CC BY-SA 4.0. See [docs/microkorg-cc-mapper.md](docs/microkorg-cc-mapper.md).
- Installed in the User Library's `Presets/MIDI Effects/Max MIDI Effect` folder; the previous mapper and its linked preset were removed after verifying the replacement.
