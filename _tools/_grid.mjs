import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const out=await p.evaluate(async(src)=>{
  const v=document.createElement('video'); v.src=src+'?'+Math.random(); v.muted=true;
  document.body.appendChild(v);
  await new Promise(r=>v.addEventListener('canplaythrough',r,{once:true}));
  const W=360,H=Math.round(360*v.videoHeight/v.videoWidth);
  const c=document.createElement('canvas'); c.width=W*3; c.height=H*2;
  const x=c.getContext('2d');
  x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
  await v.play();
  for(let i=0;i<6;i++){
    await new Promise(r=>setTimeout(r, i===0?60:760));
    x.drawImage(v,(i%3)*W,Math.floor(i/3)*H,W,H);
  }
  v.pause();
  return {png:c.toDataURL('image/png'), wh:[v.videoWidth,v.videoHeight], dur:v.duration};
}, process.argv[2]);
writeFileSync('shots/_grid.png',Buffer.from(out.png.split(',')[1],'base64'));
console.log(out.wh.join('x'),'|',out.dur.toFixed(2)+'s');
await b.close();
