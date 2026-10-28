const futureTau=Math.PI*2;
const futureNormalize=v=>{const length=Math.hypot(...v)||1;return v.map(value=>value/length);};
const futureCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function futureRotate(sample,axis,angle){const c=Math.cos(angle),s=Math.sin(angle);for(const key of ['point','normal']){const p=sample[key],a=axis===0?1:0,b=axis===2?1:2,x=p[a]*c-p[b]*s,y=p[a]*s+p[b]*c;p[a]=x;p[b]=y;}return sample;}
function futureSphere(u,v,radius){const y=1-2*v,r=Math.sqrt(Math.max(0,1-y*y)),a=u*futureTau,normal=[Math.cos(a)*r,y,Math.sin(a)*r];return {point:normal.map(value=>value*radius),normal};}
function futureTorus(a,b,radius,thickness){const c=Math.cos(b),s=Math.sin(b),r=radius+thickness*c;return {point:[Math.cos(a)*r,Math.sin(a)*r,thickness*s],normal:[Math.cos(a)*c,Math.sin(a)*c,s]};}

function warpSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 let sample;
 if(v<.72){const local=v/.72,segment=Math.floor(local*12),s=(local*12)%1,a=(segment+.12+s*.76)/12*futureTau+time*.15,b=u*futureTau,r=1.48+.055*Math.sin(segment+time*.8),c=Math.sign(Math.cos(b))*Math.abs(Math.cos(b))**.5,z=Math.sign(Math.sin(b))*Math.abs(Math.sin(b))**.5;
  sample={point:[Math.cos(a)*(r+c*.21),Math.sin(a)*(r+c*.21),z*.21],normal:futureNormalize([Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)])};
 }else if(v<.91){sample=futureTorus((v-.72)/.19*futureTau-time*.24,u*futureTau,1.02,.065);futureRotate(sample,0,.45+Math.sin(time*.4)*.25);}
 else{const local=(v-.91)/.09,moon=Math.min(2,Math.floor(local*3)),a=moon/3*futureTau-time*.28;sample=futureSphere(u,(local*3)%1,.12);sample.point[0]+=Math.cos(a)*.74;sample.point[1]+=Math.sin(a)*.74;sample.point[2]+=.18*Math.sin(a+time*.3);}
 return sample;
}

function gravitySurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 if(v<.26)return futureSphere(u,v/.26,.61+Math.sin(time*.85)*.045);
 if(v>.87){const sample=futureTorus((v-.87)/.13*futureTau+time*.2,u*futureTau,1.82,.04);futureRotate(sample,0,1.1);return futureRotate(sample,2,time*.16);}
 const local=(v-.26)/.61,panel=Math.min(5,Math.floor(local*6)),s=(local*6)%1,axis=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]][panel],side=futureNormalize(futureCross(axis,Math.abs(axis[1])<.8?[0,1,0]:[1,0,0])),up=futureCross(axis,side),theta=Math.acos(1-s*(1-Math.cos(.56))),a=u*futureTau;
 const radial=axis.map((value,k)=>value*Math.cos(theta)+(side[k]*Math.cos(a)+up[k]*Math.sin(a))*Math.sin(theta)),face=index%2===0?-1:1,radius=1.21+Math.sin(time*.75+panel*.4)*.14+face*.035;
 return {point:radial.map(value=>value*radius),normal:radial.map(value=>value*face)};
}

function machineWingSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 if(v>.92){const sample=futureSphere(u,(v-.92)/.08,1);sample.point=sample.point.map((value,k)=>value*[.15,.82,.2][k]);sample.normal=futureNormalize(sample.normal.map((value,k)=>value/[.15,.82,.2][k]));sample.material={joint:true};return sample;}
 if(v>.78){const local=(v-.78)/.14,side=index%2===0?-1:1,s=local,angle=u*futureTau,axis=futureNormalize([side*1.35,-.9*Math.PI/2*Math.cos(s*Math.PI/2),.12]),across=futureNormalize(futureCross(axis,[0,0,1])),up=futureCross(axis,across),normal=across.map((value,k)=>value*Math.cos(angle)+up[k]*Math.sin(angle)),r=.12*(1-s*.45),center=[side*(.18+1.35*s),.08-.9*Math.sin(s*Math.PI/2),.12+.12*s];return futureRotate({point:center.map((value,k)=>value+normal[k]*r),normal,material:{joint:true}},1,side*(.24+Math.sin(time*.65)*.12));}
 const local=v/.78,blade=Math.min(9,Math.floor(local*10)),side=blade%2===0?-1:1,t=Math.floor(blade/2)/4,s=(local*10)%1;
 const root=[side*(.25+1.05*t),.12-.78*t,.03+t*.14],tip=[side*(1.12+1.42*t),.88-1.95*t,-.16+t*.08],axis=futureNormalize(tip.map((value,k)=>value-root[k])),across=futureNormalize(futureCross(axis,[0,0,1])),up=futureCross(axis,across),profile=Math.pow(Math.max(0,Math.sin(Math.PI*s)),.48),w=(.22-.055*t)*profile+.012,h=.073*profile+.012;
 let face,f;if(u<.35){face=0;f=u/.35;}else if(u<.7){face=3;f=(u-.35)/.35;}else{const edge=Math.min(3,Math.floor((u-.7)/.075));face=[1,2,4,5][edge];f=((u-.7)/.075)%1;}
 const polygon=[[-w*.7,-h],[w*.7,-h],[w,-h*.2],[w*.7,h],[-w*.7,h],[-w,h*.2]],a=polygon[face],b=polygon[(face+1)%6],cx=a[0]+(b[0]-a[0])*f,cz=a[1]+(b[1]-a[1])*f;
 let nx=b[1]-a[1],nz=-(b[0]-a[0]);if(nx*cx+nz*cz<0){nx=-nx;nz=-nz;}const normal=futureNormalize(across.map((value,k)=>value*nx+up[k]*nz)),point=root.map((value,k)=>value+(tip[k]-value)*s+across[k]*cx+up[k]*cz);
 const seam=Math.min(Math.abs(s-.23),Math.abs(s-.49),Math.abs(s-.73))<.012;
 return futureRotate({point,normal,material:{edge:face!==0&&face!==3,seam}},1,side*(.24+Math.sin(time*.65)*.12));
}

function shardSample(u,v,index,radius,height){
 const side=Math.min(5,Math.floor(u*6)),f=(u*6)%1,a=side/6*futureTau,b=(side+1)/6*futureTau;
 const ringA=[Math.cos(a)*radius,0,Math.sin(a)*radius],ringB=[Math.cos(b)*radius,0,Math.sin(b)*radius];
 let p0,p1,p2;
 if(v<.28){p0=[0,-height,0];p1=[ringA[0],-height*.45,ringA[2]];p2=[ringB[0],-height*.45,ringB[2]];}
 else if(v<.82){const s=(v-.28)/.54;const point=[ringA[0]+(ringB[0]-ringA[0])*f,-height*.45+s*height*1.05,ringA[2]+(ringB[2]-ringA[2])*f],normal=futureNormalize([Math.cos((a+b)/2),0,Math.sin((a+b)/2)]);return {point,normal};}
 else{p0=[0,height*.87,0];p1=[ringB[0],height*.6,ringB[2]];p2=[ringA[0],height*.6,ringA[2]];}
 const s=v<.28?v/.28:(v-.82)/.18,r=Math.sqrt(s),point=p0.map((value,k)=>value*(1-r)+p1[k]*r*(1-f)+p2[k]*r*f),normal=futureNormalize(futureCross(p1.map((value,k)=>value-p0[k]),p2.map((value,k)=>value-p0[k])));
 if(normal.reduce((sum,value,k)=>sum+value*point[k],0)<0)for(let k=0;k<3;k++)normal[k]*=-1;
 return {point,normal};
}

export function crystalClusterSample(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 if(v<.52)return shardSample(u,v/.52,index,.5,1.95);
 const local=(v-.52)/.48,shard=Math.min(4,Math.floor(local*5)),s=(local*5)%1,a=shard/5*futureTau+time*.08,r=.92+Math.sin(time*.6+shard)*.06,height=.8+shard%3*.19;
 const sample=shardSample(u,s,index,.21+shard%2*.055,height);futureRotate(sample,2,Math.sin(a)*.37);futureRotate(sample,0,Math.cos(a)*.28);sample.point[0]+=Math.cos(a)*r;sample.point[1]+=.2+Math.sin(time*.7+shard)*.16;sample.point[2]+=Math.sin(a)*r;return sample;
}

export function futureSample(shape,index,count,time=0){return shape===17?warpSurface(index,count,time):shape===18?gravitySurface(index,count,time):machineWingSurface(index,count,time);}
