const marineTau=Math.PI*2;
const marineNormalize=v=>{const length=Math.hypot(...v)||1;return v.map(value=>value/length);};
const marineCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function marineEllipsoid(u,v,radii,center){const y=1-2*v,r=Math.sqrt(Math.max(0,1-y*y)),angle=u*marineTau,unit=[Math.cos(angle)*r,y,Math.sin(angle)*r];return {point:unit.map((value,k)=>center[k]+value*radii[k]),normal:marineNormalize(unit.map((value,k)=>value/radii[k]))};}
function marineFin(u,v,index,a,b,c,thickness=.05){const r=Math.sqrt(v),sign=index%2===0?-1:1,normal=marineNormalize(marineCross(b.map((value,k)=>value-a[k]),c.map((value,k)=>value-a[k]))).map(value=>value*sign),bulge=Math.sin(Math.PI*u)*Math.sin(Math.PI*r)*thickness;return {point:a.map((value,k)=>value*(1-r)+b[k]*r*(1-u)+c[k]*r*u+normal[k]*bulge),normal};}
function whaleRadius(s){return 1.25*Math.pow(Math.max(.00001,Math.sin(Math.PI*s)),.35)*(1-s*.7);}

function whaleSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count,angle=u*marineTau;
 let sample;
 if(v<.64){const s=v/.64,r=whaleRadius(s),s0=Math.max(.00001,s-.001),s1=Math.min(.99999,s+.001),slope=(whaleRadius(s1)-whaleRadius(s0))/((s1-s0)*3.8);
  sample={point:[-2+s*3.8,.06+Math.cos(angle)*r,Math.sin(angle)*r*.82],normal:marineNormalize([-slope,Math.cos(angle),Math.sin(angle)/.82])};
 }else if(v<.80){const s=(v-.64)/.16,side=index%4<2?-1:1;sample=marineFin(u,s,index,[1.62,.04,0],[2.75,-.12,side*1.95],[2.1,.03,side*.24],.075);
  const flap=.52+Math.sin(time*1.55)*.30,c=Math.cos(flap),ss=Math.sin(flap);for(const key of ['point','normal']){const p=sample[key],y=p[1]*c-p[2]*ss,z=p[1]*ss+p[2]*c;p[1]=y;p[2]=z;}
 }else if(v<.92){const s=(v-.8)/.12,side=index%4<2?-1:1;sample=marineFin(u,s,index,[-1,.4,side*.3],[.4,.6,side*2.3],[.55,.32,side*.65],.065);
 }else if(v<.985){sample=marineFin(u,(v-.92)/.065,index,[.03,-.55,0],[.72,-1.3,0],[.95,-.38,0],.05);
 }else{sample=marineEllipsoid(u,(v-.985)/.015,[.044,.044,.016],[-1.35,-.03,-.62]);}
 const bend=Math.max(0,(sample.point[0]+.8)/3);sample.point[1]+=Math.sin(time*1.55-sample.point[0]*.9)*bend*bend*.6;sample.point[2]+=Math.sin(time*.9)*bend*.06;
 return {point:sample.point.map(value=>value*.78),normal:sample.normal};
}

function octopusArm(arm,s,time){const a=arm/8*marineTau+.17*Math.sin(s*4-time*1.1+arm),length=1.75+.18*Math.sin(arm*2),radius=.32+length*s-.55*s**4,y=.16+1.35*s-.42*s*s+.17*Math.sin(s*4-time+arm)*s,curl=.25*s**4*Math.sin(s*7+arm);
 return [Math.cos(a)*radius-Math.sin(a)*curl,y,Math.sin(a)*radius+Math.cos(a)*curl];}
function octopusSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 let sample;
 if(v<.38)sample=marineEllipsoid(u,v/.38,[.67,.92+Math.sin(time*1.3)*.025,.56],[0,-.75,0]);
 else if(v<.46)sample=marineEllipsoid(u,(v-.38)/.08,[.48,.34,.45],[0,.04,0]);
 else{const local=(v-.46)/.54,arm=Math.min(7,Math.floor(local*8)),s=(local*8)%1,center=octopusArm(arm,s,time),p0=octopusArm(arm,Math.max(0,s-.002),time),p1=octopusArm(arm,Math.min(1,s+.002),time),tangent=marineNormalize(p1.map((value,k)=>value-p0[k])),side=marineNormalize(marineCross(tangent,Math.abs(tangent[1])<.95?[0,1,0]:[0,0,1])),up=marineCross(tangent,side),a=u*marineTau;
  const normal=side.map((value,k)=>value*Math.cos(a)+up[k]*Math.sin(a)),r=.16*Math.pow(1-s,.8)+.012;sample={point:center.map((value,k)=>value+normal[k]*r),normal};
 }
 sample.point[1]+=Math.sin(time*1.1)*.045;return {point:sample.point.map(value=>value*.9),normal:sample.normal};
}

export function marineSample(shape,index,count,time=0){return shape===15?whaleSurface(index,count,time):octopusSurface(index,count,time);}
