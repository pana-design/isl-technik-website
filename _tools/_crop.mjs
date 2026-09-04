import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [src,sx,sy,sw,sh,z]=process.argv.slice(2);
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async({src,sx,sy,sw,sh,z})=>{
  const im=new Image(); im.src=src+'?'+Math.random(); await im.decode();
  const c=document.createElement('canvas'); c.width=sw*z;c.height=sh*z;
  const x=c.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#8FA97F'; x.fillRect(0,0,c.width,c.height);
  x.drawImage(im,+sx,+sy,+sw,+sh,0,0,sw*z,sh*z);
  return c.toDataURL('image/png');
},{src,sx:+sx,sy:+sy,sw:+sw,sh:+sh,z:+z});
writeFileSync('shots/_crop.png',Buffer.from(d.split(',')[1],'base64'));
await b.close();
