/* Stellt die Haus-Renderings frei.
   1) Flood-Fill vom Rand gegen die flache Studio-Grundfarbe  -> Hintergrund weg
   2) Gradienten-Flood durch den weichen Bodenschatten (nur sanfte Uebergaenge,
      bricht an der harten Hauskante ab) -> Schatten wird echtes Alpha-Schwarz */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const TOL=Number(process.env.TOL||7);
const STEP=Number(process.env.STEP||7);      // max. Helligkeitssprung je Nachbar
const DROP=Number(process.env.DROP||75);
const PTOL=Number(process.env.PTOL||6);
const BAND=Number(process.env.BAND||3);
const ISLAND=Number(process.env.ISLAND||900);
const R=Number(process.env.R||8);
const ERO=Number(process.env.ERO||6);
const GL=Number(process.env.GL||155);
const GB=Number(process.env.GB||7);
const PRAD=Number(process.env.PRAD||0.22);
const FAR=Number(process.env.FAR||99999);  // Schritt 5a aus: frisst sonst helle Wandflaechen an
const GROUND_L=Number(process.env.GROUND_L||202);
const GROUND_S=Number(process.env.GROUND_S||22);
const GROUND_A=Number(process.env.GROUND_A||1);   // nur weichzeichnen, nicht ausduennen
const FRAC=Number(process.env.FRAC||0.6);
const HI=Number(process.env.HI||16);
const DEBUG=process.env.DEBUG==='1';
const SEEDS=(process.env.SEEDS||'0.28,0.44,0.24;0.30,0.55,0.24;0.36,0.62,0.24;0.44,0.46,0.22;0.46,0.52,0.22;0.47,0.62,0.22;'+
   '0.69,0.46,0.20;0.71,0.55,0.20;0.66,0.60,0.20;'+
   '0.727,0.680,0.05;0.60,0.80,0.05')
  .split(';').filter(Boolean).map(s=>s.split(',').map(Number));     // max. Gesamtabfall im Schatten
const b=await chromium.launch({executablePath:CH});
const p=await b.newPage(); await p.goto('http://localhost:8080/');

for(const f of process.argv.slice(2)){
  const res=await p.evaluate(async ({f,TOL,STEP,DROP,SEEDS,PTOL,BAND,ISLAND,R,FRAC,HI,ERO,GL,GB,PRAD,FAR,GROUND_L,GROUND_S,GROUND_A,DEBUG})=>{
    const im=new Image(); im.src='/img/produkte/'+f; await im.decode();
    const W=im.width,H=im.height,N=W*H;
    const c=document.createElement('canvas'); c.width=W;c.height=H;
    const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(im,0,0);
    const id=x.getImageData(0,0,W,H), D=id.data;
    const rs=[[],[],[]];
    for(let px=0;px<W;px+=7)for(const py of [0,H-1]){const i=(py*W+px)*4;rs[0].push(D[i]);rs[1].push(D[i+1]);rs[2].push(D[i+2]);}
    for(let py=0;py<H;py+=7)for(const px of [0,W-1]){const i=(py*W+px)*4;rs[0].push(D[i]);rs[1].push(D[i+1]);rs[2].push(D[i+2]);}
    const bg=rs.map(a=>{a.sort((m,n)=>m-n);return a[a.length>>1];});
    const bgL=bg[0]*.299+bg[1]*.587+bg[2]*.114;
    const L=new Float32Array(N), SAT=new Float32Array(N);
    for(let k=0;k<N;k++){const i=k*4,r=D[i],g=D[i+1],bl=D[i+2];
      L[k]=r*.299+g*.587+bl*.114; SAT[k]=Math.max(r,g,bl)-Math.min(r,g,bl);}
    const dist=k=>{const i=k*4;return Math.max(Math.abs(D[i]-bg[0]),Math.abs(D[i+1]-bg[1]),Math.abs(D[i+2]-bg[2]));};

    // --- 1) harter Hintergrund
    const out=new Uint8Array(N); const st=new Int32Array(N); let sp=0;
    const push=k=>{ if(!out[k]&&dist(k)<=TOL){out[k]=2;st[sp++]=k;} };   // 2 = Hintergrund
    for(let px=0;px<W;px++){push(px);push((H-1)*W+px);}
    for(let py=0;py<H;py++){push(py*W);push(py*W+W-1);}
    while(sp){const k=st[--sp],px=k%W,py=(k-px)/W;
      if(px>0)push(k-1); if(px<W-1)push(k+1); if(py>0)push(k-W); if(py<H-1)push(k+W);}

    // --- 1b) Schutzflaechen: helle Hausflaechen ab Saatpunkt aufsammeln,
    //     damit der Schattenfluss nicht ueber die weiche Silhouette einsickert.
    const prot=new Uint8Array(N);
    for(const [fx,fy,fr] of SEEDS){
      const s0=Math.round(fy*H)*W+Math.round(fx*W);
      if(out[s0])continue;
      // Randsaum bleibt frei, sonst wandert der Schutz am Silhouettenrand
      // um das ganze Objekt und haelt den weissen Saum fest.
      const atBg=n=>{const px=n%W;
        return (px>0&&out[n-1]===2)||(px<W-1&&out[n+1]===2)||
               (n>=W&&out[n-W]===2)||(n<N-W&&out[n+W]===2);};
      const sx0=Math.round(fx*W), sy0=Math.round(fy*H);
      const rad2=Math.pow((fr||PRAD)*W,2);
      const base=L[s0]; const q=[s0]; prot[s0]=1;
      while(q.length){ const k=q.pop(), px=k%W, py=(k-px)/W;
        const tryk=n=>{ if(prot[n]||out[n]||atBg(n))return;
          if(Math.abs(L[n]-base)>PTOL)return;
          const nx=n%W, ny=(n-nx)/W;                 // Reichweite begrenzen,
          const dx=nx-sx0, dy=ny-sy0;                // sonst laeuft der Schutz
          if(dx*dx+dy*dy>rad2)return;                // ueber den ganzen Boden
          prot[n]=1; q.push(n); };
        if(px>0)tryk(k-1); if(px<W-1)tryk(k+1); if(py>0)tryk(k-W); if(py<H-1)tryk(k+W); }
    }

    // --- 2) Schatten: nur sanft abfallende, graue Pixel ab der Hintergrundkante
    sp=0;
    const push2=(k,fromL)=>{ if(out[k]||prot[k])return;
      if(SAT[k]>14)return;                       // farbig -> Objekt
      if(L[k]>bgL+HI)return;                     // deutlich heller -> Objekt
      if(bgL-L[k]>DROP)return;                   // zu dunkel -> Objekt
      if(fromL-L[k]>STEP)return;                 // harte Kante -> Objekt
      out[k]=1; st[sp++]=k; };
    for(let k=0;k<N;k++) if(out[k]===2){ const px=k%W,py=(k-px)/W, l=L[k];
      if(px>0)push2(k-1,l); if(px<W-1)push2(k+1,l);
      if(py>0)push2(k-W,l); if(py<H-1)push2(k+W,l); }
    while(sp){const k=st[--sp],px=k%W,py=(k-px)/W,l=L[k];
      if(px>0)push2(k-1,l); if(px<W-1)push2(k+1,l);
      if(py>0)push2(k-W,l); if(py<H-1)push2(k+W,l);}

    // --- 3) Kantenentfaerbung: Mischpixel am Rand bestehen anteilig aus dem
    //     fast weissen Studiogrund. Ohne Korrektur bleibt auf gruenem Grund ein
    //     weisser Saum. Alpha aus dem Mischverhaeltnis, Farbe vom naechsten
    //     voll deckenden Objektpixel.
    const EDGE=new Int32Array(N).fill(-1);
    const isObj=k=>out[k]===0;
    const edges=[];
    for(let py=1;py<H-1;py++)for(let px=1;px<W-1;px++){const k=py*W+px;
      if(!isObj(k))continue;
      if(!isObj(k-1)||!isObj(k+1)||!isObj(k-W)||!isObj(k+W)) edges.push(k);}
    for(const k of edges) EDGE[k]=1;
    const decon=[];
    for(const k of edges){
      const px=k%W, py=(k-px)/W;
      let best=-1,bd=99;
      for(let dy=-BAND;dy<=BAND;dy++)for(let dx=-BAND;dx<=BAND;dx++){
        const nx=px+dx, ny=py+dy; if(nx<0||ny<0||nx>=W||ny>=H)continue;
        const n=ny*W+nx; if(!isObj(n)||EDGE[n]===1)continue;
        const d=dx*dx+dy*dy; if(d<bd){bd=d;best=n;}}
      if(best<0)continue;
      const i=k*4, j=best*4;
      let acc=0,cnt=0;
      for(let ch=0;ch<3;ch++){ const df=D[j+ch]-bg[ch];
        if(Math.abs(df)<14)continue;
        acc+=(D[i+ch]-bg[ch])/df; cnt++; }
      if(!cnt)continue;
      const a=Math.min(1,Math.max(0,acc/cnt));
      decon.push([i,D[j],D[j+1],D[j+2],Math.round(a*255)]);
    }
    for(const [i,r,g,bl,a] of decon){ D[i]=r;D[i+1]=g;D[i+2]=bl;D[i+3]=a; }

    // --- 4) Streuinseln: kleine, helle Restflecken (Reste des Studiogrunds
    //     zwischen Baum, Graeser und Haus) entfernen.
    {
      const seen=new Uint8Array(N), q=new Int32Array(N);
      for(let k0=0;k0<N;k0++){
        if(out[k0]!==0||seen[k0])continue;
        let qs=0,qe=0; q[qe++]=k0; seen[k0]=1;
        const cells=[]; let sumL=0;
        while(qs<qe){ const k=q[qs++], px=k%W, py=(k-px)/W;
          cells.push(k); sumL+=L[k];
          const t=n=>{ if(!seen[n]&&out[n]===0){seen[n]=1;q[qe++]=n;} };
          if(px>0)t(k-1); if(px<W-1)t(k+1); if(py>0)t(k-W); if(py<H-1)t(k+W); }
        if(cells.length<ISLAND && sumL/cells.length>190)
          for(const k of cells) out[k]=2;
      }
    }

    // --- 5) Eingeschlossene Grundreste: helle, neutrale Pixel, deren Umfeld
    //     ueberwiegend schon Grund/Schatten ist, gehoerten zum Studioboden.
    for(let it=0;it<ERO;it++){
      const S=new Int32Array((W+1)*(H+1));
      for(let y=0;y<H;y++)for(let x=0;x<W;x++)
        S[(y+1)*(W+1)+x+1]=(out[y*W+x]!==0?1:0)+S[y*(W+1)+x+1]+S[(y+1)*(W+1)+x]-S[y*(W+1)+x];
      const box=(x0,y0,x1,y1)=>S[(y1+1)*(W+1)+x1+1]-S[y0*(W+1)+x1+1]-S[(y1+1)*(W+1)+x0]+S[y0*(W+1)+x0];
      const kill=[];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;
        if(out[k]!==0||prot[k])continue;
        if(L[k]<GL||SAT[k]>20)continue;
        const x0=Math.max(0,x-R),y0=Math.max(0,y-R),x1=Math.min(W-1,x+R),y1=Math.min(H-1,y+R);
        const area=(x1-x0+1)*(y1-y0+1);
        if(box(x0,y0,x1,y1)/area>FRAC) kill.push(k);}
      if(!kill.length)break;
      for(const k of kill) out[k]=2;
    }

    // --- 5a) Freistehender Studioboden: helle Flaechen, die weit von jeder
    //     dunklen oder farbigen Struktur entfernt liegen, gehoeren nicht zum
    //     Haus. Abstand per Chamfer-Distanztransformation.
    {
      const INF=1e6, dt=new Float32Array(N);
      for(let k=0;k<N;k++) dt[k]=(SAT[k]>25||L[k]<170)?0:INF;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x; let v=dt[k];
        if(x>0)v=Math.min(v,dt[k-1]+1);
        if(y>0)v=Math.min(v,dt[k-W]+1);
        if(x>0&&y>0)v=Math.min(v,dt[k-W-1]+1.414);
        if(x<W-1&&y>0)v=Math.min(v,dt[k-W+1]+1.414);
        dt[k]=v;}
      for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const k=y*W+x; let v=dt[k];
        if(x<W-1)v=Math.min(v,dt[k+1]+1);
        if(y<H-1)v=Math.min(v,dt[k+W]+1);
        if(x<W-1&&y<H-1)v=Math.min(v,dt[k+W+1]+1.414);
        if(x>0&&y<H-1)v=Math.min(v,dt[k+W-1]+1.414);
        dt[k]=v;}
      const lim=FAR*W/1600;
      for(let k=0;k<N;k++){
        if(out[k]!==0||prot[k])continue;
        if(L[k]<198||SAT[k]>20)continue;
        if(dt[k]>lim) out[k]=2;
      }
    }

    // --- 5b) Loecher im Schatten schliessen. Die Reinigungsschritte oben
    //     stanzen einzelne Grundpixel mitten aus der Schattenflaeche; als
    //     transparente Punkte waeren sie auf der Wiese sofort sichtbar.
    {
      const S=new Int32Array((W+1)*(H+1));
      for(let y=0;y<H;y++)for(let x=0;x<W;x++)
        S[(y+1)*(W+1)+x+1]=(out[y*W+x]===1?1:0)+S[y*(W+1)+x+1]+S[(y+1)*(W+1)+x]-S[y*(W+1)+x];
      const fill=[];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;
        if(out[k]!==2)continue;
        const x0=Math.max(0,x-4),y0=Math.max(0,y-4),x1=Math.min(W-1,x+4),y1=Math.min(H-1,y+4);
        const sum=S[(y1+1)*(W+1)+x1+1]-S[y0*(W+1)+x1+1]-S[(y1+1)*(W+1)+x0]+S[y0*(W+1)+x0];
        if(sum/((x1-x0+1)*(y1-y0+1))>0.62) fill.push(k);}
      for(const k of fill) out[k]=1;
    }

    // --- Alpha schreiben
    let shadow=0;
    for(let k=0;k<N;k++){
      const i=k*4;
      if(out[k]===2){ D[i+3]=0; }
      else if(out[k]===1){                        // Schatten -> neutrales Schwarz
        let lv=L[k];
        if(lv>bgL-2){                             // aufgefuelltes Loch: Nachbarn mitteln
          let sum=0,n=0;
          for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
            const nx=(k%W)+dx, ny=((k-(k%W))/W)+dy;
            if(nx<0||ny<0||nx>=W||ny>=H)continue;
            const m=ny*W+nx; if(out[m]===1&&L[m]<bgL-4){sum+=L[m];n++;}}
          if(n)lv=sum/n;
        }
        const a=Math.min(1,Math.max(0,(bgL-lv)/bgL*3.1));
        D[i]=28;D[i+1]=32;D[i+2]=38;D[i+3]=Math.round(a*255); shadow++;
      }
    }
    // --- 6) Restlicher Studioboden (helle, neutrale Flaechen ausserhalb der
    //     geschuetzten Hausflaechen) laeuft weich aus, statt mit gezackter
    //     Kante auf der Wiese zu stehen.
    {
      const A=new Uint8Array(N); for(let k=0;k<N;k++)A[k]=D[k*4+3];
      const S=new Int32Array((W+1)*(H+1));
      for(let y=0;y<H;y++)for(let x=0;x<W;x++)
        S[(y+1)*(W+1)+x+1]=A[y*W+x]+S[y*(W+1)+x+1]+S[(y+1)*(W+1)+x]-S[y*(W+1)+x];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;
        if(prot[k]||A[k]===0)continue;
        if(L[k]<GROUND_L||SAT[k]>GROUND_S)continue;
        const x0=Math.max(0,x-GB),y0=Math.max(0,y-GB),x1=Math.min(W-1,x+GB),y1=Math.min(H-1,y+GB);
        const sum=S[(y1+1)*(W+1)+x1+1]-S[y0*(W+1)+x1+1]-S[(y1+1)*(W+1)+x0]+S[y0*(W+1)+x0];
        const avg=sum/((x1-x0+1)*(y1-y0+1));
        D[k*4+3]=Math.round(Math.min(A[k],avg)*GROUND_A);
      }
    }
    x.putImageData(id,0,0);
    if(DEBUG){ const cd=document.createElement('canvas');cd.width=W;cd.height=H;
      const xd=cd.getContext('2d'); const dm=xd.createImageData(W,H);
      for(let k=0;k<N;k++){const i=k*4;
        if(prot[k]){dm.data[i]=255;dm.data[i+1]=220;dm.data[i+2]=0;}
        else if(out[k]===2){dm.data[i]=255;dm.data[i+1]=255;dm.data[i+2]=255;}
        else if(out[k]===1){dm.data[i]=0;dm.data[i+1]=90;dm.data[i+2]=255;}
        else {dm.data[i]=255;dm.data[i+1]=0;dm.data[i+2]=120;}
        dm.data[i+3]=255;}
      xd.putImageData(dm,0,0); window.__dbg=cd.toDataURL('image/png'); }
    const c2=document.createElement('canvas'); c2.width=W;c2.height=H;
    const y=c2.getContext('2d'); y.fillStyle='#8FA97F'; y.fillRect(0,0,W,H); y.drawImage(c,0,0);
    return {bg,W,H,shadowPct:(shadow/N*100).toFixed(1),
      webp:c.toDataURL('image/webp',0.92), check:c2.toDataURL('image/png'), dbg:window.__dbg};
  },{f,TOL,STEP,DROP,SEEDS,PTOL,BAND,ISLAND,R,FRAC,HI,ERO,GL,GB,PRAD,FAR,GROUND_L,GROUND_S,GROUND_A,DEBUG});
  const name=f.replace('.webp','');
  writeFileSync('img/produkte/'+name+'-cut.webp', Buffer.from(res.webp.split(',')[1],'base64'));
  if(res.dbg)writeFileSync('shots/_dbg_'+name+'.png', Buffer.from(res.dbg.split(',')[1],'base64'));
  writeFileSync('shots/_key_'+name+'.png', Buffer.from(res.check.split(',')[1],'base64'));
  console.log(f,'bg',res.bg,'Schattenanteil',res.shadowPct+'%');
}
await b.close();
