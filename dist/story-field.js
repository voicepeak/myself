import {MOTIFS} from './field/motif-surfaces.js';
import {sceneLayout} from './field/scene-math.js';
import {createMaterialAtlas,renderSculptureScene} from './field/volume-render.js';
import {homeScenes} from './journey-content.js';

export const JOURNEY_END=homeScenes.length-1+.62;
const clamp01=v=>Math.max(0,Math.min(1,v));
const easeRange=(a,b,v)=>{const q=clamp01((v-a)/(b-a));return q*q*(3-2*q);};
const shapes=homeScenes.map(c=>MOTIFS.find(m=>m.id===c.motif).shape);
const silentContext={clearRect(){},drawImage(){},beginPath(){},arc(){},fill(){},globalAlpha:1};

export function journeyPhase(progress,flat=false){
 if(flat){const local=clamp01(progress/JOURNEY_END);return {index:0,local,scatter:easeRange(0,.9,local),morph:0,opacity:1-easeRange(.15,.65,local)};}
 const p=Math.max(0,Math.min(JOURNEY_END,progress)),index=Math.min(homeScenes.length-1,Math.floor(p)),local=p-index;
 const opening=easeRange(.12,.43,local),closing=index===homeScenes.length-1?0:easeRange(.74,1,local);
 return {index,local,scatter:opening*(1-closing),morph:closing,opacity:(index===0?1:easeRange(.26,.44,local))*(1-easeRange(.76,.92,local))};
}

// Every frame is a position on one reversible path. Neither entering a chapter
// nor changing direction resets the shape clock or the particle identities.
export function renderJourneyFrame(ctx,width,height,state,atlas,pools=[[],[]]){
 const phase=journeyPhase(state.progress,state.mode==='flat'),count=state.count||2600,t=state.time||0;
 const sample=(index,pool)=>{
  const shape=index===1&&state.choice!==undefined?state.choice:shapes[index],layout=sceneLayout(width,height,shape);
  const sampleState={count,time:t,shape,morph:1,reveal:1,static:true,recordFrame:false,pointer:state.pointer||{active:false,x:-1e4,y:-1e4}};
  const points=renderSculptureScene(silentContext,width,height,sampleState,atlas,pool);
  const side=index===0||index===1&&state.choice!==undefined;
  const cx=width*(side&&width>650?.655:.5),cy=height*(side?(width<=650?(index===0?.64:.68):.50):.5),scale=index===1&&state.choice!==undefined&&width>650?.86:1;
  for(const point of points){point.x=cx+(point.x-layout.cx)*scale;point.y=cy+(point.y-layout.cy)*scale;if(scale<1)point.size*=.92;}
  return points;
 };
 const points=sample(phase.index,pools[0]);
 if(phase.morph>0&&phase.index<homeScenes.length-1){
  const target=sample(phase.index+1,pools[1]),byId=new Array(count);
  for(const point of target)byId[point.i]=point;
  for(const point of points){const to=byId[point.i],q=phase.morph;
   for(const key of ['x','y','z','alpha','size','mask','p'])point[key]+=(to[key]-point[key])*q;
   if(q>.5){point.glyph=to.glyph;point.color=to.color;}
  }
 }
 const spread=phase.scatter*(phase.index===1&&state.choice!==undefined?0:1),step=Math.min(2,(state.dt||0)*60),springs=state.springs||(state.springs=[]),pointer=state.pointer||{};
 for(const point of points){
  const angle=point.i*2.39996323,band=.86+((point.i*53)%211)/640;
  const tx=width*(.5+Math.cos(angle)*.55*band),ty=height*(.5+Math.sin(angle)*.57*band);
  const bend=Math.sin(spread*Math.PI)*Math.sin(angle*2+t*.15)*height*.10;
  point.x+=(tx-point.x)*spread;point.y+=(ty-point.y)*spread+bend;
  point.alpha=point.alpha*(1-spread)+(.08+(point.i%5)*.018)*spread;
  point.size*=1-spread*.40;point.mask*=1-spread;
  if(spread>.75)point.color=point.i%37===0?3:1;
  if(phase.index===1&&state.choiceFrame&&(state.choiceMix??1)<1){const from=state.choiceFrame[point.i],q=state.choiceMix;if(from){for(const key of ['x','y','z','alpha','size','mask','p'])point[key]=from[key]+(point[key]-from[key])*q;if(q<.5){point.glyph=from.glyph;point.color=from.color;}}}
  const spring=springs[point.i]||(springs[point.i]={x:0,y:0,vx:0,vy:0});
  if(step&&!state.static){
   if(pointer.active){const dx=point.x+spring.x-pointer.x,dy=point.y+spring.y-pointer.y,d=Math.hypot(dx,dy),force=Math.max(0,1-d/125);if(d>1){spring.vx+=dx/d*force*1.5*step;spring.vy+=dy/d*force*1.5*step;}}
   if(state.pulse){const pulse=state.pulse,dx=point.x-pulse.x,dy=point.y-pulse.y,d=Math.hypot(dx,dy),force=Math.max(0,1-Math.abs(d-pulse.age*390)/65)*Math.max(0,1-pulse.age/1.4);if(d>1){spring.vx+=dx/d*force*3*step;spring.vy+=dy/d*force*3*step;}}
   spring.vx=(spring.vx-spring.x*.034*step)*Math.pow(.85,step);spring.vy=(spring.vy-spring.y*.034*step)*Math.pow(.85,step);spring.x+=spring.vx*step;spring.y+=spring.vy*step;
  }
  point.x+=spring.x;point.y+=spring.y;
 }
 points.sort((a,b)=>b.z-a.z);ctx.clearRect(0,0,width,height);
 for(const point of points){if(point.alpha<.008)continue;const size=point.size;
  if(point.mask>.01){ctx.globalAlpha=point.mask;ctx.fillStyle='#f8f7f2';ctx.beginPath();ctx.arc(point.x,point.y,size*.34,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=point.alpha;ctx.drawImage(atlas,point.glyph*24,point.color*32,24,32,point.x-size*.5,point.y-size*.67,size,size*1.333);
 }
 ctx.globalAlpha=1;state.lastPoints=points;return phase;
}

export function createStoryField(canvas,track,{onProgress=()=>{},mode='journey'}={}){
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),atlas=createMaterialAtlas((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
 const state={count:innerWidth<=650?1600:2600,time:0,progress:0,dt:0,mode,pointer:{x:-1e4,y:-1e4,active:false},springs:[],static:false},pools=[[],[]];
 let width=0,height=0,range=1,top=0,target=0,raf=0,last=0,modal=false,paused=false,destroyed=false,visible=true,previousPaint=0,choiceAge=2;
 function paint(dt=0){state.dt=dt;state.static=preference.matches||paused;const phase=renderJourneyFrame(ctx,width,height,state,atlas,pools);onProgress(phase,state.progress);}
 function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
 function wake(){if(!raf&&!destroyed&&!modal&&visible&&!document.hidden&&!preference.matches)raf=requestAnimationFrame(tick);}
 function tick(now){
  raf=0;if(modal||!visible||document.hidden||destroyed||preference.matches)return;
  const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;
  state.progress+=(target-state.progress)*(1-Math.exp(-dt*15));if(Math.abs(target-state.progress)<.0003)state.progress=target;
  if(!paused){state.time+=dt;choiceAge+=dt;state.choiceMix=easeRange(0,1.15,choiceAge);if(state.choiceMix===1)state.choiceFrame=null;if(state.pulse){state.pulse.age+=dt;if(state.pulse.age>1.45)state.pulse=null;}}
  // Cap raster work independently of high-refresh-rate displays.
  if(now-previousPaint>=(width<=650?32:21)||state.progress===target&&paused){paint(dt);previousPaint=now;}
  if(!paused||Math.abs(target-state.progress)>.0003)wake();
 }
 function measure(){
  const box=canvas.getBoundingClientRect(),trackBox=track.getBoundingClientRect();if(!box.width||!box.height)return;
  width=box.width;height=box.height;top=trackBox.top+scrollY;range=mode==='flat'?height*.85:Math.max(1,track.offsetHeight-height);visible=mode!=='flat'||scrollY<top+height&&scrollY+innerHeight>top;
  state.count=width<=650?1600:2600;state.choiceFrame=null;state.choiceMix=1;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  target=Math.max(0,Math.min(JOURNEY_END,(scrollY-top)/range*JOURNEY_END));state.progress=target;paint();wake();
 }
 function scroll(){if(preference.matches)return;target=Math.max(0,Math.min(JOURNEY_END,(scrollY-top)/range*JOURNEY_END));visible=mode!=='flat'||scrollY<top+height&&scrollY+innerHeight>top;if(!visible){stop();state.progress=target;paint();return;}wake();}
 function visibility(){document.hidden?stop():wake();}
 function preferenceChange(){stop();document.documentElement.classList.toggle('reduced-motion',preference.matches);state.pointer.active=false;state.springs.length=0;measure();}
 const resizer=new ResizeObserver(measure);resizer.observe(canvas);document.addEventListener('visibilitychange',visibility);window.addEventListener('scroll',scroll,{passive:true});preference.addEventListener('change',preferenceChange);
 document.documentElement.classList.toggle('reduced-motion',preference.matches);measure();
 return {state,measure,select(id){const model=MOTIFS.find(m=>m.id===id);if(!model||model.shape===state.choice)return;state.choiceFrame=new Array(state.count);for(const point of state.lastPoints||[]){const spring=state.springs[point.i]||{x:0,y:0};state.choiceFrame[point.i]={...point,x:point.x-spring.x,y:point.y-spring.y};}state.choice=model.shape;choiceAge=0;state.choiceMix=0;if(paused||preference.matches){state.choiceMix=1;state.choiceFrame=null;paint();}wake();},seek(value,{immediate=false}={}){target=Math.max(0,Math.min(JOURNEY_END,value));if(immediate||preference.matches){state.progress=target;paint();}wake();},go(index){
   if(preference.matches){document.getElementById(homeScenes[index].id)?.scrollIntoView({behavior:'instant'});return;}
   const p=index===0?0:index+.54;window.scrollTo({top:top+range*p/JOURNEY_END,behavior:'smooth'});
  },setPaused(value){paused=value;if(value&&Math.abs(target-state.progress)<.0003){stop();paint();}else wake();},setModal(value){modal=value;value?stop():wake();},move(e){if(paused||modal||preference.matches||e.pointerType==='touch')return;const box=canvas.getBoundingClientRect();state.pointer={x:e.clientX-box.left,y:e.clientY-box.top,active:true};},leave(){state.pointer.active=false;},pulse(e){if(paused||modal||preference.matches)return;state.pulse={x:e?.clientX??width*.5,y:e?.clientY??height*.5,age:0};wake();},destroy(){destroyed=true;stop();resizer.disconnect();window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',preferenceChange);}};
}
