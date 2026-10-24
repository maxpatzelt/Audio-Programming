# Changelog: Max for Live Vibe Coding Environment

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-10-13

### Added
- `MicroKorgCCMapper`: 47 independent named map rows sharing 40 distinct incoming MicroKorg CC value routes.
- CC manifest sourced from MIDI Guide with CC BY-SA 4.0 attribution. Replaced the old User Library mapper only after verifying the new AMXD; removed its paired preset because it referenced the old file.
- `BinaryLFO`: binary random remote controller with Amount-based high-event dropouts and up to eight map slots.
- Hz/tempo-synced rate modes, Hz-only x10, and a collapsible multimap panel.
- Deterministic runtime and patch-graph tests for BinaryLFO.
- User reports BinaryLFO works "pretty good" in Live; saved follow-up checks in `docs/binary-lfo.md`.

### Fixed
- Euclidean device now uses Max's documented `v8` object rather than `js @engine v8`.
- Start the tempo-relative metro on device load, use a packed pitch/velocity list for `midiformat`, and let `makenote` generate note-offs.
- Added runtime tests for Euclidean pattern generation and parameter updates.

## [0.1.0] - 2026-10-12

### Added
- Environment inspection and discovery for Ableton Live 12.4.6 Suite and Cycling '74 Max 9.1.5 on Windows.
- Project documentation suite: `PROJECT_CONTEXT.md`, `architecture.md`, `decisions.md`, `changelog.md`.
- Core AST patcher model and fluent builder (`Patcher`, `Box`, `Patchline`).
- Binary AMXD container serializer (`AMXDContainer`) supporting Audio Effect (`aaaa`), MIDI Effect (`mmmm`), and Instrument (`iiii`).
- Initial prototype devices:
  - `VibeDelay`: Stereo audio delay with feedback, modulated drift LFO, LP filter, and `live.dial` controls in presentation mode.
  - `VibeEuclid`: Algorithmic Euclidean MIDI rhythm generator with live UI and V8 JavaScript engine.
- Runtime V8 script bridges for dynamic patcher manipulation and Ableton Live Object Model (`LiveAPI`).
- Node test suite verifying patcher structure, connection graphs, and container binary integrity.
- Build and deployment scripts for publishing directly to Ableton Live User Library.
