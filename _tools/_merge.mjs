/* Setzt einzelne Regionen aus BILD-B weich in BILD-A ein.
   So bleibt alles ausserhalb der Produktbereiche pixelgleich — die Lupe
   deckt dann wirklich nur den Schutz auf und nicht auch neu gewuerfeltes Gras. */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [A,B,OUT]=process.argv.slice(2);
// x0,y0,x1,y1 normiert, plus Feather in Anteil der Bildbreite
const REGIONS=JSON.parse(process.env.REGIONS);
const FEATHER=Number(process.env.FEATHER||0.012);
const a=readFileSync(A).toString('base64'), b=readFileSync(B).toString('base64');
const br=await chromium.launch({executablePath:CH});
const p=await br.newPage(); await p.goto('http://localhost:8080/');
const d=await p.evaluate(async(o)=>{
  const l=async s=>{const i=new Image(); i.src='data:image/png;base64,'+s; await i.decode(); return i;};
  const i1=await l(o.a), i2=await l(o.b);
  const W=i1.naturalWidth,H=i1.naturalHeight;
  const c=document.createElement('canvas'); c.width=W;c.height=H;
  const x=c.getContext('2d');
  x.drawImage(i1,0,0,W,H);                      // Basis: offener Zustand

  // Maske aus weichen Rechtecken
  const m=document.createElement('canvas'); m.width=W;m.height=H;
  const mx=m.getContext('2d');
  const f=o.FEATHER*W;
  for(const r of o.REGIONS){
    const X=r[0]*W, Y=r[1]*H, X2=r[2]*W, Y2=r[3]*H;
    mx.save();
    mx.filter=`blur(${f}px)`;
    mx.fillStyle='#fff';
    mx.fillRect(X, Y, X2-X, Y2-Y);
    mx.restore();
  }
  // Bild B durch die Maske stanzen
  const t=document.createElement('canvas'); t.width=W;t.height=H;
  const tx=t.getContext('2d');
  tx.drawImage(i2,0,0,W,H);
  tx.globalCompositeOperation='destination-in';
  tx.drawImage(m,0,0);
  x.drawImage(t,0,0);
  return c.toDataURL('image/png').split(',')[1];
},{a,b,REGIONS,FEATHER});
writeFileSync(OUT,Buffer.from(d,'base64'));
await br.close(); console.log(OUT);
