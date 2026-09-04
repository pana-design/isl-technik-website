import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SRC=process.argv[2], OUT=process.argv[3], W=+(process.argv[4]||1100);
const b64=readFileSync(SRC).toString('base64');
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async ({b64,W})=>{
  const i=new Image(); i.src='data:image/png;base64,'+b64; await i.decode();
  const H=Math.round(W*i.naturalHeight/i.naturalWidth);
  const c=document.createElement('canvas'); c.width=W;c.height=H;
  const x=c.getContext('2d'); x.imageSmoothingQuality='high';
  x.fillStyle='#f0f1f2'; x.fillRect(0,0,W,H); x.drawImage(i,0,0,W,H);
  return c.toDataURL('image/png').split(',')[1];
},{b64,W});
writeFileSync(OUT, Buffer.from(d,'base64'));
await b.close(); console.log(OUT);
