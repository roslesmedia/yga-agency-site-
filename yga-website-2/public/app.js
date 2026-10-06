import { createScene } from './scene.js';
import { setupExperience } from './experience.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let scene = null;
try { scene = createScene($('#scene')); } catch { /* The designed HTML fallback remains visible. */ }
const sceneCaptions = ['Built around what makes you, you.','Your expertise. A useful product.','A clear path from content to checkout.'];
$$('[data-scene]').forEach(button => button.addEventListener('click', () => {
  $$('[data-scene]').forEach(b => {b.classList.toggle('is-active', b === button); b.setAttribute('aria-pressed', String(b === button));});
  const value = Number(button.dataset.scene);
  scene?.setMode(value);
  $('#scene-caption').textContent = sceneCaptions[value];
}));
$('#motion-toggle').addEventListener('click', function () {
  const paused = this.getAttribute('aria-pressed') !== 'true';
  this.setAttribute('aria-pressed', String(paused));
  this.setAttribute('aria-label', paused ? 'Resume scene motion' : 'Pause scene motion');
  this.textContent = paused ? '▷' : 'Ⅱ';
  scene?.setPaused(paused);
});
if (!scene) { $('#motion-toggle').hidden = true; $('.scene-instruction').textContent = 'YGA / Creator partnerships'; $('#scene').removeAttribute('tabindex'); }
function onHeroProgress(progress){
  scene?.setProgress(progress);
  const state=Math.round(progress*2);
  $$('[data-scene]').forEach(b=>{const active=Number(b.dataset.scene)===state;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  $('#scene-caption').textContent=sceneCaptions[state];
}

// Short, interruptible reveals. The page stays visible if animation is unavailable.
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function reveal(node,duration=260){if(motionPreference.matches||document.body.classList.contains('motion-paused')||!node?.animate)return;node.getAnimations().forEach(a=>a.cancel());node.animate([{opacity:.2,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration,easing:'cubic-bezier(.2,.75,.2,1)'});}
// Native controls keep the core page usable without WebGL.
const menuButton = $('.menu-toggle'), menu = $('#mobile-menu');
function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Open navigation'); document.body.classList.remove('menu-open'); }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.hidden = !open; menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open ? 'Close navigation' : 'Open navigation'); document.body.classList.toggle('menu-open',open);
});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

$$('.service-item').forEach(button => button.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded',String(open));button.classList.toggle('is-active',open);
  button.querySelector('.service-description').hidden = !open;
  button.querySelector('.service-icon').textContent = open ? '−' : '+';
  if(open)reveal(button.querySelector('.service-description'),200);
}));

const stages = [
  {name:'Start with a conversation.',copy:'We learn about your expertise, your audience and what you want to build. Together, we decide whether there is a good fit.',symbol:'↗',caption:'Your world. Our starting point.'},
  {name:'Listen for the real need.',copy:'We examine questions, comments and existing offers. We look for problems your audience already wants help solving.',symbol:'◎',caption:'Questions before assumptions.'},
  {name:'Find evidence of demand.',copy:'We shape a focused offer, explore interest and use audience feedback to decide what is worth building.',symbol:'✓',caption:'A clearer signal. A better decision.'},
  {name:'Make your expertise useful.',copy:'We research, write, structure, design and build the entire product behind the scenes, tailored to your content, brand and niche.',symbol:'▤',caption:'From insight to something tangible.'},
  {name:'Bring it to your audience.',copy:'We plan the content, product page and email sequence together. Your voice stays at the center of the launch.',symbol:'↗',caption:'The right message. A clear next step.'},
  {name:'Learn from real responses.',copy:'We review feedback, customer questions and sales performance. Then we improve the product and how it reaches people.',symbol:'↻',caption:'Launch is a beginning.'}
];
let selectedStage=0;
function selectStage(index){reveal($('.process-text'),230);selectedStage=index;const item=stages[index];$$('[data-step]').forEach(b=>{const active=Number(b.dataset.step)===index;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});$('#process-count').textContent=`0${index+1} / 06`;$('#process-name').textContent=item.name;$('#process-description').textContent=item.copy;$('#process-symbol').textContent=item.symbol;$('#process-visual-caption').textContent=item.caption;$('.process-visual').dataset.phase=String(index);$('#next-step').firstChild.textContent=`Next: ${['meet','research','validate','build','launch','improve'][(index+1)%6]} `;}
$$('[data-step]').forEach(b=>b.addEventListener('click',()=>selectStage(Number(b.dataset.step))));
$('#next-step').addEventListener('click',()=>selectStage((selectedStage+1)%6));

const questions=[
  ['A practical beginner’s guide.','A clear path through the first steps, common mistakes and small wins.'],
  ['A bespoke creator-led course.','An original learning journey, with the full curriculum, content and design built around your expertise.'],
  ['A custom workbook.','Original exercises, explanations and design that bring your method to life.']
];
$$('[data-question]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.question);$$('[data-question]').forEach(x=>{x.classList.toggle('is-active',x===b);x.setAttribute('aria-pressed',String(x===b));});$('#demand-product').textContent=questions[i][0];$('#demand-description').textContent=questions[i][1];reveal($('.demand-result'),220);}));

const products=[
  {title:['Your knowledge.','Made useful.'],subtitle:'Original content.\nDesigned around your brand.',kicker:'Custom guides and ebooks',name:['The complete product.','Created for you.'],copy:'We research your audience, write and structure the original content, and design the complete guide around your voice, visual identity and niche.',features:['Research and original writing','Custom cover, layout and visuals','Finished product and delivery setup'],art:'↗'},
  {title:['Your way.','Your course.'],subtitle:'Your expertise.\nOur behind-the-scenes production.',kicker:'Bespoke creator-led courses',name:['Every lesson.','Built around you.'],copy:'We develop the course concept, curriculum, lesson scripts, supporting content and design. For video lessons, you remain the real creator on camera; we handle the agreed production work.',features:['Original curriculum and lesson content','Brand-specific graphics and learning materials','Complete course and delivery experience'],art:'▷'},
  {title:['Your method.','Made tangible.'],subtitle:'Original exercises.\nA completely custom experience.',kicker:'Custom workbooks and learning tools',name:['From your method','to a finished product.'],copy:'We turn your approach into an original workbook or learning tool, creating the written guidance, exercises, examples and every part of the design for your particular audience.',features:['Original content, prompts and exercises','Built around your method and niche','Custom design from cover to final page'],art:'◎'}
];
function lines(node,parts){node.replaceChildren();parts.forEach((line,i)=>{if(i)node.append(document.createElement('br'));node.append(document.createTextNode(line));});}
$$('[data-product]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.product),p=products[i];$$('[data-product]').forEach(x=>{x.classList.toggle('is-active',x===b);x.setAttribute('aria-pressed',String(x===b));});$('#product-art').dataset.format=String(i);lines($('#book-title'),p.title);lines($('#book-subtitle'),p.subtitle.split('\n'));lines($('#product-name'),p.name);$('#product-kicker').textContent=p.kicker;$('#product-copy').textContent=p.copy;$('.cover-art').textContent=p.art;$('#product-features').replaceChildren(...p.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}));

// Native dialogs retain focus trapping. Exits are interruptible and return focus.
const dialogTriggers=new WeakMap(),closingAnimations=new WeakMap();
function openDialog(dialog,trigger){
  closeMenu();
  $$('dialog[open]').forEach(other=>{if(other!==dialog){other.dataset.suppressReturn='true';other.close();}});
  const previous=closingAnimations.get(dialog);closingAnimations.delete(dialog);previous?.cancel();
  dialogTriggers.set(dialog,trigger);if(!dialog.open)dialog.showModal();
  document.body.classList.add('dialog-open');dialog.querySelector('.close-dialog')?.focus();
}
async function closeDialog(dialog){
  if(!dialog.open)return;
  if(motionPreference.matches||document.body.classList.contains('motion-paused')||!dialog.animate){dialog.close();return;}
  const previous=closingAnimations.get(dialog);previous?.cancel();
  const animation=dialog.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(12px) scale(.98)'}],{duration:200,easing:'cubic-bezier(.2,.75,.2,1)'});
  closingAnimations.set(dialog,animation);
  try{await animation.finished;if(closingAnimations.get(dialog)===animation){closingAnimations.delete(dialog);dialog.close();}}catch{}
}
$$('[data-apply]').forEach(b=>b.addEventListener('click',()=>openDialog($('#application-dialog'),b)));
$('#privacy-button').addEventListener('click',function(){openDialog($('#privacy-dialog'),this);});
$$('dialog').forEach(dialog=>{
  dialog.querySelector('.close-dialog').addEventListener('click',()=>closeDialog(dialog));
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});
  dialog.addEventListener('close',()=>{
    if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open');
    const suppress=dialog.dataset.suppressReturn==='true';delete dialog.dataset.suppressReturn;
    const trigger=dialogTriggers.get(dialog);
    if(!suppress&&!document.querySelector('dialog[open]')&&trigger?.isConnected&&!trigger.closest('[data-page]')?.hidden)trigger.focus({preventScroll:true});
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(dialog);}});
});

const template=$('#application-form-template');
['inline','dialog'].forEach(prefix=>{
  const fragment=template.content.cloneNode(true),form=fragment.querySelector('form');
  form.dataset.prefix=prefix;
  form.querySelectorAll('input:not([name="website"]),select,textarea').forEach(field=>{field.id=`${prefix}-${field.name}`;const error=field.parentElement.querySelector('.field-error');error.id=`${field.id}-error`;field.setAttribute('aria-describedby',error.id);field.addEventListener('input',()=>{field.removeAttribute('aria-invalid');error.textContent='';form.requestId=null;});});
  const challenge=document.createElement('div');challenge.className='challenge';form.insertBefore(challenge,form.querySelector('.form-submit'));
  $(`#${prefix}-form-slot`).append(fragment);
});
$('#year').textContent=String(new Date().getFullYear());

function validate(form){let valid=true,first=null;form.querySelectorAll('[required]').forEach(field=>{let message='';const val=field.value.trim();if(!val)message='Please complete this field.';else if(field.name==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))message='Enter a valid email address.';else if(field.name==='creatorUrl'){try{const url=new URL(val);if(url.protocol!=='https:'||!['instagram.com','www.instagram.com','youtube.com','www.youtube.com','youtu.be'].includes(url.hostname)||url.username||url.password||url.port||url.pathname==='/')throw new Error();}catch{message='Enter a full HTTPS Instagram or YouTube link.';}}else if(field.name==='audienceNeed'&&val.length<15)message='Add a little more detail (at least 15 characters).';field.parentElement.querySelector('.field-error').textContent=message;if(message){field.setAttribute('aria-invalid','true');valid=false;first??=field;}else field.removeAttribute('aria-invalid');});first?.focus();return valid;}

let publicConfig={enabled:false,turnstileSiteKey:null};
let challengePromise=null;
function loadChallenge(){if(challengePromise)return challengePromise;challengePromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.onload=resolve;s.onerror=reject;document.head.append(s);});return challengePromise;}
async function attachChallenge(form){if(!publicConfig.enabled||!publicConfig.turnstileSiteKey||form.dataset.challengeMounted)return;form.dataset.challengeMounted='pending';try{await loadChallenge();form.challengeId=window.turnstile.render(form.querySelector('.challenge'),{sitekey:publicConfig.turnstileSiteKey,action:'creator-application',theme:'light',callback:token=>{form.challengeToken=token;},'expired-callback':()=>{form.challengeToken='';}});form.dataset.challengeMounted='true';}catch{form.dataset.challengeMounted='';const status=form.querySelector('.form-status');status.textContent='Verification could not load. Check your connection and reload the page.';status.classList.add('error');}}
async function getConfig(){if(location.protocol==='file:'||document.documentElement.dataset.standalone==='true')return;try{const r=await fetch('/api/config',{headers:{Accept:'application/json'}});if(!r.ok)return;const data=await r.json();publicConfig={enabled:data.enabled===true,turnstileSiteKey:typeof data.turnstileSiteKey==='string'?data.turnstileSiteKey:null};if(publicConfig.enabled){if(typeof data.privacyNotice==='string'&&data.privacyNotice.trim()){$('#privacy-dialog').querySelectorAll('p').forEach(p=>p.remove());const p=document.createElement('p');p.textContent=data.privacyNotice;$('#privacy-dialog').append(p);}const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){attachChallenge(e.target);obs.unobserve(e.target);}}));$$('.application-form').forEach(f=>obs.observe(f));$('#application-dialog').addEventListener('toggle',()=>{if($('#application-dialog').open)attachChallenge($('#dialog-form-slot form'));});$$('[data-apply]').forEach(b=>b.addEventListener('click',()=>attachChallenge($('#dialog-form-slot form'))));}}catch{/* Unconfigured previews remain fully browsable. */}}
getConfig();
$$('.application-form').forEach(form=>form.addEventListener('submit',async e=>{
  e.preventDefault();const status=form.querySelector('.form-status'),button=form.querySelector('.form-submit');status.className='form-status';status.textContent='';
  if(!validate(form))return;
  if(!publicConfig.enabled){status.classList.add('error');status.textContent='Applications are not connected in this preview. Nothing has been sent.';return;}
  if(!form.challengeToken){status.classList.add('error');status.textContent='Please complete the verification before sending.';await attachChallenge(form);return;}
  const payload=Object.fromEntries(new FormData(form));delete payload['cf-turnstile-response'];payload.turnstileToken=form.challengeToken;form.requestId ||= crypto.randomUUID();payload.requestId=form.requestId;
  button.disabled=true;button.textContent='Sending…';form.setAttribute('aria-busy','true');
  try{const r=await fetch('/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(typeof data.message==='string'?data.message:'Your application could not be sent. Please try again.');status.classList.add('success');status.textContent='Application received. Thank you for sharing your world with us.';form.reset();form.requestId=null;}catch(err){status.classList.add('error');status.textContent=err.name==='TimeoutError'?'The request timed out. Your application may have arrived; please wait before trying again.':err.message||'Your application could not be sent. Please try again.';}finally{button.disabled=false;button.replaceChildren(document.createTextNode('Send application '));const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');button.append(arrow);form.removeAttribute('aria-busy');form.challengeToken='';if(form.challengeId!==undefined)window.turnstile?.reset(form.challengeId);}
}));
const experience=setupExperience({scene,openDialog,closeMenu,onHeroProgress});
window.addEventListener('pagehide',e=>{if(!e.persisted){experience.dispose();scene?.dispose();}});
