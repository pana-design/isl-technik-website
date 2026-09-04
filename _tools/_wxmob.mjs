import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:393,height:852}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.evaluate(()=>{let y=0,el=document.getElementById('lichtschacht');
  while(el){y+=el.offsetTop;el=el.offsetParent;}
  window.scrollTo(0,y-60);});
await p.waitForTimeout(1500);
await p.screenshot({path:OUT+'/wx-mobil.png',fullPage:false});
await b.close();
