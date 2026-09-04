import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const sizes=[['Laptop720',1280,720],['MacBook14',1512,982],['FullHD',1920,1080],['QHD',2560,1440]];
const b=await chromium.launch({executablePath:CH});
let bad=0;
for(const [n,w,h] of sizes){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
  await p.waitForTimeout(400);
  const ids=await p.evaluate(()=>[...document.querySelectorAll('.card')].map(c=>c.id));
  const rows=[];
  for(const id of ids){
    // in die Mitte der jeweiligen Karte scrollen — nur so ist der Pin aktiv
    for(const frac of [0.15,0.5,0.85]){
      await p.evaluate(([i,f])=>{const c=document.getElementById(i);
        window.scrollTo(0,c.offsetTop+c.offsetHeight*f-window.innerHeight*0.2);},[id,frac]);
      await p.waitForTimeout(200);
      const r=await p.evaluate(i=>{
        const card=document.getElementById(i), pin=card.querySelector('.pin');
        const pr=pin.getBoundingClientRect();
        if(getComputedStyle(pin).overflow==='visible')return null;
        let cut=0,who='';
        pin.querySelectorAll('h1,h2,h3,p,li,.glass,.btn,form,details,.step').forEach(e=>{
          const b=e.getBoundingClientRect();
          if(b.height===0)return;
          const over=Math.max(pr.top-b.top, b.bottom-pr.bottom);
          if(over>2&&over>cut){cut=Math.round(over);who=(String(e.className)||e.tagName).slice(0,26);}
        });
        return cut>2?{cut,who}:null;
      },id);
      if(r){rows.push(`${id.padEnd(15)} bei ${Math.round(frac*100)}%: ${r.cut}px  (${r.who})`);break;}
    }
  }
  console.log(`\n── ${n} ${w}x${h}`);
  if(rows.length){bad+=rows.length;rows.forEach(x=>console.log('  ⚠ '+x));}
  else console.log('  ✓ nichts abgeschnitten');
  await p.close();
}
await b.close();
console.log(bad?`\n${bad} Befund(e)`:'\nAlles sauber');
