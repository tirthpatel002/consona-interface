import { BaseEngine } from '../../../core/engine'
import { createAudioContext, resumeAudioContext } from './context'
import type { AudioRecordingResult, AudioRecordingStatus } from './types'

export interface AudioRecorderOptions {
  deviceId?: string
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  channelCount?: number
  mimeType?: string
  timeSlice?: number
  fftSize?: number
  smoothingTimeConstant?: number
  maxHistorySize?: number
  maxDuration?: number
  onDataAvailable?: (chunk: Blob) => void
}

export interface AudioRecorderEngineState {
  status: AudioRecordingStatus
  duration: number
  volume: number
  waveformHistory: number[]
  error: Error | null
  activeDeviceId?: string
}

export type AudioRecorderListener = (state: AudioRecorderEngineState) => void

export function concatAudioBuffers(
  ctx: AudioContext | BaseAudioContext,
  buffer1: AudioBuffer,
  buffer2: AudioBuffer
): AudioBuffer {
  const numChannels = Math.max(buffer1.numberOfChannels, buffer2.numberOfChannels)
  const totalLength = buffer1.length + buffer2.length
  const sampleRate = buffer1.sampleRate

  const out = ctx.createBuffer(numChannels, totalLength, sampleRate)
  for (let c = 0; c < numChannels; c++) {
    const channelData = out.getChannelData(c)
    const b1Data = c < buffer1.numberOfChannels ? buffer1.getChannelData(c) : buffer1.getChannelData(0)
    const b2Data = c < buffer2.numberOfChannels ? buffer2.getChannelData(c) : buffer2.getChannelData(0)
    channelData.set(b1Data, 0)
    channelData.set(b2Data, buffer1.length)
  }
  return out
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const numSamples = buffer.length
  const dataByteLength = numSamples * blockAlign
  const headerByteLength = 44
  const totalByteLength = headerByteLength + dataByteLength

  const arrayBuffer = new ArrayBuffer(totalByteLength)
  const view = new DataView(arrayBuffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, totalByteLength - 8, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataByteLength, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c))
  }

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const channelData = channels[c]
      const raw = channelData ? channelData[i] ?? 0 : 0
      const sample = Math.max(-1, Math.min(1, raw))
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, int16, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

export class AudioRecorderEngine extends BaseEngine<AudioRecorderEngineState> {
  private stream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private chunks: Blob[] = []
  private currentTakeChunks: Blob[] = []
  private priorAudioBuffer: AudioBuffer | null = null
  private options: Required<Omit<AudioRecorderOptions, 'deviceId' | 'mimeType' | 'maxDuration' | 'onDataAvailable'>> & {
    deviceId?: string
    mimeType?: string
    maxDuration?: number
    onDataAvailable?: (chunk: Blob) => void
  }

  private timerId: ReturnType<typeof setInterval> | null = null
  private animationId: number | null = null
  private startTime = 0
  private accumulatedDuration = 0

  constructor(options: AudioRecorderOptions = {}) {
    const initialState: AudioRecorderEngineState = {
      status: 'idle',
      duration: 0,
      volume: 0,
      waveformHistory: [],
      error: null,
      activeDeviceId: options.deviceId,
    }

    super(initialState)

    this.options = {
      deviceId: options.deviceId,
      mimeType: options.mimeType,
      echoCancellation: options.echoCancellation ?? true,
      noiseSuppression: options.noiseSuppression ?? true,
      autoGainControl: options.autoGainControl ?? true,
      channelCount: options.channelCount ?? 1,
      timeSlice: options.timeSlice ?? 100,
      fftSize: options.fftSize ?? 256,
      smoothingTimeConstant: options.smoothingTimeConstant ?? 0.8,
      maxHistorySize: options.maxHistorySize ?? 200,
      maxDuration: options.maxDuration,
      onDataAvailable: options.onDataAvailable,
    }
  }

  public getStream(): MediaStream | null {
    return this.stream
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  public async start(deviceId?: string): Promise<MediaStream> {
    if (this.state.status === 'recording') {
      return this.stream!
    }

    if (deviceId) {
      this.options.deviceId = deviceId
    }

    this.setState({
      status: 'requesting-permission',
      error: null,
    })

    try {
      const hasSpecificDevice = Boolean(
        this.options.deviceId &&
          this.options.deviceId !== 'default' &&
          this.options.deviceId.trim() !== ''
      )

      const constraints: MediaStreamConstraints = {
        audio: hasSpecificDevice
          ? {
              deviceId: { exact: this.options.deviceId },
              echoCancellation: this.options.echoCancellation,
              noiseSuppression: this.options.noiseSuppression,
              autoGainControl: this.options.autoGainControl,
              channelCount: this.options.channelCount,
              sampleRate: 48000,
            }
          : {
              echoCancellation: this.options.echoCancellation,
              noiseSuppression: this.options.noiseSuppression,
              autoGainControl: this.options.autoGainControl,
              channelCount: this.options.channelCount,
              sampleRate: 48000,
            },
        video: false,
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      this.stream = stream

      this.audioContext = createAudioContext()
      await resumeAudioContext(this.audioContext)

      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.options.fftSize
      this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant

      this.source = this.audioContext.createMediaStreamSource(this.stream)
      this.source.connect(this.analyser)

      const mimeType = this.options.mimeType || this.getSupportedMimeType()
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 128000,
      }
      if (mimeType) {
        recorderOptions.mimeType = mimeType
      }

      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions)
      this.chunks = []
      this.currentTakeChunks = []
      this.priorAudioBuffer = null

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data)
          this.currentTakeChunks.push(e.data)
          this.options.onDataAvailable?.(e.data)
        }
      }

      this.mediaRecorder.start(this.options.timeSlice)
      this.startTime = Date.now()
      this.accumulatedDuration = 0

      this.setState({
        status: 'recording',
        duration: 0,
        waveformHistory: [],
        activeDeviceId: this.options.deviceId,
      })
      this.emit('record:start', { deviceId: this.options.deviceId })

      this.startAnalysisLoop()
      this.startTimer()

      return this.stream
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.setState({
        status: 'error',
        error,
      })
      this.emit('record:error', { error })
      this.cleanupStream()
      throw error
    }
  }

  public pause(): void {
    if (this.state.status !== 'recording' || !this.mediaRecorder) return
    this.mediaRecorder.pause()
    this.accumulatedDuration += Date.now() - this.startTime
    this.stopTimer()
    this.setState({ status: 'paused' })
    this.emit('record:pause')
  }

  public resume(): void {
    if (this.state.status !== 'paused' || !this.mediaRecorder) return
    this.mediaRecorder.resume()
    this.startTime = Date.now()
    this.startTimer()
    this.setState({ status: 'recording' })
    this.emit('record:resume')
  }

  public async resumeRecording(deviceId?: string): Promise<MediaStream> {
    if (this.state.status === 'recording') {
      return this.stream!
    }

    if (this.state.status === 'paused' && this.mediaRecorder) {
      this.resume()
      return this.stream!
    }

    const priorDurationMs =
      this.accumulatedDuration > 0 ? this.accumulatedDuration : (this.state.duration || 0) * 1000
    const priorDurationSec = priorDurationMs / 1000
    const priorWaveform = [...this.state.waveformHistory]

    if (deviceId) {
      this.options.deviceId = deviceId
    }

    this.setState({
      status: 'requesting-permission',
      error: null,
    })

    try {
      const hasSpecificDevice = Boolean(
        this.options.deviceId &&
          this.options.deviceId !== 'default' &&
          this.options.deviceId.trim() !== ''
      )

      const constraints: MediaStreamConstraints = {
        audio: hasSpecificDevice
          ? {
              deviceId: { exact: this.options.deviceId },
              echoCancellation: this.options.echoCancellation,
              noiseSuppression: this.options.noiseSuppression,
              autoGainControl: this.options.autoGainControl,
              channelCount: this.options.channelCount,
              sampleRate: 48000,
            }
          : {
              echoCancellation: this.options.echoCancellation,
              noiseSuppression: this.options.noiseSuppression,
              autoGainControl: this.options.autoGainControl,
              channelCount: this.options.channelCount,
              sampleRate: 48000,
            },
        video: false,
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      this.stream = stream

      this.audioContext = createAudioContext()
      await resumeAudioContext(this.audioContext)

      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.options.fftSize
      this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant

      this.source = this.audioContext.createMediaStreamSource(this.stream)
      this.source.connect(this.analyser)

      const mimeType = this.options.mimeType || this.getSupportedMimeType()
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 128000,
      }
      if (mimeType) {
        recorderOptions.mimeType = mimeType
      }

      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions)
      this.currentTakeChunks = []

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data)
          this.currentTakeChunks.push(e.data)
          this.options.onDataAvailable?.(e.data)
        }
      }

      this.mediaRecorder.start(this.options.timeSlice)
      this.startTime = Date.now()
      this.accumulatedDuration = priorDurationMs

      this.setState({
        status: 'recording',
        duration: priorDurationSec,
        waveformHistory: priorWaveform,
        activeDeviceId: this.options.deviceId,
      })
      this.emit('record:resumeRecording')

      this.startAnalysisLoop()
      this.startTimer()

      return this.stream
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.setState({
        status: 'error',
        error,
      })
      this.emit('record:error', { error })
      this.cleanupStream()
      throw error
    }
  }

  public async stop(): Promise<AudioRecordingResult> {
    this.stopTimer()
    this.stopAnalysisLoop()

    return new Promise<AudioRecordingResult>((resolve, reject) => {
      if (!this.mediaRecorder || this.state.status === 'idle') {
        const emptyResult: AudioRecordingResult = {
          blob: new Blob([], { type: 'audio/webm' }),
          url: '',
          duration: 0,
          waveform: [],
        }
        this.setState({ status: 'stopped' })
        return resolve(emptyResult)
      }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
        const currentTakeBlob = new Blob(this.currentTakeChunks, { type: mimeType })
        const waveform = [...this.state.waveformHistory]

        let currentTakeBuffer: AudioBuffer | null = null
        try {
          if (this.audioContext && this.audioContext.state !== 'closed' && currentTakeBlob.size > 0) {
            const arrayBuf = await currentTakeBlob.arrayBuffer()
            currentTakeBuffer = await this.audioContext.decodeAudioData(arrayBuf.slice(0))
          }
        } catch {
          // Decoding fallback
        }

        let finalAudioBuffer: AudioBuffer | null = null
        let finalBlob: Blob
        let finalDuration = this.state.duration

        if (this.priorAudioBuffer && currentTakeBuffer && this.audioContext) {
          finalAudioBuffer = concatAudioBuffers(this.audioContext, this.priorAudioBuffer, currentTakeBuffer)
          this.priorAudioBuffer = finalAudioBuffer
          finalBlob = audioBufferToWav(finalAudioBuffer)
          finalDuration = finalAudioBuffer.duration
        } else if (currentTakeBuffer) {
          finalAudioBuffer = currentTakeBuffer
          this.priorAudioBuffer = currentTakeBuffer
          finalBlob = audioBufferToWav(currentTakeBuffer)
          finalDuration = currentTakeBuffer.duration
        } else {
          finalBlob = new Blob(this.chunks, { type: mimeType })
        }

        const url = URL.createObjectURL(finalBlob)

        this.cleanupStream()
        this.setState({ status: 'stopped', duration: finalDuration })

        const result: AudioRecordingResult = {
          blob: finalBlob,
          url,
          duration: finalDuration,
          audioBuffer: finalAudioBuffer,
          waveform,
        }

        this.emit('record:stop', result)
        resolve(result)
      }

      this.mediaRecorder.onerror = () => {
        this.cleanupStream()
        const err = new Error('Recording failed')
        this.setState({
          status: 'error',
          error: err,
        })
        this.emit('record:error', { error: err })
        reject(err)
      }

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
    })
  }

  public cancel(): void {
    this.stopTimer()
    this.stopAnalysisLoop()
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {}
    }
    this.chunks = []
    this.currentTakeChunks = []
    this.priorAudioBuffer = null
    this.cleanupStream()
    this.setState({
      status: 'idle',
      duration: 0,
      volume: 0,
      waveformHistory: [],
      error: null,
    })
    this.emit('record:cancel')
  }

  private startTimer() {
    this.stopTimer()
    this.timerId = setInterval(() => {
      const elapsed = this.accumulatedDuration + (Date.now() - this.startTime)
      const duration = elapsed / 1000
      this.setState({ duration })
      if (this.options.maxDuration && duration >= this.options.maxDuration) {
        this.stop().catch(() => {})
      }
    }, 100)
  }

  private stopTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  private startAnalysisLoop() {
    this.stopAnalysisLoop()
    if (!this.analyser) return

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    let lastUpdate = 0

    const loop = (timestamp: number) => {
      if (this.state.status === 'recording' && this.analyser) {
        if (timestamp - lastUpdate >= 60) {
          this.analyser.getByteFrequencyData(dataArray)

          let sum = 0
          const count = Math.min(dataArray.length, 48)
          const start = Math.floor(dataArray.length * 0.05)
          const end = start + count

          for (let i = start; i < end; i++) {
            const val = dataArray[i] ?? 0
            sum += val
          }

          const rawAvg = count > 0 ? (sum / (count || 1)) / 255 : 0
          const boosted = Math.min(1, Math.max(0.04, Math.pow(rawAvg, 0.75) * 1.8))
          const newWaveform = [...this.state.waveformHistory, boosted]
          if (newWaveform.length > this.options.maxHistorySize) {
            newWaveform.shift()
          }

          lastUpdate = timestamp
          this.setState({
            volume: boosted,
            waveformHistory: newWaveform,
          })
        }
        this.animationId = requestAnimationFrame(loop)
      } else {
        this.animationId = null
      }
    }

    this.animationId = requestAnimationFrame(loop)
  }

  private stopAnalysisLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private getSupportedMimeType(): string | undefined {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ]
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return undefined
  }

  private cleanupStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }
  }

  public override destroy(): void {
    super.destroy()
    this.stopTimer()
    this.stopAnalysisLoop()
    this.cleanupStream()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
  }
}
