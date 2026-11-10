// Runs the camera and the hand tracker. Video frames stay in this extension
// page: only hand-joint coordinates and gesture names ever leave it.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { AirGestureDetector, type Pt, type Sensitivity } from '@/entrypoints/shared/gesture';
import { GESTURE_ONLY } from '@/entrypoints/shared/modes';

const FRAME_MS = 33;
const HUD_MS = 66;
const HEARTBEAT_MS = 1000;

const video = document.getElementById('cam') as HTMLVideoElement;
const detector = new AirGestureDetector();
detector.forwardOnly = GESTURE_ONLY;
detector.anyHand = GESTURE_ONLY;

function send(msg: Record<string, unknown>) {
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function applyConfig(cfg: { sensitivity?: Sensitivity; invert?: boolean } | undefined) {
  if (cfg?.sensitivity) detector.sensitivity = cfg.sensitivity;
  if (typeof cfg?.invert === 'boolean') detector.invert = cfg.invert;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'air_config') applyConfig(msg);
});

async function createTracker(): Promise<HandLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(chrome.runtime.getURL('/mediapipe/wasm'));
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: chrome.runtime.getURL('/mediapipe/hand_landmarker.task'), delegate },
    runningMode: 'VIDEO' as const,
    numHands: 1,
    // Lower bars so small, far-away hands are still picked up.
    minHandDetectionConfidence: 0.3,
    minHandPresenceConfidence: 0.3,
    minTrackingConfidence: 0.3
  });
  try {
    return await HandLandmarker.createFromOptions(vision, options('GPU'));
  } catch (err) {
    console.warn('[AirScroll] GPU unavailable, using CPU:', err);
    return HandLandmarker.createFromOptions(vision, options('CPU'));
  }
}

async function main() {
  applyConfig(await chrome.runtime.sendMessage({ type: 'air_get_config' }).catch(() => undefined));

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: 'user' },
      audio: false
    });
  } catch (err: any) {
    send({ type: 'air_error', name: err?.name || 'Error', message: String(err?.message || err) });
    return;
  }
  video.srcObject = stream;
  await video.play();

  let tracker: HandLandmarker;
  try {
    tracker = await createTracker();
  } catch (err: any) {
    send({ type: 'air_error', name: 'TrackerFailed', message: String(err?.message || err) });
    return;
  }
  send({ type: 'air_started' });

  let lastVideoTime = -1;
  let lastHud = 0;
  let lastBeat = 0;
  let lastStatus = '';
  let frames = 0;
  let fpsAt = performance.now();
  let fps = 0;

  // A timer rather than requestAnimationFrame: this document is never visible.
  setInterval(() => {
    if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const now = performance.now();
    const hand = tracker.detectForVideo(video, now).landmarks[0];
    const aspect = video.videoWidth / video.videoHeight;
    const pts: Pt[] | null = hand ? hand.map(l => ({ x: l.x * aspect, y: l.y })) : null;
    const gesture = detector.update(now, pts);
    if (gesture) send({ type: 'air_gesture', gesture });

    frames++;
    if (now - fpsAt >= 1000) {
      fps = Math.round(frames * 1000 / (now - fpsAt));
      frames = 0;
      fpsAt = now;
    }
    const changed = detector.status !== lastStatus;
    if (changed || now - lastBeat >= HEARTBEAT_MS || (hand && now - lastHud >= HUD_MS)) {
      lastStatus = detector.status;
      lastBeat = now;
      lastHud = now;
      send({
        type: 'air_frame',
        status: detector.status,
        fps,
        // Mirrored so the on-screen skeleton moves the way the hand does.
        pts: hand ? hand.map(l => [Math.round((1 - l.x) * 1000) / 1000, Math.round(l.y * 1000) / 1000]) : null
      });
    }
  }, FRAME_MS);
}

main();
