import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const out=await p.evaluate(async()=>{
  const im=new Image(); im.src='/img/wiese/fein-a.png?'+Math.random(); await im.decode();
  const mk=(w,q)=>{const h=Math.round(im.height*w/im.width);
    const c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').drawImage(im,0,0,w,h);
    return c.toDataURL('image/webp',q);};
  return {w1600:mk(1280,0.58), w1024:mk(860,0.56)};
});
writeFileSync('img/wiese/wiese-1280.webp',Buffer.from(out.w1600.split(',')[1],'base64'));
writeFileSync('img/wiese/wiese-860.webp',Buffer.from(out.w1024.split(',')[1],'base64'));
await b.close();
