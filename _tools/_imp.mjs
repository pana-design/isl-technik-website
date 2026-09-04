import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
for(const [n,o] of [['m',{...devices['iPhone 15'],viewport:{width:393,height:852}}],['d',{viewport:{width:1512,height:982}}]]){
  const ctx=await b.newContext(o); const p=await ctx.newPage();
  await p.goto('http://localhost:8080/impressum.html',{waitUntil:'networkidle'});
  const r=await p.evaluate(()=>{const h=document.querySelector('.legal h1').getBoundingClientRect(); const n=document.querySelector('.nav').getBoundingClientRect(); return {h1top:Math.round(h.top),navBottom:Math.round(n.bottom)};});
  console.log(n,JSON.stringify(r)); await p.screenshot({path:process.argv[2]+'/imp-'+n+'.png'}); await ctx.close();
}
await b.close();
