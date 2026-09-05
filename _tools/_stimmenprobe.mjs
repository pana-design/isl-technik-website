/* Kundenstimmen mobil: Karte in kleinen Schritten durchscrollen und pruefen,
   ob die gepinnte Karte oder ihre Nachbarn springen (Delta pro Schritt). */
import { chromium, webkit, devices } from 'playwright-core';
import { mkdirSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const ENGINE=process.env.ENGINE||'webkit', W=+(process.env.W||393), H=+(process.env.H||660), OUT=process.argv[2]||'shots-mobil/stimmen', STEP=+(process.env.STEP||40);
mkdirSync(OUT,{recursive:true});
const b=ENGINE==='webkit'?await webkit.launch():await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H},deviceScaleFactor:2});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(1000);
const abs=sel=>p.evaluate(sel=>{let y=0;for(let e=document.querySelector(sel);e;e=e.offsetParent)y+=e.offsetTop;return y;},sel);
const y0=await abs('.pinwrap:has(> .voices)'), yEnd=await p.evaluate(()=>{const w=document.querySelector('.pinwrap:has(> .voices)');let y=0;for(let e=w;e;e=e.offsetParent)y+=e.offsetTop;return y+w.offsetHeight;});
const info=await p.evaluate(()=>{const s=document.getElementById('stimmen');const sp=document.querySelector('.spacer[data-for="stimmen"]');const w=document.querySelector('.pinwrap:has(> .voices)');
  return {pos:getComputedStyle(s).position,stH:s.offsetHeight,spacer:sp.offsetHeight,wrap:w.offsetHeight,quotesH:document.getElementById('voiceList').offsetHeight,voiceH:[...document.querySelectorAll('.voice')].map(v=>v.offsetHeight).join('/')};});
console.log('pinwrap',y0,'..',yEnd,JSON.stringify(info));
let prev=null, shot=0;
for(let y=y0-H; y<=yEnd+H*0.5; y+=STEP){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y); await p.waitForTimeout(60);
  const st=await p.evaluate(()=>{const r=s=>Math.round(document.querySelector(s).getBoundingClientRect().top);
    const act=document.querySelector('.voice.is-active'); return {wx:r('#lichtschacht'),st:r('#stimmen'),ab:r('#ablauf'),p:document.getElementById('stimmen').style.getPropertyValue('--p'),q:act?act.dataset.i:'-'};});
  const d=prev?`Δwx=${st.wx-prev.wx} Δst=${st.st-prev.st} Δab=${st.ab-prev.ab}`:'';
  const odd=prev&&([st.wx-prev.wx,st.st-prev.st,st.ab-prev.ab].some(v=>v!==0&&v!==-STEP));
  console.log(`y=${y} wx=${st.wx} stimmen=${st.st} ablauf=${st.ab} p=${st.p} zitat=${st.q} ${d}${odd?'  <-- ungleichmaessig':''}`);
  if((y-(y0-H))%(STEP*6)===0){await p.screenshot({path:`${OUT}/${ENGINE[0]}_${String(shot++).padStart(2,'0')}_y${y}.png`});}
  prev=st;
}
console.log('Viewport',W+'x'+H,ENGINE,errs.length?'FEHLER '+errs[0]:'keine JS-Fehler');
await b.close();
