export function formatAudioTimestamp(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
