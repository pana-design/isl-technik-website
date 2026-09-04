import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
await p.screenshot({path:process.argv[2]});
await b.close();
