import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [SRC,OUT,x0,y0,x1,y1,OW]=process.argv.slice(2);
const b64=readFileSync(SRC).toString('base64');
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async(a)=>{
  const i=new Image(); i.src='data:image/png;base64,'+a.b64; await i.decode();
  const W=i.naturalWidth,H=i.naturalHeight;
  const sx=a.x0*W, sy=a.y0*H, sw=(a.x1-a.x0)*W, sh=(a.y1-a.y0)*H;
  const ow=+a.OW, oh=Math.round(ow*sh/sw);
  const c=document.createElement('canvas'); c.width=ow;c.height=oh;
  const x=c.getContext('2d'); x.imageSmoothingQuality='high';
  x.drawImage(i,sx,sy,sw,sh,0,0,ow,oh);
  return c.toDataURL('image/png').split(',')[1];
},{b64,x0:+x0,y0:+y0,x1:+x1,y1:+y1,OW});
writeFileSync(OUT,Buffer.from(d,'base64'));
await b.close(); console.log(OUT);
