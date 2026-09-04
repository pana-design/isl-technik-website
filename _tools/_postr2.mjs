/* Poster aus einem gesuchten Zeitpunkt — nicht aus dem Abspielen heraus.
   Sonst faellt das Standbild in den noch leeren ersten Frame. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [src,out,at]=process.argv.slice(2);
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async({src,at})=>{
  const v=document.createElement('video'); v.src=src+'?'+Math.random(); v.muted=true; v.playsInline=true;
  document.body.appendChild(v); v.style.cssText='position:fixed;left:-9999px;width:2px';
  await new Promise(r=>v.addEventListener('loadeddata',r,{once:true}));
  v.currentTime=+at;
  await new Promise(r=>v.addEventListener('seeked',r,{once:true}));
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const c=document.createElement('canvas'); c.width=v.videoWidth;c.height=v.videoHeight;
  const x=c.getContext('2d'); x.drawImage(v,0,0);
  // Pruefen, ob wirklich Bild drin ist (nicht nur Weiss)
  const d2=x.getImageData(0,0,c.width,c.height).data;
  let mn=255,mx=0; for(let i=0;i<d2.length;i+=4*97){mn=Math.min(mn,d2[i]);mx=Math.max(mx,d2[i]);}
  return {png:c.toDataURL('image/webp',0.82), span:mx-mn};
},{src,at});
writeFileSync(out,Buffer.from(d.png.split(',')[1],'base64'));
console.log(out,'Kontrastspanne',d.span);
await b.close();
