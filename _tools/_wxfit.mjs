import { chromium, webkit, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2]; const URL=process.env.URL||'http://localhost:8080/';
for(const [eng,name] of [[chromium,'chromium'],[webkit,'webkit']]){
  const b=await eng.launch(name==='chromium'?{executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']}:{});
  for(const [W,H] of [[393,640],[393,664],[393,700],[393,760],[393,852],[430,932],[360,640]]){
    const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H}}); const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(URL,{waitUntil:'networkidle'}); await p.waitForTimeout(900);
    const info=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); const sp=document.querySelector('.spacer[data-for="lichtschacht"]'); let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} return {y,t:sp.offsetHeight};});
    const rows=[];
    for(const f of [0.85,1.15]){
      await p.evaluate(([y,t,f])=>scrollTo({top:y+t*f,behavior:'instant'}),[info.y,info.t,f]); await p.waitForTimeout(800);
      const m=await p.evaluate(()=>{const c=document.getElementById('lichtschacht'); const cr=c.getBoundingClientRect(); const sc=c.querySelector('.wx__scene').getBoundingClientRect(); const bar=c.querySelector('.wx__bar').getBoundingClientRect(); const st=document.getElementById('stimmen').getBoundingClientRect();
        return {card:[Math.round(cr.top),Math.round(cr.bottom)],scene:[Math.round(sc.width),Math.round(sc.height),(sc.width/sc.height).toFixed(2)],barBottom:Math.round(bar.bottom),stimmen:Math.round(st.top),ok:bar.bottom<=cr.bottom-8&&bar.bottom<=st.top-8};});
      rows.push(`${f}: card ${m.card} scene ${m.scene} barB ${m.barBottom} stimmen ${m.stimmen} ${m.ok?'✓':'✗ ABGESCHNITTEN'}`);
      if(f===0.85) await p.screenshot({path:`${OUT}/fit-${name}-${W}x${H}.png`});
    }
    console.log(`${name} ${W}x${H} | `+rows.join(' | ')+(errs.length?' | ERR '+errs[0]:''));
    await ctx.close();
  }
  await b.close();
}
