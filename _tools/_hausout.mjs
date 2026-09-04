/* Bereitet ein Haus-Rendering fuer die Seite auf:
   1) verschiebt die flache Studio-Grundfarbe exakt auf die Seitenfarbe
      (--bg-page). Der Rasen liegt damit nahtlos auf der Karte, ohne dass
      das Bild freigestellt werden muss.
   2) rechnet es auf die Breiten des srcset herunter und schreibt WebP. */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const SRC=process.argv[2], OUT=process.argv[3];
const TARGET=(process.env.TARGET||'242,243,244').split(',').map(Number);
const WIDTHS=(process.env.WIDTHS||'640,1024,1600,2200').split(',').map(Number);
const Q=Number(process.env.Q||0.9);
const b64=readFileSync(SRC).toString('base64');
const br=await chromium.launch({executablePath:CH});
const p=await br.newPage(); await p.goto('http://localhost:8080/');
const res=await br && await p.evaluate(async(o)=>{
  const im=new Image(); im.src='data:image/png;base64,'+o.b64; await im.decode();
  const W=im.naturalWidth,H=im.naturalHeight;
  const c=document.createElement('canvas'); c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(im,0,0);
  const id=x.getImageData(0,0,W,H), D=id.data;
  // Grundfarbe aus dem Bildrand: Median ueber alle vier Kanten
  const rs=[[],[],[]];
  for(let px=0;px<W;px+=5)for(const py of [0,H-1]){const i=(py*W+px)*4;rs[0].push(D[i]);rs[1].push(D[i+1]);rs[2].push(D[i+2]);}
  for(let py=0;py<H;py+=5)for(const px of [0,W-1]){const i=(py*W+px)*4;rs[0].push(D[i]);rs[1].push(D[i+1]);rs[2].push(D[i+2]);}
  const bg=rs.map(a=>{a.sort((m,n)=>m-n);return a[a.length>>1];});
  const dl=[o.TARGET[0]-bg[0],o.TARGET[1]-bg[1],o.TARGET[2]-bg[2]];
  for(let i=0;i<D.length;i+=4){
    D[i]  =Math.max(0,Math.min(255,D[i]  +dl[0]));
    D[i+1]=Math.max(0,Math.min(255,D[i+1]+dl[1]));
    D[i+2]=Math.max(0,Math.min(255,D[i+2]+dl[2]));
  }
  x.putImageData(id,0,0);
  const outs={};
  for(const w of o.WIDTHS){
    const h=Math.round(w*H/W);
    const c2=document.createElement('canvas'); c2.width=w;c2.height=h;
    const x2=c2.getContext('2d'); x2.imageSmoothingQuality='high';
    x2.drawImage(c,0,0,w,h);
    outs[w]=c2.toDataURL('image/webp',o.Q).split(',')[1];
  }
  return {bg,dl,W,H,outs};
},{b64,TARGET,WIDTHS,Q});
for(const w of WIDTHS) writeFileSync(`${OUT}-${w}.webp`, Buffer.from(res.outs[w],'base64'));
console.log(`${OUT}  Quelle ${res.W}x${res.H}  Grundfarbe ${res.bg} -> Verschiebung ${res.dl}`);
await br.close();
