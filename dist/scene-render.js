import { shapePoint, projectPoint } from './scene-math.js';
export const GLYPHS = '.:;+x*=#%@';
const COLORS=['#31352b','#758362','#aab59a','#b88d7c'];

export function createAtlas(createCanvas) {
  const atlas=createCanvas(24*GLYPHS.length,32*COLORS.length);
  const ctx=atlas.getContext('2d');
  ctx.font='22px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  COLORS.forEach((color,row)=>{ctx.fillStyle=color;[...GLYPHS].forEach((glyph,col)=>ctx.fillText(glyph,col*24+12,row*32+16));});
  return atlas;
}

export function renderScene(ctx,width,height,state,atlas,particles) {
  const {count=3300,time=0,shape=0,fromShape=shape,morph=1,reveal=1,pointer={x:-1e4,y:-1e4},pulse=null}=state;
  ctx.clearRect(0,0,width,height);
  const mix=morph*morph*(3-2*morph);
  const points=[];
  const lookX=(pointer.x/width-.5)*.8,lookY=(pointer.y/height-.5)*.6;
  for(let i=0;i<count;i++) {
    const p=shapePoint(shape,i,count,time);
    let screen=projectPoint(p,width,height,shape,time,pointer.active?lookX:0,pointer.active?lookY:0);
    if(morph<1) {
      const previous=projectPoint(shapePoint(fromShape,i,count,time),width,height,fromShape,time,pointer.active?lookX:0,pointer.active?lookY:0);
      screen=Object.fromEntries(['x','y','z','perspective'].map(key=>[key,previous[key]+(screen[key]-previous[key])*mix]));
    }
    const node=particles[i] || (particles[i]={x:0,y:0,vx:0,vy:0});
    if(!state.static) {
      const dx=screen.x+node.x-pointer.x,dy=screen.y+node.y-pointer.y;
      const d=Math.hypot(dx,dy),force=Math.max(0,1-d/110);
      if(pointer.active&&d>1){node.vx+=dx/d*force*1.8;node.vy+=dy/d*force*1.8;}
      if(pulse) {
        const px=screen.x-pulse.x,py=screen.y-pulse.y,pd=Math.hypot(px,py);
        const ring=pulse.age*400;
        const impulse=Math.max(0,1-Math.abs(pd-ring)/65)*Math.max(0,1-pulse.age/1.5);
        if(pd>1){node.vx+=px/pd*impulse*4.8;node.vy+=py/pd*impulse*4.8;}
      }
      node.vx=(node.vx-node.x*.035)*.86;node.vy=(node.vy-node.y*.035)*.86;
      node.x+=node.vx;node.y+=node.vy;
    }
    const explode=(1-reveal)*(130+((i*7)%137));
    const angle=i*2.399963;
    points.push({x:screen.x+node.x+Math.cos(angle)*explode,y:screen.y+node.y+Math.sin(angle)*explode,z:screen.z,p:screen.perspective,split:Math.min(8,Math.hypot(node.x,node.y)*.25),i});
  }
  points.sort((a,b)=>b.z-a.z);
  for(const p of points) {
    const fade=Math.min(1,Math.max(.2,.77-p.z*.16))*reveal;
    if(fade<.01)continue;
    const body=p.i<count*.78;
    const glyph=body?Math.min(GLYPHS.length-1,Math.max(0,Math.floor(5.4-p.z*1.8+(p.i%3)*.45))):p.i%4+1;
    const colored=p.i%31===0;
    const size=(width<=650?6.6:8.3)*p.p;
    const color=colored?1:0;
    if(p.split>1.2) {
      ctx.globalAlpha=fade*.55;
      ctx.drawImage(atlas,glyph*24,96,24,32,p.x-p.split-size*.5,p.y+p.split*.3-size*.67,size,size*1.333);
      ctx.drawImage(atlas,glyph*24,32,24,32,p.x+p.split-size*.5,p.y-p.split*.3-size*.67,size,size*1.333);
    }
    ctx.globalAlpha=fade;
    ctx.drawImage(atlas,glyph*24,color*32,24,32,p.x-size*.5,p.y-size*.67,size,size*1.333);
  }
  ctx.globalAlpha=1;
  return points;
}
