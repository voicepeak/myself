import {marineSample} from './marine-surfaces.js';
import {futureSample,crystalClusterSample} from './future-surfaces.js';
import {projectSample} from './project-surfaces.js';
export const MOTIFS=[
 {id:'jellyfish',name:'水母',shape:1},
 {id:'manta',name:'鳐鱼',shape:0},
 {id:'helix',name:'双螺旋',shape:10},
 {id:'crystal',name:'晶体',shape:11},
 {id:'whale',name:'鲸',shape:15},
 {id:'octopus',name:'章鱼',shape:16},
 {id:'warp',name:'折跃环',shape:17},
 {id:'gravity',name:'引力核',shape:18},
 {id:'wings',name:'机械翼',shape:19},
 {id:'voice',name:'声纹',shape:20,group:'projects',project:'Ayana',url:'https://github.com/voicepeak/ayana-agent'},
 {id:'pixels',name:'像素核',shape:21,group:'projects',project:'Topspeed Builder',url:'https://github.com/voicepeak/topspeed-builder'},
 {id:'robot',name:'机械臂',shape:22,group:'projects',project:'reBot',url:'https://github.com/voicepeak/2026Evomap-hackathon'},
 {id:'mind',name:'思维网',shape:23,group:'projects',project:'ByteMind',url:'https://github.com/voicepeak/bytemind'}
];
// Continuous parametric sculptures, sampled with the original golden-angle
// identities. Broad surfaces keep the original coherent character striations.
function sculpturePoint(shape,index,count,time=0){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count,a=v*Math.PI*2;
 if(shape===6){
  const w=(u-.5)*1.45,twist=a*.5+Math.sin(time*.42)*.16;
  const r=1.58+w*Math.cos(twist),wave=Math.sin(a*3-time*.7)*.07;
  return [Math.cos(a)*r,Math.sin(a)*r,w*Math.sin(twist)+wave];
 }
 if(shape===7){
  const q=v*Math.PI*4.5+Math.sin(time*.4)*.1,r=(.16+Math.exp(v*1.85)*.34)*(1+Math.sin(time*.65+v*2)*.025),section=u*Math.PI*2;
  const tube=.1+v*.48,pleat=1+Math.cos(section*12+q*2-time*.5)*.035;
  return [Math.cos(q)*(r+tube*Math.cos(section)*pleat),Math.sin(q)*(r+tube*Math.cos(section)*pleat),tube*Math.sin(section)*pleat+.25*(v-.5)];
 }
 if(shape===8){
  const x=(u-.5)*4.4,y=(v-.5)*3.3,taper=Math.sin(v*Math.PI);
  const fold=Math.sin(x*2.25+v*2.5-time*.8)*(.32+taper*.2);
  return [x+.18*Math.sin(v*5+time*.7),y+.13*Math.cos(x*1.5-time),fold+.24*x*Math.sin(v*3-time*.25)];
 }
 if(shape===9){
  const second=index%2===1,q=v*Math.PI*2,b=u*Math.PI*2,minor=.2+.025*Math.sin(q*3-time*.65),r=1.27+minor*Math.cos(b);
  if(!second)return [-.65+r*Math.cos(q),r*Math.sin(q),minor*Math.sin(b)];
  const x=.65+r*Math.cos(q),y=minor*Math.sin(b),z=r*Math.sin(q),tilt=.5+Math.sin(time*.35)*.1;
  return [x,y*Math.cos(tilt)-z*Math.sin(tilt),y*Math.sin(tilt)+z*Math.cos(tilt)];
 }
 if(shape===10){
  const angle=u*Math.PI*2,r=Math.sqrt(v),petal=1.52+.52*Math.cos(angle*6+Math.sin(time*.35)*.12);
  const curl=Math.sin(angle*6+r*4-time*.65)*r*r*.45;
  return [Math.cos(angle)*r*petal,Math.sin(angle)*r*petal,.9*r*r-.48+curl];
 }
 const x=(u-.5)*4.6,z=(v-.5)*3.4,envelope=Math.sin(v*Math.PI);
 const wave=Math.sin(x*1.4+z*1.15-time*.65)*.5+Math.sin(z*2.4-x*.5-time*.38)*.16;
 return [x,-wave*envelope-.4*Math.cos(x*.8)*Math.cos(z*.7),z];
}

export function motifTilt(shape){
 return {6:[.52,.18,-.38],7:[-.18,.6,-.12],8:[.5,.4,-.24],9:[.4,.4,-.33],10:[.12,.35,-.25],11:[.2,.42,-.27],12:[.2,-.18,-.2],13:[-.2,.3,-.12],14:[.1,.35,-.16],15:[-.42,.12,-.18],16:[-.25,-.12,-.12],17:[.23,-.35,-.18],18:[.15,-.2,-.24],19:[-.23,.12,-.08],20:[.24,.3,-.18],21:[-.35,.4,-.22],22:[-.14,-.25,-.12],23:[.2,.28,-.18]}[shape];
}

export function motifYaw(shape,time){return shape===19||shape===22?Math.sin(time*.22)*.24:shape>=17?time*.12:shape>=15?Math.sin(time*.35)*.24:time*.12;}

export function motifPoint(shape,index,count,time=0){
 if(isVolumeShape(shape))return volumeSample(shape,index,count,time).point;
 const scale={6:.78,7:.8,8:.82,9:.95,10:.9,11:.9}[shape];
 return sculpturePoint(shape,index,count,time).map(value=>value*scale);
}

export const isVolumeShape=shape=>shape===7||shape===8||shape>=10;
const normalizeVector=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const crossVector=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function knotCenter(q){const r=(2+Math.cos(q*3))*.58;return [Math.cos(q*2)*r,Math.sin(q*2)*r,Math.sin(q*3)*.58];}

export function volumeSample(shape,index,count,time=0){
 if(shape>=20)return projectSample(shape,index,count,time);
 if(shape===11)return crystalClusterSample(index,count,time);
 if(shape>=17)return futureSample(shape,index,count,time);
 if(shape>=15)return marineSample(shape,index,count,time);
 if(shape>=12)return biologicalSample(shape,index,count,time);
 const u=(index*.6180339887498949)%1,v=(index+.5)/count,b=u*Math.PI*2;
 let point,normal;
 if(shape===7){
  const q=v*Math.PI*5,r=.12+1.08*Math.pow(1-v,.88),tube=.14+(1-v)*.23;
  normal=[Math.cos(q)*Math.cos(b),Math.sin(b),Math.sin(q)*Math.cos(b)];
  point=[Math.cos(q)*r+normal[0]*tube,(.5-v)*3.2+normal[1]*tube,Math.sin(q)*r+normal[2]*tube];
 }else if(shape===8){
  const q=v*Math.PI*2,c=knotCenter(q),c1=knotCenter(q+.001),tangent=normalizeVector(c1.map((value,k)=>value-c[k]));
  const side=normalizeVector(crossVector(tangent,[0,0,1])),up=crossVector(tangent,side);
  normal=side.map((value,k)=>value*Math.cos(b)+up[k]*Math.sin(b));
  const radius=.35+Math.sin(q*3-time*.7)*.018;point=c.map((value,k)=>value+normal[k]*radius);
 }else if(shape===10){
  if(v<.8){const local=v/.8,q=local*Math.PI*2+(index%2?Math.PI:0),r=.9;
   const side=[Math.cos(q),0,Math.sin(q)],up=normalizeVector([-.29*Math.sin(q),-r,.29*Math.cos(q)]);
   normal=side.map((value,k)=>value*Math.cos(b)+up[k]*Math.sin(b));
   const center=[r*Math.cos(q),(local-.5)*3.4,r*Math.sin(q)];point=center.map((value,k)=>value+normal[k]*.2);
  }else{const local=(v-.8)/.2,level=Math.min(7,Math.floor(local*8)),q=(level+.5)/8*Math.PI*2,s=((local*8)%1-.5)*1.8;
   normal=[-Math.sin(q)*Math.cos(b),Math.sin(b),Math.cos(q)*Math.cos(b)];
   point=[Math.cos(q)*s+normal[0]*.05,((level+.5)/8-.5)*3.4+normal[1]*.05,Math.sin(q)*s+normal[2]*.05];}
 }else{
  const face=index%8,k=face%4,top=face<4,pole=[0,top?-2:1.7,0],vertices=[[1.23,0,0],[0,0,1.1],[-1.23,0,0],[0,0,-1.1]],a=vertices[k],c=vertices[(k+1)%4],r=Math.sqrt(v);
  point=pole.map((value,j)=>value*(1-r)+a[j]*r*(1-u)+c[j]*r*u);
  if(index%5===0){const edge=Math.floor(index/8)%3,first=edge===0?pole:edge===1?a:c,last=edge===0?a:edge===1?c:pole;point=first.map((value,j)=>value+(last[j]-value)*u);}
  normal=normalizeVector(crossVector(a.map((value,j)=>value-pole[j]),c.map((value,j)=>value-pole[j])));
  const center=pole.map((value,j)=>(value+a[j]+c[j])/3);if(normal.reduce((sum,value,j)=>sum+value*center[j],0)<0)normal=normal.map(value=>-value);
 }
 return {point:point.map(value=>value*.82),normal};
}

const ellipsoidSample=(u,v,radii,center)=>{const y=1-2*v,s=Math.sqrt(Math.max(0,1-y*y)),a=u*Math.PI*2,unit=[Math.cos(a)*s,y,Math.sin(a)*s];return {point:unit.map((value,k)=>value*radii[k]+center[k]),normal:normalizeVector(unit.map((value,k)=>value/radii[k]))};};
const coralSegments=[];
function addCoral(a,b,r0,r1){const axis=normalizeVector(b.map((value,k)=>value-a[k])),side=normalizeVector(crossVector(axis,Math.abs(axis[2])<.8?[0,0,1]:[1,0,0])),up=crossVector(axis,side),area=Math.hypot(...b.map((value,k)=>value-a[k]))*(r0+r1);coralSegments.push({a,b,r0,r1,side,up,area});}
addCoral([0,1.5,0],[0,-.25,0],.23,.16);
for(let side of [-1,1]){
 addCoral([0,.65,0],[side*.68,-.1,side*.28],.17,.12);
 addCoral([side*.68,-.1,side*.28],[side*1.2,-.95,side*.42],.12,.065);
 addCoral([side*.68,-.1,side*.28],[side*.42,-1.05,-side*.45],.11,.06);
 addCoral([0,-.15,0],[side*.44,-1.02,side*.2],.15,.09);
 addCoral([side*.44,-1.02,side*.2],[side*.84,-1.72,side*.58],.09,.045);
 addCoral([side*.44,-1.02,side*.2],[side*.16,-1.75,-side*.35],.09,.045);
}
const coralArea=coralSegments.reduce((sum,segment)=>sum+segment.area,0);

export function biologicalSample(shape,index,count,time=0){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 let sample;
 if(shape===12){
  if(v<.86){const local=v/.86,wing=Math.min(3,Math.floor(local*4)),side=wing%2===0?-1:1,upper=wing<2;
   sample=ellipsoidSample(u,(local*4)%1,upper?[.82,1.08,.095]:[.6,.67,.12],[side*(upper?.85:.65),upper?-.48:.62,0]);
   const rz=side*(upper?.34:-.24),c=Math.cos(rz),s=Math.sin(rz);
   for(const key of ['point','normal']){const p=sample[key],x=p[0]*c-p[1]*s,y=p[0]*s+p[1]*c;p[0]=x;p[1]=y;}
   const flap=side*(.35+Math.sin(time*1.7)*.42),cf=Math.cos(flap),sf=Math.sin(flap);
   for(const key of ['point','normal']){const p=sample[key],x=p[0]*cf+p[2]*sf,z=-p[0]*sf+p[2]*cf;p[0]=x;p[2]=z;}
  }else if(v<.98)sample=ellipsoidSample(u,(v-.86)/.12,[.13,1.07,.16],[0,.08,-.04]);
  else{const q=(v-.98)/.02,side=index%2===0?-1:1;sample={point:[side*(.07+q*q*.35),-.85-q*.72,-.05],normal:[0,0,-1]};}
 }else if(shape===13){
  if(v<.7){const local=v/.7,theta=Math.acos(1-local*1.07),a=u*Math.PI*2,st=Math.sin(theta),ct=Math.cos(theta),rim=1+.035*Math.sin(a*9+time*.5)*st**4;
   sample={point:[Math.cos(a)*st*1.42*rim,-.45-ct*.97,Math.sin(a)*st*1.42*rim],normal:normalizeVector([Math.cos(a)*st/1.42,-ct/.97,Math.sin(a)*st/1.42])};
  }else if(v<.93){const s=(v-.7)/.23,a=u*Math.PI*2,r=.18+.12*s*s;sample={point:[Math.cos(a)*r+Math.sin(s*2)*.055,-.43+s*2.0,Math.sin(a)*r],normal:[Math.cos(a),0,Math.sin(a)]};}
  else{const s=(v-.93)/.07,a=u*Math.PI*2,r=.2+s*1.22;sample={point:[Math.cos(a)*r,-.38+.035*Math.cos(a*36),Math.sin(a)*r],normal:[0,1,0]};}
 }else{
  let at=v*coralArea,branch=coralSegments[coralSegments.length-1];for(const segment of coralSegments){if(at<=segment.area){branch=segment;break;}at-=segment.area;}
  const s=Math.max(0,Math.min(1,at/branch.area)),a=u*Math.PI*2,r=branch.r0+(branch.r1-branch.r0)*s;
  const normal=branch.side.map((value,k)=>value*Math.cos(a)+branch.up[k]*Math.sin(a));
  const point=branch.a.map((value,k)=>value+(branch.b[k]-value)*s+normal[k]*r);
  point[0]+=Math.sin(time*.8+point[1]*1.5)*.025*Math.max(0,1.5-point[1]);sample={point,normal};
 }
 return {point:sample.point.map(value=>value*.9),normal:sample.normal};
}
