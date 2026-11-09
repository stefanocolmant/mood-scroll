// Air Scroll gesture detector. Pure logic: 21 hand landmarks in, gestures out.
// Coordinates are aspect-correct (x already multiplied by width/height), so
// distances are true shapes. All speeds and distances are in "hand units"
// (palm lengths), which makes the thresholds independent of camera distance.

export type Pt = { x: number; y: number };
export type AirGesture = 'next' | 'prev' | 'like' | 'pause';
export type Sensitivity = 'low' | 'medium' | 'high';
export type AirStatus = 'no_hand' | 'too_far' | 'hand' | 'pointing';

export const SENSITIVITY: Record<Sensitivity, { dist: number; speed: number }> = {
  low: { dist: 1.0, speed: 5.0 },
  medium: { dist: 0.55, speed: 2.6 },
  high: { dist: 0.45, speed: 2.2 }
};

const WINDOW_MS = 320;       // a flick has to happen inside this window
const GAP_MS = 130;          // tracking may drop out this long mid-motion
const COOLDOWN_MS = 420;     // minimum time between two flicks
const RETURN_MS = 1200;      // the opposite stroke right after a flick is the hand coming back
const RETURN_ANCHOR_MS = 3000; // ...and for longer if it is heading back to where the flick began
const MAX_SIDEWAYS = 0.6;    // sideways travel allowed, as a share of vertical travel
const GLITCH_SPEED = 60;     // faster than a hand can move: tracking jumped
const TINY_STEP = 0.02;      // jitter that does not break a stroke
const REST_SPEED = 1.0;      // slower than this, the hand counts as still
const MIN_HAND = 0.05;       // palm smaller than this share of frame height = too far away
const PALM_HOLD_MS = 500;
const PALM_MAX_SPEED = 1.2;
const PINCH_HOLD_MS = 180;
const PINCH_ON = 0.28;
const PINCH_OFF = 0.5;
const POSE_RELEASE_MS = 200;

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** A finger counts as extended when its tip is clearly further from the wrist than its middle joint. */
function extended(p: Pt[], tip: number, pip: number): boolean {
  return dist(p[0], p[tip]) > dist(p[0], p[pip]) * 1.08;
}

export function readPose(p: Pt[]): { pointing: boolean; open: boolean; indexOut: boolean } {
  const index = extended(p, 8, 6);
  const others = [extended(p, 12, 10), extended(p, 16, 14), extended(p, 20, 18)];
  const othersOut = others.filter(Boolean).length;
  return { pointing: index && othersOut <= 1, open: index && othersOut === 3, indexOut: index };
}

type Sample = { t: number; x: number; y: number; pointing: boolean };

export class AirGestureDetector {
  status: AirStatus = 'no_hand';
  sensitivity: Sensitivity = 'medium';
  invert = false;

  private samples: Sample[] = [];
  private scale = 0;
  private lastSeen = -Infinity;
  private cooldownUntil = -Infinity;
  private last: { dir: number; t: number; anchorY: number } | null = null;
  private restY: number | null = null;
  private prevTip: { t: number; x: number; y: number } | null = null;
  private strokeSpent = false; // the current stroke already fired
  private palmSince: number | null = null;
  private palmLatched = false;
  private palmOffSince: number | null = null;
  private pinchSince: number | null = null;
  private pinchLatched = false;

  /** Feed one camera frame. `p` is null when no hand is visible. */
  update(t: number, p: Pt[] | null): AirGesture | null {
    if (!p) {
      if (t - this.lastSeen > GAP_MS) this.clearHand();
      return null;
    }
    if (t - this.lastSeen > GAP_MS) this.clearHand();
    this.lastSeen = t;

    const raw = Math.max(dist(p[0], p[9]), 1.3 * dist(p[5], p[17]));
    this.scale = this.scale ? this.scale * 0.7 + raw * 0.3 : raw;
    if (this.scale < MIN_HAND) {
      this.status = 'too_far';
      this.samples = [];
      return null;
    }

    const pose = readPose(p);
    this.status = pose.pointing ? 'pointing' : 'hand';
    const tip = p[8];
    const prev = this.prevTip;
    this.prevTip = { t, x: tip.x, y: tip.y };
    const stepSpeed = prev ? dist(prev, tip) / this.scale / Math.max(1, t - prev.t) * 1000 : 0;
    if (stepSpeed > GLITCH_SPEED) {
      this.samples = [];
      return null;
    }
    if (stepSpeed < REST_SPEED) {
      this.restY = tip.y;
      this.strokeSpent = false;
    } else if (this.last && prev && (tip.y - prev.y) * this.last.dir > TINY_STEP * this.scale) {
      this.strokeSpent = false; // moving against the last flick: that stroke is over
    }
    this.samples.push({ t, x: tip.x, y: tip.y, pointing: pose.indexOut });
    while (this.samples.length && t - this.samples[0].t > WINDOW_MS) this.samples.shift();

    return this.checkPinch(t, p) || this.checkPalm(t, pose.open, stepSpeed) || this.checkFlick(t);
  }

  private clearHand() {
    this.samples = [];
    this.scale = 0;
    this.status = 'no_hand';
    this.restY = null;
    this.prevTip = null;
    this.strokeSpent = false;
    this.palmSince = null;
    this.palmLatched = false;
    this.palmOffSince = null;
    this.pinchSince = null;
    this.pinchLatched = false;
  }

  private checkPinch(t: number, p: Pt[]): AirGesture | null {
    const gap = dist(p[4], p[8]) / this.scale;
    if (this.pinchLatched) {
      if (gap > PINCH_OFF) this.pinchLatched = false;
      return null;
    }
    if (gap >= PINCH_ON) {
      this.pinchSince = null;
      return null;
    }
    this.pinchSince ??= t;
    if (t - this.pinchSince < PINCH_HOLD_MS) return null;
    this.pinchSince = null;
    this.pinchLatched = true;
    return 'like';
  }

  private checkPalm(t: number, open: boolean, speed: number): AirGesture | null {
    if (this.palmLatched) {
      if (open) {
        this.palmOffSince = null;
        return null;
      }
      this.palmOffSince ??= t;
      if (t - this.palmOffSince >= POSE_RELEASE_MS) {
        this.palmLatched = false;
        this.palmOffSince = null;
      }
      return null;
    }
    if (!open || speed > PALM_MAX_SPEED) {
      this.palmSince = null;
      return null;
    }
    this.palmSince ??= t;
    if (t - this.palmSince < PALM_HOLD_MS) return null;
    this.palmSince = null;
    this.palmLatched = true;
    return 'pause';
  }

  private checkFlick(t: number): AirGesture | null {
    const s = this.samples;
    if (s.length < 3 || t < this.cooldownUntil || this.strokeSpent) return null;

    // Walk back from the newest frame to where the current one-way stroke began.
    const n = s.length - 1;
    const stepDy = s[n].y - s[n - 1].y;
    if (Math.abs(stepDy) / this.scale <= TINY_STEP) return null; // only fire while actually moving
    const dirY = Math.sign(stepDy);
    let start = n - 1;
    let peak = 0;
    while (start > 0) {
      const dy = s[start].y - s[start - 1].y;
      if (Math.sign(dy) !== dirY && Math.abs(dy) / this.scale > TINY_STEP) break;
      start--;
    }
    let movingSteps = 0;
    for (let i = start + 1; i <= n; i++) {
      const step = Math.abs(s[i].y - s[i - 1].y) / this.scale;
      if (step > TINY_STEP) movingSteps++;
      peak = Math.max(peak, step / Math.max(1, s[i].t - s[i - 1].t) * 1000);
    }
    if (movingSteps < 2) return null; // a single jump is the tracker, not a finger

    const { dist: needDist, speed: needSpeed } = SENSITIVITY[this.sensitivity];
    const dy = (s[n].y - s[start].y) / this.scale;
    const dx = (s[n].x - s[start].x) / this.scale;
    if (Math.abs(dy) < needDist || peak < needSpeed) return null;
    if (Math.abs(dx) > Math.abs(dy) * MAX_SIDEWAYS) return null;

    let posed = 0;
    for (let i = start; i <= n; i++) if (s[i].pointing) posed++;
    if (posed * 2 < n - start + 1) return null;

    // Screen y grows downward, so a finger moving up has dirY = -1.
    const dir = -dirY;
    if (this.last && dir === -this.last.dir) {
      const age = t - this.last.t;
      const towardAnchor = Math.abs(s[n].y - this.last.anchorY) < Math.abs(s[start].y - this.last.anchorY);
      if (age < RETURN_MS || (age < RETURN_ANCHOR_MS && towardAnchor)) {
        this.samples = [];
        return null;
      }
    }

    this.last = { dir, t, anchorY: this.restY ?? s[start].y };
    this.cooldownUntil = t + COOLDOWN_MS;
    this.strokeSpent = true;
    this.samples = [];
    return (dir > 0) !== this.invert ? 'next' : 'prev';
  }
}
