/* Gezielte Mobil-Screens: node _mobspots.mjs <out> <id:anteil|end> ...  (W/H/ENGINE per Env) */
import { chromium, webkit, devices } from 'playwright-core';
import { mkdirSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [OUT,...SPOTS]=process.argv.slice(2); mkdirSync(OUT,{recursive:true});
const W=+(process.env.W||393),H=+(process.env.H||852),ENGINE=process.env.ENGINE||'chromium';
const b=ENGINE==='webkit'?await webkit.launch():await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H},deviceScaleFactor:2}); const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(1000);
for(const s of SPOTS){
  const [id,f]=s.split(':');
  const y=await p.evaluate(async([id,f])=>{ scrollTo({top:0,behavior:'instant'}); await new Promise(r=>setTimeout(r,120)); if(id==='end') return document.documentElement.scrollHeight-innerHeight; if(id==='y') return +f;
    let y=0,e=document.getElementById(id);while(e){y+=e.offsetTop;e=e.offsetParent;}
    const sp=document.querySelector(`.spacer[data-for="${id}"]`); const t=sp?sp.offsetHeight:0; return Math.round(y+t*(+f||0)); },[id,f]);
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y); await p.waitForTimeout(1400);
  const info=await p.evaluate(()=>[...document.querySelectorAll('video')].filter(v=>!v.paused).map(v=>(v.currentSrc||'').split('/').pop()+'@'+v.currentTime.toFixed(1)));
  const name=`${OUT}/${s.replace(':','_')}.png`; await p.screenshot({path:name}); console.log(name,'y='+y,'spielt:',info.join(',')||'-');
}
console.log(errs.length?'FEHLER '+errs[0]:'keine JS-Fehler'); await b.close();
