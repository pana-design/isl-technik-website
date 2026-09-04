/* Desktop-Regression: Maus-Lupe erscheint an den Oeffnungen, sonst nicht */
import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:982}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const b=document.getElementById('heroHouse').getBoundingClientRect();return {x:b.left,y:b.top,w:b.width,h:b.height};});
const out=[];
for(const [n,fx,fy] of [['Balkontuer',.375,.6],['Fenster',.6,.59],['Lichtschacht',.625,.74],['Himmel',.5,.15]]){
  await p.mouse.move(r.x+fx*r.w, r.y+fy*r.h); await p.waitForTimeout(250);
  out.push(n+'='+await p.evaluate(()=>document.getElementById('hero').classList.contains('is-lens')));
}
const cat=await p.evaluate(()=>{const v=document.querySelector('.hero__clip');return v?(v.paused?'steht':'spielt'):'fehlt'});
console.log('Desktop-Lupe:',out.join(' '),'| Hero-Katze',cat, errs.length?'| FEHLER '+errs[0]:'| keine JS-Fehler');
await b.close();
