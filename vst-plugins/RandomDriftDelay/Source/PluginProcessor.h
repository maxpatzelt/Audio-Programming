#pragma once

#include <JuceHeader.h>

class RandomDriftDelayAudioProcessor final : public juce::AudioProcessor
{
public:
    RandomDriftDelayAudioProcessor();

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }
    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 2.1; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}
    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;

    juce::AudioProcessorValueTreeState parameters;

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();
    float readDelaySample (int channel, float delayInSamples) const;
    void chooseNextRandomTarget();

    juce::AudioBuffer<float> delayBuffer;
    double currentSampleRate = 44100.0;
    int writePosition = 0;
    float currentDeviationMs = 0.0f;
    float targetDeviationMs = 0.0f;
    int samplesUntilNextTarget = 0;
    juce::Random random;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (RandomDriftDelayAudioProcessor)
};
