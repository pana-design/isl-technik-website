/* Mobil-Rundgang: nimmt eine Seite als iPhone auf — Video eines
   durchgehenden Scrolls, Screens alle halbe Viewporthoehe und je Stopp
   die sichtbaren sticky/fixed-Elemente und laufenden Videos.
   node _tools/_mobtour.mjs <url> <ausgabeordner> */
import { chromium, devices } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [URL,OUT]=process.argv.slice(2); mkdirSync(OUT,{recursive:true});
const W=393,H=852;
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:W,height:H},deviceScaleFactor:2,
  recordVideo:{dir:OUT,size:{width:W,height:H}}});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL,{waitUntil:'networkidle',timeout:60000}); await p.waitForTimeout(2500);
// Cookie-Banner wegklicken, falls vorhanden
for(const t of ['Accept','Akzeptieren','Alle akzeptieren','OK','Got it','Agree']){
  const el=p.getByRole('button',{name:t,exact:false}).first(); if(await el.count()){ try{await el.click({timeout:1000});}catch{} break; } }
const info=await p.evaluate(()=>{
  const sel=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,3).join('.'):'');
  return {
    title:document.title, height:document.documentElement.scrollHeight,
    scripts:[...document.scripts].map(s=>s.src||'inline:'+s.textContent.slice(0,60).replace(/\s+/g,' ')).slice(0,40),
    styles:[...document.styleSheets].map(s=>s.href).filter(Boolean),
    sections:[...document.body.querySelectorAll('section,main > *,body > *')].filter(e=>e.getBoundingClientRect().height>40).map(e=>({sel:sel(e),top:Math.round(e.getBoundingClientRect().top+scrollY),h:Math.round(e.getBoundingClientRect().height),pos:getComputedStyle(e).position})).slice(0,80),
    libs:['Lenis','gsap','ScrollTrigger','ScrollSmoother','locomotive','barba','Swiper','three','THREE','lottie','Rive','rive'].filter(k=>k in window),
    bodyOverflow:getComputedStyle(document.body).overflow, htmlScroll:getComputedStyle(document.documentElement).scrollBehavior,
    videos:[...document.querySelectorAll('video')].map(v=>({src:(v.currentSrc||v.src||(v.querySelector('source')||{}).src||'').split('/').pop(),w:v.videoWidth,h:v.videoHeight,auto:v.autoplay,loop:v.loop,rect:v.getBoundingClientRect().height>0})),
    canvas:document.querySelectorAll('canvas').length,
    sticky:[...document.querySelectorAll('*')].filter(e=>['sticky','fixed'].includes(getComputedStyle(e).position)).map(e=>({sel:sel(e),pos:getComputedStyle(e).position,top:getComputedStyle(e).top,h:Math.round(e.getBoundingClientRect().height)})).slice(0,60)
  };
});
writeFileSync(OUT+'/info.json',JSON.stringify(info,null,1));
// 1) Video: gleichmaessig durchscrollen (ca. 900px/s), am Ende kurz stehen
await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
await p.evaluate(async()=>{const max=document.documentElement.scrollHeight-innerHeight; let y=0;
  await new Promise(res=>{const f=()=>{y=Math.min(max,y+15); scrollTo({top:y,behavior:'instant'}); if(y>=max){res();return;} requestAnimationFrame(f);}; requestAnimationFrame(f);});
  await new Promise(r=>setTimeout(r,1500));});
// 2) Screens + Analyse je Stopp
await p.evaluate(()=>scrollTo({top:0,behavior:'instant'})); await p.waitForTimeout(800);
const stops=[]; const max=info.height-H; let i=0;
for(let y=0;y<=max+1;y+=Math.round(H/2)){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.min(y,max)); await p.waitForTimeout(900);
  const st=await p.evaluate(()=>{
    const sel=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,3).join('.'):'');
    const vis=e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.width>0;};
    return {y:scrollY,
      stickyVisible:[...document.querySelectorAll('*')].filter(e=>['sticky','fixed'].includes(getComputedStyle(e).position)&&vis(e)).map(sel).slice(0,12),
      playing:[...document.querySelectorAll('video')].filter(v=>!v.paused&&vis(v)).map(v=>(v.currentSrc||v.src||'').split('/').pop()),
      transformed:[...document.querySelectorAll('section *')].filter(e=>vis(e)&&getComputedStyle(e).transform!=='none'&&e.getBoundingClientRect().height>60).map(sel).slice(0,8)};
  });
  const name=`m_${String(i).padStart(2,'0')}_y${st.y}.png`;
  await p.screenshot({path:`${OUT}/${name}`}); st.shot=name; stops.push(st); i++;
}
writeFileSync(OUT+'/stops.json',JSON.stringify(stops,null,1));
await ctx.close(); await b.close();
console.log(`${URL} -> ${OUT}: ${stops.length} Stopps, Hoehe ${info.height}px, libs ${JSON.stringify(info.libs)}, videos ${info.videos.length}, canvas ${info.canvas}, sticky/fixed ${info.sticky.length}${errs.length?' | Fehler: '+errs.slice(0,3).join(' | '):''}`);
