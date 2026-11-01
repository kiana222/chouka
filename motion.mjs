// Seekable seven-second composition. The parent webpage owns the playback clock.
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const label=document.querySelector('#scene-label');
let width=1280,height=720,time=0,rarity=5,count=1;
const cloudImage=new Image();cloudImage.src='./assets/cloud-sky.png';cloudImage.onload=()=>draw(time);
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const colors={3:[140,192,244],4:[179,143,231],5:[235,193,108]};
let seed=73471;const seeded=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const stars=Array.from({length:70},()=>({x:seeded(),y:seeded(),r:.4+seeded()*1.2,a:.15+seeded()*.5}));
const waapi=label.animate([{opacity:0},{opacity:.6,offset:.15},{opacity:.6,offset:.6},{opacity:0}],{duration:7000,fill:'both',iterations:1});waapi.pause();
function resize(){const dpr=Math.min(devicePixelRatio||1,1.6);width=innerWidth;height=innerHeight;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(time);}
function gradient(x,y,r,stops){const g=ctx.createRadialGradient(x,y,0,x,y,r);for(const [p,c]of stops)g.addColorStop(p,c);return g;}
function star(x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x+r*.15,y-r*.13,x+r*.65,y);ctx.quadraticCurveTo(x+r*.12,y+r*.13,x,y+r);ctx.quadraticCurveTo(x-r*.12,y+r*.13,x-r*.65,y);ctx.quadraticCurveTo(x-r*.15,y-r*.13,x,y-r);ctx.fill();ctx.restore();}
function draw(t){
  time=clamp(t,0,7);waapi.currentTime=time*1000;
  const w=width,h=height,sky=smooth((time-2)/1.2),c=colors[rarity];
  const g=ctx.createLinearGradient(0,0,w*.4,h);g.addColorStop(0,`rgb(${mix(47,15,sky)},${mix(84,30,sky)},${mix(124,58,sky)})`);g.addColorStop(1,`rgb(${mix(110,38,sky)},${mix(145,67,sky)},${mix(170,102,sky)})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // A painted cloud sea, with a deterministic camera push into the opening.
  const portalX=w*.52,portalY=h*.34,open=smooth(time/1.8),zoom=1+time*.07;
  if(cloudImage.complete&&cloudImage.naturalWidth){const scale=Math.max(w/cloudImage.naturalWidth,h/cloudImage.naturalHeight),cw=cloudImage.naturalWidth*scale,ch=cloudImage.naturalHeight*scale;ctx.save();ctx.globalAlpha=1-sky;ctx.translate(w/2,h*.43);ctx.rotate(time*.008);ctx.scale(zoom,zoom);ctx.drawImage(cloudImage,-cw/2,-ch*.43,cw,ch);ctx.restore();}
  if(time<2.9){
    const p=1-smooth((time-2.1)/.65),radius=mix(w*.08,w*.24,open);
    ctx.save();ctx.globalAlpha=p;ctx.fillStyle=gradient(portalX,portalY,radius,[[0,'#edf6fc'],[.10,'#d4e6f5'],[.28,'#80a9c7aa'],[.5,'#3f6a9150'],[1,'#8eaac000']]);ctx.fillRect(0,0,w,h);
    star(portalX,portalY,6+16*open,'#eff8ff',smooth((time-.8)/.6));ctx.restore();
  }
  ctx.save();ctx.globalAlpha=sky*.65;for(const s of stars){ctx.fillStyle=`rgba(211,227,243,${s.a})`;ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();}ctx.restore();
  if(time>1.65){
    const fly=clamp((time-1.65)/4.4),approach=smooth((time-5.5)/1.15),x=mix(w*.37,w*.74,fly),y=mix(-h*.12,h*.66,fly);
    const tint=smooth((time-3.65)/.7),r=mix(144,c[0],tint),gg=mix(198,c[1],tint),b=mix(246,c[2],tint);
    const tailLen=mix(w*.12,w*.31,fly),dx=tailLen*.68,dy=tailLen*.78;
    for(let i=count===10?5:1;i>=1;i--){const off=i===1?0:(i-1)*h*.055;const alpha=i===1?.9:.26;const tx=x-off*.45,ty=y+off;ctx.save();ctx.globalAlpha=alpha*(1-smooth((time-6.3)/.5));
      const trail=ctx.createLinearGradient(tx,ty,tx-dx,ty-dy);trail.addColorStop(0,`rgba(${r},${gg},${b},.95)`);trail.addColorStop(.3,`rgba(${r},${gg},${b},.35)`);trail.addColorStop(1,`rgba(${r},${gg},${b},0)`);
      ctx.lineCap='round';ctx.strokeStyle=trail;ctx.lineWidth=5+fly*3;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx-dx*.4,ty-dy*.42,tx-dx,ty-dy);ctx.stroke();ctx.globalAlpha*=.22;ctx.lineWidth=18;ctx.stroke();ctx.globalAlpha=alpha*(1-smooth((time-6.3)/.5));
      ctx.fillStyle=gradient(tx,ty,30+approach*160,[[0,'#f1f6ff'],[.1,`rgba(${r},${gg},${b},.65)`],[.4,`rgba(${r},${gg},${b},.12)`],[1,'#ffffff00']]);ctx.fillRect(tx-220,ty-220,440,440);star(tx,ty,9+fly*6+approach*35,'#eaf3fc');ctx.restore();
    }
    // A soft approach veil, not a full-screen flash.
    ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${approach*.21})`;ctx.fillRect(0,0,w,h);
  }
  const exit=smooth((time-6.45)/.55);if(exit){ctx.fillStyle=`rgba(29,41,60,${exit})`;ctx.fillRect(0,0,w,h);}
}
function seek(t){draw(Number(t)||0);}
window.addEventListener('message',e=>{if(e.source!==parent || e.origin!==location.origin)return;const d=e.data;if(d?.type==='wish:configure'){rarity=[3,4,5].includes(d.rarity)?d.rarity:3;count=d.count===10?10:1;draw(0);}if(d?.type==='wish:seek')seek(d.time);});
window.addEventListener('hf-seek',e=>seek(e.detail?.time??e.detail?.seconds??0));
window.addEventListener('resize',resize);
window.__wishComposition={seek,duration:7};resize();
