# Decisions: Max for Live Vibe Coding Environment

Documentation Date: 2026-10-12

## ADR-001: Pure Node.js & ES Modules for Offline Tooling
- **Context:** We need a rapid, cross-platform code generator that runs from VS Code terminal and tasks.
- **Decision:** Build the offline compiler using native Node.js ES modules (`"type": "module"`) and Node's built-in `node:test` runner.
- **Status:** APPROVED.
- **Consequences:** Zero external npm bloat for the core compiler and test suite; instant cold-start time and total portability.

## ADR-002: Direct Binary AMXD Generation
- **Context:** Ableton Live requires `.amxd` files to be dragged directly into audio or MIDI tracks.
- **Decision:** Implement direct byte-level packager for the 32-byte `ampf` chunk container, generating uncompressed JSON `ptch` payloads.
- **Status:** APPROVED.
- **Consequences:** Devices can be compiled directly without launching Max GUI to save the file. Ableton Live 12 and Max 9 open uncompressed JSON `ptch` payloads natively.

## ADR-003: Presentation-First Layout Abstraction
- **Context:** In Ableton Live, only objects in "presentation mode" are visible in the device rack.
- **Decision:** The builder provides auto-placement for presentation widgets (`live.dial`, `live.slider`, `live.toggle`) along a horizontal device rack grid, while automatically separating internal DSP and logic boxes onto the hidden patching grid.
- **Status:** APPROVED.
- **Consequences:** Eliminates visual clutter and ensures clean device rack layout in Ableton Live without manual dragging in Max patcher.

## ADR-004: BinaryLFO Uses Live Remote Control
- **Context:** BinaryLFO maps randomized binary values to automatable Live parameters, with 0/1 selecting target minimum/maximum and no modulation mode.
- **Decision:** Use one `live.map` and one `live.remote~ @normalized 1` per map slot, up to eight slots. Map selection supplies each remote's target ID; binary outputs are broadcast to all mapped remotes.
- **Status:** IMPLEMENTED; user reports the device works in Live (2026-10-12); detailed mapping coverage is not yet recorded.
- **Consequences:** Normalized 0/1 values scale to each mapped parameter's own minimum/maximum. Remote control temporarily disables direct parameter interaction and automation while mapped, as documented by Cycling '74.

## ADR-005: Preserve MicroKorg CC Aliases as Independent Map Slots
- **Context:** The MicroKorg MIDI Guide lists 47 named parameters but reuses seven CC numbers, leaving 40 distinct incoming CC values.
- **Decision:** Show one mapping row for every named parameter. Route each distinct CC value once, then fan it out to all named parameter rows that share that CC; each row keeps its own `live.map` and `live.remote~` target.
- **Status:** IMPLEMENTED; build and automated graph tests pass; Live mapping remains unverified.
- **Consequences:** The same physical control can drive multiple independently mapped Ableton parameters when its table entry is duplicated. Preserve the source dataset's CC BY-SA 4.0 attribution.
