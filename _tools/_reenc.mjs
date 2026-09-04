/* Rechnet einen Quellclip auf Webgroesse herunter. Kein Ton, kein Loop —
   die Clips werden per Scroll durchgescrubbt. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SRC=process.argv[2], OUT=process.argv[3];
const W=+(process.env.W||900), KBPS=+(process.env.KBPS||900);
const TRIM=+(process.env.TRIM||0);          // Sekunden am Ende abschneiden
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const data=await p.evaluate(async ({SRC,W,KBPS,TRIM})=>{
  const v=document.createElement('video'); v.src=SRC; v.muted=true; v.playsInline=true;
  document.body.appendChild(v); v.style.cssText='position:fixed;left:-9999px;width:2px';
  await new Promise(r=>v.addEventListener('canplaythrough',r,{once:true}));
  const H=Math.round(W*v.videoHeight/v.videoWidth/2)*2;
  const c=document.createElement('canvas'); c.width=W;c.height=H;
  const x=c.getContext('2d');
  const rec=new MediaRecorder(c.captureStream(30),
    {mimeType:'video/mp4;codecs=avc1.4d401f',videoBitsPerSecond:KBPS*1000});
  const chunks=[]; rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const stop=new Promise(r=>rec.onstop=r);
  const end=v.duration-TRIM;
  rec.start(); await v.play();
  await new Promise(res=>{ const f=()=>{ x.drawImage(v,0,0,W,H);
    if(v.currentTime>=end||v.ended){res();return;} requestAnimationFrame(f); };
    requestAnimationFrame(f); });
  v.pause(); rec.stop(); await stop;
  const u=new Uint8Array(await new Blob(chunks).arrayBuffer());
  let s=''; for(let i=0;i<u.length;i+=8192) s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  return {b64:btoa(s), bytes:u.length, w:W, h:H, dur:end};
},{SRC,W,KBPS,TRIM});
writeFileSync(OUT, Buffer.from(data.b64,'base64'));
console.log(`${OUT}  ${data.w}x${data.h}  ${data.dur.toFixed(2)}s  ${(data.bytes/1024).toFixed(0)} KB`);
await b.close();
