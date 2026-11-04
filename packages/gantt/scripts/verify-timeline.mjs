/**
 * Geometry self-test against built dist (node:test).
 * Run: npm test
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addCellUnits,
  columnWindow,
  datesFromLayout,
  diffCellUnits,
  layoutBar,
  rowWindow,
  snapToUnit,
} from '../dist/engine/timeline.js'

test('diffCellUnits / addCellUnits round-trip across calendar days', () => {
  const start = new Date(2026, 2, 7, 12, 0, 0, 0).getTime()
  const end = new Date(2026, 2, 10, 12, 0, 0, 0).getTime()
  const cells = diffCellUnits(start, end, 'month')
  assert.ok(Math.abs(cells - 3) < 0.01, `expected ~3 day cells, got ${cells}`)
  const back = addCellUnits(start, cells, 'month')
  assert.equal(new Date(back).getDate(), new Date(end).getDate())
})

test('datesFromLayout move preserves cell duration (DST-safe)', () => {
  const rangeStart = new Date(2026, 2, 1).getTime()
  const startMs = new Date(2026, 2, 7, 0, 0, 0, 0).getTime()
  const endMs = new Date(2026, 2, 10, 0, 0, 0, 0).getTime()
  const cells = diffCellUnits(startMs, endMs, 'month')
  const layout = layoutBar(startMs, endMs, rangeStart, 72, 'month')
  const moved = datesFromLayout(layout.left + 72, layout.width, rangeStart, 72, 'month', {
    type: 'move',
    preserveDurationCells: cells,
  })
  const movedCells = diffCellUnits(moved.start.getTime(), moved.end.getTime(), 'month')
  assert.ok(
    Math.abs(movedCells - cells) < 0.05,
    `cell duration drifted: ${movedCells} vs ${cells}`
  )
})

test('columnWindow clamps and overscans', () => {
  const win = columnWindow(500, 400, 50, 100, 8)
  assert.ok(win.startIndex >= 0)
  assert.ok(win.endIndex <= 100)
  assert.ok(win.endIndex > win.startIndex)
})

test('rowWindow virtualizes vertical lists', () => {
  const win = rowWindow(400, 200, 1000, 40, 8)
  assert.equal(win.startIndex, Math.max(0, Math.floor(400 / 40) - 8))
  assert.ok(win.endIndex > win.startIndex)
  assert.equal(win.offsetPx, win.startIndex * 40)
})

test('snapToUnit month snaps to hour boundaries', () => {
  const ms = new Date(2026, 0, 15, 10, 37, 0, 0).getTime()
  const snapped = snapToUnit(ms, 'month')
  const d = new Date(snapped)
  assert.equal(d.getMinutes(), 0)
  assert.equal(d.getSeconds(), 0)
})

test('layoutBar invalid dates yield a one-cell fallback', () => {
  const rangeStart = Date.UTC(2026, 0, 1)
  const bar = layoutBar(Number.NaN, Number.NaN, rangeStart, 72, 'month')
  assert.equal(bar.left, 0)
  assert.equal(bar.width, 72)
})
