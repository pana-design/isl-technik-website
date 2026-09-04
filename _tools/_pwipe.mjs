/* Misst auf Mobilbreite den Karten-Fortschritt --p und den daraus
   abgeleiteten Zufahr-Wert --zu ueber den Scrollweg des Heros. */
import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const rows=[];
for(const y of [0,100,200,300,400,500,600,800]){
  await p.evaluate(y=>window.scrollTo(0,y),y);
  await p.waitForTimeout(350);
  rows.push(await p.evaluate(y=>{
    const hero=document.getElementById('hero');
    const cs=getComputedStyle(hero);
    const house=document.getElementById('heroHouse');
    const hr=house.getBoundingClientRect();
    return {y, p:cs.getPropertyValue('--p').trim(),
            zu:cs.getPropertyValue('--zu').trim().slice(0,22),
            hausSichtbar:Math.round(Math.max(0,Math.min(hr.bottom,innerHeight)-Math.max(hr.top,0)))};
  },y));
}
console.log(JSON.stringify(rows,null,0));
await b.close();
