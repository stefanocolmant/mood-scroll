import { MODES, type ModeId } from '@/entrypoints/shared/modes';
import { tier1Classify } from '@/entrypoints/shared/tier1';

export default defineContentScript({
  matches: ['https://www.tiktok.com/*'],
  main() {
    const CONFIG = {
      // Verified May 2026 against live tiktok.com/foryou DOM:
      videoSelector: 'video',
      itemSelector: '[data-e2e="recommend-list-item-container"]',
      captionSelector: '[data-e2e="video-desc"]',
      audioSelector: '[data-e2e="video-music"]',
      creatorSelector: 'a[href^="/@"]',
      likeIconSelector: '[data-e2e="like-icon"]',
      likeAriaSelector: 'button[aria-label*="Like" i]',
      scrollContainerId: 'column-list-container',
      minVideoHeight: 200,
      decisionIntervalMs: 1500,
      tickIntervalMs: 500,
      likeDelayMinMs: 4000,
      likeDelayJitterMs: 3000,
      likeProbability: 0.55,
      likeRateLimitWindowMs: 60 * 60 * 1000,
      likeRateLimitMax: 20
    };

    // ---------- STATE ----------
    type Phase = 'training' | 'stable';
    let currentMode: ModeId | null = null;
    let customDescription = '';
    let autoEngage = true;
    let sidekickActive = false;
    let lastDecision: { matched: boolean; category: string; at: number } | null = null;
    let isClassifying = false;
    let lastDecisionAt = 0;
    let lastClassifiedVideoSrc: string | null = null;
    const likedVideoSrcs = new Set<string>();
    const likeTimestamps: number[] = [];
    // Adaptive algo: track recent matches to switch between Training (aggressive engagement)
    // and Stable (relaxed) phases as the TikTok algorithm converges on the user's niche.
    let phase: Phase = 'training';
    const recentMatches: boolean[] = [];
    const MATCH_WINDOW = 10;
    const STABLE_ENTER_THRESHOLD = 0.6;  // 60% matches → tuned
    const STABLE_EXIT_THRESHOLD = 0.4;   // drops below 40% → re-train
    // useFrames=true in BOTH phases. The 1-frame Training shortcut caused
    // "skip other" floods — many TikToks open with a 300-800ms black/title
    // card before the real subject appears, so a single frame at t=0 missed
    // the actual content. 3 frames over ~1.4s catches it reliably.
    const TRAINING_CONFIG = { decisionIntervalMs: 300, likeProbability: 1.0, useFrames: true };
    const STABLE_CONFIG = { decisionIntervalMs: 2500, likeProbability: 0.3, useFrames: true };
    const tuning = () => phase === 'training' ? TRAINING_CONFIG : STABLE_CONFIG;

    // Watch durations (ms) per category. Movie-scene-like content (drama, edu)
    // holds longer; brain rot scrolls fast.
    const WATCH_DURATIONS: Record<string, number> = {
      brain_rot: 2500,
      food_porn: 4000,
      baddies: 5000,
      comedy: 5500,
      fitness: 7000,
      larp: 7500,
      motivational: 8000,
      wholesome: 7500,
      wind_down: 9000,
      cooking: 10000,
      news_politics: 11000,
      educational: 13000,
      startup: 13000,
      drama_storytime: 15000,
      other: 6000
    };
    function watchDurationFor(category?: string | null): number {
      return WATCH_DURATIONS[category || 'other'] || 6000;
    }
    // Cap the category-appropriate hold to (video duration * 0.92) so we ALWAYS
    // advance BEFORE the natural loop point. TikTok videos have loop=true so
    // .ended never fires — they just restart. We need to beat the loop.
    function holdForVideo(category: string | null | undefined, video: HTMLVideoElement | null): number {
      const base = watchDurationFor(category);
      const dur = (video?.duration && isFinite(video.duration) && video.duration > 0)
        ? Math.floor(video.duration * 1000)
        : 0;
      if (dur > 0) {
        // Always cap to 92% of duration, regardless of base. Never let a video loop.
        const cap = Math.max(2500, Math.floor(dur * 0.92));
        return Math.min(base, cap);
      }
      return base;
    }
    let autoAdvanceAt = 0; // when to advance the current matched video

    // Loop watchdog: polls the currently matched video's currentTime. If the
    // video restarted (currentTime dropped), advance immediately so it never
    // plays again. Runs every 250ms when there's an active match hold.
    let watchedVideoLastTime = 0;
    setInterval(() => {
      if (autoAdvanceAt === 0 || !currentMode || currentMode === 'auto_scroll') return;
      const video = findPlayingVideo();
      if (!video || !video.currentSrc) return;
      // If currentTime dropped by > 0.5s from last reading, it looped.
      if (watchedVideoLastTime > 0 && video.currentTime + 0.5 < watchedVideoLastTime) {
        console.log('[MoodScroll] video looped, advancing immediately');
        autoAdvanceAt = 0;
        watchedVideoLastTime = 0;
        skipToNext(video.currentSrc);
        return;
      }
      // Also: if currentTime > duration - 0.5s (about to end), advance now.
      if (video.duration && video.currentTime > video.duration - 0.5) {
        console.log('[MoodScroll] video about to loop, advancing now');
        autoAdvanceAt = 0;
        watchedVideoLastTime = 0;
        skipToNext(video.currentSrc);
        return;
      }
      watchedVideoLastTime = video.currentTime;
    }, 250);

    // ────────────────────────────────────────────────────────────────────
    // PER-MODE TUNING TABLE — Negative hashtag pre-skip
    // ────────────────────────────────────────────────────────────────────
    // If a caption contains ANY of these hashtags, the video is INSTANTLY
    // skipped without any API call (~5ms). Catches the obvious 50-70% of
    // mismatches for free. To add a new mode, just add a key here.
    //
    // Each list = hashtags that are DEFINITELY not what the user wants
    // when that mode is selected. Be comprehensive but not so broad that
    // you skip legitimate edge cases.

    // Modes that REQUIRE the API + visual frame for every classification.
    // We skip text-only pre-filters for these because the visual evidence is
    // essential (e.g. LARP needs to SEE the Lambo / Rolex / cat-with-cash;
    // Brain Rot needs to SEE if the content is animated/AI-generated).
    const ALWAYS_VISION_MODES = new Set<string>(['larp', 'baddies', 'fitness', 'brain_rot']);

    const NEGATIVE_HASHTAGS: Record<string, string[]> = {
      startup: [
        'dance', 'dancing', 'makeup', 'beauty', 'fashion', 'outfit', 'nails', 'hair',
        'asmr', 'slime', 'satisfying', 'cat', 'cats', 'dog', 'dogs', 'pets', 'animals',
        'food', 'foodporn', 'cooking', 'recipe', 'foodtok', 'restaurant',
        'workout', 'gym', 'gymtok', 'fitness', 'bodybuilding',
        'pov', 'skit', 'comedy', 'funny', 'meme', 'humor', 'jokes',
        'prank', 'storytime', 'gossip', 'drama', 'tea', 'relationship',
        'sports', 'football', 'basketball', 'soccer', 'nba', 'nfl',
        'music', 'song', 'singing', 'dance challenge',
        'lifehack', 'travel', 'wedding', 'gaming', 'minecraft', 'fortnite'
      ],
      learn: [
        'dance', 'makeup', 'beauty', 'fashion', 'outfit', 'nails',
        'comedy', 'funny', 'meme', 'humor', 'jokes', 'pov', 'skit',
        'asmr', 'slime', 'satisfying', 'prank',
        'storytime', 'gossip', 'drama', 'tea', 'relationship',
        'gaming', 'sports', 'wedding', 'travel'
      ],
      cooking: [
        // Trimmed: removed 'tutorial' (cooking videos use #cookingtutorial),
        // 'pov' (POV cooking exists: "POV: making dinner"), 'wedding' (wedding
        // cakes are cooking), 'travel' (travel cooking shows), 'singing'
        // (singing chefs), 'comedy'/'funny' (comedic cooking videos exist).
        'dance', 'dancing', 'makeup', 'beauty', 'fashion', 'outfit', 'nails', 'hair',
        'workout', 'gym', 'fitness', 'bodybuilding', 'cardio',
        'startup', 'business', 'finance', 'crypto', 'stocks',
        'asmr', 'slime', 'sleep',
        'gaming', 'minecraft', 'fortnite', 'sports', 'football', 'basketball'
      ],
      laugh: [
        'recipe', 'cooking', 'foodtok',
        'workout', 'gym', 'fitness', 'cardio',
        'tutorial', 'study', 'studytok', 'history', 'science', 'edu',
        'startup', 'business', 'finance', 'investing', 'crypto',
        'news', 'politics', 'asmr', 'sleep', 'wholesome'
      ],
      hype: [
        'asmr', 'slime', 'sleep', 'wholesome',
        'cooking', 'recipe', 'foodtok',
        'startup', 'tutorial', 'study',
        'sad', 'cry', 'breakup', 'gossip', 'drama', 'storytime',
        'news', 'politics', 'gaming'
      ],
      wind_down: [
        'workout', 'gym', 'fitness', 'cardio', 'hiit',
        'hustle', 'grind', 'startup', 'business', 'finance',
        'comedy', 'meme', 'prank', 'funny',
        'news', 'politics', 'sports', 'gaming', 'fortnite', 'minecraft',
        'dance challenge', 'shock', 'fight'
      ],
      brain_rot: [
        'startup', 'business', 'finance', 'tutorial', 'study',
        'history', 'science', 'edu', 'learnontiktok',
        'news', 'politics', 'documentary'
      ],
      food_porn: [
        'dance', 'workout', 'gym', 'startup', 'finance',
        'tutorial', 'study', 'history', 'science',
        'sports', 'gaming', 'news', 'politics', 'comedy', 'skit', 'pov'
      ],
      larp: [
        'cooking', 'recipe', 'foodtok',
        'dance', 'dancing', 'makeup', 'beauty', 'nails', 'hair',
        'comedy', 'meme', 'skit', 'prank',
        'tutorial', 'study', 'history', 'science', 'edu',
        'gaming', 'minecraft', 'fortnite',
        'asmr', 'slime', 'sleep', 'wholesome',
        'news', 'politics'
      ],
      fitness: [
        'cooking', 'recipe', 'foodtok',
        'startup', 'business', 'finance', 'crypto',
        'tutorial', 'study', 'history', 'science', 'edu',
        'gaming', 'minecraft', 'fortnite',
        'asmr', 'slime', 'sleep', 'wholesome',
        'news', 'politics', 'comedy', 'meme', 'skit', 'prank',
        'dance challenge'
      ],
      baddies: [
        'cooking', 'recipe', 'foodtok',
        'startup', 'business', 'finance', 'crypto',
        'tutorial', 'study', 'history', 'science', 'edu',
        'gaming', 'minecraft', 'fortnite',
        'asmr', 'slime', 'sleep',
        'news', 'politics',
        'wholesome', 'family'
      ],
      // custom / auto_scroll — no pre-skip; rely on API
    };

    // ---------- INIT ----------
    chrome.storage.local.get(['currentMode', 'customDescription', 'autoEngage', 'sidekickActive']).then(r => {
      currentMode = r.currentMode || null;
      customDescription = r.customDescription || '';
      autoEngage = r.autoEngage !== false; // default true
      sidekickActive = !!r.sidekickActive;
      if (sidekickActive) applySidekickCSS();
      updateOverlayState();
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'set_mode') {
        currentMode = msg.mode;
        lastClassifiedVideoSrc = null;
        resetPhase();
        updateOverlayState();
      }
      if (msg.type === 'stop') {
        currentMode = null;
        lastClassifiedVideoSrc = null;
        resetPhase();
        updateOverlayState();
      }
    });

    // ---------- SIDEKICK CSS ----------
    function applySidekickCSS() {
      if (document.getElementById('moodscroll-sidekick-css')) return;
      const style = document.createElement('style');
      style.id = 'moodscroll-sidekick-css';
      // PHONE-ONLY mode: hide every piece of TikTok's chrome — nav, header,
      // engagement sidebar, captions, music label. Leave only the bare video.
      style.textContent = `
        /* HARD HIDES: all nav + header chrome */
        [data-e2e="nav-foryou"], [data-e2e="nav-following"], [data-e2e="nav-explore"],
        [data-e2e="nav-live"], [data-e2e="nav-shop"], [data-e2e="nav-profile"],
        [data-e2e="nav-upload"], [data-e2e="nav-more-menu"], [data-e2e="nav-search"],
        [data-e2e="search-box"], [data-e2e="search-box-button"],
        [data-e2e="top-login-button"], [data-e2e="top-right-action-bar-get-coin"],
        [data-e2e="tiktok-logo"],
        /* Right-side engagement column (like/comment/share/follow/save) */
        [data-e2e="like-icon"], [data-e2e="like-count"],
        [data-e2e="comment-icon"], [data-e2e="comment-count"],
        [data-e2e="share-icon"], [data-e2e="share-count"],
        [data-e2e="favorite-icon"], [data-e2e="favorite-count"],
        [data-e2e="feed-follow"], [data-e2e="video-author-avatar"],
        [data-e2e="more-menu-icon"], [data-e2e="see-more-icon"],
        /* Caption / music / desc overlays */
        [data-e2e="video-desc"], [data-e2e="video-music"], [data-e2e="capcut-tag"],
        [data-e2e^="desc-span"], [data-e2e="copyright"],
        /* Sidebars + the whole left column */
        [class*="DivSideNavContainer"], [class*="DivHeaderContainer"],
        [class*="DivLeftContainer"], [class*="DivSidebarContainer"],
        [class*="DivTabMenuContainer"], aside, header {
          display: none !important; width: 0 !important; height: 0 !important;
        }
        /* Compress horizontal margins so video fills the window */
        #column-list-container, [class*="DivColumnL"] {
          margin: 0 auto !important; padding: 0 !important;
        }
        body, html {
          background: #000 !important;
        }
        /* Strip TikTok's gradient overlays that darken the bottom of the video */
        [class*="DivBottomShadow"], [class*="DivVideoInfoContainer"],
        [class*="DivVideoCardContainer"] > div[class*="DivBottom"] {
          display: none !important;
        }
        /* Mood Scroll's own collapsed button stays visible (z-index 2^31) */
      `;
      document.head.appendChild(style);
    }
    function removeSidekickCSS() {
      document.getElementById('moodscroll-sidekick-css')?.remove();
    }

    // ---------- OVERLAY UI (Shadow DOM) ----------
    let overlayRoot: HTMLDivElement | null = null;
    let shadow: ShadowRoot | null = null;

    function ensureOverlay() {
      if (overlayRoot && document.documentElement.contains(overlayRoot)) return;
      // Remove any stale overlay from a previous content-script load. When
      // the extension is reloaded, the old overlay can persist in DOM with
      // stale event handlers (e.g. missing the Reset button binding).
      document.querySelectorAll('#moodscroll-overlay-root').forEach(el => el.remove());
      overlayRoot = document.createElement('div');
      overlayRoot.id = 'moodscroll-overlay-root';
      // Host is non-interactive; only the toggle button + panel inside the shadow root receive clicks.
      overlayRoot.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;';
      shadow = overlayRoot.attachShadow({ mode: 'open' });
      shadow.innerHTML = overlayHTML();
      // Attach to documentElement (not body) so we escape app-level stacking contexts.
      document.documentElement.appendChild(overlayRoot);
      wireOverlay();
      updateOverlayState();
      updateOverlayStats();
    }

    function overlayHTML(): string {
      const modeButtons = MODES.map(m =>
        `<button class="ms-mode" data-mode="${m.id}"><span class="ms-emoji">${m.emoji}</span><span class="ms-label">${m.label}</span></button>`
      ).join('');
      return `
<style>
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
    --bg-base: rgba(22, 22, 24, 0.78);
    --bg-elevated: rgba(255, 255, 255, 0.05);
    --bg-elevated-hover: rgba(255, 255, 255, 0.09);
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-strong: rgba(255, 255, 255, 0.16);
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.58);
    --text-tertiary: rgba(255, 255, 255, 0.36);
    --accent: #ffd75a;
    --accent-rich: linear-gradient(180deg, #ffe07a 0%, #ffc83d 100%);
    --success: #34d399;
    --success-rich: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
    --danger: #f87171;
    --danger-rich: linear-gradient(180deg, #fb7185 0%, #e11d48 100%);
    --purple: #a78bfa;
    --purple-rich: linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%);
    --spring: cubic-bezier(0.32, 1.45, 0.6, 1);
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
  }
  * { box-sizing: border-box; font-family: inherit; -webkit-font-smoothing: antialiased; }

  /* ---------- FLOATING TOGGLE ---------- */
  .ms-toggle {
    position: fixed; bottom: 80px; right: 20px; width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(180deg, rgba(50,50,55,0.85), rgba(22,22,24,0.85));
    color: var(--text-primary);
    border: 0.5px solid rgba(255,255,255,0.18);
    cursor: pointer; font-size: 22px; line-height: 1;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.12),
      inset 0 -1px 0 rgba(0,0,0,0.3),
      0 8px 24px rgba(0,0,0,0.5),
      0 1px 2px rgba(0,0,0,0.3);
    transition: transform 0.25s var(--spring), box-shadow 0.25s var(--ease), background 0.25s var(--ease);
    display: flex; align-items: center; justify-content: center;
    pointer-events: auto;
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
  }
  .ms-toggle:hover { transform: translateY(-2px) scale(1.05); box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.6); }
  .ms-toggle:active { transform: scale(0.95); }
  .ms-toggle.active {
    background: var(--accent-rich);
    color: #1a1500; border-color: rgba(255, 217, 90, 0.5);
    box-shadow:
      0 0 0 4px rgba(255, 217, 90, 0.12),
      0 8px 32px rgba(255, 217, 90, 0.35),
      inset 0 1px 0 rgba(255,255,255,0.4);
  }
  .ms-toggle .ms-pulse {
    position: absolute; inset: -8px; border-radius: 50%;
    border: 1.5px solid var(--accent); opacity: 0; pointer-events: none;
    animation: msPulse 2.4s var(--ease) infinite;
  }
  .ms-toggle.active .ms-pulse { opacity: 1; }
  @keyframes msPulse {
    0% { transform: scale(0.85); opacity: 0.9; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  /* ---------- DECISION FLASH ---------- */
  .ms-flash {
    position: fixed; bottom: 148px; right: 20px;
    padding: 9px 16px; border-radius: 100px;
    font-size: 11.5px; font-weight: 600; letter-spacing: -0.01em;
    pointer-events: none; opacity: 0;
    transform: translateY(8px);
    transition: all 0.4s var(--spring);
    backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    border: 0.5px solid rgba(255,255,255,0.15);
  }
  .ms-flash.show { opacity: 1; transform: translateY(0); }
  .ms-flash.match { background: var(--success-rich); color: #042818; }
  .ms-flash.skip { background: var(--danger-rich); color: #ffffff; }

  /* ---------- LOCKED-IN CELEBRATION BANNER ---------- */
  .ms-locked-banner {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.85);
    background: linear-gradient(180deg, rgba(20, 50, 32, 0.95), rgba(15, 35, 22, 0.95));
    color: #4ade80;
    border: 1px solid rgba(74, 222, 128, 0.4);
    border-radius: 20px; padding: 28px 40px;
    box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.12), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    pointer-events: none; opacity: 0;
    z-index: 2147483647;
    transition: opacity 0.5s var(--ease), transform 0.6s var(--spring);
    text-align: center; min-width: 320px;
  }
  .ms-locked-banner.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  .ms-locked-icon { font-size: 56px; line-height: 1; margin-bottom: 10px; }
  .ms-locked-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
    background: linear-gradient(180deg, #fff, #4ade80); -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; margin-bottom: 6px; }
  .ms-locked-sub { font-size: 13px; color: rgba(255,255,255,0.65); letter-spacing: -0.005em; }
  .ms-locked-cta {
    pointer-events: auto; cursor: pointer;
    display: block; margin-left: auto; margin-right: auto;
    margin-top: 16px; padding: 10px 18px;
    border: none; border-radius: 10px;
    background: linear-gradient(180deg, #ffe07a 0%, #ffc83d 100%);
    color: #1a1500; font-weight: 700; font-size: 13px; letter-spacing: -0.01em;
    font-family: inherit;
    box-shadow: 0 2px 10px rgba(255,217,90,0.3);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .ms-locked-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(255,217,90,0.45); }
  .ms-locked-cta-ghost {
    margin-top: 8px; padding: 8px 16px;
    background: transparent; color: rgba(255,255,255,0.78);
    border: 1px solid rgba(255,255,255,0.22); box-shadow: none; font-weight: 600;
  }
  .ms-locked-cta-ghost:hover { transform: translateY(-1px); box-shadow: none;
    background: rgba(255,255,255,0.06); color: #fff; }

  /* ---------- PANEL ---------- */
  .ms-panel {
    position: fixed; bottom: 148px; right: 20px; width: 304px;
    background: var(--bg-base);
    color: var(--text-primary);
    border: 0.5px solid var(--border-subtle);
    border-radius: 18px; padding: 16px 14px 14px;
    box-shadow:
      0 0 0 0.5px rgba(0,0,0,0.5),
      0 40px 100px -10px rgba(0,0,0,0.75),
      inset 0 0.5px 0 rgba(255,255,255,0.07);
    backdrop-filter: blur(48px) saturate(200%);
    -webkit-backdrop-filter: blur(48px) saturate(200%);
    display: none; pointer-events: auto;
    transform-origin: bottom right;
    opacity: 0; transform: translateY(8px) scale(0.96);
    transition: opacity 0.28s var(--ease), transform 0.32s var(--spring);
  }
  .ms-panel.open { display: block; opacity: 1; transform: translateY(0) scale(1); }

  .ms-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 2px;
  }
  .ms-title {
    font-size: 15px; font-weight: 600; letter-spacing: -0.02em;
    color: var(--text-primary);
  }
  .ms-close {
    background: rgba(255,255,255,0.06);
    color: var(--text-tertiary); border: none; cursor: pointer;
    font-size: 13px; line-height: 1; padding: 0;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s var(--ease);
  }
  .ms-close:hover { background: rgba(255,255,255,0.14); color: var(--text-primary); }
  .ms-subtitle {
    font-size: 11px; color: var(--text-tertiary);
    margin-bottom: 12px; letter-spacing: -0.005em;
  }

  /* ---------- MODE GRID ---------- */
  .ms-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;
  }
  .ms-mode {
    background: rgba(255,255,255,0.04);
    color: var(--text-secondary);
    border: 0.5px solid var(--border-subtle);
    border-radius: 9px; padding: 9px 9px;
    cursor: pointer;
    display: flex; align-items: center; gap: 7px;
    font-size: 11.5px; font-weight: 500; letter-spacing: -0.005em;
    transition: background 0.18s var(--ease), color 0.18s var(--ease), border-color 0.18s var(--ease), transform 0.16s var(--spring);
  }
  .ms-mode:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
  .ms-mode:active { transform: scale(0.97); }
  .ms-mode.active {
    background: linear-gradient(180deg, #ffe07a 0%, #ffc83d 100%);
    color: #1a1500;
    border-color: transparent;
    box-shadow: 0 2px 10px rgba(255, 217, 90, 0.28), inset 0 1px 0 rgba(255,255,255,0.4);
    font-weight: 600;
  }
  .ms-emoji { font-size: 15px; line-height: 1; flex-shrink: 0; }
  .ms-label { font-size: 11.5px; }

  /* ---------- CUSTOM INPUT ---------- */
  .ms-custom-wrap { margin-bottom: 12px; display: none; }
  .ms-custom-wrap.show { display: block; animation: msSlideDown 0.32s var(--spring); }
  @keyframes msSlideDown { from { opacity: 0; transform: translateY(-6px); max-height: 0; } to { opacity: 1; transform: translateY(0); max-height: 80px; } }
  .ms-custom-input {
    width: 100%; padding: 11px 13px;
    background: rgba(255,255,255,0.05); color: var(--text-primary);
    border: 0.5px solid var(--border-subtle);
    border-radius: 10px; font-size: 13px;
    font-family: inherit; letter-spacing: -0.01em;
    box-sizing: border-box;
    transition: all 0.2s var(--ease);
  }
  .ms-custom-input::placeholder { color: var(--text-tertiary); }
  .ms-custom-input:focus {
    outline: none; border-color: var(--accent);
    background: rgba(255,255,255,0.08);
    box-shadow: 0 0 0 3px rgba(255, 217, 90, 0.1);
  }
  .ms-custom-hint {
    font-size: 10.5px; color: var(--text-tertiary);
    margin-top: 6px; padding-left: 2px; letter-spacing: -0.005em;
  }

  /* ---------- ACTIVE LINE ---------- */
  .ms-active-line {
    font-size: 11px; padding: 8px 11px;
    background: rgba(52,211,153,0.07); color: var(--success);
    border: 0.5px solid rgba(52,211,153,0.18);
    border-radius: 9px; margin-bottom: 10px;
    letter-spacing: -0.005em; display: none;
  }
  .ms-active-line.show { display: block; }
  .ms-active-line b { color: white; font-weight: 600; }

  /* ---------- PHASE INDICATOR ---------- */
  .ms-phase {
    background: rgba(255,255,255,0.04);
    border: 0.5px solid var(--border-subtle);
    border-radius: 12px; padding: 10px 12px; margin-bottom: 12px;
    display: none;
  }
  .ms-phase.show { display: block; }
  .ms-phase-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11.5px; margin-bottom: 7px; letter-spacing: -0.01em;
  }
  .ms-phase-label {
    color: var(--text-primary); font-weight: 500;
    display: flex; align-items: center; gap: 6px;
  }
  .ms-phase-label::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent); box-shadow: 0 0 8px var(--accent);
    animation: msBlink 1.4s ease-in-out infinite;
  }
  .ms-phase.stable .ms-phase-label::before {
    background: var(--success); box-shadow: 0 0 8px var(--success); animation: none;
  }
  @keyframes msBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .ms-phase-stat { color: var(--text-tertiary); font-variant-numeric: tabular-nums; font-size: 11px; }
  .ms-phase-bar {
    height: 4px; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden;
  }
  .ms-phase-fill {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, var(--accent), var(--success));
    border-radius: 100px;
    transition: width 0.6s var(--ease);
  }
  .ms-phase.stable .ms-phase-fill { background: var(--success); }

  /* ---------- STATS — minimal inline strip ---------- */
  .ms-stats {
    display: flex; justify-content: space-between;
    padding: 7px 4px;
    margin-bottom: 10px;
    font-size: 10.5px; color: var(--text-tertiary);
    letter-spacing: 0;
    border-top: 0.5px solid var(--border-subtle);
    border-bottom: 0.5px solid var(--border-subtle);
  }
  .ms-stat-cell {
    display: flex; align-items: baseline; gap: 4px;
  }
  .ms-stat-cell b {
    color: var(--text-primary); font-weight: 600; font-size: 12px;
    font-variant-numeric: tabular-nums; letter-spacing: -0.015em;
  }
  .ms-stat-cell span { font-size: 10.5px; color: var(--text-tertiary); }

  /* ---------- ENGAGE TOGGLE ROW ---------- */
  .ms-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11px; padding: 3px 2px; margin-bottom: 10px;
    color: var(--text-secondary); letter-spacing: -0.005em;
  }
  .ms-switch { position: relative; display: inline-block; width: 30px; height: 18px; }
  .ms-switch input { opacity: 0; width: 0; height: 0; }
  .ms-slider {
    position: absolute; cursor: pointer; inset: 0;
    background: rgba(255,255,255,0.12);
    border-radius: 18px; transition: background 0.22s var(--ease);
  }
  .ms-slider::before {
    position: absolute; content: ""; height: 14px; width: 14px;
    left: 2px; top: 2px; background: white;
    border-radius: 50%; transition: transform 0.26s var(--spring);
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  }
  input:checked + .ms-slider { background: var(--success); }
  input:checked + .ms-slider::before { transform: translateX(12px); }

  /* ---------- LAYOUT BUTTONS ---------- */
  .ms-sidekick-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 5px; margin-bottom: 6px; }
  .ms-sidekick-btn {
    padding: 9px 6px;
    background: rgba(255,255,255,0.04); color: var(--text-secondary);
    border: 0.5px solid var(--border-subtle); border-radius: 8px;
    cursor: pointer; font-family: inherit;
    font-size: 11px; font-weight: 500; letter-spacing: -0.005em;
    transition: background 0.18s var(--ease), color 0.18s var(--ease), border-color 0.18s var(--ease);
  }
  /* The primary Phone Mode button — slightly bigger, accent-colored */
  .ms-phone-btn {
    background: rgba(255, 217, 90, 0.08) !important;
    color: var(--accent) !important;
    border-color: rgba(255, 217, 90, 0.22) !important;
    font-weight: 600 !important;
  }
  .ms-phone-btn:hover {
    background: rgba(255, 217, 90, 0.14) !important;
    border-color: rgba(255, 217, 90, 0.4) !important;
  }
  .ms-phone-btn.active {
    background: linear-gradient(180deg, #ffe07a, #ffc83d) !important;
    color: #1a1500 !important;
    border-color: transparent !important;
    box-shadow: 0 2px 10px rgba(255, 217, 90, 0.28), inset 0 1px 0 rgba(255,255,255,0.35);
  }
  .ms-sidekick-btn:hover {
    background: rgba(167, 139, 250, 0.09); color: var(--purple);
    border-color: rgba(167, 139, 250, 0.25);
  }
  .ms-sidekick-btn.active:not(.ms-phone-btn) {
    background: linear-gradient(180deg, #c4b5fd, #8b5cf6); color: white;
    border-color: transparent;
    box-shadow: 0 2px 10px rgba(167, 139, 250, 0.28), inset 0 1px 0 rgba(255,255,255,0.22);
  }

  /* ---------- ACTIONS ---------- */
  .ms-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px; }
  .ms-stop, .ms-receipt-btn {
    padding: 8px;
    background: rgba(255,255,255,0.04); color: var(--text-secondary);
    border: 0.5px solid var(--border-subtle); border-radius: 8px;
    cursor: pointer; font-family: inherit;
    font-size: 11px; font-weight: 500; letter-spacing: -0.005em;
    transition: background 0.18s var(--ease), color 0.18s var(--ease), border-color 0.18s var(--ease);
  }
  .ms-receipt-btn:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
  .ms-stop:hover {
    background: rgba(248,113,113,0.09); color: var(--danger);
    border-color: rgba(248,113,113,0.25);
  }
  .ms-reset-btn {
    width: 100%; padding: 8px;
    background: rgba(255,255,255,0.04); color: var(--text-secondary);
    border: 0.5px solid var(--border-subtle); border-radius: 8px;
    cursor: pointer; font-family: inherit;
    font-size: 11px; font-weight: 500; letter-spacing: -0.005em;
    transition: background 0.18s var(--ease), color 0.18s var(--ease), border-color 0.18s var(--ease);
  }
  .ms-reset-btn:hover {
    background: rgba(255,217,90,0.08); color: var(--accent);
    border-color: rgba(255,217,90,0.25);
  }
</style>
<button class="ms-toggle" id="ms-toggle" title="Mood Scroll — click to open"><span class="ms-pulse"></span><span id="ms-toggle-icon">✨</span></button>
<div class="ms-flash" id="ms-flash"></div>
<div class="ms-locked-banner" id="ms-locked-banner">
  <div class="ms-locked-icon">🎯</div>
  <div class="ms-locked-title">LOCKED IN</div>
  <div class="ms-locked-sub">Algorithm tuned · scrolling at natural pace</div>
</div>
<div class="ms-panel" id="ms-panel">
  <div class="ms-header">
    <span class="ms-title">Mood Scroll</span>
    <button class="ms-close" id="ms-close">×</button>
  </div>
  <div class="ms-subtitle">pick a mood — i'll filter the feed</div>
  <div class="ms-grid">${modeButtons}</div>
  <div class="ms-custom-wrap" id="ms-custom-wrap">
    <input class="ms-custom-input" id="ms-custom-input" type="text" placeholder="describe what you want..." maxlength="200" />
    <div class="ms-custom-hint">enter to activate · examples: "startup founders", "60s rock", "golden retrievers"</div>
  </div>
  <div class="ms-active-line" id="ms-active-line">Active: <b id="ms-active-text"></b></div>
  <div class="ms-phase" id="ms-phase">
    <div class="ms-phase-row">
      <span class="ms-phase-label" id="ms-phase-label">Training the algo</span>
      <span class="ms-phase-stat" id="ms-phase-stat">0/0 matched</span>
    </div>
    <div class="ms-phase-bar"><div class="ms-phase-fill" id="ms-phase-fill"></div></div>
  </div>
  <div class="ms-stats">
    <div class="ms-stat-cell"><b id="ms-timer">0:00</b></div>
    <div class="ms-stat-cell"><b id="ms-watched">0</b><span>watched</span></div>
    <div class="ms-stat-cell"><b id="ms-skipped">0</b><span>skipped</span></div>
  </div>
  <div class="ms-toggle-row">
    <span>train algo (auto-like matches)</span>
    <label class="ms-switch">
      <input type="checkbox" id="ms-engage-toggle" />
      <span class="ms-slider"></span>
    </label>
  </div>
  <div class="ms-sidekick-row">
    <button class="ms-sidekick-btn ms-phone-btn" id="ms-sidekick-btn" title="One click: shrink Chrome to a phone-sized strip on the right edge of your screen, hide all of TikTok's nav/buttons/captions so only the video shows, and auto-start scrolling. Work on the rest of your screen while TikTok plays.">📱 Phone Mode</button>
    <button class="ms-sidekick-btn" id="ms-popout-btn" title="Open TikTok in a NEW narrow window instead of resizing this one. Use if you want your current tabs to stay full-size.">🪟 New Window</button>
  </div>
  <div class="ms-actions">
    <button class="ms-receipt-btn" id="ms-receipt-btn">📊 Receipt</button>
    <button class="ms-stop" id="ms-stop">⏹ Stop</button>
  </div>
  <button class="ms-reset-btn" id="ms-reset-btn" title="Reset everything: opens TikTok content preferences in a new tab (where you can 'Refresh your For You feed') and clears Mood Scroll's training history so the next mode locks in faster.">🔄 Reset algo</button>
</div>
      `;
    }

    function wireOverlay() {
      if (!shadow) return;
      const toggle = shadow.getElementById('ms-toggle')!;
      const panel = shadow.getElementById('ms-panel')!;
      const closeBtn = shadow.getElementById('ms-close')!;
      const customWrap = shadow.getElementById('ms-custom-wrap')!;
      const customInput = shadow.getElementById('ms-custom-input') as HTMLInputElement;
      const engageToggle = shadow.getElementById('ms-engage-toggle') as HTMLInputElement;
      const stopBtn = shadow.getElementById('ms-stop')!;
      const receiptBtn = shadow.getElementById('ms-receipt-btn')!;

      toggle.addEventListener('click', () => {
        panel.classList.toggle('open');
      });
      closeBtn.addEventListener('click', () => panel.classList.remove('open'));

      shadow.querySelectorAll('.ms-mode').forEach(btn => {
        btn.addEventListener('click', () => {
          const modeId = (btn as HTMLElement).dataset.mode as ModeId;
          if (modeId === 'custom') {
            customWrap.classList.add('show');
            customInput.value = customDescription;
            customInput.focus();
            if (customDescription) activateMode('custom');
            else updateOverlayState();
          } else {
            customWrap.classList.remove('show');
            activateMode(modeId);
          }
        });
      });

      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const value = customInput.value.trim();
          if (!value) return;
          customDescription = value;
          chrome.storage.local.set({ customDescription: value });
          activateMode('custom');
        }
      });

      customInput.addEventListener('blur', () => {
        const value = customInput.value.trim();
        if (value && value !== customDescription) {
          customDescription = value;
          chrome.storage.local.set({ customDescription: value });
          if (currentMode === 'custom') updateOverlayState();
        }
      });

      engageToggle.checked = autoEngage;
      engageToggle.addEventListener('change', () => {
        autoEngage = engageToggle.checked;
        chrome.storage.local.set({ autoEngage });
      });

      stopBtn.addEventListener('click', () => {
        currentMode = null;
        chrome.storage.local.set({ currentMode: null });
        updateOverlayState();
      });

      receiptBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'open_receipt' }).catch(() => {});
      });

      const resetBtn = shadow.getElementById('ms-reset-btn');
      if (!resetBtn) {
        console.warn('[MoodScroll] Reset button NOT FOUND — old content script still running? Close + reopen the TikTok tab.');
      }
      if (resetBtn) {
        console.log('[MoodScroll] Reset button wired up ✓');
        resetBtn.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          console.log('[MoodScroll] 🔄 Reset Algo clicked');
          // Pause classifications by clearing the current mode — prevents stats
          // from re-incrementing instantly after reset. User must re-pick a mode.
          const prevMode = currentMode;
          currentMode = null;
          recentMatches.length = 0;
          phase = 'training';
          autoAdvanceAt = 0;
          watchedVideoLastTime = 0;
          lastClassifiedVideoSrc = null;
          likedVideoSrcs.clear();
          likeTimestamps.length = 0;
          await chrome.storage.local.set({ currentMode: null, justReset: true }).catch(() => {});
          const sessionRes = await chrome.runtime.sendMessage({ type: 'reset_session' }).catch((e: any) => ({ error: String(e) }));
          console.log('[MoodScroll] session cleared:', sessionRes);
          updatePhaseUI();
          updateOverlayStats();
          updateOverlayState();
          flashDecision(true, '🔄 RESET');
          showResetBanner();
          // Open TikTok content preferences in a new tab — user clicks "Refresh For You" there
          const settingsRes = await chrome.runtime.sendMessage({ type: 'open_tiktok_settings' }).catch((e: any) => ({ error: String(e) }));
          console.log('[MoodScroll] TikTok settings tab opened:', settingsRes, '(was mode:', prevMode, ')');
          // Hard reload this tab after the banner so the user gets an
          // undeniable visual reset. Navigate to /foryou so they land back
          // on the feed cleanly even if they were on a profile/video page.
          setTimeout(() => {
            console.log('[MoodScroll] 🔁 Reloading TikTok tab to /foryou for clean state…');
            window.location.href = 'https://www.tiktok.com/foryou';
          }, 2200);
        });
      }

      const sidekickBtn = shadow.getElementById('ms-sidekick-btn') as HTMLButtonElement;
      if (sidekickBtn) {
        sidekickBtn.addEventListener('click', async () => {
          const screenW = window.screen.availWidth;
          const screenH = window.screen.availHeight;
          if (sidekickActive) {
            await chrome.runtime.sendMessage({ type: 'sidekick_off', screenW, screenH }).catch(() => {});
            sidekickActive = false;
            removeSidekickCSS();
            chrome.storage.local.set({ sidekickActive: false });
          } else {
            await chrome.runtime.sendMessage({ type: 'sidekick_on', screenW, screenH }).catch(() => {});
            sidekickActive = true;
            applySidekickCSS();
            chrome.storage.local.set({ sidekickActive: true });
            // If no mode is active, default to Auto Scroll so the user gets
            // immediate hands-off playback in the new narrow window.
            if (!currentMode) {
              activateMode('auto_scroll');
            }
            panel.classList.remove('open');
          }
          updateOverlayState();
        });
      }

      const popoutBtn = shadow.getElementById('ms-popout-btn') as HTMLButtonElement;
      if (popoutBtn) {
        popoutBtn.addEventListener('click', async () => {
          // Don't write sidekickActive to global storage — that would leak to the
          // current tab on next reload. New popup window will be 440px wide so
          // TikTok's responsive layout already collapses the left nav; user can
          // click Compact inside the popup if they want full hide.
          await chrome.runtime.sendMessage({
            type: 'pop_out_side',
            screenW: window.screen.availWidth,
            screenH: window.screen.availHeight
          }).catch(() => {});
          panel.classList.remove('open');
        });
      }
    }

    function activateMode(modeId: ModeId) {
      currentMode = modeId;
      chrome.storage.local.set({ currentMode: modeId });
      lastClassifiedVideoSrc = null;
      resetPhase();
      updateOverlayState();
    }

    function updateOverlayState() {
      if (!shadow) return;
      const toggle = shadow.getElementById('ms-toggle');
      const toggleIcon = shadow.getElementById('ms-toggle-icon');
      const activeLine = shadow.getElementById('ms-active-line');
      const activeText = shadow.getElementById('ms-active-text');
      const customWrap = shadow.getElementById('ms-custom-wrap');
      const sidekickBtn = shadow.getElementById('ms-sidekick-btn');
      if (!toggle || !toggleIcon || !activeLine || !activeText || !customWrap) return;

      shadow.querySelectorAll('.ms-mode').forEach(b => {
        const id = (b as HTMLElement).dataset.mode;
        b.classList.toggle('active', id === currentMode);
      });

      if (currentMode) {
        const mode = MODES.find(m => m.id === currentMode);
        toggle.classList.add('active');
        toggleIcon.textContent = mode?.emoji || '✨';
        activeLine.classList.add('show');
        if (currentMode === 'custom') {
          activeText.textContent = `Custom — "${customDescription || '(empty)'}"`;
          customWrap.classList.add('show');
        } else if (currentMode === 'auto_scroll') {
          activeText.textContent = 'Auto Scroll · every 5s';
        } else {
          activeText.textContent = mode?.label || currentMode;
        }
      } else {
        toggle.classList.remove('active');
        toggleIcon.textContent = '✨';
        activeLine.classList.remove('show');
      }
      if (sidekickBtn) {
        sidekickBtn.classList.toggle('active', sidekickActive);
        sidekickBtn.textContent = sidekickActive ? '✕ Exit Phone Mode' : '📱 Phone Mode';
      }
    }

    function flashDecision(matched: boolean, category: string) {
      lastDecision = { matched, category, at: Date.now() };
      if (!shadow) return;
      const flash = shadow.getElementById('ms-flash');
      if (!flash) return;
      if (currentMode === 'auto_scroll') {
        flash.textContent = `⏩ ${category}`;
        flash.className = 'ms-flash show match';
      } else {
        flash.textContent = matched ? `MATCH · ${category}` : `SKIP · ${category}`;
        flash.className = 'ms-flash show ' + (matched ? 'match' : 'skip');
      }
      setTimeout(() => flash.classList.remove('show'), 1800);
    }

    function recordDecision(matched: boolean) {
      recentMatches.push(matched);
      if (recentMatches.length > MATCH_WINDOW) recentMatches.shift();
      const matchedCount = recentMatches.filter(Boolean).length;
      const rate = recentMatches.length ? matchedCount / recentMatches.length : 0;
      let newPhase: Phase = phase;
      if (phase === 'training' && recentMatches.length >= 5 && rate >= STABLE_ENTER_THRESHOLD) {
        newPhase = 'stable';
      } else if (phase === 'stable' && rate < STABLE_EXIT_THRESHOLD) {
        newPhase = 'training';
      }
      if (newPhase !== phase) {
        const old = phase;
        phase = newPhase;
        console.log('[MoodScroll] phase →', phase, `(${matchedCount}/${recentMatches.length})`);
        // Celebrate the lock-in!
        if (old === 'training' && newPhase === 'stable') {
          showLockedBanner();
        }
      }
      updatePhaseUI();
    }

    function showLockedBanner() {
      if (!shadow) return;
      const banner = shadow.getElementById('ms-locked-banner');
      if (!banner) return;
      const mode = MODES.find(m => m.id === currentMode);
      const label = currentMode === 'custom'
        ? `"${customDescription || 'Custom'}"`
        : (mode?.label || currentMode || '').toUpperCase();
      // Restore defaults in case a free-limit / unavailable banner ran before.
      (banner.querySelector('.ms-locked-icon') as HTMLElement).textContent = '🎯';
      (banner.querySelector('.ms-locked-sub') as HTMLElement).textContent =
        'Algorithm tuned · scrolling at natural pace';
      banner.querySelector('.ms-locked-title')!.textContent = `${label} LOCKED IN`;
      banner.querySelector('.ms-locked-cta')?.remove();
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 4000);
    }

    // First-100 free allotment (or spend cap) is used up. Offer the $10
    // lifetime upgrade + the option to paste a personal OpenAI key.
    function showFreeLimitBanner() {
      if (!shadow) return;
      const banner = shadow.getElementById('ms-locked-banner');
      if (!banner) return;
      const title = banner.querySelector('.ms-locked-title') as HTMLElement;
      const sub = banner.querySelector('.ms-locked-sub') as HTMLElement;
      const icon = banner.querySelector('.ms-locked-icon') as HTMLElement;
      icon.textContent = '🎉';
      title.textContent = 'FREE LIMIT REACHED';
      sub.innerHTML =
        'The first 100 free spots are taken. Get lifetime access for $10 and ' +
        'add your own OpenAI key — then keep scrolling your way.';
      banner.querySelector('.ms-locked-cta')?.remove();
      const cta = document.createElement('button');
      cta.className = 'ms-locked-cta';
      cta.textContent = 'Get $10 lifetime →';
      cta.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'open_site', path: '/#pricing' }).catch(() => {});
      });
      banner.appendChild(cta);
      const cta2 = document.createElement('button');
      cta2.className = 'ms-locked-cta ms-locked-cta-ghost';
      cta2.textContent = 'Paste your key in Options';
      cta2.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'open_options' }).catch(() => {});
      });
      banner.appendChild(cta2);
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 16000);
    }

    // Soft, no-action retry message for transient errors (proxy busy, network).
    function showAiUnavailableBanner() {
      if (!shadow) return;
      const banner = shadow.getElementById('ms-locked-banner');
      if (!banner) return;
      const title = banner.querySelector('.ms-locked-title') as HTMLElement;
      const sub = banner.querySelector('.ms-locked-sub') as HTMLElement;
      const icon = banner.querySelector('.ms-locked-icon') as HTMLElement;
      icon.textContent = '⏳';
      title.textContent = 'TAKING A BREAK';
      sub.textContent = 'The AI is busy for a moment. Hang tight — it’ll pick back up automatically.';
      banner.querySelector('.ms-locked-cta')?.remove();
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 9000);
    }

    function showResetBanner() {
      if (!shadow) return;
      const banner = shadow.getElementById('ms-locked-banner');
      if (!banner) return;
      const title = banner.querySelector('.ms-locked-title') as HTMLElement;
      const sub = banner.querySelector('.ms-locked-sub') as HTMLElement;
      const icon = banner.querySelector('.ms-locked-icon') as HTMLElement;
      const prevTitle = title.textContent;
      const prevSub = sub.textContent;
      const prevIcon = icon.textContent;
      icon.textContent = '🔄';
      title.textContent = 'RESET COMPLETE';
      sub.textContent = 'Refreshing feed… click "Refresh your For You feed" in the new tab too';
      banner.querySelector('.ms-locked-cta')?.remove();
      banner.classList.add('show');
      setTimeout(() => {
        banner.classList.remove('show');
        // Restore original content for next LOCKED IN trigger
        setTimeout(() => {
          icon.textContent = prevIcon || '🎯';
          title.textContent = prevTitle || 'LOCKED IN';
          sub.textContent = prevSub || 'Algorithm tuned · scrolling at natural pace';
        }, 600);
      }, 4500);
    }

    function updatePhaseUI() {
      if (!shadow) return;
      const ph = shadow.getElementById('ms-phase');
      const label = shadow.getElementById('ms-phase-label');
      const stat = shadow.getElementById('ms-phase-stat');
      const fill = shadow.getElementById('ms-phase-fill') as HTMLElement;
      if (!ph || !label || !stat || !fill) return;
      // Auto-scroll has no training/stable phase
      if (!currentMode || currentMode === 'auto_scroll') { ph.classList.remove('show'); return; }
      ph.classList.add('show');
      const matchedCount = recentMatches.filter(Boolean).length;
      const pct = recentMatches.length ? Math.round((matchedCount / recentMatches.length) * 100) : 0;
      if (phase === 'training') {
        ph.classList.remove('stable');
        label.textContent = 'Training (broad cluster)';
        stat.textContent = `${matchedCount}/${recentMatches.length || 0} matched`;
      } else {
        ph.classList.add('stable');
        label.textContent = `Tuned · strict ${pct}%`;
        stat.textContent = 'auto pace';
      }
      fill.style.width = `${pct}%`;
    }

    function resetPhase() {
      phase = 'training';
      recentMatches.length = 0;
      updatePhaseUI();
    }

    async function updateOverlayStats() {
      if (!shadow) return;
      try {
        const { session } = await chrome.storage.local.get('session');
        const watched = session?.watched || 0;
        const skipped = session?.skipped || 0;
        const startedAt = session?.startedAt || Date.now();
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        const watchedEl = shadow.getElementById('ms-watched');
        const skippedEl = shadow.getElementById('ms-skipped');
        const timerEl = shadow.getElementById('ms-timer');
        if (watchedEl) watchedEl.textContent = String(watched);
        if (skippedEl) skippedEl.textContent = String(skipped);
        if (timerEl) timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
      } catch {}
    }

    // Watch for DOM changes so the overlay survives TikTok SPA navigations
    let observerDebounce: number | null = null;
    const overlayObserver = new MutationObserver(() => {
      if (observerDebounce) return;
      observerDebounce = window.setTimeout(() => {
        observerDebounce = null;
        if (!overlayRoot || !document.documentElement.contains(overlayRoot)) ensureOverlay();
      }, 250);
    });
    if (document.documentElement) {
      ensureOverlay();
      overlayObserver.observe(document.documentElement, { childList: true });
    }
    document.addEventListener('DOMContentLoaded', () => ensureOverlay(), { once: true });

    setInterval(updateOverlayStats, 1000);

    // If we just reloaded after a Reset Algo click, show a confirmation
    // banner so the user knows the reset went through (banner from before
    // the reload is gone because the page navigated).
    chrome.storage.local.get(['justReset']).then(({ justReset }) => {
      if (!justReset) return;
      chrome.storage.local.remove('justReset');
      const tryShow = () => {
        if (!shadow) { setTimeout(tryShow, 200); return; }
        const banner = shadow.getElementById('ms-locked-banner');
        if (!banner) { setTimeout(tryShow, 200); return; }
        const title = banner.querySelector('.ms-locked-title') as HTMLElement;
        const sub = banner.querySelector('.ms-locked-sub') as HTMLElement;
        const icon = banner.querySelector('.ms-locked-icon') as HTMLElement;
        icon.textContent = '✅';
        title.textContent = 'RESET DONE';
        sub.textContent = 'Pick a mode to start training a fresh algorithm';
        banner.querySelector('.ms-locked-cta')?.remove();
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 4000);
      };
      tryShow();
    });

    // ---------- AUTO-ADVANCE TICK (for matched videos in mode-filter scrolling) ----------
    // After a match is classified, autoAdvanceAt is set to (now + WATCH_DURATIONS[category]).
    // This tick checks if the hold has expired and advances. Skipped from auto_scroll mode
    // because the auto-scroll loop manages its own advance.
    setInterval(() => {
      if (!currentMode || currentMode === 'auto_scroll' || autoAdvanceAt === 0) return;
      if (Date.now() < autoAdvanceAt) return;
      const video = findPlayingVideo();
      if (!video) { autoAdvanceAt = 0; watchedVideoLastTime = 0; return; }
      autoAdvanceAt = 0;
      watchedVideoLastTime = 0;
      skipToNext(video.currentSrc);
    }, 250);

    // ---------- AUTO SCROLL LOOP (adaptive: classify category, hold for category-duration) ----------
    let autoScrollClassifying = false;
    let autoScrollSrc: string | null = null;
    setInterval(async () => {
      if (currentMode !== 'auto_scroll') { autoScrollSrc = null; return; }
      if (autoScrollClassifying) return;
      const video = findPlayingVideo();
      if (!video) return;
      const src = video.currentSrc;

      // If we haven't classified this video yet, kick off a quick single-frame classify
      if (autoScrollSrc !== src) {
        autoScrollSrc = src;
        autoScrollClassifying = true;
        try {
          const card = video.closest(CONFIG.itemSelector) as HTMLElement | null;
          const scope: ParentNode = card || document;
          const caption = scope.querySelector(CONFIG.captionSelector)?.textContent?.trim() || '';
          // Auto-skip sponsored ads even in auto-scroll mode
          if (isSponsoredCard(card, caption)) {
            flashDecision(false, 'sponsored ad');
            chrome.runtime.sendMessage({ type: 'tally', category: 'other', matched: false }).catch(() => {});
            skipToNext(src);
            autoScrollClassifying = false;
            autoScrollSrc = null;
            return;
          }
          const hashtags = Array.from(caption.matchAll(/#([\w]+)/g)).map(m => m[1]);
          const sound = scope.querySelector(CONFIG.audioSelector)?.textContent?.trim() || '';
          const creatorEl = scope.querySelector(CONFIG.creatorSelector);
          const creator = (creatorEl?.getAttribute('href') || '').replace(/^\/@/, '@').split('?')[0] || 'unknown';
          // single-frame classify — text + 1 visual frame, ~700ms total
          const singleFrame = await captureSingleFrame(video);
          const result = await chrome.runtime.sendMessage({
            type: 'classify',
            frames: singleFrame ? [singleFrame] : [],
            caption, hashtags, sound, creator,
            mode: 'other' // generic categorization, not filtering
          }).catch(() => null);
          const category = result?.category || 'other';
          const dur = holdForVideo(category, video);
          autoAdvanceAt = Date.now() + dur;
          flashDecision(true, `${category} · ${Math.round(dur/1000)}s`);
          chrome.runtime.sendMessage({ type: 'tally', category, matched: true }).catch(() => {});
          if (autoEngage) maybeAutoLike(src, true);
          console.log(`[MoodScroll] auto-scroll: ${category}, holding ${dur}ms`);
        } catch (err) {
          // On any error fall back to a 5s hold
          autoAdvanceAt = Date.now() + 5000;
        } finally {
          autoScrollClassifying = false;
        }
        return;
      }

      // We've classified the current video — advance when its hold expires
      if (Date.now() >= autoAdvanceAt) {
        skipToNext(src);
        autoScrollSrc = null;
      }
    }, 500);

    // ---------- CLASSIFY + SKIP LOOP ----------
    setInterval(async () => {
      try {
        if (!currentMode || isClassifying) return;
        if (currentMode === 'auto_scroll') return; // handled by auto-scroll loop above
        if (currentMode === 'custom' && !customDescription) return;
        if (Date.now() - lastDecisionAt < tuning().decisionIntervalMs) return;

        const video = findPlayingVideo();
        if (!video) return;
        if (video.currentSrc === lastClassifiedVideoSrc) return;

        isClassifying = true;
        const videoSrcAtStart = video.currentSrc;
        const modeAtStart = currentMode;

        // Scope DOM queries to the card containing the playing video so we don't
        // pick metadata from a preloaded neighbor.
        const card = video.closest(CONFIG.itemSelector) as HTMLElement | null;
        const scope: ParentNode = card || document;
        const caption = scope.querySelector(CONFIG.captionSelector)?.textContent?.trim() || '';
        const hashtags = Array.from(caption.matchAll(/#([\w]+)/g)).map(m => m[1]);
        const sound = scope.querySelector(CONFIG.audioSelector)?.textContent?.trim() || '';
        const creatorEl = scope.querySelector(CONFIG.creatorSelector);
        const creatorHref = creatorEl?.getAttribute('href') || '';
        const creator = creatorHref.replace(/^\/@/, '@').split('?')[0] || 'unknown';

        // Defensive: if the card hasn't loaded its metadata yet (TikTok mounts the
        // <video> before populating caption/creator), skip this tick and retry next.
        if (currentMode !== 'custom' && !caption && creator === 'unknown') {
          isClassifying = false;
          return;
        }

        // SPONSORED AD SKIP — applies to EVERY mode including auto_scroll. We
        // never want to count ads in the user's session.
        if (isSponsoredCard(card, caption)) {
          chrome.runtime.sendMessage({ type: 'tally', category: 'other', matched: false }).catch(() => {});
          lastClassifiedVideoSrc = videoSrcAtStart;
          lastDecisionAt = Date.now();
          isClassifying = false;
          flashDecision(false, '📣 sponsored ad');
          console.log('[MoodScroll] SKIP sponsored ad');
          skipToNext(videoSrcAtStart);
          return;
        }

        // FAST PRE-SKIP: if this caption has hashtags from the mode's negative
        // list, skip immediately without any API call. Catches the obvious 60%.
        // SKIPPED for ALWAYS_VISION_MODES (LARP/Baddies/Fitness) where the
        // visual frame is the decisive signal, not the caption.
        const negTags = ALWAYS_VISION_MODES.has(currentMode || '')
          ? []
          : (NEGATIVE_HASHTAGS[currentMode || ''] || []);
        const lowerHashtags = hashtags.map(h => h.toLowerCase());
        if (negTags.length && negTags.some(tag => lowerHashtags.includes(tag.toLowerCase()))) {
          const matchedTag = negTags.find(tag => lowerHashtags.includes(tag.toLowerCase()));
          chrome.runtime.sendMessage({ type: 'tally', category: 'other', matched: false }).catch(() => {});
          lastClassifiedVideoSrc = videoSrcAtStart;
          lastDecisionAt = Date.now();
          isClassifying = false;
          flashDecision(false, `pre-skip #${matchedTag}`);
          recordDecision(false);
          console.log('[MoodScroll] INSTANT SKIP via negative hashtag', `#${matchedTag}`, 'for', currentMode);
          skipToNext(videoSrcAtStart);
          return;
        }

        // Tier 3 (creator memo) was causing false positives — if a creator made
        // ANY 2 cooking videos, all their later videos got marked cooking without
        // verification. DISABLED. Every video gets fresh classification.
        let decision: { category: string; matches_mode?: boolean; confidence: number; reason?: string } | null = null;

        if (false) {
          // memo disabled — kept code structure intact
        } else {
          // Tier 1 (keyword) — ONLY use it to short-circuit when it's a
          // confident NON-MATCH for the current mode. Confident positive
          // classifications must still go through the API+vision verification
          // because keyword overlap is too noisy (e.g., "how to make money"
          // matches the cooking keyword "how to make" and would falsely match
          // Cooking mode). Also SKIPPED for ALWAYS_VISION_MODES.
          if (currentMode !== 'custom' && !ALWAYS_VISION_MODES.has(currentMode || '')) {
            const t1 = tier1Classify(caption, hashtags, sound);
            if (t1.confidence >= 0.8 && t1.category) {
              const modeForT1 = MODES.find(m => m.id === currentMode);
              const modeMatchesForT1: readonly string[] = (modeForT1?.matches as readonly string[]) ?? [];
              if (!modeMatchesForT1.includes(t1.category)) {
                // Confident non-match → safe to short-circuit, instant skip
                decision = { category: t1.category, confidence: t1.confidence };
                console.log(`[MoodScroll] Tier1 confident SKIP: ${t1.category} ∉ [${modeMatchesForT1.join(',')}]`);
              }
              // Confident "match" via keywords → fall through to API verification
            }
          }

          if (!decision) {
            // Tier 2 (Claude/GPT). Always send AT LEAST ONE frame so the model
            // can visually verify the text-based hint. During TRAINING we send
            // 1 quick-capture frame (~5ms + ~700ms API). In STABLE we send 3
            // frames over 1.2s for full accuracy.
            // ALWAYS_VISION_MODES + custom + stable phase get 3 frames over
            // ~1.2s for full context (catches background luxury that appears
            // later in the clip). Training-phase fixed modes still get 1 frame.
            const useMultipleFrames = tuning().useFrames
              || currentMode === 'custom'
              || ALWAYS_VISION_MODES.has(currentMode || '');
            let frames: string[] = [];
            if (useMultipleFrames) {
              frames = await captureFramesOverTime(video);
              // Fallback to single-frame retry if multi-frame returned nothing
              if (frames.length === 0) {
                const single = await captureSingleFrame(video);
                if (single) frames = [single];
              }
            } else {
              const single = await captureSingleFrame(video);
              if (single) frames = [single];
            }
            const result = await chrome.runtime.sendMessage({
              type: 'classify',
              frames, caption, hashtags, sound, creator,
              mode: currentMode,
              customDescription: currentMode === 'custom' ? customDescription : undefined
            });

            const videoNow = findPlayingVideo();
            if (!videoNow || videoNow.currentSrc !== videoSrcAtStart) {
              isClassifying = false;
              return;
            }
            if (result?.error) {
              console.warn('[MoodScroll] classify error:', result.error);
              if (result.error === 'free_limit_reached') {
                // First-100 free pool (or spend cap) exhausted. Stop the mode
                // and show the upgrade / paste-your-key banner.
                showFreeLimitBanner();
                currentMode = null;
                chrome.storage.local.set({ currentMode: null }).catch(() => {});
                updateOverlayState();
              } else {
                // Transient (proxy busy / network): soft banner, keep the mode
                // so it recovers on the next video automatically.
                showAiUnavailableBanner();
              }
              isClassifying = false;
              return;
            }
            decision = result;
            // Confidence guard: if the model wasn't sure, treat as non-match.
            // LARP / Baddies / Brain Rot all use 0.3 — these visual modes need
            // generous matching because the model hedges confidence on visual
            // judgments even when classifying correctly. Fitness uses 0.4.
            // Other modes use 0.6.
            const veryGenerousModes = new Set(['larp', 'baddies', 'brain_rot']);
            const confThreshold = veryGenerousModes.has(currentMode || '')
              ? 0.3
              : (ALWAYS_VISION_MODES.has(currentMode || '') ? 0.4 : 0.6);
            if (decision && typeof decision.confidence === 'number' && decision.confidence < confThreshold) {
              console.log(`[MoodScroll] Low confidence (${decision.confidence} < ${confThreshold}) → demoting to 'other'`);
              decision = { ...decision, category: 'other' };
            }
            // Don't update memo — disabled for accuracy.
          }
        }

        if (!decision) {
          isClassifying = false;
          return;
        }

        const mode = MODES.find(m => m.id === currentMode);
        // TWO-PHASE MATCHING:
        // - Training phase: use BROAD cluster (e.g. Cooking matches food_porn too).
        //   This signals to TikTok we want the cluster, pulling related content faster.
        // - Stable phase ("locked in"): narrow to STRICT matches only.
        const useStrictMatches = phase === 'stable';
        const modeMatches: readonly string[] = useStrictMatches
          ? (mode?.matches as readonly string[]) ?? []
          : (mode?.broadMatches as readonly string[]) ?? (mode?.matches as readonly string[]) ?? [];
        // For FIXED modes, trust the locally-defined category mapping — NEVER
        // trust the API's matches_mode field. For CUSTOM mode we have no fixed
        // mapping, so the API's matches_mode is the only signal we have.
        const matches_mode = currentMode === 'custom'
          ? (typeof decision.matches_mode === 'boolean' ? decision.matches_mode : false)
          : modeMatches.includes(decision.category);

        chrome.runtime.sendMessage({
          type: 'tally',
          category: decision.category,
          matched: matches_mode
        }).catch(() => {});

        lastClassifiedVideoSrc = videoSrcAtStart;
        lastDecisionAt = Date.now();
        isClassifying = false;

        const stillPlaying = findPlayingVideo();
        if (!stillPlaying || stillPlaying.currentSrc !== videoSrcAtStart) {
          console.log('[MoodScroll] video advanced before decision applied, dropping');
          return;
        }

        flashDecision(matches_mode, decision.category);
        recordDecision(matches_mode);
        if (!matches_mode) {
          // NON-MATCH: skip immediately. Fast scrolling on irrelevant content
          // signals TikTok we don't want this.
          console.log('[MoodScroll] SKIP:', decision.category, '|', decision.reason || '');
          skipToNext(videoSrcAtStart);
        } else {
          // MATCH: hold for the category-appropriate watch time so TikTok gets
          // a strong watch-time signal (the #1 ranking factor) AND auto-like so
          // it also gets the explicit positive signal. Cap hold to 92% of video
          // duration so short clips never re-loop ("rewatch bug").
          const playingVideo = findPlayingVideo();
          const holdMs = holdForVideo(decision.category, playingVideo);
          autoAdvanceAt = Date.now() + holdMs;
          watchedVideoLastTime = 0; // reset loop watchdog for new match
          console.log(`[MoodScroll] MATCH: ${decision.category}, holding ${holdMs}ms (dur=${playingVideo?.duration}s) | ${decision.reason || ''}`);
          if (autoEngage) maybeAutoLike(videoSrcAtStart, true);
        }
      } catch (err) {
        console.error('[MoodScroll] loop error:', err);
        isClassifying = false;
      }
    }, CONFIG.tickIntervalMs);

    // ---------- DOM HELPERS ----------
    // TikTok preloads neighbors and DOESN'T always set `playsinline` or unpause.
    // The current video is the one whose bounding rect is centered in the viewport.
    function findPlayingVideo(): HTMLVideoElement | null {
      const all = document.querySelectorAll<HTMLVideoElement>(CONFIG.videoSelector);
      if (!all.length) return null;
      const viewportCenter = window.innerHeight / 2;
      let best: HTMLVideoElement | null = null;
      let bestDist = Infinity;
      for (const v of all) {
        const rect = v.getBoundingClientRect();
        if (rect.height < CONFIG.minVideoHeight) continue;
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        if (!v.currentSrc) continue;
        const center = (rect.top + rect.bottom) / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = v;
        }
      }
      return best;
    }

    function findFeedItems(): Element[] {
      return Array.from(document.querySelectorAll(CONFIG.itemSelector));
    }

    function findItemContainingVideo(src: string): Element | null {
      for (const item of findFeedItems()) {
        const v = item.querySelector('video');
        if (v && (v as HTMLVideoElement).currentSrc === src) return item;
      }
      return null;
    }

    // Detect TikTok sponsored ads. Returns true if the video card has any
    // ad markers — checked BEFORE classification so ads are skipped for free.
    function isSponsoredCard(card: HTMLElement | null, caption: string): boolean {
      if (!card) return false;
      // 1. Specific data-e2e ad markers
      const adSelectors = [
        '[data-e2e="ad-info"]',
        '[data-e2e="video-ad"]',
        '[data-e2e="ad-card"]',
        '[data-e2e="ad-overlay"]',
        '[data-e2e="ad-tag"]',
        '[data-e2e="branded-content-tag"]',
        '[data-e2e="paid-partnership-tag"]'
      ];
      for (const sel of adSelectors) {
        if (card.querySelector(sel)) return true;
      }
      // 2. "Sponsored" / "Ad" text inside the card (TikTok displays this badge)
      const allText = card.textContent || '';
      // Use whole-word match so we don't false-fire on words like "Sponsoring"
      if (/(^|\s)(Sponsored|Promoted|Advertisement|Paid partnership)(\s|$|\.|,)/i.test(allText)) {
        return true;
      }
      // 3. Sponsored hashtags in caption
      const adHashtagRegex = /#(ad|sponsored|spon|paidpromotion|paidpartnership|partnership|brandpartner|sponsoredpost|brandeddeal|advertorial)\b/i;
      if (adHashtagRegex.test(caption)) return true;
      // 4. "Learn more" / "Shop now" / "Download" CTA buttons typical of ads
      const ctaSelectors = [
        'button[data-e2e*="ad-button" i]',
        'a[data-e2e*="ad-link" i]',
        'a[href*="utm_source=tiktok"]'
      ];
      for (const sel of ctaSelectors) {
        if (card.querySelector(sel)) return true;
      }
      return false;
    }

    // Single-frame capture with retry — tries up to 3 times waiting briefly
    // between attempts because TikTok preloads videos with readyState 0/1
    // and we need to wait for it to reach readyState >= 2 to drawImage.
    // Bumped resolution to 480x854 (was 360x640) so small background objects
    // like cars / watches stay readable to gpt-4o.
    function captureSingleFrameSync(video: HTMLVideoElement): string | null {
      if (video.readyState < 2) return null;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 854;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.75);
      } catch {
        return null;
      }
    }
    async function captureSingleFrame(video: HTMLVideoElement): Promise<string | null> {
      let frame = captureSingleFrameSync(video);
      if (frame) return frame;
      // Try harder: nudge play() to trigger frame loading, then retry up to 5x
      try { await video.play().catch(() => {}); } catch {}
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 200));
        frame = captureSingleFrameSync(video);
        if (frame) return frame;
      }
      return null;
    }

    async function captureFramesOverTime(video: HTMLVideoElement): Promise<string[]> {
      const frames: string[] = [];
      // Wait 400ms BEFORE the first frame so we skip past the title
      // card / black-intro that most TikToks open with. Then 500ms gaps
      // for variety. Total capture window: 400ms → 900ms → 1400ms.
      // This dramatically reduces "skip other" from blank opening frames.
      const delays = [400, 500, 500];
      const srcAtStart = video.currentSrc;
      for (const delay of delays) {
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
        if (video.paused || video.readyState < 2) break;
        if (video.currentSrc !== srcAtStart) break;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 854;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.75));
        } catch (err) {
          console.warn('[MoodScroll] frame capture failed:', err);
        }
      }
      return frames;
    }

    function skipToNext(targetSrc: string) {
      tryAdvance(targetSrc);
      setTimeout(() => {
        const video = findPlayingVideo();
        if (video && video.currentSrc === targetSrc) tryAdvance(targetSrc);
      }, 400);
    }

    function tryAdvance(targetSrc: string) {
      // Verified: no `[data-e2e="arrow-right"]` button exists on tiktok.com/foryou.
      // Primary: scrollIntoView the next snap item.
      const items = findFeedItems();
      const currentItem = findItemContainingVideo(targetSrc) || items.find(i => {
        const r = i.getBoundingClientRect();
        return r.top < window.innerHeight / 2 && r.bottom > window.innerHeight / 2;
      });
      if (currentItem && items.length) {
        const idx = items.indexOf(currentItem);
        const nextItem = idx >= 0 ? items[idx + 1] : null;
        if (nextItem) {
          nextItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      // Fallback: scroll the snap container by one viewport height.
      const container = document.getElementById(CONFIG.scrollContainerId);
      if (container) {
        container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
        return;
      }
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }

    // ---------- AUTO-LIKE ----------
    // forceNow=true: skip the random probability roll and use a short 0.8-1.4s
    // delay. Used by Auto Scroll mode so every video in the 5s window gets liked.
    function maybeAutoLike(videoSrc: string, forceNow: boolean = false) {
      if (likedVideoSrcs.has(videoSrc)) return;
      if (!forceNow && Math.random() > tuning().likeProbability) return;
      // Rate-limit check
      const now = Date.now();
      while (likeTimestamps.length && now - likeTimestamps[0] > CONFIG.likeRateLimitWindowMs) {
        likeTimestamps.shift();
      }
      if (likeTimestamps.length >= CONFIG.likeRateLimitMax) {
        console.log('[MoodScroll] like rate-limit reached, skipping');
        return;
      }
      const delay = forceNow
        ? 800 + Math.random() * 600
        : CONFIG.likeDelayMinMs + Math.random() * CONFIG.likeDelayJitterMs;
      setTimeout(() => {
        const video = findPlayingVideo();
        if (!video || video.currentSrc !== videoSrc) return;
        // Scope the like button to the current video's card to avoid liking a neighbor.
        const card = video.closest(CONFIG.itemSelector) as HTMLElement | null;
        const scope: ParentNode = card || document;
        const likeIcon = scope.querySelector<HTMLElement>(CONFIG.likeIconSelector);
        const button = likeIcon?.closest('button')
          || scope.querySelector<HTMLButtonElement>(CONFIG.likeAriaSelector);
        // If already liked, just record it and bail
        const labelBefore = (button?.getAttribute('aria-label') || '').toLowerCase();
        if (labelBefore.startsWith('unlike') || button?.getAttribute('aria-pressed') === 'true') {
          likedVideoSrcs.add(videoSrc);
          return;
        }
        // PRIMARY: native double-tap gesture on the video. TikTok's React handler
        // detects two clicks within ~300ms as a like — and shows the floating
        // heart animation on the video, just like a real user double-tap.
        const doubleClicked = doubleTapVideo(video);
        // FALLBACK: also click the like button. Even if double-tap fires the
        // like, clicking the button is idempotent (TikTok ignores second like).
        // If double-tap didn't fire (e.g. video element changed), button click
        // saves us.
        let buttonClicked = false;
        if (button) {
          button.click();
          buttonClicked = true;
        }
        likedVideoSrcs.add(videoSrc);
        likeTimestamps.push(Date.now());
        console.log(`[MoodScroll] ❤️ liked match (dblclick=${doubleClicked}, btn=${buttonClicked})`);
      }, delay);
    }

    // Native double-tap gesture on the video element. TikTok shows the
    // floating heart and registers a like — same signal as a real user
    // double-tapping a video they want to see more of.
    function doubleTapVideo(video: HTMLVideoElement): boolean {
      try {
        const rect = video.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const opts: MouseEventInit = {
          bubbles: true,
          cancelable: true,
          clientX: cx,
          clientY: cy,
          button: 0,
          buttons: 1,
          view: window
        };
        // Burst 1
        video.dispatchEvent(new MouseEvent('mousedown', opts));
        video.dispatchEvent(new MouseEvent('mouseup', opts));
        video.dispatchEvent(new MouseEvent('click', opts));
        // Burst 2, ~80ms later — well within TikTok's double-click window
        setTimeout(() => {
          video.dispatchEvent(new MouseEvent('mousedown', opts));
          video.dispatchEvent(new MouseEvent('mouseup', opts));
          video.dispatchEvent(new MouseEvent('click', opts));
          video.dispatchEvent(new MouseEvent('dblclick', opts));
        }, 80);
        return true;
      } catch (err) {
        console.warn('[MoodScroll] double-tap failed:', err);
        return false;
      }
    }
  }
});
