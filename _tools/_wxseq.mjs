import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2]; const W=+(process.env.W||393), H=+(process.env.H||852);
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H}}); const p=await ctx.newPage();
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
const info=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); const sp=document.querySelector('.spacer[data-for="lichtschacht"]');
  let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} return {y,travel:sp.offsetHeight,h:c.offsetHeight,pos:getComputedStyle(c).position,ih:innerHeight};});
console.log(info);
for(const f of [-0.3,0,0.2,0.4,0.6,0.7,0.8,0.9,1.0,1.15,1.3]){
  await p.evaluate(([y,t,f])=>scrollTo({top:y+t*f,behavior:'instant'}),[info.y,info.travel,f]);
  await p.waitForTimeout(900);
  const m=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); const fr=c.querySelector('.wx__frame').getBoundingClientRect(); const bar=c.querySelector('.wx__bar').getBoundingClientRect();
    const st=document.getElementById('stimmen').getBoundingClientRect(); return {p:c.style.getPropertyValue('--p'),card:Math.round(c.getBoundingClientRect().top),frame:[Math.round(fr.top),Math.round(fr.bottom)],bar:[Math.round(bar.top),Math.round(bar.bottom)],stimmenTop:Math.round(st.top)};});
  console.log(f,JSON.stringify(m));
  await p.screenshot({path:`${OUT}/wx-${String(f).replace('-','m')}.png`});
}
await b.close();
