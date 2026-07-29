# Mood Scroll

**Pick a mood. TikTok scrolls itself.**

Chrome extension that classifies every video on your For You feed, auto-likes matches, and skips everything else — so TikTok's algorithm learns what you actually want.

![Demo contact sheet](mood-scroll-demo-contact-sheet.jpg)

## Quick start

1. Download **`mood-scroll-extension.zip`** and unzip.
2. Open **chrome://extensions** → enable **Developer mode** → **Load unpacked** → select the **`chrome-mv3`** folder.
3. Open **tiktok.com/foryou** → tap the yellow **✨** button → pick a mood. **Free for the first 100 users — nothing to paste, no key.**
4. After the first 100, it’s a one-time **$10** and you bring your own OpenAI key ([get one](https://platform.openai.com/api-keys)) — paste it in the options page and the extension calls OpenAI directly.

Full install guide, all 8 modes, privacy notes, and troubleshooting: **[SETUP.md](./SETUP.md)**

## Modes

| Mode | What it matches |
|------|-----------------|
| ⏩ Auto Scroll | Hands-off — watches everything, auto-likes, advances every 5s |
| 🧠💀 Brain Rot | AI slop, stacked edits, sigma content |
| 🍳 Cooking | Recipe demos and technique |
| 😂 Laugh | Genuine comedy |
| 💎 LARP | Wealth flex — cars, watches, mansions |
| 💪 Fitness | Gym physique content |
| 💅 Baddies | Aesthetic / glam |
| ✨ Custom | Any niche you type in |

## How it works

1. Sponsored / ad content → skip (free)
2. Negative hashtag pre-skip (free, ~5ms)
3. Keyword classifier for confident non-matches (free, ~10ms)
4. AI vision on 3 frames + caption (~1–2s)
5. Match → double-tap like + hold → advance

Visual modes (LARP, Baddies, Brain Rot, Fitness) go straight to the model — no keyword shortcuts.

## Privacy

Runs locally in your browser. **Free tier:** frames + caption go to our managed proxy, which holds the key server-side — we never store your browsing. **Paid tier:** your own key and the frames go straight to OpenAI, never to our server. Your key (if any) and preferences stay in `chrome.storage.local`. No accounts, no analytics.

## Build from source

```bash
npm install
npm run build    # outputs .output/chrome-mv3
npm run zip      # rebuilds mood-scroll-extension.zip
```

Built with [WXT](https://wxt.dev) (TypeScript + Vite).
