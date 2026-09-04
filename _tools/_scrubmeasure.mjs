/* Misst, wie fluessig ein Produktclip beim Scrollen wirklich mitlaeuft:
   praesentierte Frames (requestVideoFrameCallback) und Abstand zwischen
   gewuenschter und angezeigter Clipposition. OVERRIDE=datei ersetzt den
   Spannrahmen-Clip testweise durch eine andere Kodierung. */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OVERRIDE=process.env.OVERRIDE, STEP=+(process.env.STEP||8);
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:982}});
if(OVERRIDE){
  await p.route("**/img/systeme/spannrahmen.mp4",r=>r.continue({url:"http://localhost:8080/"+OVERRIDE})); }
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const geo=await p.evaluate(()=>{let y=0,e=document.getElementById('systeme');while(e){y+=e.offsetTop;e=e.offsetParent;}
  return {sys:y,travel:document.querySelector('.spacer[data-for="systeme"]').offsetHeight};});
await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geo.sys-200);
await p.waitForTimeout(1500);                      // Clip laden lassen
await p.evaluate(()=>{
  const fig=document.querySelector('.systems__shot[data-i="0"]'); const v=fig.querySelector('video');
  window.__m={shown:[],want:[],v};
  const onf=(now,meta)=>{window.__m.shown.push({t:Math.round(now),mt:+meta.mediaTime.toFixed(3)}); v.requestVideoFrameCallback(onf);};
  v.requestVideoFrameCallback(onf);
  const card=document.getElementById('systeme');
  const tick=now=>{const pv=parseFloat(getComputedStyle(card).getPropertyValue('--p'))||0;
    const eff=Math.min(1,Math.max(0,(pv-0.08)/0.84)); const idx=Math.floor(eff*7);
    if(idx===0){const want=(eff*7-idx)*Math.max(0,v.duration-0.06); window.__m.want.push({t:Math.round(now),w:+want.toFixed(3),ct:+v.currentTime.toFixed(3)});}
    requestAnimationFrame(tick);}; requestAnimationFrame(tick);
});
await p.mouse.move(700,500);
const t0=Date.now();
// Schritt 1 (Spannrahmen) langsam durchfahren: hold + 1/7 des Wegs
const span=geo.travel*(0.08+0.84/7)+200;
let sent=0; while(sent<span){ await p.mouse.wheel(0,STEP); sent+=STEP; await p.waitForTimeout(16); }
await p.waitForTimeout(600);
const m=await p.evaluate(()=>({shown:window.__m.shown,want:window.__m.want,dur:window.__m.v.duration,w:window.__m.v.videoWidth,h:window.__m.v.videoHeight}));
const secs=(Date.now()-t0)/1000;
// Lag: fuer jeden rAF-Wunsch den zuletzt praesentierten Frame suchen
let lagSum=0,lagMax=0,n=0,j=0;
for(const w of m.want){ while(j+1<m.shown.length&&m.shown[j+1].t<=w.t) j++; if(!m.shown.length||m.shown[j].t>w.t) continue;
  const lag=Math.abs(w.w-m.shown[j].mt); lagSum+=lag; lagMax=Math.max(lagMax,lag); n++; }
const distinct=new Set(m.shown.map(s=>s.mt)).size;
console.log(`${OVERRIDE?'NEU ('+OVERRIDE.split('/').pop()+')':'ORIGINAL'}  ${m.w}x${m.h} ${m.dur.toFixed(2)}s | Scrollzeit ${secs.toFixed(1)}s | praesentierte Frames: ${m.shown.length} (${(m.shown.length/secs).toFixed(1)}/s, ${distinct} verschiedene) | Abstand Soll/Ist: Ø ${(lagSum/Math.max(1,n)*1000).toFixed(0)} ms, max ${(lagMax*1000).toFixed(0)} ms | rAF-Frames ${m.want.length}`);
await b.close();
