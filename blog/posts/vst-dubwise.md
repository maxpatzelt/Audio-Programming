---
title: "DubWise (VST)"
slug: "vst-dubwise"
project_type: "vst"
github_url: "https://github.com/maxpatzelt/DubWise"
repo_path: "vst-plugins/DubWise"
source_readme: "vst-plugins/DubWise/README.md"
generated_at_utc: "2026-10-24T19:07:18Z"
---

# DubWise (VST)

> Synced from project README.
> Repo: https://github.com/maxpatzelt/DubWise

Professional dub/reggae VST workstation with vintage mixer aesthetic.

## Features

### Phase 1 - Siren VCO (Current)
- **Morphing VCO**: Smooth waveform morphing from clean sine to complex harmonics
  - Frequency control: 20 Hz - 4 kHz
  - Tone morphing: Sine → Triangle → Saw → Square
- **ADSR Envelope**: Full envelope shaping
- **MIDI Support**: Velocity-sensitive playback

### Planned Features
- Sample player (air horns, vocal snippets)
- Dub delay with tape saturation
- Modular routing matrix
- LFO bank with flexible routing
- Vintage mixer-style UI
- Multiple tape deck emulations

## Building

### Requirements
- CMake 3.22+
- Visual Studio 2022 (Windows)
- JUCE framework (included)

### Build Instructions
```bash
cd D:\DubWise
mkdir build
cmake -S . -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release
```

VST3 output: `build/DubWise_artefacts/Release/VST3/DubWise.vst3`

## License
Proprietary - Commercial VST in development

## Author
Max Patzelt
