import {topics} from './explore-data.js';
import {createExplorationField,depthPhase} from './explore-field.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const track=$('#depth-track'),stage=$('#stage'),portal=$('#portal'),title=$('#portal-title'),subtitle=$('#portal-subtitle'),reveal=$('#reveal'),revealTitle=$('#reveal-title'),content=$('#reveal-content'),back=$('#back'),trail=$('#trail-label');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const outward='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11"/></svg>';
let topic=topics[0],field=null,distance=1,currentProgress=0,targetProgress=0,activeIndex=-1,focusDestination=null,lastWheel=0,touchStart=null,syncTimer=0,ignoreScroll=false;
const getTopic=id=>topics.find(t=>t.id===id);
function canonical(t,p){const phase=depthPhase(p,t.items.length),item=phase.index?t.items[phase.index-1]:null;return '#/'+t.id+(item?'/'+item.id+(phase.local>=.28?'/open':''):(phase.local>=.28?'/list':''));}
function parse(hash){
 if(!hash||hash==='#top'||hash==='#ji'||hash==='#me')return {topic:'me',progress:0};
 if(hash==='#projects'||hash==='#work'||hash==='#paths')return {topic:'work',progress:.56};
 if(hash==='#likes'||hash==='#picks')return {topic:'likes',progress:.56};
 const old=hash.match(/^#(project|favorite)\/([^/]+)$/);if(old){const id=old[1]==='project'?'work':'likes',t=getTopic(id),i=t.items.findIndex(x=>x.id===old[2]);return i<0?null:{topic:id,progress:i+1+.56};}
 const match=hash.match(/^#\/(me|work|likes)(?:\/([^/]+))?(?:\/(open))?$/);if(!match)return null;
 const t=getTopic(match[1]),part=match[2];if(!part)return {topic:t.id,progress:0};if(part==='list'&&!match[3])return {topic:t.id,progress:.56};const i=t.items.findIndex(x=>x.id===part);return i<0?null:{topic:t.id,progress:i+1+(match[3]?.56:0)};
}
function layout(){const h=stage.getBoundingClientRect().height||innerHeight;distance=Math.round(h*1.05);track.style.height=(h+(topic.items.length+.62)*distance)+'px';}
function linksHTML(links){return links.map(link=>`<a href="${esc(link.url)}" ${/^https:/.test(link.url)?'target="_blank" rel="noopener noreferrer"':''}>${esc(link.label)} ${outward}</a>`).join('');}
function build(index){
 activeIndex=index;const item=index?topic.items[index-1]:null,label=item?item.title:topic.title;
 title.innerHTML=esc(label)+(item?'':'<span>。</span>');subtitle.textContent=item?item.short:topic.subtitle;
 revealTitle.textContent=item?item.title:topic.nav;revealTitle.tabIndex=-1;trail.textContent=item?topic.nav:'';document.title=(item?item.title:topic.nav)+' · 纪';
 if(item){content.innerHTML=`<div class="detail-layout"><div class="detail-intro"><p>${esc(item.short)}</p><div class="content-links">${linksHTML(item.links)}</div></div><div class="fact-list">${item.facts.map(f=>`<div class="fact"><span>${esc(f)}</span><i aria-hidden="true"></i></div>`).join('')}</div></div>`;}
 else{content.innerHTML=`<div class="item-grid">${topic.items.map((i,n)=>`<button class="item" data-item="${esc(i.id)}"><span class="item-ordinal">${String(n+1).padStart(2,'0')}</span><span class="item-copy"><span class="item-name">${esc(i.name)}</span><span class="item-caption">${esc(i.short)}</span></span><img class="item-visual" src="./assets/motif-${esc(i.motif)}.webp" alt="" width="640" height="400" loading="lazy"><span class="item-mark" aria-hidden="true">${arrow}</span></button>`).join('')}</div>`;}
}
function renderPhase(phase,p){
 currentProgress=p;if(activeIndex!==phase.index)build(phase.index);
 const po=phase.portal,co=phase.content,showPortal=po>.08,showContent=co>.55;
 portal.hidden=false;portal.style.opacity=String(po);portal.style.transform=`translate3d(0,${-18*(1-po)}px,0)`;portal.classList.toggle('is-inactive',!showPortal);portal.inert=!showPortal;portal.setAttribute('aria-hidden',String(!showPortal));
 reveal.hidden=false;reveal.style.opacity=String(co);reveal.style.transform=`translate3d(0,${18*(1-co)}px,0)`;reveal.classList.toggle('is-ready',showContent);reveal.inert=!showContent;reveal.setAttribute('aria-hidden',String(!showContent));
 back.hidden=p<.15;$('#depth-meter-fill').style.transform=`scaleX(${Math.min(1,p/phase.max)})`;
 if(focusDestination&&phase.index===focusDestination.index){if(focusDestination.open&&showContent){focusDestination=null;revealTitle.focus({preventScroll:true});}else if(!focusDestination.open&&po>.7){focusDestination=null;$('#enter').focus({preventScroll:true});}}
}
function setPosition(progress,{behavior='smooth',focus=false}={}){targetProgress=Math.max(0,Math.min(topic.items.length+.62,progress));const phase=depthPhase(targetProgress,topic.items.length);focusDestination=focus?{index:phase.index,open:phase.local>=.28}:null;window.scrollTo({top:Math.round(targetProgress*distance),behavior:reduced.matches?'instant':behavior});if(reduced.matches||behavior==='instant')field?.seek(targetProgress,{instant:true});if(!field)renderPhase(phase,targetProgress);}
function remember(){history.replaceState({explore:true,topic:topic.id,progress:targetProgress},'',canonical(topic,targetProgress));}
function switchTo(id,{progress=0,push=true}={}){
 const next=getTopic(id);if(!next)return;if(push){remember();history.pushState({explore:true,topic:id,progress},'',canonical(next,progress));}
 clearTimeout(syncTimer);topic=next;activeIndex=-1;focusDestination=null;layout();$$('[data-topic]').forEach(b=>b.dataset.topic===id?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
 targetProgress=Math.max(0,Math.min(topic.items.length+.62,progress));ignoreScroll=true;window.scrollTo({top:Math.round(targetProgress*distance),behavior:'instant'});ignoreScroll=false;
 field?.setSequence([topic.motif,...topic.items.map(i=>i.motif)],targetProgress);if(!field)renderPhase(depthPhase(targetProgress,topic.items.length),targetProgress);$('#announcement').textContent=topic.nav;
}
function switchTopic(step){const i=topics.findIndex(t=>t.id===topic.id),next=topics[(i+step+topics.length)%topics.length];switchTo(next.id);}
function backOne(){const phase=depthPhase(targetProgress,topic.items.length);let previous;if(phase.index===0)previous=0;else if(phase.local>=.28)previous=phase.index;else previous=.56;setPosition(previous,{focus:true});}
$('#enter').addEventListener('click',e=>{const phase=depthPhase(currentProgress,topic.items.length);setPosition(phase.index+.56,{focus:e.detail===0});});back.addEventListener('click',backOne);
$('#previous').addEventListener('click',()=>switchTopic(-1));$('#next').addEventListener('click',()=>switchTopic(1));$$('[data-topic]').forEach(b=>b.addEventListener('click',()=>switchTo(b.dataset.topic)));
content.addEventListener('click',e=>{const button=e.target.closest('[data-item]');if(!button)return;const index=topic.items.findIndex(i=>i.id===button.dataset.item);if(index<0)return;remember();history.pushState({explore:true,topic:topic.id,progress:index+1},'',canonical(topic,index+1));setPosition(index+1,{focus:e.detail===0});});
window.addEventListener('scroll',()=>{if(ignoreScroll)return;targetProgress=Math.max(0,Math.min(topic.items.length+.62,scrollY/distance));field?.seek(targetProgress);if(!field)renderPhase(depthPhase(targetProgress,topic.items.length),targetProgress);clearTimeout(syncTimer);syncTimer=setTimeout(remember,180);},{passive:true});
window.addEventListener('resize',()=>{const p=targetProgress;layout();ignoreScroll=true;window.scrollTo({top:Math.round(p*distance),behavior:'instant'});ignoreScroll=false;field?.seek(p,{instant:true});});
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();switchTopic(-1);}else if(e.key==='ArrowRight'){e.preventDefault();switchTopic(1);}else if(e.key==='Escape'&&targetProgress>.15){e.preventDefault();backOne();}});
stage.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<30||Math.abs(e.deltaX)<Math.abs(e.deltaY)*1.2||Date.now()-lastWheel<900)return;lastWheel=Date.now();switchTopic(e.deltaX>0?1:-1);},{passive:true});
stage.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});stage.addEventListener('touchend',e=>{if(!touchStart||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4)switchTopic(dx<0?1:-1);},{passive:true});
stage.addEventListener('pointermove',e=>field?.move(e));stage.addEventListener('pointerleave',()=>field?.leave());stage.addEventListener('click',e=>{if(!e.target.closest('button,a'))field?.pulse(e);});
$('#motion-toggle').addEventListener('click',()=>{const b=$('#motion-toggle'),paused=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(paused));b.setAttribute('aria-label',paused?'播放字符动画':'暂停字符动画');b.querySelector('svg').innerHTML=paused?'<path d="m7 5 7 5-7 5z"/>':'<path d="M7 5v10m6-10v10"/>';field?.setPaused(paused);});
function fromLocation(){const r=history.state?.explore&&getTopic(history.state.topic)?{topic:history.state.topic,progress:history.state.progress}:parse(location.hash);if(!r){history.replaceState(null,'','#/me');switchTo('me',{push:false});return;}if(r.topic===topic.id&&Math.abs(r.progress-targetProgress)<.002)return;switchTo(r.topic,{progress:r.progress,push:false});}
window.addEventListener('popstate',fromLocation);window.addEventListener('hashchange',fromLocation);
field=createExplorationField($('#field'),{onProgress:renderPhase});const initial=parse(location.hash)||{topic:'me',progress:0};switchTo(initial.topic,{progress:initial.progress,push:false});
window.__JI_EXPLORER__={get route(){const phase=depthPhase(targetProgress,topic.items.length);return {topic:topic.id,index:phase.index,progress:targetProgress,item:phase.index?topic.items[phase.index-1].id:null,open:phase.local>=.28};},field,switchTo,setPosition,back:backOne};
