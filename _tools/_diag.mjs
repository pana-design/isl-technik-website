import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(()=>{
  const g=(s)=>{const e=document.querySelector(s); if(!e)return null;
    const c=getComputedStyle(e), r=e.getBoundingClientRect();
    return {sel:s,pos:c.position,disp:c.display,z:c.zIndex,
            rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};};
  return [g('.hero__pin'),g('.hero__inner'),g('.hero__grid'),g('.hero__copy'),
          g('.hero__cta'),g('.hero__chips'),g('.hero__chips .glass'),g('.hero__cue'),g('.hero__bg')];
}),null,1));
await b.close();
