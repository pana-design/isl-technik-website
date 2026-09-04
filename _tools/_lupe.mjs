/* Faehrt die Lupe ueber die drei Oeffnungen und haelt jeweils fest, was im
   Glas steht — plus ein enger Ausschnitt, damit die Vergroesserung beurteilbar ist. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const STOPS=[[0.395,0.596,'Balkontuer'],[0.598,0.566,'Fenster'],[0.627,0.735,'Lichtschacht']];
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:900}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const box=await p.evaluate(()=>{const r=document.getElementById('heroHouse').getBoundingClientRect();
  return {x:r.x,y:r.y,w:r.width,h:r.height};});
const shots=[];
for(const [fx,fy,name] of STOPS){
  await p.mouse.move(box.x+box.w*fx, box.y+box.h*fy, {steps:25});
  await p.waitForTimeout(1100);
  const g=await p.evaluate(()=>{const r=document.querySelector('.hero__lens-glass').getBoundingClientRect();
    return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};});
  const pad=70;
  shots.push({name, buf:await p.screenshot({clip:{
    x:Math.max(0,g.x-pad), y:Math.max(0,g.y-pad), width:g.w+pad*2, height:g.h+pad*2+40}})});
}
const b64=shots.map(s=>s.buf.toString('base64'));
const names=shots.map(s=>s.name);
const png=await p.evaluate(async(o)=>{
  const CW=420,CH2=440;
  const c=document.createElement('canvas'); c.width=CW*3;c.height=CH2;
  const x=c.getContext('2d'); x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<o.b64.length;i++){
    const im=new Image(); im.src='data:image/png;base64,'+o.b64[i]; await im.decode();
    const s=Math.min((CW-16)/im.naturalWidth,(CH2-34)/im.naturalHeight);
    x.drawImage(im,i*CW+(CW-im.naturalWidth*s)/2,26,im.naturalWidth*s,im.naturalHeight*s);
    x.fillStyle='#c00'; x.font='bold 16px sans-serif'; x.fillText(o.names[i],i*CW+10,18);
  }
  return c.toDataURL('image/png').split(',')[1];
},{b64,names});
writeFileSync(OUT,Buffer.from(png,'base64'));
console.log(errs.length?('FEHLER '+errs.join('|')):'keine JS-Fehler');
await b.close();
