import type {
  ComposedTranscript,
  TranscriptAlignment,
  TranscriptCue,
  TranscriptInput,
  TranscriptSegment,
  TranscriptWord,
} from './types'

export interface ComposeTranscriptOptions {
  hideAudioTags?: boolean
  duration?: number
}

function isComposedTranscript(value: unknown): value is ComposedTranscript {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray((value as ComposedTranscript).words) &&
      Array.isArray((value as ComposedTranscript).segments)
  )
}

function isAlignment(value: unknown): value is TranscriptAlignment {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (Array.isArray((value as TranscriptAlignment).words) ||
        Array.isArray((value as TranscriptAlignment).characters))
  )
}

function cueText(item: TranscriptWord | TranscriptCue | { word?: string; text?: string }): string {
  if ('text' in item && item.text) return item.text
  if ('word' in item && item.word) return item.word
  return ''
}

function wordsToAlignment(
  items: Array<TranscriptWord | TranscriptCue | { word?: string; text?: string; startTime?: number; endTime?: number }>
): TranscriptAlignment {
  return {
    words: items.map((item) => ({
      word: cueText(item),
      startTime: Number.isFinite(item.startTime) ? Number(item.startTime) : 0,
      endTime: Number.isFinite(item.endTime) ? Number(item.endTime) : Number(item.startTime) || 0,
    })),
  }
}

/**
 * Accept text, word arrays, cues, alignments, or composed transcripts from a parent.
 */
export function normalizeTranscript(
  input: TranscriptInput,
  options: ComposeTranscriptOptions = {}
): TranscriptAlignment | null {
  if (!input) return null

  if (typeof input === 'string') {
    const tokens = input.trim().split(/\s+/).filter(Boolean)
    if (!tokens.length) return { words: [] }
    const duration = options.duration && options.duration > 0 ? options.duration : 0
    const step = duration > 0 ? duration / (tokens.length || 1) : 0
    return {
      words: tokens.map((word, index) => ({
        word,
        startTime: step ? index * step : 0,
        endTime: step ? (index + 1) * step : 0,
      })),
    }
  }

  if (Array.isArray(input)) {
    if (input.length === 0) return { words: [] }
    return wordsToAlignment(input as TranscriptCue[])
  }

  if (isComposedTranscript(input)) {
    return wordsToAlignment(input.words)
  }

  if (isAlignment(input)) return input

  return null
}

/**
 * Composes a stream/array of character timestamps into structured words and gaps.
 */
export function composeTranscript(
  alignment: TranscriptAlignment,
  options: ComposeTranscriptOptions = {}
): ComposedTranscript {
  const {
    characters = [],
    characterStartTimesSeconds: starts = [],
    characterEndTimesSeconds: ends = [],
    words: inputWords,
  } = alignment

  const segments: TranscriptSegment[] = []
  const words: TranscriptWord[] = []

  // If word-level tokens are provided directly without character arrays
  if ((!characters || characters.length === 0) && inputWords && inputWords.length > 0) {
    let segmentIndex = 0
    inputWords.forEach((item, wIndex) => {
      const wordObj: TranscriptWord = {
        kind: 'word',
        segmentIndex: segmentIndex++,
        wordIndex: wIndex,
        text: item.word,
        startTime: item.startTime,
        endTime: item.endTime,
      }
      segments.push(wordObj)
      words.push(wordObj)

      // Add space between words
      if (wIndex < inputWords.length - 1) {
        segments.push({
          kind: 'gap',
          segmentIndex: segmentIndex++,
          text: ' ',
        })
      }
    })
    return { segments, words, hasTimings: words.some((word) => word.endTime > word.startTime) }
  }

  let wordBuffer = ''
  let whitespaceBuffer = ''
  let wordStart = 0
  let wordEnd = 0
  let segmentIndex = 0
  let wordIndex = 0
  let insideAudioTag = false

  const hideAudioTags = options.hideAudioTags ?? false

  const flushWhitespace = () => {
    if (!whitespaceBuffer) return
    segments.push({
      kind: 'gap',
      segmentIndex: segmentIndex++,
      text: whitespaceBuffer,
    })
    whitespaceBuffer = ''
  }

  const flushWord = () => {
    if (!wordBuffer) return
    const word: TranscriptWord = {
      kind: 'word',
      segmentIndex: segmentIndex++,
      wordIndex: wordIndex++,
      text: wordBuffer,
      startTime: wordStart,
      endTime: wordEnd,
    }
    segments.push(word)
    words.push(word)
    wordBuffer = ''
  }

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    if (!char) continue

    const start = starts[i] ?? 0
    const end = ends[i] ?? start

    if (hideAudioTags) {
      if (char === '[') {
        flushWord()
        whitespaceBuffer = ''
        insideAudioTag = true
        continue
      }
      if (insideAudioTag) {
        if (char === ']') insideAudioTag = false
        continue
      }
    }

    if (/\s/.test(char)) {
      flushWord()
      whitespaceBuffer += char
      continue
    }

    if (whitespaceBuffer) {
      flushWhitespace()
    }

    if (!wordBuffer) {
      wordBuffer = char
      wordStart = start
      wordEnd = end
    } else {
      wordBuffer += char
      wordEnd = end
    }
  }

  flushWord()
  flushWhitespace()

  return {
    segments,
    words,
    hasTimings: words.some((word) => Number.isFinite(word.endTime) && word.endTime > word.startTime),
  }
}

/**
 * Binary search to find the active word index corresponding to currentTime.
 */
export function findWordIndexByTime(words: TranscriptWord[], time: number): number {
  if (!words || words.length === 0) return -1
  let lo = 0
  let hi = words.length - 1
  let found = -1

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const word = words[mid]
    if (!word) break

    if (time >= word.startTime && time < word.endTime) {
      return mid
    }
    if (time < word.startTime) {
      hi = mid - 1
    } else {
      found = mid
      lo = mid + 1
    }
  }

  return found
}
