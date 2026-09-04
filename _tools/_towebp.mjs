/* PNG → WebP in mehreren Breiten (Chrome-Canvas, wie _shrink.mjs) */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SRC=process.argv[2], BASE=process.argv[3];
const WIDTHS=(process.argv[4]||'640,1024,1600,2200').split(',').map(Number);
const Q=+(process.argv[5]||0.82);
const b64=readFileSync(SRC).toString('base64');
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
for (const W of WIDTHS){
  const d=await p.evaluate(async ({b64,W,Q})=>{
    const i=new Image(); i.src='data:image/png;base64,'+b64; await i.decode();
    const H=Math.round(W*i.naturalHeight/i.naturalWidth);
    const c=document.createElement('canvas'); c.width=W;c.height=H;
    const x=c.getContext('2d'); x.imageSmoothingQuality='high';
    x.drawImage(i,0,0,W,H);
    return c.toDataURL('image/webp',Q).split(',')[1];
  },{b64,W,Q});
  writeFileSync(`${BASE}-${W}.webp`, Buffer.from(d,'base64'));
  console.log(`${BASE}-${W}.webp`);
}
await b.close();
