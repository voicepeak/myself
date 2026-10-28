import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createMaterialAtlas,renderSculptureScene} from './dist/field/volume-render.js';
const require=createRequire(import.meta.url);let native;try{native=require('@napi-rs/canvas');}catch{native=require(process.env.TEMP+'/ji-site-qa/node_modules/@napi-rs/canvas');}
const {createCanvas}=native,atlas=createMaterialAtlas(createCanvas);
for(const [id,shape]of [['fxdesk',17],['rmua',19],['xatom',11]]){const canvas=createCanvas(1000,625),ctx=canvas.getContext('2d');ctx.translate(-155,0);renderSculptureScene(ctx,1000,625,{count:3200,shape,time:12,morph:1,reveal:1,static:true,recordFrame:false,pointer:{active:false,x:-10000,y:-10000}},atlas,[]);const output=createCanvas(1000,625),c=output.getContext('2d');c.fillStyle='#f8f7f2';c.fillRect(0,0,1000,625);c.drawImage(canvas,0,0);writeFileSync(new URL(`./dist/assets/${id}-field.webp`,import.meta.url),output.toBuffer('image/webp'));}
console.log('Exported three character motif covers; these are illustrations, not product screenshots.');
