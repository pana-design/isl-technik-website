/* Prueft die Vorfuehrrunde: ohne Mausbewegung muss die Lupe von selbst
   erscheinen und nacheinander andere Positionen anfahren. */
import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:900}});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const pos=[];
for(let i=0;i<4;i++){
  await p.waitForTimeout(1600);
  pos.push(await p.evaluate(()=>{
    const l=document.getElementById('heroLens'), s=getComputedStyle(l);
    return {op:s.opacity, lx:s.getPropertyValue('--lx').trim(), ly:s.getPropertyValue('--ly').trim()};
  }));
}
console.log(JSON.stringify(pos));
await p.screenshot({path:process.argv[2]});
await b.close();
