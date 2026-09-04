/* PSNR eines Webclips gegen seine Quelle (auf Clipgroesse skaliert) an
   mehreren Zeitpunkten. Aufruf: node _vquality.mjs quelle.mp4 clip1.mp4 clip2.mp4 ... */
import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [SRC,...CLIPS]=process.argv.slice(2);
const b=await chromium.launch({executablePath:CH}); const p=await b.newPage(); await p.goto('http://localhost:8080/');
const load=async u=>p.evaluate(async u=>{const v=document.createElement('video');v.src=u;v.muted=true;v.preload='auto';document.body.appendChild(v);
  await new Promise(r=>v.readyState>=4?r():v.addEventListener('canplaythrough',r,{once:true})); window.__vids=window.__vids||{}; window.__vids[u]=v; return [v.videoWidth,v.videoHeight,v.duration];},u);
const src=await load(SRC); for(const c of CLIPS) await load(c);
for(const c of CLIPS){
  const r=await p.evaluate(async ({SRC,c})=>{
    const a=window.__vids[SRC], v=window.__vids[c]; const W=v.videoWidth,H=v.videoHeight;
    const ca=document.createElement('canvas'), cb=document.createElement('canvas'); ca.width=cb.width=W; ca.height=cb.height=H;
    const xa=ca.getContext('2d',{willReadFrequently:true}), xb=cb.getContext('2d',{willReadFrequently:true});
    const seek=(vid,t)=>new Promise(r=>{vid.addEventListener('seeked',r,{once:true}); vid.currentTime=t;});
    const out=[];
    for(const t of [0.5,1.5,2.5,3.5,4.5]){
      await seek(a,t); await seek(v,t); await new Promise(r=>setTimeout(r,60));
      xa.drawImage(a,0,0,W,H); xb.drawImage(v,0,0,W,H);
      const A=xa.getImageData(0,0,W,H).data, B=xb.getImageData(0,0,W,H).data; let se=0;
      for(let i=0;i<A.length;i+=4){ const d0=A[i]-B[i],d1=A[i+1]-B[i+1],d2=A[i+2]-B[i+2]; se+=d0*d0+d1*d1+d2*d2; }
      const mse=se/(A.length/4*3); out.push(10*Math.log10(255*255/Math.max(mse,1e-9)));
    }
    return out;},{SRC,c});
  console.log(c.split('/').pop().padEnd(28), 'PSNR', r.map(x=>x.toFixed(1)).join(' '), ' Ø', (r.reduce((a,b)=>a+b)/r.length).toFixed(1),'dB');
}
await b.close();
