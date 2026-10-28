import {motifPoint,motifTilt,isVolumeShape,motifYaw} from './motif-surfaces.js';
const TAU = Math.PI * 2;
export const SHAPES = ['manta','jellyfish','knot','bloom','sphere','ribbon'];

// Original parametric creatures. Each shape uses the same point identities so
// the renderer can continuously morph, rather than cross-fading two pictures.
export function shapePoint(shape, index, count, time = 0) {
  if(shape>=6)return motifPoint(shape,index,count,time);
  const bodyCount = Math.floor(count * .78);
  const tail = index >= bodyCount;
  const n = tail ? index - bodyCount : index;
  const total = tail ? count - bodyCount : bodyCount;
  const u = (n * .6180339887498949) % 1;
  const v = (n + .5) / total;
  const a = u * TAU;
  const r = Math.sqrt(v);
  if (shape === 0) {
    if (tail) {
      const s = n / total, lane = n % 7 - 3;
      return [Math.sin(s * 5 - time * 1.7) * s * .2 + lane * .008 * (1-s), .06 + Math.sin(s*4-time*1.7)*s*.1, .78 + s * 3.6];
    }
    const x = Math.cos(a) * r * 2.65;
    const z = Math.sin(a) * r * (Math.sin(a) > 0 ? 1 : 1.35);
    const fin = Math.sin(time * 1.8 - Math.abs(x) * 1.1) * Math.pow(Math.abs(x)/2.65,1.7);
    const y = fin * .65 - .22 * (1-r*r) + Math.sin(a*6+time)*.035*r;
    return [x,y,z];
  }
  if (shape === 1) {
    if (!tail) {
      const radius = Math.sin(r*Math.PI/2) * 1.42 * (1+.045*Math.cos(a*12));
      return [Math.cos(a)*radius,-.55-Math.cos(r*Math.PI/2)*.95+Math.sin(a*12+time*1.8)*.07*Math.pow(r,5),Math.sin(a)*radius];
    }
    const strand = n % 16, s = Math.floor(n/16) / (total/16), angle = strand/16*TAU;
    const radius = .8 + Math.sin(s*8-time*1.5+angle)*.26*s;
    return [Math.cos(angle)*radius+Math.sin(s*8-time*1.4+strand)*.22*s, -.5+s*3.25, Math.sin(angle)*radius+Math.cos(s*7-time+strand)*s*.2];
  }
  if(shape === 2) {
    const q = (index+.5)/count*TAU;
    const b = a;
    const radius = (2+Math.cos(3*q))*.6;
    return [Math.cos(2*q)*(radius+.23*Math.cos(b)),Math.sin(2*q)*(radius+.23*Math.cos(b)),Math.sin(3*q)*.6+.23*Math.sin(b)];
  }
  if(shape === 3) {
    const petal = 1.45 + .7*Math.cos(a*5);
    return [Math.cos(a)*r*petal,Math.sin(a)*r*petal,Math.sin(a*5+r*5-time*.8)*r*.42 + .25*Math.cos(r*4)];
  }
  if(shape === 4) {
    const y = 1-2*(index+.5)/count;
    const ring = Math.sqrt(1-y*y);
    const swell = 1.65 + Math.sin(a*3 + y*5 + time*.6)*.1;
    return [Math.cos(a)*ring*swell,y*swell,Math.sin(a)*ring*swell];
  }
  const q = index / count * TAU;
  const w = (u-.5)*.9;
  const radius = 1.65+w*Math.cos(q*1.5+time*.13);
  return [Math.cos(q)*radius, Math.sin(q)*radius, w*Math.sin(q*1.5+time*.13)+Math.sin(q*3-time*.4)*.35];
}

export function rotatePoint(point, rx, ry, rz) {
  let [x,y,z] = point;
  let c=Math.cos(rx),s=Math.sin(rx),ny=y*c-z*s;z=y*s+z*c;y=ny;
  c=Math.cos(ry);s=Math.sin(ry);let nx=x*c+z*s;z=-x*s+z*c;x=nx;
  c=Math.cos(rz);s=Math.sin(rz);nx=x*c-y*s;y=x*s+y*c;x=nx;
  return [x,y,z];
}

export function sceneLayout(width,height,shape) {
  const mobile=width<=650;
  return {cx:width*(mobile?.5:.655),cy:height*(mobile?.51:shape===1?.43:.47),scale:Math.min(width*(mobile?.174:.131),height*.205)*(shape===1?.7:1),mobile};
}

export function projectPoint(point,width,height,shape,time=0,lookX=0,lookY=0) {
  const layout = sceneLayout(width,height,shape);
  const tiltX = shape===0 ? -.62 : shape===1 ? -.06 : .24;
  const tiltZ = shape===0 ? -.38 : shape===1 ? -.18 : -.24;
  const tilt=shape>=6?motifTilt(shape):[tiltX,0,tiltZ];
  const p = rotatePoint(point,tilt[0]+lookY*.1,tilt[1]+Math.sin(time*.18)*.25+lookX*.18+(isVolumeShape(shape)?motifYaw(shape,time):0),tilt[2]);
  const perspective=7.5/(7.5+p[2]);
  return {x:layout.cx+p[0]*layout.scale*perspective,y:layout.cy+p[1]*layout.scale*perspective,z:p[2],perspective};
}
