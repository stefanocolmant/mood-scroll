var content=function(){"use strict";var Je=Object.defineProperty;var Qe=(q,M,H)=>M in q?Je(q,M,{enumerable:!0,configurable:!0,writable:!0,value:H}):q[M]=H;var P=(q,M,H)=>Qe(q,typeof M!="symbol"?M+"":M,H);var he,fe;function q(i){return i}const M=[{id:"auto_scroll",emoji:"⏩",label:"Auto Scroll",matches:[],broadMatches:[]},{id:"brain_rot",emoji:"🧠💀",label:"Brain Rot",matches:["brain_rot","food_porn"],broadMatches:["brain_rot","food_porn","comedy"]},{id:"cooking",emoji:"🍳",label:"Cooking",matches:["cooking"],broadMatches:["cooking","food_porn"]},{id:"laugh",emoji:"😂",label:"Laugh",matches:["comedy"],broadMatches:["comedy","brain_rot"]},{id:"larp",emoji:"💎",label:"LARP",matches:["larp"],broadMatches:["larp","motivational","fitness"]},{id:"fitness",emoji:"💪",label:"Fitness",matches:["fitness"],broadMatches:["fitness","motivational"]},{id:"baddies",emoji:"💅",label:"Baddies",matches:["baddies"],broadMatches:["baddies"]},{id:"custom",emoji:"✨",label:"Custom",matches:[],broadMatches:[]}],H=new Set(["fyp","foryoupage","foryou","viral","trending","parati","xyzbca"]),Te={cooking:{keywords:["recipe","how to make","how to cook","ingredients:","preheat","simmer for","sauté","whisk together","fold in","minutes at","stir in","bake at"],hashtags:["cookingtiktok","easyrecipe","recipevideo","cookingclass","cheflife","kitchenhacks"]},educational:{keywords:["how to","tutorial","explained","tip:","did you know","pro tip","lesson","fact:","in this video"],hashtags:["learnontiktok","edutok","studytok","didyouknow","sciencetok","history","tutorial"]},comedy:{keywords:["skit","pov:","when you","when my","me when","tell me without telling me","pov when"],hashtags:["comedy","funny","humor","jokes","meme","lmao"]},fitness:{keywords:["shirtless","pump","pump cover","gym session","workout","deadlift","squat","bench press","chest day","back day","leg day","arm day","lifting","gainz","shredded","physique","natty","mens physique","bodybuilding","cutting","bulking","reps","sets","rep range","gym pr","six pack","aesthetic gym","gym flex","flexing muscle"],hashtags:["gymtok","fittok","fitness","gymrat","bodybuilding","physique","gainz","gym","gymflex","shredded","mensphysique","womensphysique","natty","lifting","fitfam","fitspo","workout","gymmotivation","gymlife","chestday","backday","legday","pumpcover","sixpack","aestheticgym","gymbros","gymtransformation"]},baddies:{keywords:["baddie","bad bitch","pretty privilege","glam","glow up","outfit of the day","ootd","fit check","feeling cute","baddie aesthetic","gym girl","fit girl","gym fit","how she walks","just girls"],hashtags:["baddie","baddies","baddietok","baddievibes","baddieaesthetic","badbitch","badbitchenergy","fitgirl","fitgirls","gymgirl","gymgirls","gymbaddie","glam","glamour","glammakeup","ootd","fashiongirl","fashionista","fitcheck","fitcheckdaily","glowup","glowupchallenge","instabaddie","baddiesonly","thatgirl","cleangirl","cleangirlaesthetic","softgirl","gymgirlaesthetic","gymgirlfit"]},motivational:{keywords:["grind","success","never give up","mindset","discipline","hustle","mentality"],hashtags:["motivation","sigma","mindset","success","entrepreneur","inspiration"]},brain_rot:{keywords:["skibidi","skibidi toilet","sigma","gigachad","gyatt","rizz","ohio","fanum","mewing","looksmax","looksmaxxing","subway surfers","minecraft parkour","ai voice","ai narrator","ai voiceover","peter griffin","family guy edit","stewie","spongebob edit","simpsons edit","anime edit","animeedit"],hashtags:["skibidi","skibiditoilet","brainrot","sigma","sigmaedit","sigmamale","gigachad","gyatt","rizz","ohio","fanumtax","mewing","looksmaxxing","aigenerated","aivoice","aivideo","aishorts","airelaxing","familyguy","familyguyedit","peterstewieedit","petergriffin","spongebob","spongebobedit","simpsonsedit","rickandmorty","phonk","phonky","phonkedit","phonkmusic","animeedit","animeedits","manhwa","manhwaedit","subwaysurfers","minecraftparkour","parkour","edit","edits","cope","slop","sloppost","ragebait"]},wholesome:{keywords:["rescued","wholesome","made my day","good news"],hashtags:["wholesome","cute","feelgood","adoption","kindness"]},food_porn:{keywords:[],hashtags:["foodporn","food","yummy","tasty","foodie"]},larp:{keywords:["lamborghini","lambo","ferrari","mclaren","rolls royce","bentley","aventador","huracan","urus","g wagon","g-wagon","g63","rolex","patek philippe","audemars piguet","richard mille","birkin","louis vuitton","hermes bag","gucci flex","secured the bag","first million","made my first million","luxury lifestyle","i'm rich","i'm so rich","rich kid","private jet","mansion tour","penthouse tour","andrew tate","tristan tate","iman gadzhi","tai lopez","grant cardone","alpha male","sigma grindset","high value man"],hashtags:["lambo","lamborghini","ferrari","mclaren","bentley","rollsroyce","supercar","supercars","exoticcars","exoticcar","sportscar","sportscars","luxurycar","luxurycars","aventador","huracan","urus","gwagon","g63","rolex","rolexwatch","patekphilippe","audemarspiguet","richardmille","luxurywatches","birkin","hermesbirkin","louisvuitton","gucciflex","luxurylifestyle","richlife","millionairelifestyle","billionairelifestyle","millionaire","billionaire","andrewtate","tristantate","sigmamale","alphamale","sigmagrindset","sigmaedit","highvalueman","imanagadzhi","tailopez","grantcardone","flex","moneyflex","getrichquick","privatejet","oldmoney","newmoney","hustlegrindset"]},startup:{keywords:["startup","founder","y combinator"," yc ","seed round","series a","mvp","product market fit","pmf","fundraising","pitch deck","launching","building in public","saas","indie hacker"],hashtags:["startup","startups","founder","founders","ycombinator","yc","startuplife","entrepreneur","saas","indiehackers","buildinpublic","techstartup","siliconvalley","techtok"]}};function Ce(i,o,c){const m=o.map(x=>x.toLowerCase().replace(/^#/,"")).filter(x=>!H.has(x)),v=((i||"")+" "+(c||"")).toLowerCase(),b={};for(const[x,k]of Object.entries(Te)){let y=0;for(const W of k.keywords)v.includes(W)&&(y+=2);for(const W of k.hashtags)m.includes(W)&&(y+=3);y>0&&(b[x]=y)}const A=Object.entries(b).sort((x,k)=>k[1]-x[1]);if(!A.length)return{category:null,confidence:0};const[I,F]=A[0];return{category:I,confidence:Math.min(F/6,.95)}}const Le={matches:["https://www.tiktok.com/*"],main(){const i={videoSelector:"video",itemSelector:'[data-e2e="recommend-list-item-container"]',captionSelector:'[data-e2e="video-desc"]',audioSelector:'[data-e2e="video-music"]',creatorSelector:'a[href^="/@"]',likeIconSelector:'[data-e2e="like-icon"]',likeAriaSelector:'button[aria-label*="Like" i]',scrollContainerId:"column-list-container",minVideoHeight:200,decisionIntervalMs:1500,tickIntervalMs:500,likeDelayMinMs:4e3,likeDelayJitterMs:3e3,likeProbability:.55,likeRateLimitWindowMs:36e5,likeRateLimitMax:20};let o=null,c="",m=!0,v=!1,b=!1,A=0,I=null;const F=new Set,x=[];let k="training";const y=[],W=10,_e=.6,Re=.4,Ne={decisionIntervalMs:300,likeProbability:1,useFrames:!0},Oe={decisionIntervalMs:2500,likeProbability:.3,useFrames:!0},ce=()=>k==="training"?Ne:Oe,ze={brain_rot:2500,food_porn:4e3,baddies:5e3,comedy:5500,fitness:7e3,larp:7500,motivational:8e3,wholesome:7500,wind_down:9e3,cooking:1e4,news_politics:11e3,educational:13e3,startup:13e3,drama_storytime:15e3,other:6e3};function $e(e){return ze[e||"other"]||6e3}function be(e,t){const s=$e(e),a=t!=null&&t.duration&&isFinite(t.duration)&&t.duration>0?Math.floor(t.duration*1e3):0;if(a>0){const n=Math.max(2500,Math.floor(a*.92));return Math.min(s,n)}return s}let T=0,_=0;setInterval(()=>{if(T===0||!o||o==="auto_scroll")return;const e=N();if(!(!e||!e.currentSrc)){if(_>0&&e.currentTime+.5<_){console.log("[MoodScroll] video looped, advancing immediately"),T=0,_=0,z(e.currentSrc);return}if(e.duration&&e.currentTime>e.duration-.5){console.log("[MoodScroll] video about to loop, advancing now"),T=0,_=0,z(e.currentSrc);return}_=e.currentTime}},250);const ee=new Set(["larp","baddies","fitness","brain_rot"]),Pe={startup:["dance","dancing","makeup","beauty","fashion","outfit","nails","hair","asmr","slime","satisfying","cat","cats","dog","dogs","pets","animals","food","foodporn","cooking","recipe","foodtok","restaurant","workout","gym","gymtok","fitness","bodybuilding","pov","skit","comedy","funny","meme","humor","jokes","prank","storytime","gossip","drama","tea","relationship","sports","football","basketball","soccer","nba","nfl","music","song","singing","dance challenge","lifehack","travel","wedding","gaming","minecraft","fortnite"],learn:["dance","makeup","beauty","fashion","outfit","nails","comedy","funny","meme","humor","jokes","pov","skit","asmr","slime","satisfying","prank","storytime","gossip","drama","tea","relationship","gaming","sports","wedding","travel"],cooking:["dance","dancing","makeup","beauty","fashion","outfit","nails","hair","workout","gym","fitness","bodybuilding","cardio","startup","business","finance","crypto","stocks","asmr","slime","sleep","gaming","minecraft","fortnite","sports","football","basketball"],laugh:["recipe","cooking","foodtok","workout","gym","fitness","cardio","tutorial","study","studytok","history","science","edu","startup","business","finance","investing","crypto","news","politics","asmr","sleep","wholesome"],hype:["asmr","slime","sleep","wholesome","cooking","recipe","foodtok","startup","tutorial","study","sad","cry","breakup","gossip","drama","storytime","news","politics","gaming"],wind_down:["workout","gym","fitness","cardio","hiit","hustle","grind","startup","business","finance","comedy","meme","prank","funny","news","politics","sports","gaming","fortnite","minecraft","dance challenge","shock","fight"],brain_rot:["startup","business","finance","tutorial","study","history","science","edu","learnontiktok","news","politics","documentary"],food_porn:["dance","workout","gym","startup","finance","tutorial","study","history","science","sports","gaming","news","politics","comedy","skit","pov"],larp:["cooking","recipe","foodtok","dance","dancing","makeup","beauty","nails","hair","comedy","meme","skit","prank","tutorial","study","history","science","edu","gaming","minecraft","fortnite","asmr","slime","sleep","wholesome","news","politics"],fitness:["cooking","recipe","foodtok","startup","business","finance","crypto","tutorial","study","history","science","edu","gaming","minecraft","fortnite","asmr","slime","sleep","wholesome","news","politics","comedy","meme","skit","prank","dance challenge"],baddies:["cooking","recipe","foodtok","startup","business","finance","crypto","tutorial","study","history","science","edu","gaming","minecraft","fortnite","asmr","slime","sleep","news","politics","wholesome","family"]};chrome.storage.local.get(["currentMode","customDescription","autoEngage","sidekickActive"]).then(e=>{o=e.currentMode||null,c=e.customDescription||"",m=e.autoEngage!==!1,v=!!e.sidekickActive,v&&ye(),L()}),chrome.runtime.onMessage.addListener(e=>{e.type==="set_mode"&&(o=e.mode,I=null,me(),L()),e.type==="stop"&&(o=null,I=null,me(),L())});function ye(){if(document.getElementById("moodscroll-sidekick-css"))return;const e=document.createElement("style");e.id="moodscroll-sidekick-css",e.textContent=`
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
      `,document.head.appendChild(e)}function qe(){var e;(e=document.getElementById("moodscroll-sidekick-css"))==null||e.remove()}let R=null,l=null;function le(){R&&document.documentElement.contains(R)||(document.querySelectorAll("#moodscroll-overlay-root").forEach(e=>e.remove()),R=document.createElement("div"),R.id="moodscroll-overlay-root",R.style.cssText="all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;",l=R.attachShadow({mode:"open"}),l.innerHTML=He(),document.documentElement.appendChild(R),Fe(),L(),ue())}function He(){return`
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
  <div class="ms-grid">${M.map(t=>`<button class="ms-mode" data-mode="${t.id}"><span class="ms-emoji">${t.emoji}</span><span class="ms-label">${t.label}</span></button>`).join("")}</div>
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
      `}function Fe(){if(!l)return;const e=l.getElementById("ms-toggle"),t=l.getElementById("ms-panel"),s=l.getElementById("ms-close"),a=l.getElementById("ms-custom-wrap"),n=l.getElementById("ms-custom-input"),r=l.getElementById("ms-engage-toggle"),d=l.getElementById("ms-stop"),h=l.getElementById("ms-receipt-btn");e.addEventListener("click",()=>{t.classList.toggle("open")}),s.addEventListener("click",()=>t.classList.remove("open")),l.querySelectorAll(".ms-mode").forEach(u=>{u.addEventListener("click",()=>{const w=u.dataset.mode;w==="custom"?(a.classList.add("show"),n.value=c,n.focus(),c?te("custom"):L()):(a.classList.remove("show"),te(w))})}),n.addEventListener("keydown",u=>{if(u.key==="Enter"){const w=n.value.trim();if(!w)return;c=w,chrome.storage.local.set({customDescription:w}),te("custom")}}),n.addEventListener("blur",()=>{const u=n.value.trim();u&&u!==c&&(c=u,chrome.storage.local.set({customDescription:u}),o==="custom"&&L())}),r.checked=m,r.addEventListener("change",()=>{m=r.checked,chrome.storage.local.set({autoEngage:m})}),d.addEventListener("click",()=>{o=null,chrome.storage.local.set({currentMode:null}),L()}),h.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"open_receipt"}).catch(()=>{})});const g=l.getElementById("ms-reset-btn");g||console.warn("[MoodScroll] Reset button NOT FOUND — old content script still running? Close + reopen the TikTok tab."),g&&(console.log("[MoodScroll] Reset button wired up ✓"),g.addEventListener("click",async u=>{u.stopPropagation(),u.preventDefault(),console.log("[MoodScroll] 🔄 Reset Algo clicked");const w=o;o=null,y.length=0,k="training",T=0,_=0,I=null,F.clear(),x.length=0,await chrome.storage.local.set({currentMode:null,justReset:!0}).catch(()=>{});const Y=await chrome.runtime.sendMessage({type:"reset_session"}).catch(C=>({error:String(C)}));console.log("[MoodScroll] session cleared:",Y),de(),ue(),L(),j(!0,"🔄 RESET"),Ge();const $=await chrome.runtime.sendMessage({type:"open_tiktok_settings"}).catch(C=>({error:String(C)}));console.log("[MoodScroll] TikTok settings tab opened:",$,"(was mode:",w,")"),setTimeout(()=>{console.log("[MoodScroll] 🔁 Reloading TikTok tab to /foryou for clean state…"),window.location.href="https://www.tiktok.com/foryou"},2200)}));const S=l.getElementById("ms-sidekick-btn");S&&S.addEventListener("click",async()=>{const u=window.screen.availWidth,w=window.screen.availHeight;v?(await chrome.runtime.sendMessage({type:"sidekick_off",screenW:u,screenH:w}).catch(()=>{}),v=!1,qe(),chrome.storage.local.set({sidekickActive:!1})):(await chrome.runtime.sendMessage({type:"sidekick_on",screenW:u,screenH:w}).catch(()=>{}),v=!0,ye(),chrome.storage.local.set({sidekickActive:!0}),o||te("auto_scroll"),t.classList.remove("open")),L()});const D=l.getElementById("ms-popout-btn");D&&D.addEventListener("click",async()=>{await chrome.runtime.sendMessage({type:"pop_out_side",screenW:window.screen.availWidth,screenH:window.screen.availHeight}).catch(()=>{}),t.classList.remove("open")})}function te(e){o=e,chrome.storage.local.set({currentMode:e}),I=null,me(),L()}function L(){if(!l)return;const e=l.getElementById("ms-toggle"),t=l.getElementById("ms-toggle-icon"),s=l.getElementById("ms-active-line"),a=l.getElementById("ms-active-text"),n=l.getElementById("ms-custom-wrap"),r=l.getElementById("ms-sidekick-btn");if(!(!e||!t||!s||!a||!n)){if(l.querySelectorAll(".ms-mode").forEach(d=>{const h=d.dataset.mode;d.classList.toggle("active",h===o)}),o){const d=M.find(h=>h.id===o);e.classList.add("active"),t.textContent=(d==null?void 0:d.emoji)||"✨",s.classList.add("show"),o==="custom"?(a.textContent=`Custom — "${c||"(empty)"}"`,n.classList.add("show")):o==="auto_scroll"?a.textContent="Auto Scroll · every 5s":a.textContent=(d==null?void 0:d.label)||o}else e.classList.remove("active"),t.textContent="✨",s.classList.remove("show");r&&(r.classList.toggle("active",v),r.textContent=v?"✕ Exit Phone Mode":"📱 Phone Mode")}}function j(e,t){if(!l)return;const s=l.getElementById("ms-flash");s&&(o==="auto_scroll"?(s.textContent=`⏩ ${t}`,s.className="ms-flash show match"):(s.textContent=e?`MATCH · ${t}`:`SKIP · ${t}`,s.className="ms-flash show "+(e?"match":"skip")),setTimeout(()=>s.classList.remove("show"),1800))}function ve(e){y.push(e),y.length>W&&y.shift();const t=y.filter(Boolean).length,s=y.length?t/y.length:0;let a=k;if(k==="training"&&y.length>=5&&s>=_e?a="stable":k==="stable"&&s<Re&&(a="training"),a!==k){const n=k;k=a,console.log("[MoodScroll] phase →",k,`(${t}/${y.length})`),n==="training"&&a==="stable"&&je()}de()}function je(){if(!l)return;const e=l.getElementById("ms-locked-banner");if(!e)return;const t=M.find(a=>a.id===o),s=o==="custom"?`"${c||"Custom"}"`:((t==null?void 0:t.label)||o||"").toUpperCase();e.querySelector(".ms-locked-title").textContent=`${s} LOCKED IN`,e.classList.add("show"),setTimeout(()=>e.classList.remove("show"),4e3)}function Ve(){if(!l)return;const e=l.getElementById("ms-locked-banner");if(!e)return;const t=e.querySelector(".ms-locked-title"),s=e.querySelector(".ms-locked-sub"),a=e.querySelector(".ms-locked-icon");a.textContent="🔑",t.textContent="ADD YOUR API KEY",s.innerHTML="Mood Scroll needs your own OpenAI key to classify videos.<br><br>Click the extension icon in Chrome's toolbar → Options → paste your <code>sk-...</code> key → Save.",e.classList.add("show"),setTimeout(()=>e.classList.remove("show"),12e3)}function Ge(){if(!l)return;const e=l.getElementById("ms-locked-banner");if(!e)return;const t=e.querySelector(".ms-locked-title"),s=e.querySelector(".ms-locked-sub"),a=e.querySelector(".ms-locked-icon"),n=t.textContent,r=s.textContent,d=a.textContent;a.textContent="🔄",t.textContent="RESET COMPLETE",s.textContent='Refreshing feed… click "Refresh your For You feed" in the new tab too',e.classList.add("show"),setTimeout(()=>{e.classList.remove("show"),setTimeout(()=>{a.textContent=d||"🎯",t.textContent=n||"LOCKED IN",s.textContent=r||"Algorithm tuned · scrolling at natural pace"},600)},4500)}function de(){if(!l)return;const e=l.getElementById("ms-phase"),t=l.getElementById("ms-phase-label"),s=l.getElementById("ms-phase-stat"),a=l.getElementById("ms-phase-fill");if(!e||!t||!s||!a)return;if(!o||o==="auto_scroll"){e.classList.remove("show");return}e.classList.add("show");const n=y.filter(Boolean).length,r=y.length?Math.round(n/y.length*100):0;k==="training"?(e.classList.remove("stable"),t.textContent="Training (broad cluster)",s.textContent=`${n}/${y.length||0} matched`):(e.classList.add("stable"),t.textContent=`Tuned · strict ${r}%`,s.textContent="auto pace"),a.style.width=`${r}%`}function me(){k="training",y.length=0,de()}async function ue(){if(l)try{const{session:e}=await chrome.storage.local.get("session"),t=(e==null?void 0:e.watched)||0,s=(e==null?void 0:e.skipped)||0,a=(e==null?void 0:e.startedAt)||Date.now(),n=Math.floor((Date.now()-a)/1e3),r=Math.floor(n/60),d=n%60,h=l.getElementById("ms-watched"),g=l.getElementById("ms-skipped"),S=l.getElementById("ms-timer");h&&(h.textContent=String(t)),g&&(g.textContent=String(s)),S&&(S.textContent=`${r}:${String(d).padStart(2,"0")}`)}catch{}}let pe=null;const We=new MutationObserver(()=>{pe||(pe=window.setTimeout(()=>{pe=null,(!R||!document.documentElement.contains(R))&&le()},250))});document.documentElement&&(le(),We.observe(document.documentElement,{childList:!0})),document.addEventListener("DOMContentLoaded",()=>le(),{once:!0}),setInterval(ue,1e3),chrome.storage.local.get(["justReset"]).then(({justReset:e})=>{if(!e)return;chrome.storage.local.remove("justReset");const t=()=>{if(!l){setTimeout(t,200);return}const s=l.getElementById("ms-locked-banner");if(!s){setTimeout(t,200);return}const a=s.querySelector(".ms-locked-title"),n=s.querySelector(".ms-locked-sub"),r=s.querySelector(".ms-locked-icon");r.textContent="✅",a.textContent="RESET DONE",n.textContent="Pick a mode to start training a fresh algorithm",s.classList.add("show"),setTimeout(()=>s.classList.remove("show"),4e3)};t()}),setInterval(()=>{if(!o||o==="auto_scroll"||T===0||Date.now()<T)return;const e=N();if(!e){T=0,_=0;return}T=0,_=0,z(e.currentSrc)},250);let oe=!1,U=null;setInterval(async()=>{var s,a,n,r;if(o!=="auto_scroll"){U=null;return}if(oe)return;const e=N();if(!e)return;const t=e.currentSrc;if(U!==t){U=t,oe=!0;try{const d=e.closest(i.itemSelector),h=d||document,g=((a=(s=h.querySelector(i.captionSelector))==null?void 0:s.textContent)==null?void 0:a.trim())||"";if(we(d,g)){j(!1,"sponsored ad"),chrome.runtime.sendMessage({type:"tally",category:"other",matched:!1}).catch(()=>{}),z(t),oe=!1,U=null;return}const S=Array.from(g.matchAll(/#([\w]+)/g)).map(f=>f[1]),D=((r=(n=h.querySelector(i.audioSelector))==null?void 0:n.textContent)==null?void 0:r.trim())||"",u=h.querySelector(i.creatorSelector),w=((u==null?void 0:u.getAttribute("href"))||"").replace(/^\/@/,"@").split("?")[0]||"unknown",Y=await ge(e),$=await chrome.runtime.sendMessage({type:"classify",frames:Y?[Y]:[],caption:g,hashtags:S,sound:D,creator:w,mode:"other"}).catch(()=>null),C=($==null?void 0:$.category)||"other",V=be(C,e);T=Date.now()+V,j(!0,`${C} · ${Math.round(V/1e3)}s`),chrome.runtime.sendMessage({type:"tally",category:C,matched:!0}).catch(()=>{}),m&&Ee(t,!0),console.log(`[MoodScroll] auto-scroll: ${C}, holding ${V}ms`)}catch{T=Date.now()+5e3}finally{oe=!1}return}Date.now()>=T&&(z(t),U=null)},500),setInterval(async()=>{var e,t,s,a;try{if(!o||b||o==="auto_scroll"||o==="custom"&&!c||Date.now()-A<ce().decisionIntervalMs)return;const n=N();if(!n||n.currentSrc===I)return;b=!0;const r=n.currentSrc,d=o,h=n.closest(i.itemSelector),g=h||document,S=((t=(e=g.querySelector(i.captionSelector))==null?void 0:e.textContent)==null?void 0:t.trim())||"",D=Array.from(S.matchAll(/#([\w]+)/g)).map(p=>p[1]),u=((a=(s=g.querySelector(i.audioSelector))==null?void 0:s.textContent)==null?void 0:a.trim())||"",w=g.querySelector(i.creatorSelector),$=((w==null?void 0:w.getAttribute("href"))||"").replace(/^\/@/,"@").split("?")[0]||"unknown";if(o!=="custom"&&!S&&$==="unknown"){b=!1;return}if(we(h,S)){chrome.runtime.sendMessage({type:"tally",category:"other",matched:!1}).catch(()=>{}),I=r,A=Date.now(),b=!1,j(!1,"📣 sponsored ad"),console.log("[MoodScroll] SKIP sponsored ad"),z(r);return}const C=ee.has(o||"")?[]:Pe[o||""]||[],V=D.map(p=>p.toLowerCase());if(C.length&&C.some(p=>V.includes(p.toLowerCase()))){const p=C.find(E=>V.includes(E.toLowerCase()));chrome.runtime.sendMessage({type:"tally",category:"other",matched:!1}).catch(()=>{}),I=r,A=Date.now(),b=!1,j(!1,`pre-skip #${p}`),ve(!1),console.log("[MoodScroll] INSTANT SKIP via negative hashtag",`#${p}`,"for",o),z(r);return}let f=null;if(o!=="custom"&&!ee.has(o||"")){const p=Ce(S,D,u);if(p.confidence>=.8&&p.category){const E=M.find(ne=>ne.id===o),B=(E==null?void 0:E.matches)??[];B.includes(p.category)||(f={category:p.category,confidence:p.confidence},console.log(`[MoodScroll] Tier1 confident SKIP: ${p.category} ∉ [${B.join(",")}]`))}}if(!f){const p=ce().useFrames||o==="custom"||ee.has(o||"");let E=[];if(p){if(E=await Ye(n),E.length===0){const K=await ge(n);K&&(E=[K])}}else{const K=await ge(n);K&&(E=[K])}const B=await chrome.runtime.sendMessage({type:"classify",frames:E,caption:S,hashtags:D,sound:u,creator:$,mode:o,customDescription:o==="custom"?c:void 0}),ne=N();if(!ne||ne.currentSrc!==r){b=!1;return}if(B!=null&&B.error){console.warn("[MoodScroll] classify error:",B.error),typeof B.error=="string"&&/api key/i.test(B.error)&&(Ve(),o=null,chrome.storage.local.set({currentMode:null}).catch(()=>{}),L()),b=!1;return}f=B;const Ie=new Set(["larp","baddies","brain_rot"]).has(o||"")?.3:ee.has(o||"")?.4:.6;f&&typeof f.confidence=="number"&&f.confidence<Ie&&(console.log(`[MoodScroll] Low confidence (${f.confidence} < ${Ie}) → demoting to 'other'`),f={...f,category:"other"})}if(!f){b=!1;return}const O=M.find(p=>p.id===o),Xe=k==="stable"?(O==null?void 0:O.matches)??[]:(O==null?void 0:O.broadMatches)??(O==null?void 0:O.matches)??[],se=o==="custom"?typeof f.matches_mode=="boolean"?f.matches_mode:!1:Xe.includes(f.category);chrome.runtime.sendMessage({type:"tally",category:f.category,matched:se}).catch(()=>{}),I=r,A=Date.now(),b=!1;const Me=N();if(!Me||Me.currentSrc!==r){console.log("[MoodScroll] video advanced before decision applied, dropping");return}if(j(se,f.category),ve(se),!se)console.log("[MoodScroll] SKIP:",f.category,"|",f.reason||""),z(r);else{const p=N(),E=be(f.category,p);T=Date.now()+E,_=0,console.log(`[MoodScroll] MATCH: ${f.category}, holding ${E}ms (dur=${p==null?void 0:p.duration}s) | ${f.reason||""}`),m&&Ee(r,!0)}}catch(n){console.error("[MoodScroll] loop error:",n),b=!1}},i.tickIntervalMs);function N(){const e=document.querySelectorAll(i.videoSelector);if(!e.length)return null;const t=window.innerHeight/2;let s=null,a=1/0;for(const n of e){const r=n.getBoundingClientRect();if(r.height<i.minVideoHeight||r.bottom<0||r.top>window.innerHeight||!n.currentSrc)continue;const d=(r.top+r.bottom)/2,h=Math.abs(d-t);h<a&&(a=h,s=n)}return s}function ke(){return Array.from(document.querySelectorAll(i.itemSelector))}function Ue(e){for(const t of ke()){const s=t.querySelector("video");if(s&&s.currentSrc===e)return t}return null}function we(e,t){if(!e)return!1;const s=['[data-e2e="ad-info"]','[data-e2e="video-ad"]','[data-e2e="ad-card"]','[data-e2e="ad-overlay"]','[data-e2e="ad-tag"]','[data-e2e="branded-content-tag"]','[data-e2e="paid-partnership-tag"]'];for(const d of s)if(e.querySelector(d))return!0;const a=e.textContent||"";if(/(^|\s)(Sponsored|Promoted|Advertisement|Paid partnership)(\s|$|\.|,)/i.test(a)||/#(ad|sponsored|spon|paidpromotion|paidpartnership|partnership|brandpartner|sponsoredpost|brandeddeal|advertorial)\b/i.test(t))return!0;const r=['button[data-e2e*="ad-button" i]','a[data-e2e*="ad-link" i]','a[href*="utm_source=tiktok"]'];for(const d of r)if(e.querySelector(d))return!0;return!1}function xe(e){if(e.readyState<2)return null;try{const t=document.createElement("canvas");t.width=480,t.height=854;const s=t.getContext("2d");return s?(s.drawImage(e,0,0,t.width,t.height),t.toDataURL("image/jpeg",.75)):null}catch{return null}}async function ge(e){let t=xe(e);if(t)return t;try{await e.play().catch(()=>{})}catch{}for(let s=0;s<5;s++)if(await new Promise(a=>setTimeout(a,200)),t=xe(e),t)return t;return null}async function Ye(e){const t=[],s=[400,500,500],a=e.currentSrc;for(const n of s){if(n>0&&await new Promise(r=>setTimeout(r,n)),e.paused||e.readyState<2||e.currentSrc!==a)break;try{const r=document.createElement("canvas");r.width=480,r.height=854;const d=r.getContext("2d");if(!d)continue;d.drawImage(e,0,0,r.width,r.height),t.push(r.toDataURL("image/jpeg",.75))}catch(r){console.warn("[MoodScroll] frame capture failed:",r)}}return t}function z(e){Se(e),setTimeout(()=>{const t=N();t&&t.currentSrc===e&&Se(e)},400)}function Se(e){const t=ke(),s=Ue(e)||t.find(n=>{const r=n.getBoundingClientRect();return r.top<window.innerHeight/2&&r.bottom>window.innerHeight/2});if(s&&t.length){const n=t.indexOf(s),r=n>=0?t[n+1]:null;if(r){r.scrollIntoView({behavior:"smooth",block:"center"});return}}const a=document.getElementById(i.scrollContainerId);if(a){a.scrollBy({top:a.clientHeight,behavior:"smooth"});return}window.scrollBy({top:window.innerHeight,behavior:"smooth"})}function Ee(e,t=!1){if(F.has(e)||!t&&Math.random()>ce().likeProbability)return;const s=Date.now();for(;x.length&&s-x[0]>i.likeRateLimitWindowMs;)x.shift();if(x.length>=i.likeRateLimitMax){console.log("[MoodScroll] like rate-limit reached, skipping");return}const a=t?800+Math.random()*600:i.likeDelayMinMs+Math.random()*i.likeDelayJitterMs;setTimeout(()=>{const n=N();if(!n||n.currentSrc!==e)return;const d=n.closest(i.itemSelector)||document,h=d.querySelector(i.likeIconSelector),g=(h==null?void 0:h.closest("button"))||d.querySelector(i.likeAriaSelector);if(((g==null?void 0:g.getAttribute("aria-label"))||"").toLowerCase().startsWith("unlike")||(g==null?void 0:g.getAttribute("aria-pressed"))==="true"){F.add(e);return}const D=Ke(n);let u=!1;g&&(g.click(),u=!0),F.add(e),x.push(Date.now()),console.log(`[MoodScroll] ❤️ liked match (dblclick=${D}, btn=${u})`)},a)}function Ke(e){try{const t=e.getBoundingClientRect(),s=t.left+t.width/2,a=t.top+t.height/2,n={bubbles:!0,cancelable:!0,clientX:s,clientY:a,button:0,buttons:1,view:window};return e.dispatchEvent(new MouseEvent("mousedown",n)),e.dispatchEvent(new MouseEvent("mouseup",n)),e.dispatchEvent(new MouseEvent("click",n)),setTimeout(()=>{e.dispatchEvent(new MouseEvent("mousedown",n)),e.dispatchEvent(new MouseEvent("mouseup",n)),e.dispatchEvent(new MouseEvent("click",n)),e.dispatchEvent(new MouseEvent("dblclick",n))},80),!0}catch(t){return console.warn("[MoodScroll] double-tap failed:",t),!1}}}},X=(fe=(he=globalThis.browser)==null?void 0:he.runtime)!=null&&fe.id?globalThis.browser:globalThis.chrome;function J(i,...o){}const Ae={debug:(...i)=>J(console.debug,...i),log:(...i)=>J(console.log,...i),warn:(...i)=>J(console.warn,...i),error:(...i)=>J(console.error,...i)},Z=class Z extends Event{constructor(o,c){super(Z.EVENT_NAME,{}),this.newUrl=o,this.oldUrl=c}};P(Z,"EVENT_NAME",ae("wxt:locationchange"));let re=Z;function ae(i){var o;return`${(o=X==null?void 0:X.runtime)==null?void 0:o.id}:content:${i}`}function De(i){let o,c;return{run(){o==null&&(c=new URL(location.href),o=i.setInterval(()=>{let m=new URL(location.href);m.href!==c.href&&(window.dispatchEvent(new re(m,c)),c=m)},1e3))}}}const G=class G{constructor(o,c){P(this,"isTopFrame",window.self===window.top);P(this,"abortController");P(this,"locationWatcher",De(this));P(this,"receivedMessageIds",new Set);this.contentScriptName=o,this.options=c,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(o){return this.abortController.abort(o)}get isInvalid(){return X.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(o){return this.signal.addEventListener("abort",o),()=>this.signal.removeEventListener("abort",o)}block(){return new Promise(()=>{})}setInterval(o,c){const m=setInterval(()=>{this.isValid&&o()},c);return this.onInvalidated(()=>clearInterval(m)),m}setTimeout(o,c){const m=setTimeout(()=>{this.isValid&&o()},c);return this.onInvalidated(()=>clearTimeout(m)),m}requestAnimationFrame(o){const c=requestAnimationFrame((...m)=>{this.isValid&&o(...m)});return this.onInvalidated(()=>cancelAnimationFrame(c)),c}requestIdleCallback(o,c){const m=requestIdleCallback((...v)=>{this.signal.aborted||o(...v)},c);return this.onInvalidated(()=>cancelIdleCallback(m)),m}addEventListener(o,c,m,v){var b;c==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),(b=o.addEventListener)==null||b.call(o,c.startsWith("wxt:")?ae(c):c,m,{...v,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),Ae.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){window.postMessage({type:G.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(o){var b,A,I;const c=((b=o.data)==null?void 0:b.type)===G.SCRIPT_STARTED_MESSAGE_TYPE,m=((A=o.data)==null?void 0:A.contentScriptName)===this.contentScriptName,v=!this.receivedMessageIds.has((I=o.data)==null?void 0:I.messageId);return c&&m&&v}listenForNewerScripts(o){let c=!0;const m=v=>{if(this.verifyScriptStartedEvent(v)){this.receivedMessageIds.add(v.data.messageId);const b=c;if(c=!1,b&&(o!=null&&o.ignoreFirstEvent))return;this.notifyInvalidated()}};addEventListener("message",m),this.onInvalidated(()=>removeEventListener("message",m))}};P(G,"SCRIPT_STARTED_MESSAGE_TYPE",ae("wxt:content-script-started"));let ie=G;function et(){}function Q(i,...o){}const Be={debug:(...i)=>Q(console.debug,...i),log:(...i)=>Q(console.log,...i),warn:(...i)=>Q(console.warn,...i),error:(...i)=>Q(console.error,...i)};return(async()=>{try{const{main:i,...o}=Le,c=new ie("content",o);return await i(c)}catch(i){throw Be.error('The content script "content" crashed on startup!',i),i}})()}();
content;
