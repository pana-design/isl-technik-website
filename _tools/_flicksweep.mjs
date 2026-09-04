/* Faehrt die Seite in 250px-Schritten ab und macht an jeder Stelle einen
   Trackpad-Flick (20 x 60px). Kommt die Seite nicht beim Ziel an oder haengt
   ein Frame > 50ms, ist dort etwas faul. DIR=-1 testet aufwaerts. */
import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const DIR=+(process.env.DIR||1), W=+(process.env.W||1512), H=+(process.env.H||982);
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:W,height:H}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(500);
await p.evaluate(()=>{window.__g=[];let last=performance.now();const t=now=>{window.__g.push([Math.round(now-last),Math.round(scrollY)]);last=now;requestAnimationFrame(t);};requestAnimationFrame(t);});
const max=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
const ids=await p.evaluate(()=>[...document.querySelectorAll('.card')].map(c=>{let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;}return [c.id,y];}));
const where=y=>{let n='';for(const [id,top] of ids){if(y>=top-50)n=id;}return n;};
await p.mouse.move(700,500);
const bad=[]; let tested=0;
for(let start=DIR>0?0:max; DIR>0?start<max-1300:start>1300; start+=DIR*250){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start);
  await p.waitForTimeout(350);
  const y0=await p.evaluate(()=>scrollY);
  await p.evaluate(()=>{window.__g.length=0;});
  for(let i=0;i<20;i++){ await p.mouse.wheel(0,DIR*(+(process.env.DELTA||60))); await p.waitForTimeout(16); }
  await p.waitForTimeout(1300);
  const r=await p.evaluate(()=>({y:scrollY,gaps:window.__g}));
  const moved=(r.y-y0)*DIR, want=Math.min(1200, DIR>0?max-y0:y0);
  const maxGap=Math.max(...r.gaps.map(g=>g[0]));
  // Rueckwaerts-Ruckler innerhalb des Flicks
  let rev=0; for(let i=1;i<r.gaps.length;i++){ if((r.gaps[i][1]-r.gaps[i-1][1])*DIR<-1) rev++; }
  tested++;
  if(want-moved>4||maxGap>50||rev){ bad.push({start:y0,in:where(y0),moved,want,maxGap,rev}); }
}
console.log(`Richtung ${DIR>0?'runter':'rauf'}: ${tested} Flicks getestet, auffaellig: ${bad.length}`);
for(const x of bad) console.log(`  y=${x.start} (${x.in}): bewegt ${x.moved}/${x.want}px, max Frame-Gap ${x.maxGap}ms, Rueckwaertsruckler ${x.rev}`);
await b.close();
