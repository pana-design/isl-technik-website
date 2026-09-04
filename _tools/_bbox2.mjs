/* Findet die Bounding-Boxen der zusammenhaengenden Unterschiedsflaechen
   zwischen zwei Bildern — aber nur dort, wo der Unterschied kraeftig ist
   (Gras rauscht nur schwach, die Gewebe sind massiv dunkler). */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [A,B]=process.argv.slice(2);
const TH=Number(process.env.TH||110);
const MIN=Number(process.env.MIN||1500);
const a=readFileSync(A).toString('base64'), b=readFileSync(B).toString('base64');
const br=await chromium.launch({executablePath:CH});
const p=await br.newPage(); await p.goto('http://localhost:8080/');
const out=await p.evaluate(async(o)=>{
  const l=async s=>{const i=new Image(); i.src='data:image/png;base64,'+s; await i.decode(); return i;};
  const i1=await l(o.a), i2=await l(o.b);
  const W=600,H=Math.round(600*i1.naturalHeight/i1.naturalWidth);
  const c=document.createElement('canvas'); c.width=W;c.height=H; const x=c.getContext('2d');
  x.drawImage(i1,0,0,W,H); const d1=x.getImageData(0,0,W,H).data;
  x.clearRect(0,0,W,H); x.drawImage(i2,0,0,W,H); const d2=x.getImageData(0,0,W,H).data;
  const m=new Uint8Array(W*H);
  for(let i=0,k=0;i<d1.length;i+=4,k++){
    const dv=Math.abs(d1[i]-d2[i])+Math.abs(d1[i+1]-d2[i+1])+Math.abs(d1[i+2]-d2[i+2]);
    m[k]=dv>o.TH?1:0;
  }
  // 3x3 Dilatation, damit zerfranste Flaechen zusammenwachsen
  for(let pass=0;pass<3;pass++){
    const n=new Uint8Array(m);
    for(let y=1;y<H-1;y++)for(let xx=1;xx<W-1;xx++){
      const k=y*W+xx; if(m[k])continue;
      if(m[k-1]||m[k+1]||m[k-W]||m[k+W])n[k]=1;
    }
    m.set(n);
  }
  const seen=new Uint8Array(W*H), boxes=[];
  for(let k=0;k<W*H;k++){
    if(!m[k]||seen[k])continue;
    const st=[k]; seen[k]=1; let n=0,x0=1e9,y0=1e9,x1=-1,y1=-1;
    while(st.length){
      const q=st.pop(); n++;
      const qx=q%W, qy=(q/W)|0;
      if(qx<x0)x0=qx; if(qx>x1)x1=qx; if(qy<y0)y0=qy; if(qy>y1)y1=qy;
      for(const nb of [q-1,q+1,q-W,q+W]){
        if(nb<0||nb>=W*H||seen[nb]||!m[nb])continue;
        seen[nb]=1; st.push(nb);
      }
    }
    if(n>=o.MIN) boxes.push({n,box:[(x0/W).toFixed(3),(y0/H).toFixed(3),(x1/W).toFixed(3),(y1/H).toFixed(3)]});
  }
  boxes.sort((p,q)=>q.n-p.n);
  return boxes.slice(0,8);
},{a,b,TH,MIN});
console.log(JSON.stringify(out,null,1));
await br.close();
