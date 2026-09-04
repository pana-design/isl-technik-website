import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2]||'./shots', URL=process.argv[3]||'http://localhost:8080/';
const sizes=[['iPhoneSE',375,667],['iPhone15',393,852],['iPad',820,1180],
 ['Laptop720',1280,720],['MacBook14',1512,982],['FullHD',1920,1080],['QHD',2560,1440],['Ultra',3440,1440]];
const b=await chromium.launch({executablePath:CH});
let fails=0;
for(const [name,w,h] of sizes){
  const p=await b.newPage({viewport:{width:w,height:h}});
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,80))});
  p.on('requestfailed',r=>{
    // Abgebrochene Ladevorgaenge (z.B. Video-Preload beim Schliessen der
    // Seite) sind keine Fehler — nur echte Fehlschlaege melden.
    const why=(r.failure()||{}).errorText||'';
    if(!why.includes('ABORTED')) errs.push(why+' '+r.url().split('/').pop());
  });
  await p.goto(URL,{waitUntil:'networkidle',timeout:30000});
  await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{
    const de=document.documentElement;
    let over=0,who='';
    document.querySelectorAll('*').forEach(e=>{
      const b=e.getBoundingClientRect();
      if(b.width===0||b.width>de.clientWidth*3)return;
      const d=b.right-de.clientWidth;
      if(d>2&&d>over){
        // Von einem Vorfahren beschnitten (z. B. das vergroesserte Bild im
        // Lupenglas)? Dann ragt nichts sichtbar heraus.
        for(let a=e.parentElement;a;a=a.parentElement){
          const o=getComputedStyle(a).overflow;
          if((o.includes('hidden')||o.includes('clip'))&&
             a.getBoundingClientRect().right<=de.clientWidth+2) return;
        }
        over=Math.round(d);who=(e.className&&String(e.className).slice(0,32))||e.tagName;
      }
    });
    const h1=document.querySelector('h1');
    return {sw:de.scrollWidth,cw:de.clientWidth,total:document.body.scrollHeight,
      h1:h1?getComputedStyle(h1).fontSize:'-',over,who,
      pinPos:getComputedStyle(document.querySelector('.card')).position};
  });
  const hs=r.sw>r.cw+1;
  if(hs||r.over>2||errs.length)fails++;
  console.log(`${name.padEnd(10)} ${String(w).padStart(4)}x${String(h).padStart(4)} | h1:${r.h1.padStart(7)} | pin:${r.pinPos.padEnd(8)} | ${(r.total/h).toFixed(1)}vh | hscroll:${hs?'JA':'nein'} | ueber:${r.over?r.over+'px '+r.who:'-'}${errs.length?' | ERR '+errs.slice(0,2).join(','):''}`);
  await p.screenshot({path:`${OUT}/${w}.png`});
  await p.close();
}
await b.close();
console.log(fails?`\n${fails} Groesse(n) mit Befund`:'\nAlle Groessen sauber');
