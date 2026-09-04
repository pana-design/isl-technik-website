import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:900}});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const box=await p.evaluate(()=>{const r=document.getElementById('heroHouse').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
await p.mouse.move(box.x+box.w*0.395, box.y+box.h*0.596,{steps:25});
await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.evaluate(()=>{
  const hero=document.getElementById('hero');
  const lens=document.getElementById('heroLens');
  const glass=document.querySelector('.hero__lens-glass');
  const img=document.querySelector('.hero__lens-img');
  const cs=getComputedStyle(img), gs=getComputedStyle(glass), ls=getComputedStyle(lens);
  const hs=getComputedStyle(hero);
  const rr=e=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)];};
  return {
    heroVars:{hw:hs.getPropertyValue('--hw'),hh:hs.getPropertyValue('--hh'),ovw:hs.getPropertyValue('--ovw')},
    lensVars:{lx:ls.getPropertyValue('--lx'),ly:ls.getPropertyValue('--ly'),zoom:ls.getPropertyValue('--zoom')},
    lens:{rect:rr(lens),op:ls.opacity,tf:ls.transform},
    glass:{rect:rr(glass),disp:gs.display,pos:gs.position,ovf:gs.overflow,br:gs.borderRadius},
    img:{rect:rr(img),disp:cs.display,pos:cs.position,w:cs.width,h:cs.height,
         left:cs.left,top:cs.top,tf:cs.transform,org:cs.transformOrigin,
         complete:img.complete,natural:[img.naturalWidth,img.naturalHeight],cur:img.currentSrc.split('/').pop()}
  };
}),null,1));
await b.close();
