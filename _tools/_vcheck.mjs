import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
for(const src of process.argv.slice(2)){
  const r=await p.evaluate(async(src)=>{
    const v=document.createElement('video'); v.src=src+'?'+Math.random(); v.muted=true;
    document.body.appendChild(v);
    await new Promise(r=>v.addEventListener('canplaythrough',r,{once:true}));
    const W=320,H=180, c=document.createElement('canvas'); c.width=W;c.height=H;
    const x=c.getContext('2d',{willReadFrequently:true});
    const snap=()=>{x.drawImage(v,0,0,W,H);
      const d=x.getImageData(0,0,W,H).data; let s=0;
      for(let i=0;i<d.length;i+=4) s=(s*31+d[i])>>>0; return {hash:s,d:new Uint8Array(d)};};
    // waehrend der Wiedergabe abtasten (kein Seeking)
    const frames=[]; await v.play();
    for(let i=0;i<6;i++){ await new Promise(r=>setTimeout(r,700)); frames.push(snap()); }
    v.pause();
    let maxd=0,sum=0;
    for(let i=0;i<frames[0].d.length;i+=4){
      const q=Math.abs(frames[0].d[i]-frames[3].d[i]); sum+=q; if(q>maxd)maxd=q;}
    return {hashes:frames.map(f=>f.hash), mittel:(sum/(W*H)).toFixed(2), max:maxd, dur:v.duration};
  },src);
  console.log(src, '| Dauer', r.dur.toFixed(2), '| Hashes', r.hashes.join(','), '| Diff Mittel', r.mittel, 'Max', r.max);
}
await b.close();
