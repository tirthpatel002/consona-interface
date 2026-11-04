import { definePlugin } from '@consona/interface-core'
import { AudioProvider } from './context'
import {
  AudioPlayer,
  AudioPlayerButton,
  AudioRecorder,
  AudioRecorderButton,
  AudioTimeline,
  LiveWaveform,
  BarVisualizer,
  MicSelector,
  TranscriptViewer,
  VoiceButton,
  VideoPlayer,
  MediaImage,
} from './components'

export const AudioPlugin = definePlugin({
  name: 'audio',
  version: '1.1.0',
  description:
    'Audio and media framework — shared AudioEngine bus, headless hooks for custom UI, and optional chrome components.',
  Provider: AudioProvider,
  components: {
    AudioPlayer,
    AudioPlayerButton,
    AudioRecorder,
    AudioRecorderButton,
    AudioTimeline,
    LiveWaveform,
    BarVisualizer,
    MicSelector,
    TranscriptViewer,
    VoiceButton,
    VideoPlayer,
    MediaImage,
  },
})

export const MediaPlugin = AudioPlugin
