import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:982}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'}); await p.waitForTimeout(500);
const info=await p.evaluate(()=>{const c=document.getElementById('systeme'); const sp=document.querySelector('.spacer[data-for="systeme"]'); let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent;} return {y,t:sp.offsetHeight};});
await p.evaluate(([y,t])=>scrollTo({top:y+t*0.4,behavior:'instant'}),[info.y,info.t]); await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>[...document.querySelectorAll('.systems__shot')].map(f=>(f.classList.contains('has-clip')?'clip':'nur-img')+(f.classList.contains('is-active')?'*':'')).join(' ')));
await p.screenshot({path:process.argv[2]+'/sysdesk.png'}); console.log('errors',errs); await b.close();
