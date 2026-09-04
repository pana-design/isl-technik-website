import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [src,out,at]=process.argv.slice(2);
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async({src,at})=>{
  const v=document.createElement('video'); v.src=src+'?'+Math.random(); v.muted=true;
  document.body.appendChild(v);
  await new Promise(r=>v.addEventListener('canplaythrough',r,{once:true}));
  await v.play(); await new Promise(r=>setTimeout(r,+at*1000)); v.pause();
  const c=document.createElement('canvas'); c.width=v.videoWidth;c.height=v.videoHeight;
  c.getContext('2d').drawImage(v,0,0);
  return c.toDataURL('image/webp',0.8);
},{src,at});
writeFileSync(out,Buffer.from(d.split(',')[1],'base64'));
await b.close();
