/* Bildrate/Groesse eines Clips per Browser messen (kein ffprobe installiert) */
import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
for (const src of process.argv.slice(2)) {
  const r=await p.evaluate(async src=>{
    const v=document.createElement('video'); v.src=src; v.muted=true; v.playsInline=true; document.body.appendChild(v);
    await new Promise(r=>v.addEventListener('canplaythrough',r,{once:true}));
    let n=0, t0=0, t1=0; const first=new Promise(r=>{ const cb=(now,m)=>{ if(!n) t0=m.mediaTime; n++; t1=m.mediaTime; if(m.mediaTime<2.0) v.requestVideoFrameCallback(cb); else r(); }; v.requestVideoFrameCallback(cb); });
    await v.play(); await first; v.pause();
    return {w:v.videoWidth,h:v.videoHeight,dur:v.duration.toFixed(2),fps:((n-1)/(t1-t0)).toFixed(1)};
  },src);
  console.log(src, JSON.stringify(r));
}
await b.close();
