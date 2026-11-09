// Puts the hand-tracking runtime and model into public/ so the extension ships
// them itself (MV3 extensions cannot load remote code).
import { cp, mkdir, access, writeFile } from 'node:fs/promises';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const out = new URL('../public/mediapipe/', import.meta.url);
const wasm = new URL('../node_modules/@mediapipe/tasks-vision/wasm/', import.meta.url);
const model = new URL('hand_landmarker.task', out);

await mkdir(out, { recursive: true });
await mkdir(new URL('wasm/', out), { recursive: true });
for (const file of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  await cp(new URL(file, wasm), new URL(`wasm/${file}`, out));
}
try {
  await access(model);
} catch {
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`model download failed: ${res.status}`);
  await writeFile(model, Buffer.from(await res.arrayBuffer()));
}
