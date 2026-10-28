import {renderScene,GLYPHS,createAtlas} from './original-render.js';
import {rotatePoint} from './scene-math.js';
import {isVolumeShape,motifTilt,volumeSample,motifYaw} from './motif-surfaces.js';
const collector={clearRect(){},drawImage(){},globalAlpha:1};
let depthGrid=new Float32Array(0),gridWidth=0,gridHeight=0;
export const FRAME_STRIDE=11;
export function createMaterialAtlas(createCanvas){const original=createAtlas(createCanvas),canvas=createCanvas(240,224),ctx=canvas.getContext('2d');ctx.drawImage(original,0,0);ctx.font='22px monospace';ctx.textAlign='center';ctx.textBaseline='middle';['#646e68','#a9b1aa','#d7ddd5'].forEach((color,row)=>{ctx.fillStyle=color;[...GLYPHS].forEach((glyph,i)=>ctx.fillText(glyph,i*24+12,(row+4)*32+16));});return canvas;}
function rememberFrame(state,points){
 if(state.recordFrame===false)return;
 if(!state.lastFrame||state.lastFrame.length!==state.count*FRAME_STRIDE)state.lastFrame=new Float64Array(state.count*FRAME_STRIDE);
 for(const p of points){const at=p.i*FRAME_STRIDE;state.lastFrame.set([p.x,p.y,p.z,p.alpha,p.size,p.glyph,p.mask,p.split,p.color,p.p,p.splitFade],at);}
}
function originalStyles(points,width,state){
 const reveal=state.reveal??1;
 for(const p of points){p.alpha=Math.min(1,Math.max(.2,.77-p.z*.16))*reveal;p.size=(width<=650?6.6:8.3)*p.p;p.glyph=p.i<state.count*.78?Math.min(GLYPHS.length-1,Math.max(0,Math.floor(5.4-p.z*1.8+(p.i%3)*.45))):p.i%4+1;p.mask=0;p.splitFade=.55;p.color=p.i%31===0?1:0;}
}
function volumeStyles(points,width,height,state){
 const cell=5,gw=Math.ceil(width/cell),gh=Math.ceil(height/cell);
 if(gw!==gridWidth||gh!==gridHeight){gridWidth=gw;gridHeight=gh;depthGrid=new Float32Array(gw*gh);}depthGrid.fill(Infinity);
 const pointer=state.pointer||{},lookX=pointer.active?(pointer.x/width-.5)*.8:0,lookY=pointer.active?(pointer.y/height-.5)*.6:0,t=state.time||0,tilt=motifTilt(state.shape),reveal=state.reveal??1;
 for(const p of points){const sample=volumeSample(state.shape,p.i,state.count,t),n=sample.normal;p.material=sample.material;p.normal=rotatePoint(n,tilt[0]+lookY*.1,tilt[1]+Math.sin(t*.18)*.25+lookX*.18+motifYaw(state.shape,t),tilt[2]);p.front=p.normal[2]<.06;if(!p.front)continue;const gx=Math.floor(p.x/cell),gy=Math.floor(p.y/cell);if(gx>=0&&gx<gw&&gy>=0&&gy<gh){const at=gy*gw+gx;depthGrid[at]=Math.min(depthGrid[at],p.z);}}
 for(const p of points){const gx=Math.floor(p.x/cell),gy=Math.floor(p.y/cell),nearest=gx>=0&&gx<gw&&gy>=0&&gy<gh?depthGrid[gy*gw+gx]:Infinity,visible=p.front&&p.z<=nearest+.25;const light=Math.max(.12,Math.min(1,.38-p.normal[0]*.32-p.normal[1]*.44-p.normal[2]*.42)),rung=state.shape===10&&p.i>=state.count*.8;p.alpha=visible?(.62+.38*light)*reveal*(rung?.45:1):0;p.size=(width<=650?7.6:10.2)*p.p*(rung?.8:1);p.glyph=Math.min(GLYPHS.length-1,Math.max(0,Math.floor(2.5+light*6.3)));p.mask=visible?reveal*.9:0;p.splitFade=.5;p.color=p.i%31===0?1:0;
  if(state.shape===19&&visible){const material=p.material||{},spec=Math.pow(Math.max(0,-p.normal[0]*.28-p.normal[1]*.3-p.normal[2]*.91),52),rim=Math.pow(1-Math.abs(p.normal[2]),3);p.alpha=reveal*((material.edge||material.seam)? .98:.46+light*.42);p.color=material.edge||material.seam?0:spec>.4?6:spec>.10?5:4;p.glyph=material.seam?8:Math.min(9,Math.floor(3+light*5+rim));p.size*=material.edge?1.04:.96;}
 }
}
function drawStyled(ctx,width,height,points,atlas){
 ctx.clearRect(0,0,width,height);
 for(const p of points){if(p.alpha<.005)continue;const size=p.size,glyph=p.glyph;
  if(p.mask>.001){ctx.globalAlpha=p.mask;ctx.fillStyle='#f8f7f2';ctx.beginPath();ctx.arc(p.x,p.y,size*.34,0,Math.PI*2);ctx.fill();}
  if(p.split>1.2){ctx.globalAlpha=p.alpha*p.splitFade;ctx.drawImage(atlas,glyph*24,96,24,32,p.x-p.split-size*.5,p.y+p.split*.3-size*.67,size,size*1.333);ctx.drawImage(atlas,glyph*24,32,24,32,p.x+p.split-size*.5,p.y-p.split*.3-size*.67,size,size*1.333);}
  ctx.globalAlpha=p.alpha;ctx.drawImage(atlas,glyph*24,p.color*32,24,32,p.x-size*.5,p.y-size*.67,size,size*1.333);
 }ctx.globalAlpha=1;
}

export function renderSculptureScene(ctx,width,height,state,atlas,particles){
 const transitioning=!!state.fromFrame&&(state.morph??1)<1,volume=isVolumeShape(state.shape);
 // Stable original forms retain the exact original renderer. A transition uses
 // the last displayed positions AND styles, never a regenerated rest pose.
 if(!transitioning&&!volume){const points=renderScene(ctx,width,height,{...state,morph:1},atlas,particles);originalStyles(points,width,state);rememberFrame(state,points);return points;}
 const points=renderScene(collector,width,height,{...state,morph:1},atlas,particles);
 volume?volumeStyles(points,width,height,state):originalStyles(points,width,state);
 if(transitioning){const source=state.fromFrame,mix=state.morph*state.morph*(3-2*state.morph);
  for(const p of points){const at=p.i*FRAME_STRIDE;p.x=source[at]+(p.x-source[at])*mix;p.y=source[at+1]+(p.y-source[at+1])*mix;p.z=source[at+2]+(p.z-source[at+2])*mix;p.alpha=source[at+3]+(p.alpha-source[at+3])*mix;p.size=source[at+4]+(p.size-source[at+4])*mix;if(mix<.5)p.glyph=source[at+5];p.mask=source[at+6]+(p.mask-source[at+6])*mix;p.split=source[at+7]+(p.split-source[at+7])*mix;p.color=mix<.5?source[at+8]:p.color;p.p=source[at+9]+(p.p-source[at+9])*mix;p.splitFade=source[at+10]+(p.splitFade-source[at+10])*mix;}
  points.sort((a,b)=>b.z-a.z);
 }
 drawStyled(ctx,width,height,points,atlas);rememberFrame(state,points);return points;
}
