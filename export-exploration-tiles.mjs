import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {topics} from './dist/explore-data.js';
import {MOTIFS} from './dist/field/motif-surfaces.js';
import {createMaterialAtlas,renderSculptureScene} from './dist/field/volume-render.js';
const require=createRequire(import.meta.url);let native;try{native=require('@napi-rs/canvas');}catch{native=require(process.env.TEMP+'/ji-site-qa/node_modules/@napi-rs/canvas');}
const {createCanvas}=native,atlas=createMaterialAtlas(createCanvas),ids=[...new Set(topics.flatMap(t=>t.items.map(item=>item.motif)))];
for(const id of ids){const shape=MOTIFS.find(m=>m.id===id).shape,canvas=createCanvas(640,400),ctx=canvas.getContext('2d');ctx.save();ctx.translate(0,6);renderSculptureScene(ctx,640,400,{count:2300,time:12,shape,morph:1,reveal:1,static:true,pointer:{active:false,x:-10000,y:-10000}},atlas,[]);ctx.restore();const output=createCanvas(640,400),out=output.getContext('2d');out.fillStyle='#f8f7f2';out.fillRect(0,0,640,400);out.drawImage(canvas,0,0);writeFileSync(new URL(`./dist/assets/motif-${id}.webp`,import.meta.url),output.toBuffer('image/webp'));}
console.log('Generated '+ids.length+' miniature character motifs using the original renderer.');
