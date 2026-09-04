import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:982}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(2600);          // Vorfuehrrunde laeuft
await p.screenshot({path:'shots/_hero_tour.png'});
await p.mouse.move(1150,520); await p.waitForTimeout(80);
await p.mouse.move(1160,530); await p.waitForTimeout(700);
await p.screenshot({path:'shots/_hero_reveal.png'});
const box=await p.evaluate(()=>{const h=document.getElementById('heroHouse').getBoundingClientRect();
 const t=document.querySelector('.hero__copy').getBoundingClientRect();
 return {house:[Math.round(h.left),Math.round(h.top),Math.round(h.width),Math.round(h.height)],
         textRight:Math.round(t.right)};});
console.log(JSON.stringify(box), errs.length?('ERR '+errs.join(' | ')):'keine Fehler');
await b.close();
