# Audio Programming Project Context

Documentation date: 2026-10-01. Workspace files were inspected on this date.

## Purpose and Current State
- **VERIFIED:** Windows workspace for JUCE plug-ins and VCV Rack modules.
- **VERIFIED:** contains `vst-plugins/RandomDriftDelay` and `vcv-rack-modules/AudioProgrammingDrift`, plus shared directories, templates, docs, dependencies, experiments, archives, and tools.
- **VERIFIED:** RandomDriftDelay is a JUCE CMake project producing Standalone and VST3 formats. AudioProgrammingDrift is a VCV Rack 2 plug-in project.
- **UNKNOWN:** latest build/test status and whether all workstation toolchains are currently usable.

## Goals
- Keep serious/released work self-contained under the relevant plug-in directory; use `experiments/` for disposable work.
- Keep reusable first-party DSP/UI/assets under `shared/`; reviewed SDKs under `dependencies/`.
- Preserve stable plug-in parameter IDs and record third-party code/assets and licenses.

## Hardware, Software, and Network
- **VERIFIED:** workstation is Windows; workspace path is `C:\VSCODE PROGRAMS\audio programming`.
- **VERIFIED from project docs/manifests:** JUCE CMake flow targets Visual Studio 2022; VCV Rack project targets Rack SDK 2.0.6 / Rack 2 Pro 2.0.6.
- **UNKNOWN:** exact current Windows/Visual Studio/CMake versions and build host hardware.
- No home-network dependency is required for normal audio-project builds.

## Important Paths and Dependencies
- JUCE checkout expected at `dependencies/juce/JUCE` (ignored by git; local dependency).
- Rack SDK expected at `dependencies/rack-sdk/Rack-SDK` (ignored by git; local dependency).
- VCV build workaround uses per-user junction `C:\Users\Max\AudioDev` because Rack Makefiles cannot handle the workspace path containing spaces.
- VCV helper: `tools/build-rack-drift.sh`.
- CMake build output is under `vst-plugins/RandomDriftDelay/build` and ignored.

## Current Projects
- Random Drift Delay: stereo delay, 350 ms centre, random drift amount 0–100 ms, speed 0.05–12 Hz; fixed wet mix and feedback. See its project README.
- Drift Delay for Rack: mono delay, 350 ms centre, 35% feedback, 45% wet; amount and speed controls.

## Known Problems and History
- **VERIFIED from `InstallationLog.txt`, 2026-09-17:** an MSYS2 installer attempt targeting `C:\msys64` failed because the directory already exists and contains an installation. This does not establish that MSYS2 is broken; inspect the existing installation before attempting changes.
- **VERIFIED from VCV quickstart:** Rack Makefiles cannot build directly from a path containing spaces; the `AudioDev` junction is the documented workaround.
- **UNKNOWN:** whether the junction and SDK paths currently exist and work.
- No project build was performed as part of this documentation update.

## Must Not Change Without Confirmation
- Existing plug-in parameter IDs, user data/presets, third-party license notices, SDK installations, build outputs, or the `AudioDev` junction.
- Do not upgrade JUCE or Rack SDK versions without checking compatibility and preserving a reproducible build path.

## Relationship to Other Projects
- Audio builds are independent from Pi-hole and ZimaBoard services. Shared workstation hardware is the only known relationship.

## Outstanding Tasks / Unknowns
- Verify current build prerequisites and run focused builds only when requested.
- Determine whether the ignored local SDKs and junction are present before changing build instructions.
- Last known source inspection: 2026-10-01; build state not verified.