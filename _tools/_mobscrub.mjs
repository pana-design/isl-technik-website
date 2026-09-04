/* Reagieren die Produktclips mobil aufs Scrollen? Prueft in Chromium und
   WebKit (iPhone-Emulation): Clip vorhanden, sichtbar, currentTime folgt. */
import { chromium, webkit, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
for(const [name,launch] of [['Chromium',()=>chromium.launch({executablePath:CH})],['WebKit',()=>webkit.launch()]]){
  let b; try{ b=await launch(); }catch(e){ console.log(name,'Start fehlgeschlagen:',e.message.split('\n')[0]); continue; }
  const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:393,height:852}});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
  const geo=await p.evaluate(()=>{let y=0,e=document.getElementById('systeme');while(e){y+=e.offsetTop;e=e.offsetParent;}
    return {top:y,travel:(document.querySelector('.spacer[data-for="systeme"]')||{}).offsetHeight||0, hero:!!document.querySelector('.hero__clip'), heroPlaying:(()=>{const v=document.querySelector('.hero__clip');return v?!v.paused:null})()};});
  const rows=[];
  for(const f of [0.12,0.3,0.5,0.7,0.9]){
    await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geo.top+geo.travel*f); await p.waitForTimeout(900);
    rows.push(await p.evaluate(()=>{const fig=document.querySelector('.systems__shot.is-active'); const v=fig&&fig.querySelector('video');
      return {i:fig&&fig.dataset.i, clip:!!v, on:fig&&fig.classList.contains('has-clip'), rs:v?v.readyState:null, t:v?+v.currentTime.toFixed(2):null, vis:v?getComputedStyle(v).display!=='none'&&v.getBoundingClientRect().height>0:null};}));
  }
  console.log(`${name}: travel ${geo.travel}px, Hero-Clip ${geo.hero?(geo.heroPlaying?'spielt':'steht'):'fehlt'} |`, rows.map(r=>`#${r.i} clip=${r.clip} on=${r.on} rs=${r.rs} t=${r.t}`).join(' | '), errs.length?'| FEHLER '+errs[0]:'');
  await b.close();
}
