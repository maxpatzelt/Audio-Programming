# Max for Live Vibe Coding Environment Context

Documentation Date: 2026-10-13
Status: Initial prototypes built; BinaryLFO user-tested; MicroKorgCCMapper build-verified (2026-10-13)

## Purpose and Current State
- **VERIFIED:** Windows workspace for code-first Max for Live development using JavaScript, Node.js, and Cycling '74 Max 9 / Ableton Live 12.
- **VERIFIED:** Max 9.1.5 bundled with Ableton Live 12.4.6 Suite discovered at `C:\ProgramData\Ableton\Live 12 Suite\Resources\Max\Max.exe`.
- **VERIFIED:** Node.js v24.19.0, npm 12.2.0, git 2.33.1, Python 3.10.6 available.
- **VERIFIED:** AMXD 32-byte header container format verified against existing Ableton devices (`LFO.amxd`, `CC_map8.amxd`).
- **VERIFIED (user report, 2026-10-12):** BinaryLFO was loaded in Live and reported to work "pretty good". Detailed mapping/rate scenario coverage was not recorded.
- **IMPLEMENTED / BUILD-VERIFIED (2026-10-13):** `MicroKorgCCMapper` contains 47 labeled CC entries across 40 distinct CC values, each with an independent Map/Unmap slot.
- **VERIFIED:** `MicroKorgCCMapper.amxd` is installed in the User Library MIDI Effects folder and hash-matched the build. The prior `microkorg midi cc map.amxd` and its linked `.adv` preset were removed at the user's request.
- Detailed environment details, architecture, and decisions are recorded in [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md).

## Goals
- Provide a fluent, type-safe / schema-safe programmatic API in JavaScript to describe, generate, and modify Max for Live patchers.
- Enable headless compilation and testing of `.amxd` and `.maxpat` devices from VS Code without requiring manual UI wiring.
- Include Max runtime JavaScript modules leveraging Max 9's V8 engine and the Live Object Model (`LiveAPI`).
- Implement an automated test suite validating patcher JSON structure, line connectivity, and container binaries.
- Deploy directly to Ableton Live's User Library with one command.

## Important Paths
- Workspace Root: [c:/VSCODE PROGRAMS/Audio Programming/Max4Live](.)
- Ableton Executable: `C:\ProgramData\Ableton\Live 12 Suite\Program\Ableton Live 12 Suite.exe`
- Max Executable: `C:\ProgramData\Ableton\Live 12 Suite\Resources\Max\Max.exe`
- User Library: `C:\Users\Max\Documents\Ableton\User Library`
- Documentation:
  - [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
  - [docs/architecture.md](docs/architecture.md)
  - [docs/decisions.md](docs/decisions.md)
  - [docs/changelog.md](docs/changelog.md)
  - [docs/binary-lfo.md](docs/binary-lfo.md)
  - [docs/microkorg-cc-mapper.md](docs/microkorg-cc-mapper.md)
