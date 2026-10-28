import {MOTIFS} from './field/motif-surfaces.js';
import {createMaterialAtlas,renderSculptureScene} from './field/volume-render.js';
export function createHeroScene(canvas,{onFrame=()=>{},onChange=()=>{}}={}){
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),atlas=createMaterialAtlas((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
 const models=['manta','jellyfish','whale','crystal'].map(id=>MOTIFS.find(m=>m.id===id));
 const state={count:innerWidth<=650?2300:3700,time:0,shape:0,morph:1,reveal:reduced.matches?1:0,pointer:{x:-1e4,y:-1e4,active:false},pulse:null,static:reduced.matches},particles=[];
 let width=0,height=0,documentTop=0,left=0,raf=0,last=0,visible=true,paused=false,modal=false,selected=0,intro=0,morphAge=1.6;
 const paint=(dt=0)=>{state.static=reduced.matches;renderSculptureScene(ctx,width,height,state,atlas,particles);if(state.morph===1)state.fromFrame=null;onFrame(dt,state.pointer);};
 const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;};
 const start=()=>{if(!raf&&!document.hidden&&visible&&!paused&&!modal&&!reduced.matches)raf=requestAnimationFrame(tick);};
 function tick(now){raf=0;if(document.hidden||!visible||paused||modal||reduced.matches)return;const dt=last?Math.min(.04,(now-last)/1000):.016;last=now;state.time+=dt;intro+=dt;morphAge+=dt;const q=Math.min(1,morphAge/1.6);state.morph=q<.5?8*q**4:1-(-2*q+2)**4/2;state.reveal=1-(1-Math.max(0,Math.min(1,(intro-.15)/2.1)))**4;if(state.pulse){state.pulse.age+=dt;if(state.pulse.age>1.6)state.pulse=null;}paint(dt);raf=requestAnimationFrame(tick);}
 function resize(){const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;width=box.width;height=box.height;documentTop=box.top+scrollY;left=box.left;const dpr=Math.min(devicePixelRatio||1,1.5),pw=Math.round(width*dpr),ph=Math.round(height*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}ctx.setTransform(dpr,0,0,dpr,0,0);paint();start();}
 function change(index){index=(index+models.length)%models.length;if(index===selected)return;state.fromFrame=state.lastFrame?.slice()||null;selected=index;state.shape=models[index].shape;state.morph=state.fromFrame&&!reduced.matches&&!paused?0:1;morphAge=state.morph?1.6:0;intro=3;state.reveal=1;paint();onChange(models[index],index);start();}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();},{threshold:.04});observer.observe(canvas);
 const resizer=new ResizeObserver(resize);resizer.observe(canvas);
 const visibility=()=>document.hidden?stop():start();document.addEventListener('visibilitychange',visibility);
 reduced.addEventListener('change',()=>{stop();state.reveal=1;intro=3;state.morph=1;state.fromFrame=null;state.pointer.active=false;particles.length=0;paint();start();});
 resize();onChange(models[0],0);
 return {state,models,change,resize,setPaused(value){paused=value;value?stop():start();},setModal(value){modal=value;value?stop():start();},move(e){if(paused||modal||reduced.matches||e.pointerType==='touch')return;state.pointer={x:e.clientX-left,y:e.clientY+scrollY-documentTop,active:true};},leave(){state.pointer.active=false;},pulse(e){if(paused||modal||reduced.matches)return;if(e)state.pointer={x:e.clientX-left,y:e.clientY+scrollY-documentTop,active:true};state.pulse={x:state.pointer.active?state.pointer.x:width*.655,y:state.pointer.active?state.pointer.y:height*.47,age:0};start();},destroy(){stop();observer.disconnect();resizer.disconnect();document.removeEventListener('visibilitychange',visibility);}};
}
