/* Stimmen JS-Messung (--p) und CSS-Sticky ueberein? An der Haelfte des
   Spacers muss --p = 0.5 sein und die Karte am oberen Rand (top = --gap) kleben. */
import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
for(const [w,h] of [[1512,982],[1440,806],[1280,720],[1920,1080]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
  const rows=[];
  for(const id of ['hero','systeme','insektenschutz','lichtschacht','stimmen']){
    const r=await p.evaluate(async id=>{
      const c=document.getElementById(id); const sp=document.querySelector(`.spacer[data-for="${id}"]`);
      let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;}
      const gap=parseFloat(getComputedStyle(c).top);
      const travel=sp?sp.offsetHeight:0;
      scrollTo({top:y-gap+travel*0.5,behavior:'instant'});
      await new Promise(r=>setTimeout(r,900));
      const pv=parseFloat(getComputedStyle(c).getPropertyValue('--p'));
      return {id, p:+pv.toFixed(3), top:+(c.getBoundingClientRect().top-gap).toFixed(1), travel, fonts:document.fonts.status};
    },id);
    rows.push(`${r.id}: --p=${r.p} (soll 0.5), Karte top-Abweichung ${r.top}px, Weg ${r.travel}px`);
  }
  console.log(`${w}x${h}:\n  `+rows.join('\n  '));
  await p.close();
}
await b.close();
