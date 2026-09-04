/* Mobil: passt jede gepinnte Karte in den Viewport? Schneidet nichts ab? */
import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
for(const [n,w,h] of [['iPhoneSE',375,667],['iPhone15',393,852],['Pixel',412,915],['iPad',820,1180]]){
  const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:w,height:h}}); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(1000);
  const rows=[];
  for(const id of ['hero','systeme','lichtschacht','stimmen']){
    const r=await p.evaluate(async id=>{const c=document.getElementById(id); const sp=document.querySelector(`.spacer[data-for="${id}"]`);
      let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} const travel=sp?sp.offsetHeight:0; const pinned=getComputedStyle(c).position==='sticky'&&travel>4;
      scrollTo({top:y+travel*0.5,behavior:'instant'}); await new Promise(r=>setTimeout(r,700));
      const pin=c.querySelector('.pin'); const pr=pin.getBoundingClientRect(); let cut=0,who='';
      pin.querySelectorAll('h1,h2,h3,p,.glass,.btn,.wx__frame,.systems__shot img,.systems__clip').forEach(el=>{const r=el.getBoundingClientRect(); if(r.height===0||getComputedStyle(el).opacity==='0')return;
        const over=Math.max(0-r.top, r.bottom-innerHeight); if(over>2&&over>cut){cut=Math.round(over);who=(el.className||el.tagName).toString().slice(0,24);}});
      return {id,pinned,travel,h:Math.round(c.getBoundingClientRect().height),cut,who};},id);
    rows.push(`${r.id}: ${r.pinned?'gepinnt':'Fluss'} h=${r.h} travel=${r.travel}${r.cut?' ABGESCHNITTEN '+r.cut+'px ('+r.who+')':''}`);
  }
  console.log(`${n} ${w}x${h}: `+rows.join(' | ')+(errs.length?' | FEHLER '+errs[0]:''));
  await ctx.close();
}
await b.close();
