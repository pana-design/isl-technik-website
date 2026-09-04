import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
for(const h of [711,740]){ const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:393,height:h}}); const p=await ctx.newPage();
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
  console.log(h, await p.evaluate(()=>{const sp=document.querySelector('.spacer[data-for="hero"]'); const cs=getComputedStyle(sp);
    const hero=document.getElementById('hero'); const hs=getComputedStyle(hero);
    return {spDisplay:cs.display,spHeight:cs.height,off:sp.offsetHeight,heroPos:hs.position,heroH:hs.height,img:hs.getPropertyValue('--hero-img'),svh:CSS.supports('height','100svh')};})); await ctx.close(); }
await b.close();
