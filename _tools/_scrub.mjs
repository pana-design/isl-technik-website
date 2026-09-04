import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:982}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const geo=await p.evaluate(()=>{const s=document.querySelector('#systeme');
  const sp=document.querySelector('.spacer[data-for="systeme"]');
  let y=0,e=s; while(e){y+=e.offsetTop;e=e.offsetParent;}
  return {top:y, travel:sp.offsetHeight};});
// Plissee ist Schritt 4 von 7 -> eff zwischen 3/7 und 4/7
const hold=0.08;
for(const [k,f] of [['a',3.05],['b',3.5],['c',3.95]]){
  const eff=f/7;
  const pv=eff*(1-hold*2)+hold;
  await p.evaluate(y=>window.scrollTo(0,y), geo.top + pv*geo.travel);
  await p.waitForTimeout(1100);
  await p.screenshot({path:`shots/_scrub_${k}.png`});
}
const st=await p.evaluate(()=>{const v=document.querySelector('#systeme video.systems__clip');
  return v?{src:v.currentSrc.split('/').pop(),t:v.currentTime.toFixed(2),dur:v.duration,ready:v.readyState,
    cls:v.parentElement.className}:null;});
console.log(JSON.stringify(st), errs.length?('ERR '+errs.join('|')):'keine Fehler');
await b.close();
