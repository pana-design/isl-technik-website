import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:393,height:760}}); const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const cdp=await ctx.newCDPSession(p); await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:6000*1024/8,uploadThroughput:200*1024/8}); // ~600 kbit/s
await p.goto('http://localhost:8080/',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(600);
const state=async()=>p.evaluate(()=>[...document.querySelectorAll('.systems__shot')].map(f=>{const img=f.querySelector('img'); const v=f.querySelector('video'); return (img.src.includes('poster')?'P':'FOTO')+(f.classList.contains('has-clip')?'+clip':'')+(v&&getComputedStyle(v).display!=='none'&&!f.classList.contains('has-clip')?'!VIDSICHTBAR':'');}).join(' '));
console.log('t=0.6s', await state());
const info=await p.evaluate(()=>{const c=document.getElementById('systeme'); const sp=document.querySelector('.spacer[data-for="systeme"]'); let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} return {y,t:sp.offsetHeight};});
for(const f of [0.05,0.3,0.5,0.75]){ await p.evaluate(([y,t,f])=>scrollTo({top:y+t*f,behavior:'instant'}),[info.y,info.t,f]); await p.waitForTimeout(700);
  console.log('scroll',f, await state()); await p.screenshot({path:`${OUT}/sys-${f}.png`}); }
await p.waitForTimeout(9000); console.log('t+12s', await state());
console.log('errors',errs);
await b.close();
