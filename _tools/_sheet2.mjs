import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2]; const SRCS=process.argv.slice(3);
const imgs=SRCS.map(s=>({name:s.split('/').pop(),b64:readFileSync(s).toString('base64')}));
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async (imgs)=>{
  const CW=380, CH2=400, COLS=3;
  const rows=Math.ceil(imgs.length/COLS);
  const c=document.createElement('canvas'); c.width=CW*COLS; c.height=CH2*rows;
  const x=c.getContext('2d'); x.fillStyle='#ffffff'; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<imgs.length;i++){
    const im=new Image(); im.src='data:image/png;base64,'+imgs[i].b64; await im.decode();
    const s=Math.min((CW-16)/im.naturalWidth,(CH2-36)/im.naturalHeight);
    const w=im.naturalWidth*s,h=im.naturalHeight*s;
    x.drawImage(im,(i%COLS)*CW+(CW-w)/2,Math.floor(i/COLS)*CH2+28+((CH2-36)-h)/2,w,h);
    x.fillStyle='#000'; x.font='bold 18px sans-serif';
    x.fillText(imgs[i].name,(i%COLS)*CW+10,Math.floor(i/COLS)*CH2+20);
  }
  return c.toDataURL('image/png').split(',')[1];
}, imgs);
writeFileSync(OUT,Buffer.from(d,'base64'));
await b.close(); console.log(OUT);
