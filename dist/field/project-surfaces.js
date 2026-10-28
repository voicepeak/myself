const projectTau=Math.PI*2;
const projectNormalize=v=>{const length=Math.hypot(...v)||1;return v.map(value=>value/length);};
const projectCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const projectLerp=(a,b,s)=>a.map((value,k)=>value+(b[k]-value)*s);
function projectSphere(u,v,radius,center=[0,0,0]){const y=1-2*v,r=Math.sqrt(Math.max(0,1-y*y)),a=u*projectTau,normal=[Math.cos(a)*r,y,Math.sin(a)*r];return {point:normal.map((value,k)=>value*radius+center[k]),normal};}
function projectTube(u,s,a,b,radius){const axis=projectNormalize(b.map((value,k)=>value-a[k])),side=projectNormalize(projectCross(axis,Math.abs(axis[2])<.9?[0,0,1]:[0,1,0])),up=projectCross(axis,side),angle=u*projectTau,normal=side.map((value,k)=>value*Math.cos(angle)+up[k]*Math.sin(angle));return {point:a.map((value,k)=>value+(b[k]-value)*s+normal[k]*radius),normal};}
function projectCube(u,v,half,center){const face=Math.min(5,Math.floor(v*6)),s=(v*6)%1,a=u*2-1,b=s*2-1,axis=Math.floor(face/2),sign=face%2?1:-1,point=[0,0,0],normal=[0,0,0];point[axis]=sign*half;point[(axis+1)%3]=a*half;point[(axis+2)%3]=b*half;normal[axis]=sign;return {point:point.map((value,k)=>value+center[k]),normal};}

function voiceSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 if(v<.18)return projectSphere(u,v/.18,.37+Math.sin(time*1.6)*.025);
 const local=(v-.18)/.82,band=Math.min(6,Math.floor(local*7)),q=(local*7)%1*projectTau,latitude=(band-3)*.31,envelope=Math.sqrt(Math.max(.1,1-(latitude/1.2)**2)),wave=Math.sin(q*5-time*1.4+band*.8)*.1+Math.sin(q*9+time*.8)*.045,radius=.97*envelope+wave,b=u*projectTau,thickness=.045+.01*Math.sin(q*3+time),normal=[Math.cos(q)*Math.cos(b),Math.sin(b),Math.sin(q)*Math.cos(b)];
 return {point:[Math.cos(q)*radius+normal[0]*thickness,latitude+Math.sin(q*3-time*.9)*.045+normal[1]*thickness,Math.sin(q)*radius+normal[2]*thickness],normal};
}

function pixelSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count,cube=Math.min(7,Math.floor(v*8)),s=(v*8)%1,gap=.58+(.5+.5*Math.sin(time*.7))*.17,center=[cube&1?gap:-gap,cube&2?gap:-gap,cube&4?gap:-gap];
 return projectCube(u,s,.45,center);
}

function robotSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count,shoulder=[-.55,.85,0],elbow=[-.85+Math.sin(time*.55)*.14,-.35,.03],wrist=[.5+Math.sin(time*.55)*.12,-1.0+Math.cos(time*.55)*.1,-.08],tool=[.99,-.55,-.08],opening=.1+(.5+.5*Math.sin(time*.9))*.18;
 if(v<.16)return projectTube(u,v/.16,[-.55,1.45,0],[-.55,1.1,0],.47);
 if(v<.26)return projectTube(u,(v-.16)/.1,[-.55,1.1,0],shoulder,.22);
 if(v<.49)return projectTube(u,(v-.26)/.23,shoulder,elbow,.185);
 if(v<.69)return projectTube(u,(v-.49)/.2,elbow,wrist,.145);
 if(v<.85){const local=(v-.69)/.16,joint=Math.min(2,Math.floor(local*3));return projectSphere(u,(local*3)%1,[.28,.25,.2][joint],[shoulder,elbow,wrist][joint]);}
 if(v<.9)return projectTube(u,(v-.85)/.05,wrist,tool,.12);
 if(v<.935)return projectTube(u,(v-.9)/.035,[tool[0],tool[1]-opening,tool[2]],[tool[0],tool[1]+opening,tool[2]],.1);
 const local=(v-.935)/.065,side=index%2?1:-1,start=[tool[0],tool[1]+side*opening,tool[2]],end=[tool[0]+.45,tool[1]+side*opening*.55,tool[2]],sample=projectTube(u,local,start,end,.065);return sample;
}

const projectPhi=(1+Math.sqrt(5))/2;
const projectNodes=[];
for(const a of [-1,1])for(const b of [-1,1]){projectNodes.push([0,a,b*projectPhi],[a,b*projectPhi,0],[a*projectPhi,0,b]);}
for(let i=0;i<projectNodes.length;i++)projectNodes[i]=projectNormalize(projectNodes[i]).map(value=>value*1.3);
const projectEdges=[];
for(let i=0;i<projectNodes.length;i++)for(let j=i+1;j<projectNodes.length;j++){if(Math.hypot(...projectNodes[i].map((value,k)=>value-projectNodes[j][k]))<1.5)projectEdges.push([projectNodes[i],projectNodes[j]]);}
function mindSurface(index,count,time){
 const u=(index*.6180339887498949)%1,v=(index+.5)/count;
 if(v<.12)return projectSphere(u,v/.12,.27+Math.sin(time*1.3)*.03);
 if(v<.4){const local=(v-.12)/.28,node=Math.min(11,Math.floor(local*12));return projectSphere(u,(local*12)%1,.13,projectNodes[node]);}
 if(v<.9){const local=(v-.4)/.5,edge=Math.min(projectEdges.length-1,Math.floor(local*projectEdges.length)),s=(local*projectEdges.length)%1;return projectTube(u,s,...projectEdges[edge],.028);}
 const local=(v-.9)/.1,packet=Math.min(5,Math.floor(local*6)),edge=projectEdges[(packet*5)%projectEdges.length],s=(time*.2+packet/6)%1;return projectSphere(u,(local*6)%1,.075,projectLerp(...edge,s));
}

export function projectSample(shape,index,count,time=0){return shape===20?voiceSurface(index,count,time):shape===21?pixelSurface(index,count,time):shape===22?robotSurface(index,count,time):mindSurface(index,count,time);}
