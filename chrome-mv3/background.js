var background=function(){"use strict";var v,O;function I(t){return t==null||typeof t=="function"?{main:t}:t}let w=Promise.resolve();function k(t){const i=w.then(t,t);return w=i.catch(()=>{}),i}const b="https://api.openai.com",T="gpt-4o",M={larp:`You classify TikTok videos for a "LARP" filter — luxury / wealth flex content.

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

Output JSON only: {"category": "larp" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,brain_rot:`You classify TikTok videos for a "Brain Rot" filter — animated / AI / edited slop.

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

Output JSON only: {"category": "brain_rot" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,cooking:`You classify TikTok videos for a "Cooking" filter — actual recipe and cooking technique.

Look at the attached frames. Does the video SHOW actual cooking happening? Examples:
- Recipe steps being demonstrated, ingredient prep, cooking technique
- Someone using a stove, oven, knife, mixer, whisk
- Food being assembled, baked, fried, plated mid-cooking

NOT cooking: food reviews, eating videos, restaurant b-roll, plated finished food, anyone just talking about food without cooking it.

THE TEST: do you see someone actually cooking with technique/steps? → cooking. Just food visible? → other.

Output JSON only: {"category": "cooking" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,laugh:`You classify TikTok videos for a "Laugh" filter — actually funny comedy.

Look at the attached frames + caption. Is this genuinely funny — sketch with setup/punchline, witty edit, absurd humor, clever timing?

NOT laugh: cringe content played straight, mean pranks, generic POV memes without a joke, awkward situations.

THE TEST: would a normal person genuinely laugh? → comedy. Just trying to be funny? → other.

Output JSON only: {"category": "comedy" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,fitness:`You classify TikTok videos for a "Fitness" filter — gym + physique content.

Look at the attached frames. Does the video show:
- Shirtless / sports-bra physique flex, pump check, body reveal
- Lifting demonstration (deadlift, squat, bench press, OHP) with form or aesthetic focus
- Bodybuilding pose, physique transformation
- Aesthetic gym content (slow-mo lifting with bass music, body in motion)

NOT fitness: gym vlogs that don't show exercise/physique, fashion at the gym (those are baddies if female focus), Tate-style flex with money/cars (that's larp).

Output JSON only: {"category": "fitness" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,baddies:`You classify TikTok videos for a "Baddies" filter — attractive women aesthetic content.

Look at the attached frames. Common sense: is there an attractive woman as the focus of the video (showing face or body with intentional styled presentation)?

- Gym girls (woman in workout fit, mirror selfie, doing exercise with aesthetic focus)
- Fashion / OOTD / fit check / GRWM videos centered on a woman
- Glam transformations, glow-ups, "that girl" / "clean girl" aesthetic
- Slow-mo walks, hair flips, model poses, lip-sync clips
- Mirror selfies, pool/beach content, bedroom photoshoot vibes

NOT baddies: man on screen, animated content, group/crowd with no focused woman, genuine makeup TUTORIAL with instruction, regular cooking with woman in background.

THE TEST: woman whose presentation is meant to be looked at? → baddies. No? → other.

Output JSON only: {"category": "baddies" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`,custom:`You classify a TikTok video against a USER DESCRIPTION provided in the user message.

Look at the attached frames + caption. Does the video genuinely match the user's description? Be reasonably strict — surface keyword overlap is NOT a match; the video itself must be about the described topic.

If confidence is below 0.65, return matches_mode=false.

Output JSON only: {"category": "matches_user" or "other", "matches_mode": boolean, "confidence": 0-1, "reason": "5 words"}`},C=`You categorize TikTok videos for adaptive watch duration. Return one of:
brain_rot, food_porn, comedy, cooking, fitness, larp, baddies, educational, wholesome, wind_down, motivational, news_politics, drama_storytime, other

Look at the attached frames + caption. Pick the closest single category.

Output JSON only: {"category": "<one of above>", "confidence": 0-1, "reason": "5 words"}`;async function $(t){var x,P,E,L;const i=s=>s.replace(/^data:image\/jpeg;base64,/,""),u=M[t.mode]||C,o=(t.mode==="custom"&&t.customDescription?`USER DESCRIPTION: ${t.customDescription}

`:"")+`Caption: ${t.caption||"(none)"}
Hashtags: ${((x=t.hashtags)==null?void 0:x.join(" "))||"(none)"}
Creator: ${t.creator||"(unknown)"}

${t.frames.length} video frame${t.frames.length===1?"":"s"} attached. Classify per the system prompt. JSON only.`,n=(t.proxyUrl||b).replace(/\/+$/,""),a=t.model||T;if(/api\.openai\.com/i.test(n)){const s=(t.frames||[]).map(d=>({type:"image_url",image_url:{url:d.startsWith("data:")?d:`data:image/jpeg;base64,${d}`}})),f=await fetch(`${n}/v1/chat/completions`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${t.apiKey}`},body:JSON.stringify({model:a,max_tokens:120,temperature:0,messages:[{role:"system",content:u},{role:"user",content:[...s,{type:"text",text:o}]}]})});if(!f.ok){const d=await f.text();throw new Error(`OpenAI ${f.status}: ${d.slice(0,300)}`)}const p=await f.json(),N=(L=(E=(P=p==null?void 0:p.choices)==null?void 0:P[0])==null?void 0:E.message)==null?void 0:L.content;if(!N)throw new Error("OpenAI returned no text: "+JSON.stringify(p).slice(0,200));const A=N.replace(/^```(?:json)?\s*|\s*```$/g,"").trim();try{return JSON.parse(A)}catch{throw new Error("parse_failed: "+A.slice(0,200))}}const r=(t.frames||[]).map(s=>({type:"image",source:{type:"base64",media_type:"image/jpeg",data:i(s)}})),h=await fetch(`${n}/v1/messages`,{method:"POST",headers:{"content-type":"application/json","x-api-key":t.apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:a,max_tokens:120,temperature:0,system:u,messages:[{role:"user",content:[...r,{type:"text",text:o}]}]})});if(!h.ok){const s=await h.text();throw new Error(`Claude ${h.status}: ${s.slice(0,300)}`)}const l=await h.json(),y=Array.isArray(l==null?void 0:l.content)?l.content.find(s=>(s==null?void 0:s.type)==="text"):null,S=y==null?void 0:y.text;if(!S)throw new Error("Claude returned no text: "+JSON.stringify(l).slice(0,200));const _=S.replace(/^```(?:json)?\s*|\s*```$/g,"").trim();try{return JSON.parse(_)}catch{throw new Error("parse_failed: "+_.slice(0,200))}}async function J(t){if(!t||t==="unknown")return null;const c=((await chrome.storage.local.get("creator_memo")).creator_memo||{})[t];if(!c||c.count<2)return null;const o=Math.min(.5+c.count*.15,.9);return{category:c.category,confidence:o}}async function B(t,i){!t||t==="unknown"||await k(async()=>{const c=(await chrome.storage.local.get("creator_memo")).creator_memo||{},o=c[t];o&&o.category===i?(o.count++,o.lastSeen=Date.now()):c[t]={category:i,count:1,lastSeen:Date.now()},await chrome.storage.local.set({creator_memo:c})})}const D=I(()=>{chrome.runtime.onInstalled.addListener(o=>{o.reason==="install"&&chrome.runtime.openOptionsPage(),(o.reason==="install"||o.reason==="update")&&chrome.tabs.query({url:"https://www.tiktok.com/*"},n=>{n.forEach(a=>{a.id!==void 0&&chrome.tabs.reload(a.id).catch(()=>{})})})}),chrome.runtime.onMessage.addListener((o,n,a)=>{if(o.type==="classify")return u(o).then(a).catch(e=>a({error:e.message})),!0;if(o.type==="check_memo")return J(o.creator).then(e=>a(e||{confidence:0})).catch(e=>a({confidence:0,error:e.message})),!0;if(o.type==="update_memo")return B(o.creator,o.category).then(()=>a({ok:!0})).catch(e=>a({ok:!1,error:e.message})),!0;if(o.type==="tally")return c(o.category,o.matched).then(()=>a({ok:!0})).catch(e=>a({ok:!1,error:e.message})),!0;if(o.type==="reset_session")return chrome.storage.local.set({session:null}).then(()=>a({ok:!0})).catch(e=>a({ok:!1,error:e.message})),!0;if(o.type==="open_receipt")return chrome.tabs.create({url:chrome.runtime.getURL("receipt.html")}).then(()=>a({ok:!0})).catch(e=>a({ok:!1,error:String((e==null?void 0:e.message)??e)})),!0;if(o.type==="open_tiktok_settings")return chrome.tabs.create({url:"https://www.tiktok.com/setting/content-preferences"}).then(()=>a({ok:!0})).catch(e=>a({ok:!1,error:String((e==null?void 0:e.message)??e)})),!0;if(o.type==="sidekick_on")return i(!0,o.screenW,o.screenH).then(e=>a(e)).catch(e=>a({ok:!1,error:String((e==null?void 0:e.message)??e)})),!0;if(o.type==="sidekick_off")return i(!1,o.screenW,o.screenH).then(e=>a(e)).catch(e=>a({ok:!1,error:String((e==null?void 0:e.message)??e)})),!0;if(o.type==="pop_out_side")return t(o.screenW||1440,o.screenH||900).then(e=>a(e)).catch(e=>a({ok:!1,error:e.message})),!0});async function t(o,n){const e=Math.min(n-60,900),r=Math.max(0,o-440),l=await chrome.windows.create({url:"https://www.tiktok.com/foryou",type:"popup",width:440,height:e,left:r,top:40,focused:!0});return{ok:!0,windowId:l==null?void 0:l.id}}async function i(o,n=1440,a=900){const e=await chrome.windows.getCurrent();if(!e.id)return{ok:!1,error:"no current window"};if(o){const h=Math.max(500,Math.min(a-60,900));return!(await chrome.storage.local.get("sidekickPrevBounds")).sidekickPrevBounds&&e.width&&e.width>540&&await chrome.storage.local.set({sidekickPrevBounds:{width:e.width,height:e.height,left:e.left,top:e.top}}),await chrome.windows.update(e.id,{state:"normal",width:440,height:h,left:Math.max(0,n-440),top:40}),{ok:!0}}else{const{sidekickPrevBounds:r}=await chrome.storage.local.get("sidekickPrevBounds");return r?(await chrome.windows.update(e.id,r),await chrome.storage.local.remove("sidekickPrevBounds")):await chrome.windows.update(e.id,{state:"maximized"}),{ok:!0}}}async function u(o){const{apiKey:n,proxyUrl:a,model:e}=await chrome.storage.local.get(["apiKey","proxyUrl","model"]);if(!n)return{error:"No API key. Open the options page."};try{return await $({...o,apiKey:n,proxyUrl:a||b,model:e||T})}catch(r){return console.error("[MoodScroll] classify error:",r),{error:String((r==null?void 0:r.message)??r)}}}async function c(o,n){await k(async()=>{const{session:a}=await chrome.storage.local.get("session"),e=Date.now();let r=a;(!r||e-r.startedAt>6*60*60*1e3)&&(r={startedAt:e,categories:{},watched:0,skipped:0}),r.categories[o]=(r.categories[o]||0)+1,n?r.watched++:r.skipped++,await chrome.storage.local.set({session:r})})}});function U(){}(O=(v=globalThis.browser)==null?void 0:v.runtime)!=null&&O.id?globalThis.browser:globalThis.chrome;function m(t,...i){}const j={debug:(...t)=>m(console.debug,...t),log:(...t)=>m(console.log,...t),warn:(...t)=>m(console.warn,...t),error:(...t)=>m(console.error,...t)};let g;try{g=D.main(),g instanceof Promise&&console.warn("The background's main() function return a promise, but it must be synchronous")}catch(t){throw j.error("The background crashed on startup!"),t}return g}();
background;
