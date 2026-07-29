const ENV = import.meta.env as unknown as Record<string, string | undefined>;
// Free tier by default: the extension talks to our managed proxy (which holds
// the OpenAI key server-side). Paid users paste their own key and the
// background routes them directly to OpenAI instead.
const DEFAULT_PROXY_URL = ENV.WXT_PROXY_URL || 'https://mood-scroll.vercel.app/api/openai';
const DEFAULT_MODEL = 'gpt-4o';

async function init() {
  const stored = await chrome.storage.local.get(['apiKey', 'proxyUrl', 'model']);
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const proxyInput = document.getElementById('proxyUrl') as HTMLInputElement;
  const modelSelect = document.getElementById('model') as HTMLSelectElement;
  const status = document.getElementById('status')!;
  const saveBtn = document.getElementById('save') as HTMLButtonElement;

  apiKeyInput.value = stored.apiKey || '';
  proxyInput.value = stored.proxyUrl || DEFAULT_PROXY_URL;
  modelSelect.value = stored.model || DEFAULT_MODEL;

  const save = async () => {
    const key = apiKeyInput.value.trim();
    await chrome.storage.local.set({
      apiKey: key,
      proxyUrl: proxyInput.value.trim() || DEFAULT_PROXY_URL,
      model: modelSelect.value || DEFAULT_MODEL
    });
    status.textContent = key ? '✓ Saved — using your own key' : '✓ Saved';
    status.classList.add('show');
    setTimeout(() => status.classList.remove('show'), 2400);
  };

  saveBtn.addEventListener('click', save);
  // Enter in the key field saves too — fastest possible path.
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
  });
}
init();
