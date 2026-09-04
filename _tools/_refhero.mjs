import { chromium, devices } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const URL=process.argv[2]||'https://sensiq.co/', SEL=process.argv[3]||'header, .hero, section:first-of-type';
const b=await chromium.launch({executablePath:CH}); const ctx=await b.newContext({...devices['iPhone 15'],viewport:{width:393,height:852},deviceScaleFactor:2}); const p=await ctx.newPage();
await p.goto(URL,{waitUntil:'networkidle'}); await p.waitForTimeout(1500);
const out=await p.evaluate(SEL=>{
  const root=document.querySelector(SEL); if(!root) return 'kein Element fuer '+SEL;
  const lines=[]; const cs=e=>getComputedStyle(e);
  const walk=(e,d)=>{ if(d>7) return; const r=e.getBoundingClientRect(); const s=cs(e);
    if(r.width<2||r.height<2||s.display==='none') return;
    const txt=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean).join(' ').slice(0,40);
    lines.push(`${'  '.repeat(d)}<${e.tagName.toLowerCase()}${e.id?'#'+e.id:''}${e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,3).join('.'):''}> ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} ${s.position!=='static'?s.position:''} ${s.display==='flex'||s.display==='grid'?s.display+'/'+s.flexDirection:''} p:${s.padding} m:${s.margin} ${['H1','H2','P','A','SPAN','BUTTON'].includes(e.tagName)?'fs:'+s.fontSize+' lh:'+s.lineHeight+' fw:'+s.fontWeight+' c:'+s.color:''} ${s.backgroundColor!=='rgba(0, 0, 0, 0)'?'bg:'+s.backgroundColor:''} ${s.borderRadius!=='0px'?'r:'+s.borderRadius:''} ${e.tagName==='IMG'||e.tagName==='VIDEO'?'src:'+(e.currentSrc||e.src||'').split('/').pop().slice(0,40)+' fit:'+s.objectFit:''} ${txt?'"'+txt+'"':''}`);
    [...e.children].forEach(c=>walk(c,d+1)); };
  walk(root,0); return lines.join('\n'); },SEL);
console.log(out); await b.close();
