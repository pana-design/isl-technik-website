/* Hero-Sequenz mobil: Screens entlang des gepinnten Scrollwegs (Lupe wandert, dann Schutz zu) */
import { chromium, webkit, devices } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const ENGINE=process.env.ENGINE||'chromium', W=+(process.env.W||393), H=+(process.env.H||852), OUT=process.argv[2]||'shots-mobil/hero';
mkdirSync(OUT,{recursive:true});
const b=ENGINE==='webkit'?await webkit.launch():await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H},deviceScaleFactor:2});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(1200);
const span=await p.evaluate(()=>(document.querySelector('.spacer[data-for="hero"]')||{}).offsetHeight||0);
const shots=[];
for(const f of [0,0.15,0.36,0.55,0.72,0.86,1.0,1.25]){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(f*span)); await p.waitForTimeout(650);
  const st=await p.evaluate(()=>{const h=document.getElementById('hero'); const l=document.getElementById('heroLens');
    const chips=document.querySelector('.hero__chips'); const cr=chips.getBoundingClientRect(); const house=document.getElementById('heroHouse').getBoundingClientRect();
    const v=document.querySelector('.hero__clip');
    return {zu:h.style.getPropertyValue('--zu'), lens:h.classList.contains('is-lens'), lx:l.style.getPropertyValue('--lx'), ly:l.style.getPropertyValue('--ly'),
      chipsBottom:Math.round(cr.bottom), house:[Math.round(house.left),Math.round(house.width),Math.round(house.height)], cat:v?(v.paused?'pause':'spielt'):'-',
      cta:Math.round(document.querySelector('.hero__cta').getBoundingClientRect().bottom)};});
  const name=`${OUT}/h_${String(Math.round(f*100)).padStart(3,'0')}.png`; await p.screenshot({path:name}); shots.push(name);
  console.log(`p=${f}: zu=${st.zu} lens=${st.lens} lx=${st.lx} ly=${st.ly} chipsBottom=${st.chipsBottom} ctaBottom=${st.cta} house=${st.house} Katze=${st.cat}`);
}
console.log('span',span,'Viewport',W+'x'+H,'engine',ENGINE,errs.length?'FEHLER '+errs[0]:'keine JS-Fehler');
await b.close();
