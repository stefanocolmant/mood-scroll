import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  srcDir: '.',
  manifest: {
    name: 'Mood Scroll',
    description: 'Pick a mode. We scroll for you.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
    // tiktok.com — for the content script.
    // api.openai.com — PAID/BYO path only: lets the MV3 background worker call
    // OpenAI DIRECTLY with the buyer's own key. Declaring the host is required
    // to bypass CORS (api.openai.com sends no permissive CORS headers). The
    // free tier instead hits our managed proxy, which DOES send CORS headers,
    // so no host permission is needed for it. A buyer's key only ever travels
    // from their browser to OpenAI — never to our server.
    host_permissions: [
      'https://www.tiktok.com/*',
      'https://api.openai.com/*'
    ]
  }
});
