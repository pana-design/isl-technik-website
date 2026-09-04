import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH}); const p=await b.newPage(); await p.goto('http://localhost:8080/');
for(const u of process.argv.slice(2)){ const r=await p.evaluate(async u=>{const v=document.createElement('video');v.src=u;v.muted=true;v.preload='auto';document.body.appendChild(v);
  await new Promise(r=>v.addEventListener('loadedmetadata',r,{once:true}));
  await new Promise(r=>v.readyState>=4?r():v.addEventListener('canplaythrough',r,{once:true}));
  // Seek-Test: 10 Positionen, praesentierte Frames zaehlen
  let shown=[]; const cb=(now,m)=>{shown.push(+m.mediaTime.toFixed(3)); v.requestVideoFrameCallback(cb);}; v.requestVideoFrameCallback(cb);
  const t0=performance.now();
  for(let i=0;i<=10;i++){ v.currentTime=i/10*(v.duration-0.06); await new Promise(r=>v.addEventListener('seeked',r,{once:true})); }
  const ms=performance.now()-t0; await new Promise(r=>setTimeout(r,100));
  return `${v.videoWidth}x${v.videoHeight} ${v.duration.toFixed(2)}s buffered-end=${v.buffered.length?v.buffered.end(v.buffered.length-1).toFixed(2):'-'} | 11 Seeks in ${ms.toFixed(0)}ms, gezeigte Frames: ${shown.length} -> ${shown.slice(0,12).join(',')}`;},u);
  console.log(u.split('/').pop().padEnd(16), r); }
await b.close();
