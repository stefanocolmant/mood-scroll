# Mood Scroll — TikTok Feed Curator

Pick a mood. Mood Scroll classifies every TikTok video, auto-skips anything that doesn't match, and watches + likes the ones that do — training TikTok's algorithm to surface what you actually want.

## Free for the first 100 — nothing to set up

For the first 100 users, Mood Scroll is **free with zero setup — no key, no payment.**
The AI is fully managed: frames go to our secure proxy, which holds the key
server-side and runs the classification for you. You just install and open TikTok.

After the first 100 users it becomes a **one-time $10** and you bring your own
OpenAI key (paste it in the extension's options — it stays in your browser).

## Install (60 seconds)

1. Download **`mood-scroll-extension.zip`** and unzip anywhere.
2. Open **chrome://extensions** in Chrome (or Brave / Arc / Edge).
3. Toggle **Developer mode** ON (top-right corner).
4. Click **Load unpacked** → select the unzipped **`chrome-mv3`** folder.
5. Open **tiktok.com/foryou** → yellow **✨** floating button appears bottom-right.
6. Click **✨** → pick a mood → it works. **No key to enter on the free tier.**

> **Paid / lifetime ($10):** open the extension's options page and paste your own
> OpenAI API key ([get one here](https://platform.openai.com/api-keys)). Once set,
> the extension calls OpenAI directly with your key and you're no longer limited.

## The 8 modes

Click the **✨** button to open the panel:

| Mode | What it matches |
|---|---|
| **⏩ Auto Scroll** | Hands-off — watches every video, auto-likes, advances every 5s. No filtering. |
| **🧠💀 Brain Rot** | Animated / AI-generated / edited slop. Family Guy + Subway Surfers stacked, Skibidi Toilet, AI narrators, anime+phonk edits, sigma slow-mo, split-screen game-footage videos. |
| **🍳 Cooking** | Actual recipe demos and cooking technique. Skips food reviews / restaurants. |
| **😂 Laugh** | Genuine comedy — sketches with punchlines, witty edits. Skips cringe. |
| **💎 LARP** | Visible wealth flex — Lambos, Rolexes, mansions, cash, designer hauls, Tate-style content. |
| **💪 Fitness** | Gym physique content — shirtless lifters, pump checks, deadlift/squat demos. |
| **💅 Baddies** | Attractive women aesthetic — gym girls, OOTD, glam, that-girl, slow-mo walks. |
| **✨ Custom** | Type ANY niche (e.g. `"vintage car restoration"`). Classifier matches against your text. |

## Smart features

- **Two-phase training**: liking the broader content cluster during training (e.g. Cooking → also food reviews, LARP → also aspirational lifestyle) to push TikTok toward the niche faster. Once **🎯 LOCKED IN**, narrows to strict matches.
- **Double-tap-to-like**: matches get a native double-tap gesture on the video (heart animation pops, stronger algo signal than sidebar button).
- **Loop watchdog**: videos never replay — auto-advance before the loop point.
- **🔄 Reset algo**: clears training state + opens TikTok content preferences so you can refresh the For You feed.
- **📱 Phone Mode**: one click resizes Chrome to a 440px strip on the right edge of your screen + hides ALL of TikTok's nav/buttons/captions. Open Cursor / VS Code on the left 3/4.
- **🪟 New Window**: opens TikTok in a separate narrow popup, current tabs untouched.
- **📊 Receipt**: download a PNG of your session — what categories you actually watched.

## How it works under the hood (per video)

1. **Sponsored skip** — TikTok ads + `#sponsored / #ad` always skip (free)
2. **Negative hashtag pre-skip** — known-bad tags = instant skip (free, ~5ms)
3. **Tier 1 keyword classifier** — confident non-matches skip (free, ~10ms)
4. **API + vision** — gpt-4o with 3 video frames + caption decides (~1-2s)
5. **Local match** — does category match your mode's allow-list?
6. **Match** → double-tap-like + hold for category-appropriate time → advance

Visual modes (LARP / Baddies / Brain Rot / Fitness) skip steps 2-3 and go straight to API + frames — visual evidence is the truth.

## Privacy

- Everything runs locally in your browser.
- **Free tier:** video frames + caption text go to our managed proxy, which adds the key server-side and forwards to the model. We never store your browsing.
- **Paid tier:** your own key and the frames go straight to OpenAI — never to our server.
- Your key (if any), mode preference, and session data live in `chrome.storage.local` — never uploaded.
- No tracking, no accounts, no analytics.

## If something breaks

Open Chrome DevTools on the TikTok page (`⌘+⌥+I` → Console tab). Look for `[MoodScroll]` lines:
- `[MoodScroll] classify error: free_limit_reached` → the first-100 free pool is used up; get $10 lifetime and paste your own key in options
- `[MoodScroll] BYO classify error: ... 401` → your own OpenAI key is wrong
- `[MoodScroll] MATCH: ...` / `SKIP: ...` → classifier is working
- Nothing logged → extension isn't injecting; refresh chrome://extensions ⟳ and the tab

Built with [WXT](https://wxt.dev) (TypeScript + Vite).
