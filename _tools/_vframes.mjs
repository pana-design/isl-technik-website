/* Kontaktbogen aus einem Clip: node _tools/_vframes.mjs <clip-url> <out.png> [anzahl] */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [SRC,OUT]=process.argv.slice(2), N=+(process.argv[4]||8);
const b=await chromium.launch({executablePath:CH}); const p=await b.newPage(); await p.goto('http://localhost:8080/');
const png=await p.evaluate(async ({SRC,N})=>{
  const v=document.createElement('video'); v.src=SRC; v.muted=true; v.preload='auto'; document.body.appendChild(v);
  await new Promise(r=>v.readyState>=4?r():v.addEventListener('canplaythrough',r,{once:true}));
  const W=480,H=Math.round(480*v.videoHeight/v.videoWidth), COLS=4, rows=Math.ceil(N/COLS);
  const c=document.createElement('canvas'); c.width=W*COLS; c.height=H*rows; const x=c.getContext('2d');
  for(let i=0;i<N;i++){ const t=i/(N-1)*(v.duration-0.05);
    await new Promise(r=>{v.addEventListener('seeked',r,{once:true}); v.currentTime=t;}); await new Promise(r=>setTimeout(r,80));
    x.drawImage(v,(i%COLS)*W,Math.floor(i/COLS)*H,W,H); x.fillStyle='#c00'; x.font='bold 18px sans-serif'; x.fillText(t.toFixed(1)+'s',(i%COLS)*W+8,Math.floor(i/COLS)*H+22);
    // Drittel-Raster fuer den Crop
    x.strokeStyle='rgba(255,0,0,.5)'; for(const f of [.2,.35,.5,.65,.8]){ x.beginPath(); x.moveTo((i%COLS)*W+f*W,Math.floor(i/COLS)*H); x.lineTo((i%COLS)*W+f*W,Math.floor(i/COLS)*H+H); x.stroke(); }
  }
  return c.toDataURL('image/png').split(',')[1];
},{SRC,N});
writeFileSync(OUT,Buffer.from(png,'base64')); console.log('ok',OUT); await b.close();
