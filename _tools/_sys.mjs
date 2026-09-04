import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:982}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const info=await p.evaluate(()=>{
  const s=document.querySelector('#systeme');
  const sp=document.querySelector('.spacer[data-for="systeme"]');
  s.scrollIntoView();
  return {spacerH:sp?sp.offsetHeight:0};
});
await p.evaluate(()=>{const s=document.querySelector('#systeme');
  window.scrollTo(0, s.offsetTop + 300);});
await p.waitForTimeout(900);
await p.screenshot({path:'shots/_sys.png'});
const box=await p.evaluate(()=>{const st=document.querySelector('.systems__stage').getBoundingClientRect();
  const im=document.querySelector('.systems__shot.is-active img').getBoundingClientRect();
  return {stage:[Math.round(st.left),Math.round(st.top),Math.round(st.width),Math.round(st.height)],
          img:[Math.round(im.left),Math.round(im.top),Math.round(im.width),Math.round(im.height)]};});
console.log(JSON.stringify({...info,...box}));
await b.close();
