#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace
{
constexpr float baseDelayMs = 350.0f;
constexpr float maximumDeviationMs = 100.0f;
constexpr float wetMix = 0.45f;
}

RandomDriftDelayAudioProcessor::RandomDriftDelayAudioProcessor()
    : AudioProcessor (BusesProperties()
        .withInput ("Input", juce::AudioChannelSet::stereo(), true)
        .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      parameters (*this, nullptr, "PARAMETERS", createParameterLayout())
{
}

juce::AudioProcessorValueTreeState::ParameterLayout RandomDriftDelayAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> layout;
    layout.push_back (std::make_unique<juce::AudioParameterFloat> (
        "amplitude", "Deviation Amplitude", juce::NormalisableRange<float> (0.0f, maximumDeviationMs, 0.1f), 25.0f, "ms"));
    layout.push_back (std::make_unique<juce::AudioParameterFloat> (
        "speed", "Randomness Speed", juce::NormalisableRange<float> (0.05f, 12.0f, 0.01f, 0.45f), 2.0f, "Hz"));
    return { layout.begin(), layout.end() };
}

void RandomDriftDelayAudioProcessor::prepareToPlay (double newSampleRate, int)
{
    currentSampleRate = newSampleRate;
    const int size = juce::roundToInt (currentSampleRate * 2.0) + 2;
    delayBuffer.setSize (juce::jmax (1, getTotalNumOutputChannels()), size);
    delayBuffer.clear();
    writePosition = 0;
    currentDeviationMs = targetDeviationMs = 0.0f;
    samplesUntilNextTarget = 0;
}

void RandomDriftDelayAudioProcessor::releaseResources() {}

bool RandomDriftDelayAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto output = layouts.getMainOutputChannelSet();
    return (output == juce::AudioChannelSet::mono() || output == juce::AudioChannelSet::stereo())
        && output == layouts.getMainInputChannelSet();
}

void RandomDriftDelayAudioProcessor::chooseNextRandomTarget()
{
    const auto amplitude = parameters.getRawParameterValue ("amplitude")->load();
    targetDeviationMs = random.nextFloat() * 2.0f * amplitude - amplitude;
    const auto speedHz = parameters.getRawParameterValue ("speed")->load();
    samplesUntilNextTarget = juce::jmax (1, juce::roundToInt (currentSampleRate / speedHz));
}

float RandomDriftDelayAudioProcessor::readDelaySample (int channel, float delayInSamples) const
{
    const int bufferSize = delayBuffer.getNumSamples();
    float position = static_cast<float> (writePosition) - delayInSamples;
    while (position < 0.0f) position += static_cast<float> (bufferSize);

    const int indexA = static_cast<int> (position) % bufferSize;
    const int indexB = (indexA + 1) % bufferSize;
    const float fraction = position - std::floor (position);
    const auto* channelData = delayBuffer.getReadPointer (channel);
    return channelData[indexA] + fraction * (channelData[indexB] - channelData[indexA]);
}

void RandomDriftDelayAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&)
{
    juce::ScopedNoDenormals noDenormals;
    const int channels = juce::jmin (buffer.getNumChannels(), delayBuffer.getNumChannels());
    const int numSamples = buffer.getNumSamples();

    for (int sample = 0; sample < numSamples; ++sample)
    {
        if (samplesUntilNextTarget-- <= 0)
            chooseNextRandomTarget();

        // Smooth motion avoids clicks while still allowing random delay-time drift.
        currentDeviationMs += 0.0015f * (targetDeviationMs - currentDeviationMs);
        const float delaySamples = (baseDelayMs + currentDeviationMs) * 0.001f * static_cast<float> (currentSampleRate);

        for (int channel = 0; channel < channels; ++channel)
        {
            const float input = buffer.getSample (channel, sample);
            const float delayed = readDelaySample (channel, delaySamples);
            delayBuffer.setSample (channel, writePosition, input + delayed * 0.35f);
            buffer.setSample (channel, sample, input + delayed * wetMix);
        }

        if (++writePosition == delayBuffer.getNumSamples())
            writePosition = 0;
    }
}

juce::AudioProcessorEditor* RandomDriftDelayAudioProcessor::createEditor()
{
    return new RandomDriftDelayAudioProcessorEditor (*this);
}

void RandomDriftDelayAudioProcessor::getStateInformation (juce::MemoryBlock& destinationData)
{
    if (const auto state = parameters.copyState(); state.isValid())
        copyXmlToBinary (*state.createXml(), destinationData);
}

void RandomDriftDelayAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    if (const auto xml = getXmlFromBinary (data, sizeInBytes))
        if (xml->hasTagName (parameters.state.getType()))
            parameters.replaceState (juce::ValueTree::fromXml (*xml));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new RandomDriftDelayAudioProcessor();
}
