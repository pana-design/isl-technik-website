import { chromium } from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');
const r=await p.evaluate(async()=>{
  const out={};
  for(const f of ['haus3d-zu-1600-cut.webp','haus3d-offen-1600-cut.webp']){
    const im=new Image(); im.src='/img/produkte/'+f+'?'+Math.random(); await im.decode();
    const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
    const D=x.getImageData(0,0,im.width,im.height).data;
    let x0=1e9,y0=1e9,x1=-1,y1=-1;
    for(let y=0;y<im.height;y++)for(let px=0;px<im.width;px++){
      if(D[(y*im.width+px)*4+3]>40){if(px<x0)x0=px;if(px>x1)x1=px;if(y<y0)y0=y;if(y>y1)y1=y;}}
    out[f]={w:im.width,h:im.height,box:[x0,y0,x1,y1],
      rel:[ (x0/im.width).toFixed(3),(y0/im.height).toFixed(3),(x1/im.width).toFixed(3),(y1/im.height).toFixed(3)]};
  }
  return out;
});
console.log(JSON.stringify(r,null,1));
await b.close();
