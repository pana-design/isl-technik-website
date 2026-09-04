import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [A,B,OUT]=process.argv.slice(2);
const TH=Number(process.env.TH||110);
const a=readFileSync(A).toString('base64'), b=readFileSync(B).toString('base64');
const br=await chromium.launch({executablePath:CH});
const p=await br.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async(o)=>{
  const l=async s=>{const i=new Image(); i.src='data:image/png;base64,'+s; await i.decode(); return i;};
  const i1=await l(o.a), i2=await l(o.b);
  const W=1000,H=Math.round(1000*i1.naturalHeight/i1.naturalWidth);
  const c=document.createElement('canvas'); c.width=W;c.height=H; const x=c.getContext('2d');
  x.drawImage(i1,0,0,W,H); const d1=x.getImageData(0,0,W,H);
  x.clearRect(0,0,W,H); x.drawImage(i2,0,0,W,H); const d2=x.getImageData(0,0,W,H);
  const out=x.createImageData(W,H);
  for(let i=0;i<d1.data.length;i+=4){
    const dv=Math.abs(d1.data[i]-d2.data[i])+Math.abs(d1.data[i+1]-d2.data[i+1])+Math.abs(d1.data[i+2]-d2.data[i+2]);
    const v=dv>o.TH?0:255;
    out.data[i]=v;out.data[i+1]=v;out.data[i+2]=v;out.data[i+3]=255;
  }
  x.putImageData(out,0,0);
  x.strokeStyle='rgba(255,0,0,.55)'; x.fillStyle='#c00'; x.font='11px sans-serif'; x.lineWidth=1;
  for(let i=0;i<=20;i++){
    const px=i/20*W; x.beginPath(); x.moveTo(px,0); x.lineTo(px,H); x.stroke();
    x.fillText((i/20).toFixed(2),px+2,11);
  }
  for(let i=0;i<=20;i++){
    const py=i/20*H; x.beginPath(); x.moveTo(0,py); x.lineTo(W,py); x.stroke();
    x.fillText((i/20).toFixed(2),2,py-2);
  }
  return c.toDataURL('image/png').split(',')[1];
},{a,b,TH});
writeFileSync(OUT,Buffer.from(d,'base64'));
await br.close(); console.log(OUT);
