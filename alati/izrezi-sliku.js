// node cut2.js in.rgba out.rgba w h threshold
// 1) clears near-white background touching the border, 2) clears small near-white holes enclosed by green (basket slots),
// 3) "unblends" the edge pixels from white so no light halo remains.
const fs=require("fs");const [,,inp,out,W,H,T]=process.argv;const w=+W,h=+H,thr=+T||198;const d=fs.readFileSync(inp);const N=w*h;
const px=p=>[d[p*4],d[p*4+1],d[p*4+2]];
const isBg=p=>{const [r,g,b]=px(p);const mn=Math.min(r,g,b),mx=Math.max(r,g,b);return mn>thr&&mx-mn<24};
const isGreen=p=>{const [r,g,b]=px(p);return g>r+25&&g>=b};
const clear=new Uint8Array(N);const comp=new Int32Array(N).fill(-1);
const nb=p=>{const x=p%w,y=(p/w)|0,o=[];if(x>0)o.push(p-1);if(x<w-1)o.push(p+1);if(y>0)o.push(p-w);if(y<h-1)o.push(p+w);return o};
let id=0;
for(let s=0;s<N;s++){if(comp[s]>=0||!isBg(s))continue;const pts=[],st=[s];comp[s]=id;let border=false;const around=new Set();
 while(st.length){const p=st.pop();pts.push(p);const x=p%w,y=(p/w)|0;if(x==0||y==0||x==w-1||y==h-1)border=true;
  for(const q of nb(p)){if(comp[q]>=0)continue;if(isBg(q)){comp[q]=id;st.push(q)}else around.add(q)}}
 let green=0;for(const q of around)if(isGreen(q))green++;
 if(border||(pts.length<1500&&green>around.size*0.5))for(const p of pts)clear[p]=1;
 id++}
// distance (in px, 4-neighbour) from cleared area
const dist=new Int32Array(N).fill(1e9);const q=[];for(let p=0;p<N;p++)if(clear[p]){dist[p]=0;q.push(p)}
for(let i=0;i<q.length;i++){const p=q[i];for(const n of nb(p))if(dist[n]>dist[p]+1){dist[n]=dist[p]+1;q.push(n)}}
const o=Buffer.from(d);
for(let p=0;p<N;p++){
 if(clear[p]){o[p*4+3]=0;continue}
 if(dist[p]>2)continue;
 const x=p%w,y=(p/w)|0;let fr=0,fg=0,fb=0,c=0;
 for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const r=Y*w+X;if(dist[r]>=4){fr+=d[r*4];fg+=d[r*4+1];fb+=d[r*4+2];c++}}
 if(!c)continue;fr/=c;fg/=c;fb/=c;
 const f=[fr,fg,fb],col=px(p);let a=0,k=0;
 for(let i=0;i<3;i++){const den=255-f[i];if(den>25){a+=(255-col[i])/den;k++}}
 a=k?Math.max(0,Math.min(1,a/k)):1;
 o[p*4]=Math.round(fr);o[p*4+1]=Math.round(fg);o[p*4+2]=Math.round(fb);o[p*4+3]=Math.round(255*a);
}
fs.writeFileSync(out,o);
