import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT=process.argv[2];
const b=await chromium.launch({executablePath:CH,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1512,height:900},deviceScaleFactor:1});
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
await p.screenshot({path:OUT});
await b.close();
