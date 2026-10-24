#include "PluginEditor.h"

RandomDriftDelayAudioProcessorEditor::RandomDriftDelayAudioProcessorEditor (RandomDriftDelayAudioProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    titleLabel.setText ("RANDOM DRIFT DELAY", juce::dontSendNotification);
    titleLabel.setFont (juce::FontOptions (20.0f, juce::Font::bold));
    titleLabel.setJustificationType (juce::Justification::centred);
    addAndMakeVisible (titleLabel);

    for (auto* slider : { &amplitudeSlider, &speedSlider })
    {
        slider->setSliderStyle (juce::Slider::RotaryHorizontalVerticalDrag);
        slider->setTextBoxStyle (juce::Slider::TextBoxBelow, false, 72, 20);
        addAndMakeVisible (*slider);
    }
    amplitudeLabel.setText ("DRIFT AMOUNT", juce::dontSendNotification);
    speedLabel.setText ("RANDOM SPEED", juce::dontSendNotification);
    for (auto* label : { &amplitudeLabel, &speedLabel })
    {
        label->setJustificationType (juce::Justification::centred);
        addAndMakeVisible (*label);
    }
    amplitudeAttachment = std::make_unique<Attachment> (processor.parameters, "amplitude", amplitudeSlider);
    speedAttachment = std::make_unique<Attachment> (processor.parameters, "speed", speedSlider);
    setSize (420, 250);
}

void RandomDriftDelayAudioProcessorEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff161a20));
    g.setColour (juce::Colour (0xff54d6b0));
    g.drawRoundedRectangle (getLocalBounds().toFloat().reduced (8.0f), 10.0f, 2.0f);
}

void RandomDriftDelayAudioProcessorEditor::resized()
{
    titleLabel.setBounds (20, 18, getWidth() - 40, 32);
    const auto controls = getLocalBounds().reduced (40, 60);
    const int half = controls.getWidth() / 2;
    amplitudeSlider.setBounds (controls.withWidth (half));
    speedSlider.setBounds (controls.withLeft (controls.getX() + half));
    amplitudeLabel.setBounds (controls.getX(), controls.getY() + 8, half, 22);
    speedLabel.setBounds (controls.getX() + half, controls.getY() + 8, half, 22);
}
