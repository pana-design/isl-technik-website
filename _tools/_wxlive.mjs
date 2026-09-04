import { webkit, devices } from 'playwright-core';
const OUT=process.argv[2]; const URL=process.env.URL||'https://isl-technik.de/';
const b=await webkit.launch();
for(const [W,H] of [[393,760],[393,664]]){
  const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H}}); const p=await ctx.newPage();
  await p.goto(URL,{waitUntil:'networkidle'}); await p.waitForTimeout(1200);
  const info=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); const sp=document.querySelector('.spacer[data-for="lichtschacht"]');
    let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} return {y,travel:sp.offsetHeight,pos:getComputedStyle(c).position,ih:innerHeight,cols:getComputedStyle(c.querySelector('.wx__bar')).gridTemplateColumns};});
  console.log(W,H,JSON.stringify(info));
  for(const f of [0.75,1.0,1.15]){
    await p.evaluate(([y,t,f])=>scrollTo({top:y+t*f,behavior:'instant'}),[info.y,info.travel,f]); await p.waitForTimeout(900);
    const m=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); const bar=c.querySelector('.wx__bar').getBoundingClientRect(); return {p:c.style.getPropertyValue('--p'),bar:[Math.round(bar.top),Math.round(bar.bottom)],stimmen:Math.round(document.getElementById('stimmen').getBoundingClientRect().top)};});
    console.log('  ',f,JSON.stringify(m)); await p.screenshot({path:`${OUT}/live-${H}-${f}.png`});
  }
  await ctx.close();
}
await b.close();
