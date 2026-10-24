cmake_minimum_required(VERSION 3.22)

project(RandomDriftDelay VERSION 0.1.0)

# Point this at your local JUCE checkout. The workspace convention puts it here.
add_subdirectory(${CMAKE_CURRENT_LIST_DIR}/../../dependencies/juce/JUCE JUCE)

juce_add_plugin(RandomDriftDelay
    COMPANY_NAME "AudioProgramming"
    BUNDLE_ID "com.audioprogramming.randomdriftdelay"
    PLUGIN_MANUFACTURER_CODE AuPr
    PLUGIN_CODE Rdd1
    FORMATS Standalone VST3
    PRODUCT_NAME "Random Drift Delay"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE)

target_sources(RandomDriftDelay PRIVATE
    Source/PluginProcessor.cpp
    Source/PluginProcessor.h
    Source/PluginEditor.cpp
    Source/PluginEditor.h)

target_compile_definitions(RandomDriftDelay PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0)

target_link_libraries(RandomDriftDelay PRIVATE
    juce::juce_audio_utils
    juce::juce_dsp
    juce::juce_gui_extra
    juce::juce_recommended_config_flags
    juce::juce_recommended_lto_flags
    juce::juce_recommended_warning_flags)

juce_generate_juce_header(RandomDriftDelay)
