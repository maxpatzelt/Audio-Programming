#pragma once

#include "PluginProcessor.h"

class RandomDriftDelayAudioProcessorEditor final : public juce::AudioProcessorEditor
{
public:
    explicit RandomDriftDelayAudioProcessorEditor (RandomDriftDelayAudioProcessor&);
    void paint (juce::Graphics&) override;
    void resized() override;

private:
    RandomDriftDelayAudioProcessor& processor;
    juce::Slider amplitudeSlider, speedSlider;
    juce::Label amplitudeLabel, speedLabel, titleLabel;
    using Attachment = juce::AudioProcessorValueTreeState::SliderAttachment;
    std::unique_ptr<Attachment> amplitudeAttachment, speedAttachment;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (RandomDriftDelayAudioProcessorEditor)
};
