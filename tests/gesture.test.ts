import test from 'node:test';
import assert from 'node:assert/strict';
import { AirGestureDetector, type Pt, type Sensitivity } from '../entrypoints/shared/gesture.ts';

type Pose = 'point' | 'open' | 'fist' | 'pinch';
const FPS = 30;
const DT = 1000 / FPS;

/** A plausible hand with palm length `s`, wrist at (cx, cy), fingers up. */
function hand(cx: number, cy: number, s: number, pose: Pose): Pt[] {
  const p = (dx: number, dy: number): Pt => ({ x: cx + dx * s, y: cy + dy * s });
  const up = (x: number) => [p(x, -1.0), p(x, -1.3), p(x, -1.6), p(x, -1.9)];
  const curled = (x: number) => [p(x, -1.0), p(x, -1.15), p(x, -0.95), p(x, -0.75)];
  const thumb = pose === 'pinch'
    ? [p(0.3, -0.25), p(0.45, -0.55), p(0.42, -1.2), p(0.38, -1.62)]
    : [p(0.3, -0.25), p(0.55, -0.45), p(0.75, -0.6), p(0.9, -0.7)];
  const index = pose === 'fist' ? curled(0.3) : pose === 'pinch' ? [p(0.3, -1), p(0.34, -1.3), p(0.36, -1.5), p(0.37, -1.64)] : up(0.3);
  const rest = (x: number) => pose === 'open' ? up(x) : curled(x);
  return [p(0, 0), ...thumb, ...index, ...rest(0), ...rest(-0.25), ...rest(-0.5)];
}

function run(frames: Array<[number, number, Pose] | null>, opts: { s?: number; sensitivity?: Sensitivity; invert?: boolean } = {}) {
  const d = new AirGestureDetector();
  if (opts.sensitivity) d.sensitivity = opts.sensitivity;
  if (opts.invert) d.invert = true;
  const out: string[] = [];
  frames.forEach((f, i) => {
    const g = d.update(1000 + i * DT, f ? hand(f[0], f[1], opts.s ?? 0.15, f[2]) : null);
    if (g) out.push(g);
  });
  return out;
}

const rest = (n: number, y = 0.7, x = 0.6, pose: Pose = 'point') => Array.from({ length: n }, () => [x, y, pose] as [number, number, Pose]);
/** Move vertically by `dy` over `n` frames. */
const stroke = (from: number, dy: number, n: number, x = 0.6, pose: Pose = 'point') =>
  Array.from({ length: n }, (_, i) => [x, from + dy * (i + 1) / n, pose] as [number, number, Pose]);

test('a single upward flick is one Next', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.2, 5), ...rest(20, 0.5)]), ['next']);
});
test('a single downward flick is one Previous', () => {
  assert.deepEqual(run([...rest(10, 0.5), ...stroke(0.5, 0.2, 5), ...rest(20)]), ['prev']);
});
test('the hand coming back after a flick does not fire Previous', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.2, 5), ...stroke(0.5, 0.2, 5), ...rest(20)]), ['next']);
});
test('flick, return, flick, return, flick gives three Next', () => {
  const cycle = [...stroke(0.7, -0.2, 5), ...rest(6, 0.5), ...stroke(0.5, 0.2, 8), ...rest(6)];
  assert.deepEqual(run([...rest(10), ...cycle, ...cycle, ...cycle]), ['next', 'next', 'next']);
});
test('Previous works once the return window has passed', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.2, 5), ...rest(100, 0.5), ...stroke(0.5, 0.2, 5), ...rest(10, 0.7)]), ['next', 'prev']);
});
test('one long fast stroke fires once, not every cooldown', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.8, -0.72, 36), ...rest(20, 0.08)]), ['next']);
});
test('a late return after holding the hand up does not fire Previous', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.2, 5), ...rest(45, 0.5), ...stroke(0.5, 0.2, 5), ...rest(10)]), ['next']);
});
test('flicking back on purpose after the hand returned works', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.2, 5), ...stroke(0.5, 0.2, 6), ...rest(30), ...stroke(0.7, 0.15, 5), ...rest(10, 0.85)]), ['next', 'prev']);
});
test('a slow drift does nothing', () => {
  assert.deepEqual(run([...rest(5), ...stroke(0.7, -0.3, 60)]), []);
});
test('tracking jitter does nothing', () => {
  const jitter = Array.from({ length: 120 }, (_, i) => [0.6 + (i % 2) * 0.004, 0.7 + (i % 3) * 0.005, 'point'] as [number, number, Pose]);
  assert.deepEqual(run(jitter), []);
});
test('a sideways swipe does nothing', () => {
  const swipe = Array.from({ length: 6 }, (_, i) => [0.6 + i * 0.05, 0.7 - i * 0.03, 'point'] as [number, number, Pose]);
  assert.deepEqual(run([...rest(10), ...swipe]), []);
});
test('a relaxed open hand swiping up scrolls', () => {
  assert.deepEqual(run([...rest(3, 0.7, 0.6, 'open'), ...stroke(0.7, -0.2, 5, 0.6, 'open'), ...rest(5, 0.5, 0.6, 'fist')]), ['next']);
});
test('a fist moving fast does not scroll', () => {
  assert.deepEqual(run([...rest(10, 0.7, 0.6, 'fist'), ...stroke(0.7, -0.2, 5, 0.6, 'fist')]), []);
});
test('a one-frame tracking jump is not a flick', () => {
  assert.deepEqual(run([...rest(10), [0.6, 0.1, 'point'], ...rest(10, 0.1)]), []);
});
test('a smaller one-frame jump is not a flick either', () => {
  assert.deepEqual(run([...rest(10), [0.6, 0.5, 'point'], ...rest(10, 0.5)]), []);
});
test('a hand far from the camera flicks the same way', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.08, 5), ...rest(20, 0.62)], { s: 0.06 }), ['next']);
});
test('a hand too small to trust is ignored', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.05, 5), ...rest(20, 0.65)], { s: 0.03 }), []);
});
test('a short tracking dropout does not lose the flick', () => {
  const s = stroke(0.7, -0.24, 6);
  assert.deepEqual(run([...rest(10), s[0], s[1], null, s[3], s[4], s[5], ...rest(20, 0.46)]), ['next']);
});
test('losing the hand clears the stroke', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.05, 3), ...Array(10).fill(null), ...rest(1, 0.3), ...rest(20, 0.3)]), []);
});
test('sensitivity changes how small a flick counts', () => {
  const small = [...rest(10), ...stroke(0.7, -0.075, 3), ...rest(20, 0.625)];
  assert.deepEqual(run(small, { sensitivity: 'low' }), []);
  assert.deepEqual(run(small, { sensitivity: 'medium' }), []);
  assert.deepEqual(run(small, { sensitivity: 'high' }), ['next']);
});
test('flip setting swaps directions', () => {
  assert.deepEqual(run([...rest(10), ...stroke(0.7, -0.2, 5), ...rest(20, 0.5)], { invert: true }), ['prev']);
});
test('holding a pinch likes exactly once', () => {
  assert.deepEqual(run(rest(30, 0.7, 0.6, 'pinch')), ['like']);
});
test('a one-frame pinch does nothing', () => {
  assert.deepEqual(run([...rest(10), [0.6, 0.7, 'pinch'], ...rest(10)]), []);
});
test('holding an open palm pauses exactly once, and works again after dropping it', () => {
  assert.deepEqual(run(rest(40, 0.7, 0.6, 'open')), ['pause']);
  assert.deepEqual(run([...rest(30, 0.7, 0.6, 'open'), ...rest(10, 0.7, 0.6, 'fist'), ...rest(30, 0.7, 0.6, 'open')]), ['pause', 'pause']);
});
test('a waving open hand does not pause', () => {
  const wave = Array.from({ length: 60 }, (_, i) => [0.6 + (i % 2) * 0.06, 0.7, 'open'] as [number, number, Pose]);
  assert.deepEqual(run(wave), []);
});
