import {MOTIFS} from './field/motif-surfaces.js';
import {createMaterialAtlas,renderSculptureScene} from './field/volume-render.js';

const sink={clearRect(){},drawImage(){},beginPath(){},arc(){},fill(){},globalAlpha:1};
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=(a,b,x)=>{const q=clamp((x-a)/(b-a));return q*q*(3-2*q);};
const STRIDE=11;
const keys=['x','y','z','alpha','size','mask','split','p','splitFade'];
const shapeOf=id=>MOTIFS.find(m=>m.id===id)?.shape??0;
function saveFrame(buffer,at,p,x=p.x,y=p.y){buffer[at]=x;buffer[at+1]=y;buffer[at+2]=p.z;buffer[at+3]=p.alpha;buffer[at+4]=p.size;buffer[at+5]=p.mask;buffer[at+6]=p.split;buffer[at+7]=p.p;buffer[at+8]=p.splitFade;buffer[at+9]=p.glyph;buffer[at+10]=p.color;}

export function depthPhase(progress,itemCount){
 const max=itemCount+.62,p=Math.max(0,Math.min(max,progress)),index=Math.min(itemCount,Math.floor(p)),local=p-index,last=index===itemCount;
 const forming=last?0:ease(.72,1,local),scatter=ease(.12,.42,local)*(1-forming);
 return {index,local,max,scatter,forming,portal:1-ease(.08,.27,local),content:ease(.24,.43,local)*(last?1:1-ease(.73,.9,local))};
}

// Stable sculptures use the exact renderer and sample count from the motif lab.
// Transitions sample the same glyph identities and never reset the scene clock.
export function drawExplorationFrame(ctx,width,height,state,atlas,pools=[[],[]]){
 const particles=state.springs||(state.springs=[]);
 if(state.spread===0&&state.morph===0&&!state.from){
  const direct=state.direct||(state.direct={});Object.assign(direct,{count:state.count,time:state.time,shape:state.shape,morph:1,reveal:1,pointer:state.pointer,pulse:state.pulse,static:state.static});
  const points=renderSculptureScene(ctx,width,height,direct,atlas,particles);
  if(!state.last||state.last.length!==state.count*STRIDE)state.last=new Float64Array(state.count*STRIDE);
  for(const p of points){const n=particles[p.i]||{x:0,y:0};saveFrame(state.last,p.i*STRIDE,p,p.x-n.x,p.y-n.y);}
  return points;
 }
 const sample=(shape,pool)=>renderSculptureScene(sink,width,height,{count:state.count,time:state.time,shape,morph:1,reveal:1,recordFrame:false,static:true,pointer:state.pointer},atlas,pool);
 const points=sample(state.shape,pools[0]);
 if(state.morph>0&&state.nextShape!=null){const target=sample(state.nextShape,pools[1]),byId=new Array(state.count);for(const p of target)byId[p.i]=p;for(const p of points){const n=byId[p.i],q=state.morph;for(const key of keys)p[key]+=(n[key]-p[key])*q;if(q>.5){p.glyph=n.glyph;p.color=n.color;}}}
 const spread=state.spread||0,step=Math.min(2,(state.dt||0)*60),pointer=state.pointer||{};
 if(!state.last||state.last.length!==state.count*STRIDE)state.last=new Float64Array(state.count*STRIDE);
 for(const p of points){
  const a=p.i*2.39996323,band=.86+((p.i*53)%211)/640;
  p.x+=(width*(.5+Math.cos(a)*.57*band)-p.x)*spread;p.y+=(height*(.5+Math.sin(a)*.59*band)-p.y)*spread;
  p.alpha=p.alpha*(1-spread)+(.07+(p.i%5)*.015)*spread;p.size*=1-spread*.4;p.mask*=1-spread;p.split*=1-spread;
  if(spread>.75)p.color=p.i%37===0?3:1;
  if(state.from&&(state.mix??1)<1){const at=p.i*STRIDE,q=state.mix;for(const [j,key]of keys.entries())p[key]=state.from[at+j]+(p[key]-state.from[at+j])*q;if(q<.5){p.glyph=state.from[at+9];p.color=state.from[at+10];}}
  const n=particles[p.i]||(particles[p.i]={x:0,y:0,vx:0,vy:0});
  if(step&&!state.static){const dx=p.x+n.x-pointer.x,dy=p.y+n.y-pointer.y,d=Math.hypot(dx,dy),force=Math.max(0,1-d/110);if(pointer.active&&d>1){n.vx+=dx/d*force*1.8*step;n.vy+=dy/d*force*1.8*step;}if(state.pulse){const px=p.x-state.pulse.x,py=p.y-state.pulse.y,pd=Math.hypot(px,py),impulse=Math.max(0,1-Math.abs(pd-state.pulse.age*400)/65)*Math.max(0,1-state.pulse.age/1.5);if(pd>1){n.vx+=px/pd*impulse*4.8*step;n.vy+=py/pd*impulse*4.8*step;}}n.vx=(n.vx-n.x*.035*step)*Math.pow(.86,step);n.vy=(n.vy-n.y*.035*step)*Math.pow(.86,step);n.x+=n.vx*step;n.y+=n.vy*step;}
  p.split=Math.min(8,Math.hypot(n.x,n.y)*.25)*(1-spread);
  saveFrame(state.last,p.i*STRIDE,p);p.x+=n.x;p.y+=n.y;
 }
 points.sort((a,b)=>b.z-a.z);ctx.clearRect(0,0,width,height);
 for(const p of points){if(p.alpha<.005)continue;const size=p.size,glyph=p.glyph;if(p.mask>.001){ctx.globalAlpha=p.mask;ctx.fillStyle='#f8f7f2';ctx.beginPath();ctx.arc(p.x,p.y,size*.34,0,Math.PI*2);ctx.fill();}if(p.split>1.2){ctx.globalAlpha=p.alpha*p.splitFade;ctx.drawImage(atlas,glyph*24,96,24,32,p.x-p.split-size*.5,p.y+p.split*.3-size*.67,size,size*1.333);ctx.drawImage(atlas,glyph*24,32,24,32,p.x+p.split-size*.5,p.y-p.split*.3-size*.67,size,size*1.333);}ctx.globalAlpha=p.alpha;ctx.drawImage(atlas,glyph*24,p.color*32,24,32,p.x-size*.5,p.y-size*.67,size,size*1.333);}
 ctx.globalAlpha=1;return points;
}

export function createExplorationField(canvas,{onProgress=()=>{}}={}){
 const ctx=canvas.getContext('2d');if(!ctx)return null;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const atlas=createMaterialAtlas((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}),pools=[[],[]];
 const state={count:innerWidth<=650?2300:3700,time:0,shape:0,nextShape:null,spread:0,morph:0,mix:1,progress:0,dt:0,static:false,pointer:{x:-10000,y:-10000,active:false},springs:[],pulse:null};
 let models=['manta'],target=0,width=0,height=0,raf=0,last=0,lastPaint=0,paused=false,destroyed=false,transitionAge=2;
 function paint(dt=0){state.dt=dt;state.static=paused||reduced.matches;const phase=depthPhase(state.progress,models.length-1);state.shape=shapeOf(models[phase.index]);state.nextShape=phase.index<models.length-1?shapeOf(models[phase.index+1]):null;state.spread=phase.scatter;state.morph=phase.forming;drawExplorationFrame(ctx,width,height,state,atlas,pools);onProgress(phase,state.progress);}
 function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
 function wake(){if(!raf&&!destroyed&&!document.hidden&&!reduced.matches&&!paused)raf=requestAnimationFrame(tick);}
 function tick(now){raf=0;if(document.hidden||destroyed||paused||reduced.matches)return;const dt=last?Math.min(.04,(now-last)/1000):.016;last=now;state.time+=dt;transitionAge+=dt;state.mix=ease(0,.8,transitionAge);state.progress+=(target-state.progress)*(1-Math.exp(-dt*14));if(Math.abs(target-state.progress)<.0005)state.progress=target;if(state.mix===1)state.from=null;if(state.pulse){state.pulse.age+=dt;if(state.pulse.age>1.6)state.pulse=null;}const phase=depthPhase(state.progress,models.length-1),interval=phase.forming>0&&phase.forming<1?30:14;if(now-lastPaint>=interval){paint(dt);lastPaint=now;}wake();}
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;width=r.width;height=r.height;state.count=width<=650?2300:3700;state.from=null;state.mix=1;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);paint();wake();}
 function setSequence(ids,progress=0){state.from=state.last?.slice()||null;models=ids.slice();target=state.progress=Math.max(0,Math.min(models.length-1+.62,progress));state.mix=state.from?0:1;transitionAge=0;if(paused||reduced.matches){state.mix=1;state.from=null;paint();}wake();}
 function seek(progress,{instant=false}={}){target=Math.max(0,Math.min(models.length-1+.62,progress));if(instant||paused||reduced.matches){state.progress=target;paint();}wake();}
 function visibility(){document.hidden?stop():wake();}function changeMotion(){stop();state.pointer.active=false;if(reduced.matches)state.springs.length=0;state.progress=target;state.mix=1;state.from=null;paint();wake();}
 const observer=new ResizeObserver(resize);observer.observe(canvas);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',changeMotion);resize();
 return {state,setSequence,seek,setPaused(value){paused=value;if(value){stop();state.progress=target;state.mix=1;state.from=null;paint();}else wake();},move(e){if(paused||reduced.matches||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();state.pointer={x:e.clientX-r.left,y:e.clientY-r.top,active:true};},leave(){state.pointer.active=false;},pulse(e){if(paused||reduced.matches)return;const r=canvas.getBoundingClientRect();state.pulse={x:e.clientX-r.left,y:e.clientY-r.top,age:0};wake();},destroy(){destroyed=true;stop();observer.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',changeMotion);}};
}
