/* Baut aus einem Clip eine nahtlose Schleife und komprimiert sie.
   Verfahren: die zweite Haelfte wird ueber die erste geblendet
   out(t) = (1-t/L)*v(t+L) + (t/L)*v(t)  mit L = Laenge/2.
   Dadurch stimmen Anfang und Ende exakt ueberein — kein Sprung beim Loop. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SRC=process.argv[2]||'/img/wiese/gras-a.mp4';
const OUT=process.argv[3]||'img/wiese/wiese';
const W=+(process.env.W||1280), H=+(process.env.H||720);
const KBPS=+(process.env.KBPS||1500), TYPE=process.env.TYPE||'mp4';

const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
p.on('console',m=>console.log('  ·',m.text()));

const data=await p.evaluate(async ({SRC,W,H,KBPS,TYPE})=>{
  const mk=()=>{const v=document.createElement('video');
    v.src=SRC; v.muted=true; v.playsInline=true; v.preload='auto';
    document.body.appendChild(v); v.style.cssText='position:fixed;left:-9999px;width:2px';
    return v;};
  const v1=mk(), v2=mk();
  await Promise.all([v1,v2].map(v=>new Promise(r=>v.addEventListener('loadeddata',r,{once:true}))));
  const D=v1.duration, L=D/2;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d');
  const mime = TYPE==='webm' ? 'video/webm;codecs=vp9' : 'video/mp4;codecs=avc1.42E01E';
  const stream=c.captureStream(30);
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:KBPS*1000});
  const chunks=[]; rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};

  v2.currentTime=L;
  await new Promise(r=>v2.addEventListener('seeked',r,{once:true}));
  v1.currentTime=0;
  await new Promise(r=>v1.addEventListener('seeked',r,{once:true}));

  const done=new Promise(r=>rec.onstop=r);
  rec.start();
  await Promise.all([v1.play(),v2.play()]);
  const t0=performance.now();
  await new Promise(res=>{
    const frame=()=>{
      const t=Math.min(v1.currentTime,L);
      const a=Math.max(0,Math.min(1,t/L));
      const drift=v2.currentTime-(v1.currentTime+L);
      if(Math.abs(drift)>0.08 && v1.currentTime+L<v1.duration) v2.currentTime=v1.currentTime+L;
      x.globalAlpha=1; x.drawImage(v2,0,0,W,H);
      x.globalAlpha=a; x.drawImage(v1,0,0,W,H);
      x.globalAlpha=1;
      if(v1.currentTime>=L-1/30 || performance.now()-t0>(L+1.5)*1000){res();return;}
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  v1.pause(); v2.pause(); rec.stop(); await done;
  const blob=new Blob(chunks,{type:mime});
  const buf=await blob.arrayBuffer();
  let s=''; const u=new Uint8Array(buf);
  for(let i=0;i<u.length;i+=8192) s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  return {b64:btoa(s), dur:D, loop:L, bytes:u.length};
},{SRC,W,H,KBPS,TYPE});

const ext = TYPE==='webm' ? 'webm' : 'mp4';
writeFileSync(`${OUT}.${ext}`, Buffer.from(data.b64,'base64'));
console.log(`${OUT}.${ext}  Quelle ${data.dur.toFixed(2)}s -> Schleife ${data.loop.toFixed(2)}s, ${(data.bytes/1024).toFixed(0)} KB`);
await b.close();
