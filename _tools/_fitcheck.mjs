/* Passen gepinnte Karten bei kurzen Safari-Viewports? Misst Karten-Unterkante
   gegen die unterste Inhaltskante (Buttons, Statusleiste, Kacheln). */
import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
for(const [w,h] of [[393,711],[393,660],[390,640],[375,548],[430,740]]){
  const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:w,height:h}}); const p=await ctx.newPage();
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(600);
  const rows=[];
  for(const id of ['hero','systeme','lichtschacht','stimmen']){
    const r=await p.evaluate(async id=>{
      scrollTo({top:0,behavior:'instant'}); await new Promise(r=>setTimeout(r,150));
      const c=document.getElementById(id); let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;}
      const sp=document.querySelector(`.spacer[data-for="${id}"]`); const t=sp?sp.offsetHeight:0;
      const pinned=getComputedStyle(c).position==='sticky'&&t>4;
      if(!pinned) return {id,pinned:false};
      scrollTo({top:y+t*0.5,behavior:'instant'}); await new Promise(r=>setTimeout(r,900));
      const cb=c.getBoundingClientRect().bottom; let low=0,who='';
      c.querySelectorAll('.btn,.wx__bar,.glass,.systems__card,.voice,.hero__chips,h1,h2,p').forEach(e=>{const r=e.getBoundingClientRect(); if(r.height&&r.bottom>low){low=r.bottom;who=(e.className||e.tagName).toString().slice(0,18);}});
      return {id,pinned:true,card:Math.round(cb),low:Math.round(low),who,ok:low<=cb+1&&cb<=innerHeight+1};
    },id);
    rows.push(r.pinned?`${r.id}: ${r.ok?'OK ':'ZU HOCH'} Inhalt bis ${r.low}px, Karte bis ${r.card}px (${r.who})`:`${r.id}: Fluss`);
  }
  console.log(`${w}x${h}: `+rows.join(' | ')); await ctx.close();
}
await b.close();
