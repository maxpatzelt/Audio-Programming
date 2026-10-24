# Random Drift Delay

A stereo delay with a fixed 350 ms centre delay and gently changing random drift.

- **Drift Amount**: the maximum random deviation from the centre delay, from 0 to 100 ms.
- **Random Speed**: how often a new random drift destination is selected, from 0.05 to 12 Hz.

The delay time transitions smoothly to prevent clicks. It includes modest feedback and a fixed wet mix.

## Build (Windows / Visual Studio 2022)

Install a JUCE checkout in `../../dependencies/juce/JUCE`, then from this project directory run:

```powershell
cmake -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release --target RandomDriftDelay_VST3
```

The VST3 bundle will be under `build/RandomDriftDelay_artefacts/Release/VST3/`. Run the `RandomDriftDelay_Standalone` target first to audition it outside a DAW.
