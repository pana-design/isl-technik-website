/* Mobil: drei Scrollstufen des Zufahr-Effekts nebeneinander. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const shots=[], meta=[];
for(const y of [0,80,160,240]){
  await p.evaluate(y=>window.scrollTo(0,y),y);
  await p.waitForTimeout(400);
  meta.push(await p.evaluate(()=>{
    const cs=getComputedStyle(document.getElementById('hero'));
    const hint=document.querySelector('.hero__h--hint');
    return {p:cs.getPropertyValue('--p').trim(), zu:cs.getPropertyValue('--zu').trim(),
            clip:getComputedStyle(hint).clipPath.slice(0,44), op:getComputedStyle(hint).opacity};
  }));
  shots.push((await p.screenshot({clip:{x:0,y:100,width:393,height:500}})).toString('base64'));
}
const png=await p.evaluate(async(o)=>{
  const CW=400,CH2=520;
  const c=document.createElement('canvas'); c.width=CW*o.b64.length;c.height=CH2;
  const x=c.getContext('2d'); x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<o.b64.length;i++){
    const im=new Image(); im.src='data:image/png;base64,'+o.b64[i]; await im.decode();
    x.drawImage(im,i*CW+4,20,CW-8,(CW-8)*im.naturalHeight/im.naturalWidth);
    x.fillStyle='#c00'; x.font='bold 15px sans-serif'; x.fillText(o.labels[i],i*CW+8,15);
  }
  return c.toDataURL('image/png').split(',')[1];
},{b64:shots,labels:['0px','80px','160px','240px']});
writeFileSync(OUT,Buffer.from(png,'base64'));
console.log(JSON.stringify(meta));
console.log(errs.length?('FEHLER '+errs.join('|')):'keine JS-Fehler');
await b.close();
