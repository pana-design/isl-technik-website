import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:982}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.evaluate(()=>{let y=0,el=document.getElementById('pollenschutz');
  while(el){y+=el.offsetTop;el=el.offsetParent;}
  window.scrollTo(0,y-8);});
await p.waitForTimeout(1600);
await p.screenshot({path:OUT+'/split-kachel.png'});
await b.close();
