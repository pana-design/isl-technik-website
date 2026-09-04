import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
for(const [n,w,h] of [['SE',375,667],['15',393,852],['ProMax',430,932],['iPadP',820,1180]]){
  const p=await b.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true});
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
  await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const cs=getComputedStyle(document.getElementById('hero'));
    const hr=document.getElementById('heroHouse').getBoundingClientRect();
    return {p0:cs.getPropertyValue('--p').trim(), hausH:Math.round(hr.height), hausUnten:Math.round(hr.bottom)};
  });
  console.log(n, w+'x'+h, JSON.stringify(r));
  await p.close();
}
await b.close();
