import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:1512,height:900}});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(1200);
const box=await p.evaluate(()=>{const r=document.getElementById('heroHouse').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
// Cursor auf die Balkontuer legen
await p.mouse.move(box.x+box.w*0.33, box.y+box.h*0.60, {steps:20});
await p.waitForTimeout(900);
await p.screenshot({path:process.argv[2]});
// zweiter Schuss: Lupe auf den Lichtschacht
await p.mouse.move(box.x+box.w*0.62, box.y+box.h*0.72, {steps:20});
await p.waitForTimeout(900);
await p.screenshot({path:process.argv[3]});
await b.close();
