/* Hero mobil: Screens entlang des Scrollwegs (Anteile von "Bildoberkante erreicht Viewport-Oberkante") */
import { chromium, webkit, devices } from 'playwright-core';
import { mkdirSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const ENGINE=process.env.ENGINE||'chromium', W=+(process.env.W||393), H=+(process.env.H||852), OUT=process.argv[2]||'shots-mobil/hero3';
const FR=(process.env.FR||'0,0.1,0.3,0.5,0.65,0.8,1.0,1.3').split(',').map(Number);
mkdirSync(OUT,{recursive:true});
const b=ENGINE==='webkit'?await webkit.launch():await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H},deviceScaleFactor:2});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(1200);
const top=await p.evaluate(()=>{let y=0;for(let e=document.querySelector('.hero__bg');e;e=e.offsetParent)y+=e.offsetTop;return y;});
for(const f of FR){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(f*top)); await p.waitForTimeout(700);
  const st=await p.evaluate(()=>{const h=document.getElementById('hero');
    const ls=[...document.querySelectorAll('.hero__lens')].map(l=>{const r=l.getBoundingClientRect();return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}px o=${getComputedStyle(l).opacity}`});
    const house=document.getElementById('heroHouse').getBoundingClientRect();
    return {zu:h.style.getPropertyValue('--zu'), on:h.classList.contains('is-lens'), ls, house:[Math.round(house.left),Math.round(house.top),Math.round(house.width),Math.round(house.height)]};});
  const name=`${OUT}/${ENGINE[0]}${W}x${H}_${String(Math.round(f*100)).padStart(3,'0')}.png`; await p.screenshot({path:name});
  console.log(`p=${f} y=${Math.round(f*top)}: zu=${st.zu||'-'} on=${st.on} haus(l,t,w,h)=${st.house} lupen=${st.ls.join(' | ')}`);
}
console.log('bildoben',top,'Viewport',W+'x'+H,ENGINE,errs.length?'FEHLER '+errs[0]:'keine JS-Fehler');
await b.close();
