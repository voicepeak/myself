import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {topics} from './dist/explore-data.js';
const require=createRequire(import.meta.url);let JSDOM,VirtualConsole;
try{({JSDOM,VirtualConsole}=require('jsdom'));}catch{({JSDOM,VirtualConsole}=require(process.env.TEMP+'/ji-site-qa/node_modules/jsdom'));}
const root=path.resolve('dist'),read=f=>readFileSync(path.join(root,f),'utf8'),strip=s=>s.replace(/^import .*;\r?\n/gm,'').replace(/\bexport /g,'');
const order=['field/marine-surfaces.js','field/future-surfaces.js','field/project-surfaces.js','field/motif-surfaces.js','field/scene-math.js','field/original-render.js','field/volume-render.js','explore-data.js','explore-field.js','shallow.js'];
for(const f of order)for(const m of read(f).matchAll(/^import .*?from ['"]([^'"]+)['"]/gm))assert.ok(existsSync(path.resolve(root,path.dirname(f),m[1])),f+' imports '+m[1]);
for(const m of read('index.html').matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g))assert.ok(existsSync(path.join(root,m[1])),m[1]+' exists');
const runtime=order.map(f=>strip(read(f))).join('\n');new vm.Script(runtime,{filename:'depth-runtime.js'});
const lab=read('motifs.html').replace(/\r\n/g,'\n');for(const name of ['marine-surfaces','future-surfaces','project-surfaces','motif-surfaces','scene-math','original-render','volume-render']){let source=strip(read('field/'+name+'.js').replace(/\r\n/g,'\n')).replace(' if(state.recordFrame===false)return;\n','').trim();if(name==='motif-surfaces')source=source.slice(source.indexOf('// Continuous parametric sculptures'));assert.ok(lab.includes(source),name+' matches the lab implementation');}
const motifStart=lab.indexOf('const MOTIFS=')+'const MOTIFS='.length,motifEnd=lab.indexOf('];',motifStart),labMotifs=JSON.parse(lab.slice(motifStart,motifEnd+1));for(const model of labMotifs.filter(m=>m.project)){const project=topics.find(t=>t.id==='work').items.find(i=>i.name===model.project);assert.ok(project,model.project+' retained');assert.equal(project.motif,model.id,model.project+' uses the approved project motif');}
const html=read('index.html').replace('<link rel="stylesheet" href="./shallow.css">',()=>'<style>'+read('shallow.css')+'</style>');const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function createPage({width=1440,reduced=false,hash=''}={}){
 const errors=[],frames=new Map();let serial=0,clock=0;const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',(...args)=>errors.push(args.map(String).join(' ')));
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://127.0.0.1:4173/'+hash,pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  Object.defineProperty(w,'innerWidth',{value:width,configurable:true});Object.defineProperty(w,'innerHeight',{value:width<=650?844:900,configurable:true});
  w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion')?reduced:false,addEventListener(){},removeEventListener(){}});
  w.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};w.cancelAnimationFrame=id=>frames.delete(id);
  w.scrollTo=(first,second)=>{Object.defineProperty(w,'scrollY',{value:typeof first==='object'?first.top:second||0,configurable:true});w.dispatchEvent(new w.Event('scroll'));};
  w.HTMLElement.prototype.scrollIntoView=function(){};w.ResizeObserver=class{constructor(cb){this.cb=cb;}observe(target){queueMicrotask(()=>this.cb([{target}]));}disconnect(){}};
  w.HTMLElement.prototype.getBoundingClientRect=function(){return {x:0,y:0,left:0,top:0,right:width,bottom:w.innerHeight,width,height:w.innerHeight};};
  const contexts=new WeakMap(),noop=()=>{};w.HTMLCanvasElement.prototype.getContext=function(){if(!contexts.has(this))contexts.set(this,{clearRect:noop,drawImage:noop,fillText:noop,setTransform:noop,beginPath:noop,arc:noop,fill:noop});return contexts.get(this);};
 }});const w=dom.window;w.eval(runtime);await delay(20);
 const advance=n=>{for(let i=0;i<n;i++){clock+=17;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(clock));}};
 const scroll=p=>w.scrollTo({top:Math.round(p*Math.round(w.innerHeight*1.05))});
 return {dom,w,d:w.document,errors,advance,scroll};
}
assert.equal(topics.length,3);assert.equal(topics.find(t=>t.id==='work').items.length,7);assert.equal(topics.find(t=>t.id==='likes').items.length,5);
const inventory=JSON.parse(readFileSync('project-inventory.json','utf8'));for(const p of topics.find(t=>t.id==='work').items){const original=inventory.find(i=>i.id===p.id);assert.ok(original);assert.ok(p.links.some(link=>link.url===original.repo));assert.ok(!('image'in p));}
assert.ok(topics.find(t=>t.id==='work').items.find(i=>i.id==='bytemind').facts.includes('Fork 项目'));
assert.ok(read('about.html').includes('./#/me'));

const page=await createPage(),{w,d}=page;page.advance(5);assert.equal(d.querySelector('#stage-title').textContent,'纪');assert.equal(w.__JI_SHALLOW__.field.state.count,3700);assert.ok(d.querySelector('.explore-topics'));for(const label of ['正在探索','灵感收藏','碎片','联系与合作'])assert.ok(d.querySelector('#content').textContent.includes(label));assert.ok(!d.querySelector('#page').textContent.includes('自述')); 
w.__JI_SHALLOW__.render('work');assert.equal(d.querySelectorAll('.project').length,7);assert.ok(d.querySelectorAll('.project-details a').length>=7);d.querySelector('.project').open=true;assert.equal(d.querySelector('.project').open,true);assert.ok(d.querySelector('.project-details').textContent.includes('长期记忆'));
w.__JI_SHALLOW__.render('likes');assert.equal(d.querySelectorAll('.like-row').length,5);assert.equal(d.querySelectorAll('.likes-collections section').length,2);assert.ok(d.querySelector('.likes-layout').textContent.includes('花谱'));assert.deepEqual(page.errors,[]);w.__JI_SHALLOW__.field.destroy();page.dom.window.close();
const mobile=await createPage({width:390,reduced:true,hash:'#/work/ayana/open'});assert.equal(mobile.w.__JI_SHALLOW__.topic,'work');assert.equal(mobile.d.querySelector('#item-ayana').open,true);assert.equal(mobile.w.__JI_SHALLOW__.field.state.count,2300);assert.deepEqual(mobile.errors,[]);mobile.w.__JI_SHALLOW__.field.destroy();mobile.dom.window.close();
console.log('PASS: three distinct theme layouts, seven expandable projects, five direct collection links, legacy item routes, mobile reduced-motion, and removed biography.');
