// Offscreen documents cannot show a permission prompt, so the camera is granted
// here once, on a visible page of the extension.
const statusEl = document.getElementById('status')!;
const go = document.getElementById('go') as HTMLButtonElement;
const retry = document.getElementById('retry') as HTMLButtonElement;

async function ask() {
  retry.hidden = true;
  statusEl.textContent = 'Asking for your camera. Click Allow in the bar at the top.';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach(t => t.stop());
    await chrome.storage.local.set({ airEnabled: true });
    statusEl.textContent = 'Camera is ready. Air Scroll is on.';
    go.hidden = false;
  } catch (err: any) {
    const bySystem = /system/i.test(String(err?.message));
    statusEl.textContent = err?.name === 'NotFoundError'
      ? 'No camera was found on this computer.'
      : bySystem
        ? 'macOS is blocking Chrome. Turn Chrome on in System Settings, Privacy & Security, Camera, then try again.'
        : 'Camera was blocked. Click the camera icon in the address bar, choose Allow, then try again.';
    retry.hidden = false;
  }
}

go.addEventListener('click', () => { location.href = 'https://www.tiktok.com/foryou'; });
retry.addEventListener('click', ask);
ask();
