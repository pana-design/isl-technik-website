import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
// Kundenstimmen + Impressum mobil
let ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:393,height:852}}); let p=await ctx.newPage();
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
await p.evaluate(()=>{const c=document.getElementById('stimmen'); const sp=document.querySelector('.spacer[data-for="stimmen"]'); let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} scrollTo({top:y+sp.offsetHeight*0.2,behavior:'instant'});});
await p.waitForTimeout(900); await p.screenshot({path:OUT+'/stimmen-m.png'});
await p.goto('http://localhost:8080/impressum.html',{waitUntil:'networkidle'}); await p.screenshot({path:OUT+'/impressum-m.png',fullPage:true});
await ctx.close();
// Desktop Wetter-Buehne Regression
ctx=await b.newContext({viewport:{width:1512,height:982}}); p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
const info=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); const sp=document.querySelector('.spacer[data-for="lichtschacht"]'); let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} return {y,t:sp.offsetHeight};});
for(const f of [0.2,0.5,0.85]){ await p.evaluate(([y,t,f])=>scrollTo({top:y+t*f,behavior:'instant'}),[info.y,info.t,f]); await p.waitForTimeout(900);
  const m=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); return {p:c.style.getPropertyValue('--p'),nacht:getComputedStyle(c.querySelector('.wx__phase--nacht')).opacity,regen:getComputedStyle(c.querySelector('.wx__phase--regen')).opacity,playing:[...c.querySelectorAll('video')].map(v=>!v.paused)};});
  console.log('desktop',f,JSON.stringify(m)); await p.screenshot({path:`${OUT}/desk-${f}.png`}); }
console.log('errors:',errs);
await b.close();
