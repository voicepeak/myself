import { createAtlas, renderScene } from './scene-render.js';

export function createScene(canvas) {
  const ctx=canvas.getContext('2d');
  if(!ctx) return null;
  const atlas=createAtlas((width,height)=>{const c=document.createElement('canvas');c.width=width;c.height=height;return c;});
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const state={count:innerWidth<=650?2300:3700,time:0,shape:0,fromShape:0,morph:1,reveal:media.matches?1:0,pointer:{x:-10000,y:-10000,active:false},pulse:null,static:media.matches};
  const particles=[];
  let width=0,height=0,raf=0,last=0,paused=false,panelOpen=false,visible=true;
  const resize=()=>{const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();};
  const draw=()=>renderScene(ctx,width,height,state,atlas,particles);
  const frame=now=>{
    raf=0;
    if(document.hidden||!visible||paused||panelOpen||media.matches)return;
    const dt=last?Math.min(.04,(now-last)/1000):.016;last=now;
    state.time+=dt;
    if(state.pulse){state.pulse.age+=dt;if(state.pulse.age>1.6)state.pulse=null;}
    draw();raf=requestAnimationFrame(frame);
  };
  const start=()=>{last=0;if(!raf&&!document.hidden&&!paused&&!panelOpen&&visible&&!media.matches)raf=requestAnimationFrame(frame);};
  const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;};
  const updatePointer=e=>{const rect=canvas.getBoundingClientRect();state.pointer={x:e.clientX-rect.left,y:e.clientY-rect.top,active:true};};
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')updatePointer(e);});
  canvas.addEventListener('pointerleave',()=>{state.pointer.active=false;});
  canvas.addEventListener('click',e=>{if(media.matches||paused)return;updatePointer(e);state.pulse={x:state.pointer.x,y:state.pointer.y,age:0};});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();});observer.observe(canvas);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
  media.addEventListener('change',()=>{state.static=media.matches;if(media.matches){stop();state.reveal=1;state.morph=1;draw();}else start();});
  resize();start();
  return {state,draw,start,stop,setPaused(value){paused=value;value?stop():start();},setPanelOpen(value){panelOpen=value;value?stop():start();},change(index){state.fromShape=state.shape;state.shape=index;state.morph=media.matches?1:0;if(media.matches)draw();else {window.gsap.to(state,{morph:1,duration:1.6,ease:'power3.inOut',overwrite:'auto',onUpdate:paused?draw:undefined});start();}},intro(){if(media.matches){draw();return;}window.gsap.to(state,{reveal:1,duration:2.1,ease:'power3.out',delay:.15,onUpdate:paused?draw:undefined});}};
}
