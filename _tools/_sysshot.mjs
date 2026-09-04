import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:982}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const pos=await p.evaluate(()=>{const w=document.getElementById('systeme').closest('.pinwrap');
  const sp=w.querySelector('.spacer'); let y=0,el=w; while(el){y+=el.offsetTop;el=el.offsetParent;}
  return {top:y,travel:sp.offsetHeight};});
await p.evaluate(({y})=>window.scrollTo(0,y),{y:pos.top-16+pos.travel*0.3});
await p.waitForTimeout(1200);
await p.screenshot({path:OUT+'/sys-bars.png',clip:{x:0,y:0,width:1512,height:220}});
await b.close();
