// Frames aus einem MP4 ziehen — Chrome-Canvas statt ffmpeg (gibt es hier nicht)
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const DIR=process.argv[2], FILE=process.argv[3], NAME=process.argv[4]||'frame';
const TS=(process.argv[5]||'0.0,0.5,1.0').split(',').map(Number); // Anteile der Dauer
const b=await chromium.launch({executablePath:CH,args:['--allow-file-access-from-files']});
const p=await b.newPage();
await p.goto('file://'+DIR+'/frames.html');
const out=await p.evaluate(async ({file,ts})=>{
  const v=document.getElementById('v'); v.src=file;
  await new Promise(r=>v.addEventListener('loadedmetadata',r,{once:true}));
  const res=[];
  for(const t of ts){
    v.currentTime=Math.max(0,Math.min(v.duration-0.05,t*v.duration));
    await new Promise(r=>v.addEventListener('seeked',r,{once:true}));
    const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
    c.getContext('2d').drawImage(v,0,0);
    res.push(c.toDataURL('image/png'));
  }
  return {res,w:v.videoWidth,h:v.videoHeight,d:v.duration};
},{file:FILE,ts:TS});
out.res.forEach((d,i)=>writeFileSync(`${DIR}/${NAME}-${i}.png`,Buffer.from(d.split(',')[1],'base64')));
console.log('ok',out.w+'x'+out.h,'dur',out.d.toFixed(2));
await b.close();
