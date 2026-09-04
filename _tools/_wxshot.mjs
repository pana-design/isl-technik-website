import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:982}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const pos=await p.evaluate(()=>{const w=document.getElementById('lichtschacht').closest('.pinwrap');
  const sp=w.querySelector('.spacer');
  let y=0,el=w; while(el){y+=el.offsetTop;el=el.offsetParent;}
  return {top:y,travel:sp.offsetHeight};});
// Uebergang: Naht Pollenschutz -> Lichtschacht mittig im Bild
await p.evaluate(({y})=>window.scrollTo(0,y),{y:pos.top-16-491});
await p.waitForTimeout(1400);
await p.screenshot({path:OUT+'/wx-uebergang.png'});
for(const [name,f] of [['phase1',0.15],['phase2',0.5],['phase3',0.85]]){
  await p.evaluate(({y})=>window.scrollTo(0,y),{y:pos.top-16+pos.travel*f});
  await p.waitForTimeout(1600);
  await p.screenshot({path:OUT+`/wx-${name}.png`});
}
await b.close();
