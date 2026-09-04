import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SRC=process.argv[2], OUT=process.argv[3], BG=process.argv[4]||'#eef0f2';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async ({SRC,BG})=>{
  const i=new Image(); i.src=SRC; await i.decode();
  const c=document.createElement('canvas'); c.width=i.naturalWidth; c.height=i.naturalHeight;
  const x=c.getContext('2d'); x.fillStyle=BG; x.fillRect(0,0,c.width,c.height); x.drawImage(i,0,0);
  return c.toDataURL('image/png').split(',')[1];
},{SRC,BG});
writeFileSync(OUT, Buffer.from(d,'base64'));
await b.close(); console.log(OUT);
