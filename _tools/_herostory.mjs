/* Hero-Geschichte mobil (is-story): Screens entlang des Spacer-Scrollwegs.
   FR = Anteile des Spacers (negativ = vor dem Klebepunkt), ENGINE, W, H wie gewohnt. */
import { chromium, webkit, devices } from 'playwright-core';
import { mkdirSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const ENGINE=process.env.ENGINE||'chromium', W=+(process.env.W||393), H=+(process.env.H||660), OUT=process.argv[2]||'shots-mobil/story';
const FR=(process.env.FR||'-0.5,0,0.05,0.2,0.4,0.6,0.7,0.85,1.0,1.15,1.4').split(',').map(Number);
mkdirSync(OUT,{recursive:true});
const b=ENGINE==='webkit'?await webkit.launch():await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H},deviceScaleFactor:2});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(1200);
const m=await p.evaluate(()=>{const h=document.getElementById('hero'); const sp=document.querySelector('.spacer[data-for="hero"]');
  return {story:h.classList.contains('is-story'), top:getComputedStyle(h).top, heroH:h.offsetHeight, spacer:sp?sp.offsetHeight:0};});
const s0=-parseFloat(m.top)||0, span=m.spacer;
console.log('is-story',m.story,'top',m.top,'heroH',m.heroH,'spacer',span,'s0',s0);
for(const f of FR){
  const y=Math.max(0,Math.round(s0+f*span));
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y); await p.waitForTimeout(700);
  const st=await p.evaluate(()=>{const h=document.getElementById('hero');
    const ls=[...document.querySelectorAll('.hero__lens')].map(l=>getComputedStyle(l).opacity).join('/');
    const house=document.getElementById('heroHouse').getBoundingClientRect(); const v=document.querySelector('.hero__clip');
    const rest=document.querySelector('.stack__rest').getBoundingClientRect();
    return {zu:h.style.getPropertyValue('--zu'), on:h.classList.contains('is-lens'), ls, houseTop:Math.round(house.top), houseBottom:Math.round(house.bottom), heroTop:Math.round(h.getBoundingClientRect().top), restTop:Math.round(rest.top), video:v?(v.paused?'pause':'spielt'):'-'};});
  const name=`${OUT}/${ENGINE[0]}${W}x${H}_${String(Math.round(f*100)).padStart(4,'0').replace('-','m')}.png`; await p.screenshot({path:name});
  console.log(`f=${f} y=${y}: zu=${st.zu||'-'} lupen=${st.on}(${st.ls}) heroTop=${st.heroTop} haus=${st.houseTop}..${st.houseBottom} restTop=${st.restTop} video=${st.video}`);
}
console.log('Viewport',W+'x'+H,ENGINE,errs.length?'FEHLER '+errs[0]:'keine JS-Fehler');
await b.close();
