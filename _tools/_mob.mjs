import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
for(const [n,w,h] of [['393',393,852],['820',820,1180],['1280',1280,720]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
  await p.waitForTimeout(2200);
  await p.screenshot({path:`shots/_hero_${n}.png`});
  await p.close();
}
await b.close();
