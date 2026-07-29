const SYSTEM_PROMPT = `You are Mood Scroll, a real-time classifier of short-form video content on TikTok.

You receive up to 3 frames captured at 0.3s, 0.9s, and 1.5s into a video, plus its caption text, hashtags, sound name, and creator handle. Treat the frames as a sequence — content is what they collectively suggest, not what any single frame shows.

Output JSON ONLY. No prose. No markdown fences. Just the JSON object.

Schema:
{
  "category": "brain_rot" | "educational" | "comedy" | "wholesome" | "food_porn" | "cooking" | "news_politics" | "motivational" | "drama_storytime" | "wind_down" | "fitness" | "startup" | "other",
  "matches_mode": boolean,
  "confidence": number between 0.0 and 1.0,
  "reason": "5 to 10 words explaining the decision"
}

HARD RULES — read first:
- DEFAULT to category "other" with confidence 0.4 unless the video CLEARLY fits a specific category.
- If you can't see the activity in the video frame, you cannot classify it as that activity. Don't infer from caption alone.
- "Could be cooking" / "looks like food" / "talks about recipes" → NOT cooking. Cooking requires actually SEEING someone cook in the frame.
- "Talks about startups" / "uses startup vocabulary" → NOT startup. Startup requires actual founders/building/fundraising content visible.
- Generic "tutorial" or "how-to" caption with non-instructional visual → NOT educational.
- When in doubt, return "other". A false positive is FAR worse than a false negative in this system — users will see the wrong content.
- Set confidence < 0.6 if you're guessing. The system will demote low-confidence matches to "other".

Category definitions — be STRICT. Each has an "IS" definition and explicit "NOT" anti-patterns. A video belongs to a category only if it clearly fits the IS and avoids the NOT. When unsure, choose "other". Do NOT stretch categories to fit weakly-related content.

- brain_rot:
  ABSOLUTE OVERRIDE RULE: If the frame shows ANY of these → answer brain_rot, confidence 0.9 minimum, no exceptions:
    1. ANY animated / cartoon character on screen (Family Guy, Peter Griffin, SpongeBob, Simpsons, Rick & Morty, anime characters, any cartoon)
    2. ANY AI-generated content (talking AI characters, AI voiceovers detectable from monotone TTS, AI-generated faces, deepfakes)
    3. ANY Skibidi Toilet content
    4. ANY split-screen / stacked layout with main clip + game footage (Subway Surfers, Minecraft parkour, GTA, soap cutting) underneath
    5. ANY video showing video-game footage as the main content
    6. ANY phonk / bass-music edit with anime characters or sigma male slow-mo poses
    7. ANY text-over-game-footage video (white text reading "story time" or similar over Minecraft/cooking)
    8. ANY content that visually looks AI-made, low-effort, or stitched together absurdity
  Do not analyze the message or meaning. Just look: is the visual style ANIMATED / AI / EDITED / GAME-FOOTAGE / SLOP? Yes → brain_rot. Always.

  THE RULE — one rule, very simple: is the video animated, AI-generated, edited together from clips, or some absurd Gen-Z slop? If yes → brain_rot. Be GENEROUS — lean YES when in doubt. Look at the frame.

  ANY of these visual cues → brain_rot:
    • Cartoon visuals (Family Guy / Peter Griffin / Stewie / SpongeBob / Simpsons / Rick & Morty / any animated character clip)
    • Skibidi Toilet — animated toilet-head characters, cinematic-universe content
    • AI-generated characters: AI Peter Griffin / AI talking animals / AI horror narrators / AI cartoon mashups
    • Stacked / split-screen layout: main clip up top + Minecraft parkour / Subway Surfers / soap-cutting / cooking / slime running underneath
    • Anime clips with phonk / bass-heavy music (anime edits)
    • Sigma male / gigachad slow-mo edits with text overlays
    • TTS / AI voiceover reading over random b-roll or gameplay
    • Text-on-game-footage videos (white text over Minecraft parkour, story-time over Subway Surfers, etc.)
    • Ragebait edits, conspiracy / "did you know" with stock footage and AI voice
    • Brainrot meme content delivered via text-over-game (gyatt / rizz / ohio / fanum / mewing / looksmaxxing references over Minecraft/cooking)
    • Mr Beast-style quick-cut edits with constant zooms and text
    • Andrew Tate edits with phonk + cars + cash overlays
    • Anything that visually looks low-effort, AI-made, or stitched-together absurdity

  NOT brain_rot — return "other":
    × A real person filming themselves doing something (dancing, talking, vlog) → other
    × Real animals doing animal things (without AI overlay) → other or wholesome
    × A genuinely funny human sketch → comedy
    × Real cooking / fitness / tutorial → cooking / fitness / educational
    × A real podcast clip → other

  THE TEST: scan the frame. Is the visual STYLE animated, AI-generated, stitched-together, or absurd Gen-Z slop? Yes → brain_rot. Just real people doing real things? → other. Lean YES on brain_rot when in doubt — these videos are everywhere on the FYP.

- educational:
  IS: teaches a verifiable skill, fact, or concept with depth — tutorials, explainers, science, history, language, finance breakdowns.
  NOT: a makeup tutorial (that's beauty/brain_rot), a "did you know" with no substance, a generic "X simple trick" hack video.

- comedy:
  IS: genuinely funny — sketches with setup/punchline, witty reactions, absurd humor with clever editing, written jokes.
  NOT: cringe content, awkward situations played straight, mean-spirited pranks, generic POV memes without a real joke.

- wholesome:
  IS: heartwarming acts of kindness, family moments, animal rescues, reunions, paying-it-forward.
  NOT: cute cats/dogs alone (that's brain_rot), any romantic/relationship drama, sad-then-happy reaction baits.

- food_porn:
  IS: food shown for pure visual appeal — close-up plated dishes, eating ASMR, restaurant footage, food reviews. NO instruction.
  NOT: any video that shows actual recipe steps or cooking technique (that's cooking).

- cooking:
  IS: STRICT — recipe demonstration, ingredient prep, cooking technique. The video must SHOW someone cooking, with steps.
  NOT: food reviews. Restaurant b-roll. Food eating. "Talking about" a recipe. Plated finished dishes alone. Just because the caption says "recipe" does NOT make it cooking — the frame must show prep/cooking.

- news_politics:
  IS: news coverage, political commentary, current events, debate.
  NOT: a creator's emotional reaction to news without substance (that's drama_storytime).

- motivational:
  IS: genuine pep talks, training montages, success stories with substance, focused mindset content.
  NOT: generic "grind" music videos with no message. NOT bro voiceover over random gym clips.

- drama_storytime:
  IS: gossip, storytimes, internet drama recaps, "let me tell you about my day", reaction-to-news content.
  NOT: a documentary (that's educational).

- wind_down:
  IS: calming content — nature, ASMR, slow-paced lo-fi, no shouting, soft visuals.
  NOT: anything with bass drops or sudden noise. NOT motivational quotes over calm music.

- fitness:
  IS: gym + physique content. Includes:
    • Shirtless / sports-bra gym flex shots, physique reveals, "pump check" videos
    • Lifting demonstrations (deadlift, squat, bench press, OHP) with focus on form OR aesthetic
    • Bodybuilding content, men's/women's physique posing, natural lifting transformations
    • Gym session vlogs where the camera is on the body / the lift
    • "Aesthetic gym" content with bass-heavy music and slow-mo lifting
  NOT: gym vlogs that never show exercise or physique (those are other/lifestyle). NOT a baddie aesthetic gym video where the focus is the attractive woman's overall presentation (that's baddies). NOT a Tate-style flex with a Lambo (that's larp).

- baddies:
  THE RULE — common sense. Is there an attractive woman in the frame who is the focus (showing her face or body)? Yes → baddies. No → other. Don't overthink it.

  ANY of these in the frame → baddies:
    • A woman showing her face to the camera with intentional presentation (makeup done, posed, hair styled)
    • A woman showing her body (gym fit, swimwear, fashion, OOTD, fit check)
    • Gym girls — woman working out, doing weights, stretching, taking mirror selfies in gym wear
    • Fashion / outfit / "fit check" / get-ready-with-me / OOTD videos centered on a woman
    • Glam content — makeup transformations, glow-up reveals, "that girl" / "clean girl" aesthetic
    • Slow-mo walks, hair flips, model-style poses, lip-sync clips of attractive women
    • Pretty-privilege / "baddie" / "high value woman" content
    • Soft-girl, baddie aesthetic, lifestyle vlogs of attractive women
    • Dance / trend videos where the visual draw is the woman's appearance
    • Mirror selfie videos, pool/beach content, bedroom photoshoot vibes

  Be GENEROUS — when in doubt, lean YES on baddies. If there's a woman on screen who looks put-together / styled / intentional with her presentation, it's baddies.

  NOT baddies — return "other":
    × Talking head with no styling / casual / no appearance focus → other
    × Genuine makeup TUTORIAL (educational instruction) → educational
    × Food/cooking with someone in the background → cooking (if cooking) or other
    × Animated content (no real woman on screen) → brain_rot or other
    × A man on screen → other
    × A group/crowd shot where no individual woman is the focus → other

  THE TEST: do I see a woman who is clearly meant to be looked at (face/body, styled, intentional)? Yes → baddies. No → other. Lean YES when uncertain.

- startup:
  IS: STRICT — founders building/fundraising, YC/accelerators, indie hackers, SaaS, business advice specifically for founders, fundraising stories, tech entrepreneurship.
  NOT: generic finance advice. NOT career advice. NOT crypto/stock trading. NOT corporate office vlogs. NOT generic "side hustle" videos.

- larp:
  SCAN ALL FRAMES CAREFULLY: You are given up to 3 frames from different points in the video. Examine each one — foreground AND background — for any wealth markers. A luxury car parked behind the subject in one of the frames is still LARP. Don't just look at the main subject; scan the entire frame.

  ABSOLUTE OVERRIDE RULE: If you see ANY VISIBLE CASH in any frame — stacks of bills, money fan/spread, someone counting money, money rain, money gun, briefcase of cash, money on a table in front of someone, money being thrown — the answer is LARP. Always. Without exception. Confidence 0.9 minimum. Do not even consider any other category. Cash on screen is the single clearest LARP signal in the entire system.

  THE RULE — one rule, very simple: scan the visible frame for wealth markers. If you spot ANY of them — anywhere in the shot, foreground or background, briefly or prominently — the answer is larp. Do not analyze what the people are doing or saying. The video's "intent" doesn't matter. The only question: is there VISIBLE WEALTH in the frame?

  WEALTH MARKERS (any one of these in the frame = larp):
    • Any exotic/luxury car (Lambo, Ferrari, McLaren, Bentley, Rolls Royce, Porsche 911, G-Wagon, Maserati, Aston Martin, AMG, M5, vintage muscle, exotic supercar of any kind)
    • Any luxury watch (Rolex, Patek, AP, Richard Mille, Hublot, Cartier, Omega Daytona, big chunky diamond watches)
    • CASH IS ALWAYS LARP — any visible cash (stacks of bills, money fan/spread, counting money, money rain, money gun, scattered bills, briefcase of cash) → larp, no exceptions. This is the single clearest signal.
    • Designer logos (LV monogram, Gucci, Hermes orange box, Chanel double-C, Dior, Versace, Balenciaga, Prada)
    • Designer items (Birkin, bag, shoes, clothing)
    • Opulent interiors (marble, gold fixtures, chandeliers, infinity pool, sweeping staircase, oversized rooms, columns)
    • LUXURY private jet (Gulfstream, Citation, Embraer Phenom, Bombardier Global, Dassault Falcon — sleek twin-jet business aircraft), yacht (large white hull, multi-deck), helicopter, Ferrari-red Vegas hotel suite
    • Gold chains, iced-out jewelry, diamond grills, big diamond pendants
    • Casino chips, slot-machine wins, sports-book bet slips with big payouts
    • Whiskey + cigar + watch combo, classic wealth-aesthetics frames
    • Known wealth personalities on screen (Andrew Tate, Tristan Tate, Iman Gadzhi, Tai Lopez, Grant Cardone)
    • Crypto/trading screens with explicit profit numbers
    • Pet sitting near/on luxury items (cat on cash, dog with Rolex, exotic pet in a luxury setting)
    • Luxury hotel suites, first-class flight cabins
    • Anything else that visually communicates "I have money" — when in doubt, lean YES

  ONLY return "other" if the frame contains ZERO visible wealth markers (e.g. talking head against a plain wall, office vlog at a normal job, educational charts only, regular apartment).

  EXPLICITLY NOT a luxury aircraft (return "other" not larp):
    × Small prop plane (Cessna, Piper, single-engine)
    × Glider, ultralight, paraglider
    × Commercial airliner cabin or exterior (Boeing/Airbus passenger jet)
    × Inside-the-airport / TSA / boarding-pass scenes
    × Helicopter rescue / news / military
    Only LUXURY business jets and sleek private aircraft count.

  Ignore the subject and the activity. Ignore the caption. Just answer: is wealth visible? Yes → larp. No → other.

- other: anything that doesn't strongly fit one of the above with high confidence. Prefer "other" over a weak match. This is the safe default.

Mode → matching categories (set matches_mode = true if category appears in this list for the given mode):
- brain_rot: brain_rot, food_porn
- startup: startup
- learn: educational, startup
- laugh: comedy
- wind_down: wholesome, wind_down
- hype: motivational, fitness
- cooking: cooking
- custom: see CUSTOM MODE HANDLING below

CUSTOM MODE HANDLING:
When MODE is "custom", a CUSTOM_DESCRIPTION field will be present in the user message. Set matches_mode=true only if the video content genuinely matches that description based on visuals, on-screen text, caption, and hashtags.
- Be reasonably strict. Surface-level keyword overlap (e.g., a hashtag alone) is NOT enough — the video itself must be about the described topic.
- Don't be so strict that clearly relevant videos get rejected for missing one element.
- Set matches_mode=true only when your confidence is >= 0.65 that the video fits.
- Still populate "category" with the closest standard category (or "other" if none fit) — independent of the custom match decision.
- In "reason", briefly cite the evidence (e.g., "founder discussing seed round, matches startup description").

If your confidence is below 0.5 (or 0.65 for custom), err toward matches_mode = false. Skipping a maybe-match is better than wasting the user's time.`;

type CreatorMemo = Record<string, {
  category: string;
  count: number;
  lastSeen: number;
}>;

let writeQueue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.catch(() => {});
  return next;
}

// Managed Mood Scroll proxy by default: the extension talks to our server,
// which holds the real OpenAI key (a server-side env var) and calls OpenAI for
// it. Users paste nothing — it works free out of the box. A LOW-VALUE shared
// app token (baked in at build time via WXT_APP_TOKEN) is sent as the bearer
// so the proxy can reject random internet traffic and keep spend bounded. That
// token only unlocks the rate/spend-capped proxy — it is NOT the OpenAI key,
// so it is safe to ship inside the extension. Power users can override the
// endpoint/key in Options → Advanced.
const ENV = import.meta.env as unknown as Record<string, string | undefined>;
const DEFAULT_PROXY_URL =
  ENV.WXT_PROXY_URL || 'https://mood-scroll.vercel.app/api/openai';
const DEFAULT_APP_TOKEN = ENV.WXT_APP_TOKEN || '';
const DEFAULT_MODEL = 'gpt-4o';

// Mode-specific prompts — focused yes/no instead of the giant taxonomy.
// Returns `{category, matches_mode, confidence, reason}`. category is
// informational (used by Auto Scroll for adaptive duration).
const MODE_PROMPTS: Record<string, string> = {
  larp: `You classify TikTok videos for a "LARP" filter — luxury / wealth flex content.

Look at the attached frames. Is there any visible wealth in any frame? Examples:
- Luxury car (Lambo, Ferrari, McLaren, Bentley, Rolls Royce, Porsche, G-Wagon) — even in background
- Luxury watch (Rolex, Patek, AP, Richard Mille) — wrist shot or close-up
- Cash visible (stacks, fans, money on table, counting money)
- Designer items (Birkin, LV monogram, Hermes, Chanel, Gucci)
- Mansion / penthouse interior (marble, gold, infinity pool)
- Private jet (sleek business aircraft like Gulfstream — NOT small prop planes or commercial cabins)
- Gold chains, diamond jewelry
- Andrew Tate / Tristan Tate / Iman Gadzhi on screen

CASH = always larp, confidence 0.9+. Be GENEROUS — if you see wealth, it's larp.

NOT larp: talking head with no luxury visible, normal apartment, finance education charts, regular car review.

Output JSON only: {"category": "larp" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,

  brain_rot: `You classify TikTok videos for a "Brain Rot" filter — animated / AI / edited slop.

Look at the attached frames. Is the visual style animated, AI-generated, or stitched-together slop? Examples:
- Cartoon characters (Family Guy, Peter Griffin, SpongeBob, Simpsons, Rick & Morty, anime)
- AI-generated talking characters or AI voiceover narration
- Skibidi Toilet content
- Split-screen with game footage underneath (Subway Surfers, Minecraft parkour, soap cutting)
- Phonk / bass-music edits with anime or sigma slow-mo poses
- Text-over-game-footage videos
- Sigma male montages, gigachad edits
- Andrew Tate edits with phonk

NOT brain rot: real people just being themselves (dancing, talking, vlogging), real animals, genuine comedy with punchline.

THE TEST: animated / AI / edited / game-footage / slop? → brain_rot. Real person doing real things? → other.

Output JSON only: {"category": "brain_rot" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,

  cooking: `You classify TikTok videos for a "Cooking" filter — actual recipe and cooking technique.

Look at the attached frames. Does the video SHOW actual cooking happening? Examples:
- Recipe steps being demonstrated, ingredient prep, cooking technique
- Someone using a stove, oven, knife, mixer, whisk
- Food being assembled, baked, fried, plated mid-cooking

NOT cooking: food reviews, eating videos, restaurant b-roll, plated finished food, anyone just talking about food without cooking it.

THE TEST: do you see someone actually cooking with technique/steps? → cooking. Just food visible? → other.

Output JSON only: {"category": "cooking" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,

  laugh: `You classify TikTok videos for a "Laugh" filter — actually funny comedy.

Look at the attached frames + caption. Is this genuinely funny — sketch with setup/punchline, witty edit, absurd humor, clever timing?

NOT laugh: cringe content played straight, mean pranks, generic POV memes without a joke, awkward situations.

THE TEST: would a normal person genuinely laugh? → comedy. Just trying to be funny? → other.

Output JSON only: {"category": "comedy" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,

  fitness: `You classify TikTok videos for a "Fitness" filter — gym + physique content.

Look at the attached frames. Does the video show:
- Shirtless / sports-bra physique flex, pump check, body reveal
- Lifting demonstration (deadlift, squat, bench press, OHP) with form or aesthetic focus
- Bodybuilding pose, physique transformation
- Aesthetic gym content (slow-mo lifting with bass music, body in motion)

NOT fitness: gym vlogs that don't show exercise/physique, fashion at the gym (those are baddies if female focus), Tate-style flex with money/cars (that's larp).

Output JSON only: {"category": "fitness" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,

  baddies: `You classify TikTok videos for a "Baddies" filter — attractive women aesthetic content.

Look at the attached frames. Common sense: is there an attractive woman as the focus of the video (showing face or body with intentional styled presentation)?

- Gym girls (woman in workout fit, mirror selfie, doing exercise with aesthetic focus)
- Fashion / OOTD / fit check / GRWM videos centered on a woman
- Glam transformations, glow-ups, "that girl" / "clean girl" aesthetic
- Slow-mo walks, hair flips, model poses, lip-sync clips
- Mirror selfies, pool/beach content, bedroom photoshoot vibes

NOT baddies: man on screen, animated content, group/crowd with no focused woman, genuine makeup TUTORIAL with instruction, regular cooking with woman in background.

THE TEST: woman whose presentation is meant to be looked at? → baddies. No? → other.

Output JSON only: {"category": "baddies" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,

  custom: `You classify a TikTok video against a USER DESCRIPTION provided in the user message.

Look at the attached frames + caption. Does the video genuinely match the user's description? Be reasonably strict — surface keyword overlap is NOT a match; the video itself must be about the described topic.

If confidence is below 0.65, return matches_mode=false.

Output JSON only: {"category": "matches_user" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`
};

// Used for Auto Scroll (no filter, just adaptive watch duration per category).
const AUTO_SCROLL_PROMPT = `You categorize TikTok videos for adaptive watch duration. Return one of:
brain_rot, food_porn, comedy, cooking, fitness, larp, baddies, educational, wholesome, wind_down, motivational, news_politics, drama_storytime, other

Look at the attached frames + caption. Pick the closest single category.

Output JSON only: {"category": "<one of above>", "confidence": 0-1, "reason": "5 words"}`;

async function classifyWithClaude(args: {
  frames: string[];
  caption: string;
  hashtags: string[];
  sound: string;
  creator: string;
  mode: string;
  customDescription?: string;
  apiKey: string;
  proxyUrl?: string;
  model?: string;
  installId?: string;
}) {
  const stripPrefix = (dataUrl: string) =>
    dataUrl.replace(/^data:image\/jpeg;base64,/, '');

  // Pick the focused system prompt for this mode. Fall back to auto-scroll
  // generic prompt for any unrecognized mode (e.g. 'other').
  const systemPrompt = MODE_PROMPTS[args.mode] || AUTO_SCROLL_PROMPT;

  const customLine = args.mode === 'custom' && args.customDescription
    ? `USER DESCRIPTION: ${args.customDescription}\n\n`
    : '';

  const userText =
    customLine +
    `Caption: ${args.caption || '(none)'}\n` +
    `Hashtags: ${args.hashtags?.join(' ') || '(none)'}\n` +
    `Creator: ${args.creator || '(unknown)'}\n\n` +
    `${args.frames.length} video frame${args.frames.length === 1 ? '' : 's'} attached. Classify per the system prompt. JSON only.`;

  const baseUrl = (args.proxyUrl || DEFAULT_PROXY_URL).replace(/\/+$/, '');
  const modelToUse = args.model || DEFAULT_MODEL;

  // Our managed proxy and OpenAI both speak the Chat Completions format, so
  // that is the default. Only fall back to the Anthropic /v1/messages shape
  // for explicit LiteLLM-style endpoints a power user might configure.
  const useAnthropicFormat = /anthropic|\/messages|litellm/i.test(baseUrl);
  const useOpenAIFormat = !useAnthropicFormat;

  if (useOpenAIFormat) {
    // Frames are sent at the model's DEFAULT detail (no detail override) — the
    // proxy's hard spend cap is the budget backstop, so per-call resolution is
    // left at full quality for the best classification accuracy.
    const imageParts = (args.frames || []).map(frame => ({
      type: 'image_url' as const,
      image_url: {
        url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}`
      }
    }));
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${args.apiKey}`,
        // Anonymous install id — only used by OUR proxy for the first-100-free
        // gate. Harmless to upstreams that ignore unknown headers.
        ...(args.installId ? { 'x-ms-install': args.installId } : {})
      },
      body: JSON.stringify({
        model: modelToUse,
        max_tokens: 120,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: [...imageParts, { type: 'text', text: userText }] }
        ]
      })
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenAI ${res.status}: ${errorText.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenAI returned no text: ' + JSON.stringify(data).slice(0, 200));
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    try { return JSON.parse(cleaned); }
    catch (err) { throw new Error('parse_failed: ' + cleaned.slice(0, 200)); }
  }

  // Anthropic format path — used by any LiteLLM-style endpoint set in
  // the proxy URL field.
  const imageBlocks = (args.frames || []).map(frame => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: stripPrefix(frame)
    }
  }));
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelToUse,
      max_tokens: 120,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: userText }] }]
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Claude ${res.status}: ${errorText.slice(0, 300)}`);
  }
  const data = await res.json();
  const textBlock = Array.isArray(data?.content)
    ? data.content.find((b: any) => b?.type === 'text')
    : null;
  const text = textBlock?.text;
  if (!text) throw new Error('Claude returned no text: ' + JSON.stringify(data).slice(0, 200));
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  try { return JSON.parse(cleaned); }
  catch (err) { throw new Error('parse_failed: ' + cleaned.slice(0, 200)); }
}

async function checkCreatorMemo(creator: string): Promise<{ category: string; confidence: number } | null> {
  if (!creator || creator === 'unknown') return null;
  const stored = await chrome.storage.local.get('creator_memo');
  const memo: CreatorMemo = stored.creator_memo || {};
  const entry = memo[creator];
  if (!entry || entry.count < 2) return null;
  const confidence = Math.min(0.5 + entry.count * 0.15, 0.9);
  return { category: entry.category, confidence };
}

async function updateCreatorMemo(creator: string, category: string) {
  if (!creator || creator === 'unknown') return;
  await serialized(async () => {
    const stored = await chrome.storage.local.get('creator_memo');
    const memo: CreatorMemo = stored.creator_memo || {};
    const entry = memo[creator];
    if (entry && entry.category === category) {
      entry.count++;
      entry.lastSeen = Date.now();
    } else {
      memo[creator] = { category, count: 1, lastSeen: Date.now() };
    }
    await chrome.storage.local.set({ creator_memo: memo });
  });
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.runtime.openOptionsPage();
    }
    // On install AND update: reload any open TikTok tabs so the latest
    // content script kicks in immediately. Without this, refreshing the
    // extension at chrome://extensions leaves stale code running on
    // already-open tabs — new buttons/handlers won't work until manual
    // page refresh. This is the #1 source of "X button isn't working"
    // confusion.
    if (details.reason === 'install' || details.reason === 'update') {
      chrome.tabs.query({ url: 'https://www.tiktok.com/*' }, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id !== undefined) {
            chrome.tabs.reload(tab.id).catch(() => {});
          }
        });
      });
    }
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'classify') {
      handleClassify(msg).then(sendResponse).catch(err => sendResponse({ error: err.message }));
      return true;
    }
    if (msg.type === 'check_memo') {
      checkCreatorMemo(msg.creator)
        .then(r => sendResponse(r || { confidence: 0 }))
        .catch(err => sendResponse({ confidence: 0, error: err.message }));
      return true;
    }
    if (msg.type === 'update_memo') {
      updateCreatorMemo(msg.creator, msg.category)
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: err.message }));
      return true;
    }
    if (msg.type === 'tally') {
      handleTally(msg.category, msg.matched)
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: err.message }));
      return true;
    }
    if (msg.type === 'reset_session') {
      chrome.storage.local.set({ session: null })
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: err.message }));
      return true;
    }
    if (msg.type === 'open_receipt') {
      chrome.tabs.create({ url: chrome.runtime.getURL('receipt.html') })
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: String(err?.message ?? err) }));
      return true;
    }
    if (msg.type === 'open_options') {
      // Content scripts can't call openOptionsPage directly — relay it here so
      // a banner can jump the user straight to setup (paste-your-key, etc.).
      try { chrome.runtime.openOptionsPage(); sendResponse({ ok: true }); }
      catch (err: any) { sendResponse({ ok: false, error: String(err?.message ?? err) }); }
      return true;
    }
    if (msg.type === 'open_site') {
      // Opens the marketing site (e.g. pricing) when the free limit is hit.
      const path = typeof msg.path === 'string' ? msg.path : '';
      chrome.tabs.create({ url: `https://mood-scroll.vercel.app${path}` })
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: String(err?.message ?? err) }));
      return true;
    }
    if (msg.type === 'open_tiktok_settings') {
      // TikTok's "Refresh your For You feed" lives in Content Preferences.
      // Opens in a new tab so the user can click the refresh button themselves
      // (requires login). The pre-checked path: Settings → Content Preferences.
      chrome.tabs.create({ url: 'https://www.tiktok.com/setting/content-preferences' })
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: String(err?.message ?? err) }));
      return true;
    }
    if (msg.type === 'sidekick_on') {
      handleSidekick(true, msg.screenW, msg.screenH)
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ ok: false, error: String(err?.message ?? err) }));
      return true;
    }
    if (msg.type === 'sidekick_off') {
      handleSidekick(false, msg.screenW, msg.screenH)
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ ok: false, error: String(err?.message ?? err) }));
      return true;
    }
    if (msg.type === 'pop_out_side') {
      handlePopOut(msg.screenW || 1440, msg.screenH || 900)
        .then(r => sendResponse(r))
        .catch(err => sendResponse({ ok: false, error: err.message }));
      return true;
    }
  });

  async function handlePopOut(screenW: number, screenH: number) {
    const width = 440;
    const height = Math.min(screenH - 60, 900);
    const left = Math.max(0, screenW - width);
    const top = 40;
    const win = await chrome.windows.create({
      url: 'https://www.tiktok.com/foryou',
      type: 'popup',
      width, height, left, top,
      focused: true
    });
    return { ok: true, windowId: win?.id };
  }

  async function handleSidekick(on: boolean, screenW = 1440, screenH = 900) {
    const win = await chrome.windows.getCurrent();
    if (!win.id) return { ok: false, error: 'no current window' };
    if (on) {
      const targetW = 440;
      const targetH = Math.max(500, Math.min(screenH - 60, 900));
      // Only snapshot prev bounds if we don't already have one — avoids the
      // double-on bug where the second call would record the already-shrunk size.
      const existing = await chrome.storage.local.get('sidekickPrevBounds');
      if (!existing.sidekickPrevBounds && win.width && win.width > targetW + 100) {
        await chrome.storage.local.set({
          sidekickPrevBounds: { width: win.width, height: win.height, left: win.left, top: win.top }
        });
      }
      await chrome.windows.update(win.id, {
        state: 'normal',
        width: targetW,
        height: targetH,
        left: Math.max(0, screenW - targetW),
        top: 40
      });
      return { ok: true };
    } else {
      const { sidekickPrevBounds } = await chrome.storage.local.get('sidekickPrevBounds');
      if (sidekickPrevBounds) {
        await chrome.windows.update(win.id, sidekickPrevBounds);
        await chrome.storage.local.remove('sidekickPrevBounds');
      } else {
        await chrome.windows.update(win.id, { state: 'maximized' });
      }
      return { ok: true };
    }
  }

  // Stable anonymous id, generated once and stored locally. Used only by our
  // proxy to count distinct free installs (the first-100 gate). Never PII.
  async function getInstallId(): Promise<string> {
    const { installId } = await chrome.storage.local.get('installId');
    if (installId) return installId as string;
    const id = 'ms_' + (globalThis.crypto?.randomUUID?.()
      ?? (Date.now().toString(36) + Math.random().toString(36).slice(2)));
    await chrome.storage.local.set({ installId: id });
    return id;
  }

  async function handleClassify(msg: any) {
    const { apiKey, proxyUrl, model } = await chrome.storage.local.get(['apiKey', 'proxyUrl', 'model']);
    const personalKey = (apiKey || '').trim();
    const chosenModel = model || DEFAULT_MODEL;

    // PAID / BYO path: a personal OpenAI key is set → call OpenAI DIRECTLY with
    // it. Their key never touches our server. If they left the managed proxy URL
    // in place, route to api.openai.com so their key is actually used.
    if (personalKey) {
      const looksManaged = /mood-scroll|\/api\/openai/i.test(proxyUrl || '');
      const base = (proxyUrl && proxyUrl.trim() && !looksManaged)
        ? proxyUrl.trim()
        : 'https://api.openai.com';
      try {
        return await classifyWithClaude({ ...msg, apiKey: personalKey, proxyUrl: base, model: chosenModel });
      } catch (err: any) {
        console.error('[MoodScroll] BYO classify error:', err);
        return { error: String(err?.message ?? err) };
      }
    }

    // FREE path: managed proxy with the baked low-value app token + install id.
    const installId = await getInstallId();
    try {
      return await classifyWithClaude({
        ...msg,
        apiKey: DEFAULT_APP_TOKEN,
        proxyUrl: proxyUrl || DEFAULT_PROXY_URL,
        model: chosenModel,
        installId
      });
    } catch (err: any) {
      const m = String(err?.message ?? err);
      // Proxy says the first-100 free allotment (or spend cap) is used up.
      if (/free_limit_reached|\b402\b/.test(m)) return { error: 'free_limit_reached' };
      console.error('[MoodScroll] classify error:', err);
      return { error: m };
    }
  }

  async function handleTally(category: string, matched: boolean) {
    await serialized(async () => {
      const { session } = await chrome.storage.local.get('session');
      const now = Date.now();
      let s = session;
      if (!s || (now - s.startedAt) > 6 * 60 * 60 * 1000) {
        s = { startedAt: now, categories: {}, watched: 0, skipped: 0 };
      }
      s.categories[category] = (s.categories[category] || 0) + 1;
      if (matched) s.watched++;
      else s.skipped++;
      await chrome.storage.local.set({ session: s });
    });
  }
});
