import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:982}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(500);
// Recorder im Fenster: pro rAF scrollY, Frame-Abstand, aktiver Clip
await p.evaluate(()=>{
  window.__log=[]; let last=performance.now();
  const tick=now=>{
    const fig=document.querySelector('.systems__shot.is-active');
    const v=fig&&fig.querySelector('video');
    const wx=document.querySelector('.wx__phase[data-i="0"] video');
    const fr=document.querySelector('.wx__frame').getBoundingClientRect();
    window.__log.push({t:Math.round(now),gap:Math.round(now-last),y:Math.round(scrollY),
      sys:fig?+fig.dataset.i:null, ct:v?+v.currentTime.toFixed(3):null, seeking:v?v.seeking:null, rs:v?v.readyState:null,
      wxct:wx?+wx.currentTime.toFixed(2):null, wxpaused:wx?wx.paused:null, wxtop:Math.round(fr.top), wxbot:Math.round(fr.bottom)});
    last=now; requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const geo=await p.evaluate(()=>{
  const g=id=>{let y=0,e=document.getElementById(id);while(e){y+=e.offsetTop;e=e.offsetParent;}return y;};
  const sp=document.querySelector('.spacer[data-for="systeme"]');
  return {sys:g('systeme'),sysTravel:sp.offsetHeight,wx:g('lichtschacht'),max:document.documentElement.scrollHeight-innerHeight};
});
console.log('geo',geo);
// Mit dem Rad von ganz oben bis hinter die Wetterbuehne: 100px alle 16ms
await p.mouse.move(700,500);
const target=geo.wx+1400;
let sent=0;
while(sent<target){ await p.mouse.wheel(0,100); sent+=100; await p.waitForTimeout(16); }
await p.waitForTimeout(1500);
const log=await p.evaluate(()=>window.__log);
// Auswertung
const sysFrames=log.filter(r=>r.y>geo.sys-500&&r.y<geo.sys+geo.sysTravel+500);
const long=sysFrames.filter(r=>r.gap>34);
const back=log.filter((r,i)=>i&&r.y<log[i-1].y-1);
const stalls=[]; for(let i=3;i<log.length;i++){ if(log[i].y===log[i-3].y&&log[i].y>0&&log[i].y<geo.max-5&&log[i].t<log[log.length-1].t-1600) stalls.push(log[i]); }
console.log('Frames im Systeme-Bereich:',sysFrames.length,' davon >34ms:',long.length,' max gap:',Math.max(...sysFrames.map(r=>r.gap)),'ms');
console.log('Langsame Frames (Beispiele):',JSON.stringify(long.slice(0,12).map(r=>({gap:r.gap,y:r.y,sys:r.sys,ct:r.ct,seeking:r.seeking}))));
console.log('Rueckwaerts-Spruenge:',back.length, JSON.stringify(back.slice(0,5)));
console.log('Stillstand waehrend Radbewegung (Frames):',stalls.length, JSON.stringify(stalls.slice(0,5).map(r=>({t:r.t,y:r.y,sys:r.sys}))));
// Scrub-Genauigkeit: Verteilung seeking=true
const seekFrac=sysFrames.filter(r=>r.seeking).length/Math.max(1,sysFrames.length);
console.log('Anteil Frames mit seeking=true im Systeme-Bereich:',(seekFrac*100).toFixed(0)+'%');
// Laub-Clip: wann startete er relativ zur Sichtbarkeit?
const first=log.find(r=>r.wxct!==null&&r.wxpaused===false);
const seen=log.find(r=>r.wxtop<982*0.5);
const fully=log.find(r=>r.wxbot<=982+4&&r.wxtop>=0);
console.log('Laub-Clip startet bei y=',first&&first.y,' frame.top=',first&&first.wxtop,'(Viewport 982) — Clip laeuft ab hier');
console.log('Buehne halb im Bild bei y=',seen&&seen.y,' Laub-Clip steht da schon bei',seen&&seen.wxct,'s');
console.log('Buehne ganz im Bild bei y=',fully&&fully.y,' Laub-Clip steht da schon bei',fully&&fully.wxct,'s (Clip ist 5.1s)');
await b.close();
