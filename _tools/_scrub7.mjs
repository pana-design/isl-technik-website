/* Faehrt alle sieben Produktschritte durch und haelt jeweils Anfang und Ende
   fest — so wird sichtbar, ob jeder Clip laedt und in die richtige Richtung
   durchgescrubbt wird. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:982}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const geo=await p.evaluate(()=>{const s=document.querySelector('#systeme');
  const sp=document.querySelector('.spacer[data-for="systeme"]');
  let y=0,e=s; while(e){y+=e.offsetTop;e=e.offsetParent;}
  return {top:y, travel:sp.offsetHeight};});
const hold=0.08, shots=[], info=[];
for(let i=0;i<7;i++){
  for(const f of [i+0.12, i+0.92]){
    const pv=(f/7)*(1-hold*2)+hold;
    await p.evaluate(y=>window.scrollTo(0,y), geo.top + pv*geo.travel);
    await p.waitForTimeout(1000);
    shots.push(await p.screenshot({clip:{x:380,y:60,width:760,height:560}}));
  }
  info.push(await p.evaluate(i=>{
    const fig=document.querySelector(`.systems__shot[data-i="${i}"]`);
    const v=fig&&fig.querySelector('video.systems__clip');
    return {i, hasClip:!!v, on:fig?fig.classList.contains('has-clip'):null,
            t:v?+v.currentTime.toFixed(2):null, dur:v&&isFinite(v.duration)?+v.duration.toFixed(2):null};
  }, i));
}
// Kontaktbogen
const b64=shots.map(s=>s.toString('base64'));
const png=await p.evaluate(async(b64)=>{
  const CW=380,CH2=280,COLS=4;
  const rows=Math.ceil(b64.length/COLS);
  const c=document.createElement('canvas'); c.width=CW*COLS;c.height=CH2*rows;
  const x=c.getContext('2d'); x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<b64.length;i++){
    const im=new Image(); im.src='data:image/png;base64,'+b64[i]; await im.decode();
    x.drawImage(im,(i%COLS)*CW,Math.floor(i/COLS)*CH2,CW,CH2);
    x.fillStyle='#c00'; x.font='bold 15px sans-serif';
    x.fillText(`${Math.floor(i/2)}${i%2?' Ende':' Start'}`,(i%COLS)*CW+8,Math.floor(i/COLS)*CH2+18);
  }
  return c.toDataURL('image/png').split(',')[1];
},b64);
writeFileSync(OUT,Buffer.from(png,'base64'));
console.log(JSON.stringify(info));
console.log(errs.length?('FEHLER '+errs.join('|')):'keine JS-Fehler');
await b.close();
