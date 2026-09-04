import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [A,B,OUT]=process.argv.slice(2);
const a=readFileSync(A).toString('base64'), bb=readFileSync(B).toString('base64');
const br=await chromium.launch({executablePath:CH});
const p=await br.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async(o)=>{
  const l=async s=>{const i=new Image(); i.src='data:image/png;base64,'+s; await i.decode(); return i;};
  const i1=await l(o.a), i2=await l(o.b);
  const W=1000,H=Math.round(W*i1.naturalHeight/i1.naturalWidth);
  const c=document.createElement('canvas'); c.width=W;c.height=H; const x=c.getContext('2d');
  x.drawImage(i1,0,0,W,H); const d1=x.getImageData(0,0,W,H);
  x.clearRect(0,0,W,H); x.drawImage(i2,0,0,W,H); const d2=x.getImageData(0,0,W,H);
  const out=x.createImageData(W,H);
  let n=0;
  for(let i=0;i<d1.data.length;i+=4){
    const dv=Math.abs(d1.data[i]-d2.data[i])+Math.abs(d1.data[i+1]-d2.data[i+1])+Math.abs(d1.data[i+2]-d2.data[i+2]);
    const v=dv>28?255:0; if(v) n++;
    out.data[i]=255-v; out.data[i+1]=255-v; out.data[i+2]=255-v; out.data[i+3]=255;
  }
  x.putImageData(out,0,0);
  return {png:c.toDataURL('image/png').split(',')[1], pct:(100*n/(W*H)).toFixed(1)};
},{a:o=>0, ...{a,b:bb}});
writeFileSync(OUT,Buffer.from(d.png,'base64'));
console.log('abweichende Pixel:',d.pct+'%');
await br.close();
