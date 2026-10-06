/* Strong, one-shot scroll entrances. Text remains semantic and available to AT. */
export function createPopReveals({reducedMotion}) {
  const records=new Map(),liveAnimations=new Set();
  const ease='cubic-bezier(.2,.75,.2,1)';
  const phone=matchMedia('(max-width:760px)');
  let observer=null,disposed=false,suspended=false;

  function readableText(node){
    if(node.nodeType===3)return node.textContent;
    if(node.nodeName==='BR')return ' ';
    return [...node.childNodes].map(readableText).join('');
  }
  function splitHeading(node){
    if(node.querySelector('.pop-word'))return [...node.querySelectorAll('.pop-word')];
    const text=readableText(node).replace(/\s+/g,' ').trim();
    node.setAttribute('aria-label',text);
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),textNodes=[];
    while(walker.nextNode())if(walker.currentNode.textContent.trim())textNodes.push(walker.currentNode);
    for(const textNode of textNodes){
      const fragment=document.createDocumentFragment();
      for(const chunk of textNode.textContent.split(/(\s+)/)){
        if(!chunk)continue;
        if(/^\s+$/.test(chunk)){fragment.append(document.createTextNode(chunk));continue;}
        const span=document.createElement('span');span.className='pop-word';span.textContent=chunk;span.setAttribute('aria-hidden','true');fragment.append(span);
      }
      textNode.replaceWith(fragment);
    }
    node.classList.add('pop-headline');
    return [...node.querySelectorAll('.pop-word')];
  }
  function register(node,kind,index=0){
    if(records.has(node))return;
    if(kind==='headline')splitHeading(node);
    node.dataset.popKind=kind;
    records.set(node,{node,kind,index,seen:false,animations:new Set()});
  }
  document.querySelectorAll('[data-page] h1,[data-page] h2').forEach((node,i)=>{
    if(node.id!=='story-title')register(node,'headline',i);
  });
  document.querySelectorAll('.hero-intro,.hero-description,.hero-actions,.offer-line,.manifesto-grid>.large-copy,.section-heading>p,.section-heading>div>p,.demand-copy>p,.faq-heading>p,.application-heading>p,.route-hero .eyebrow,.route-hero p,.route-hero .text-link,.lab-manifesto>div,.studio-statement>p,.route-end>.section-label,.route-end>.button,.route-end>.text-link,.final-cta-copy>.section-label,.final-cta-copy>.button,.final-cta-copy>p').forEach((node,i)=>register(node,'copy',i));
  document.querySelectorAll('.service-item,.question-options>button,.partnership-point,.fit-grid>div,.faq-list>details,.chapter-card,.page-link-card').forEach((node,i)=>register(node,'slide',i));
  document.querySelectorAll('.process-explorer,.product-art,.product-detail,.role-panel,.lab-card,.principle-card,.application-form').forEach((node,i)=>register(node,'panel',i));
  document.querySelectorAll('.zero-art,.arrow-sculpture,.orbit-composition,.lab-stack,.studio-sculpture,.story-world').forEach((node,i)=>register(node,'sculpture',i));

  function track(record,node,frames,options){
    const animation=node.animate(frames,{duration:720,easing:ease,fill:'backwards',...options});
    record.animations.add(animation);liveAnimations.add(animation);
    const release=()=>{record.animations.delete(animation);liveAnimations.delete(animation);if(!record.animations.size)record.node.classList.remove('pop-is-running');};
    animation.finished.then(release,release);return animation;
  }
  function finish(record){
    record.node.classList.remove('pop-pending','pop-is-running');
    [...record.animations].forEach(a=>a.cancel());
    record.animations.clear();record.seen=true;
  }
  function play(record,delay=0){
    if(disposed)return;
    if(reducedMotion()||!record.node.animate){finish(record);return;}
    [...record.animations].forEach(a=>a.cancel());record.animations.clear();
    record.seen=true;record.node.classList.remove('pop-pending');record.node.classList.add('pop-is-running');
    const {node,kind,index}=record;
    if(kind==='headline'){
      const words=splitHeading(node);
      words.forEach((word,i)=>track(record,word,[
        {opacity:0,transform:`perspective(850px) translate3d(0,${phone.matches?'.72em':'.95em'},0) rotateX(-48deg) scale(1.16)`,offset:0},
        {opacity:1,transform:'perspective(850px) translate3d(0,-.055em,0) rotateX(4deg) scale(1.035)',offset:.68},
        {opacity:1,transform:'perspective(850px) translate3d(0,0,0) rotateX(0) scale(1)',offset:1}
      ],{duration:780,delay:delay+Math.min(i*48,480)}));
      return;
    }
    const base=getComputedStyle(node).transform;
    const end=base==='none'?'':base;
    const distance=phone.matches?48:82;
    let start,overshoot;
    if(kind==='copy'){
      start=`translate3d(0,${phone.matches?32:48}px,0) scale(1.035) ${end}`;
      overshoot=`translate3d(0,-3px,0) scale(1.006) ${end}`;
    }else if(kind==='slide'){
      const direction=index%2===0?-1:1;
      start=`translate3d(${direction*distance}px,32px,0) rotate(${direction*1.4}deg) scale(.94) ${end}`;
      overshoot=`translate3d(${-direction*4}px,-3px,0) rotate(0deg) scale(1.012) ${end}`;
    }else if(kind==='sculpture'){
      start=`perspective(1100px) translate3d(0,${distance}px,0) rotateX(18deg) rotateY(-13deg) scale(.9) ${end}`;
      overshoot=`perspective(1100px) translate3d(0,-9px,0) rotateX(-2deg) rotateY(2deg) scale(1.045) ${end}`;
    }else{
      start=`perspective(1100px) translate3d(0,${distance}px,0) rotateX(13deg) scale(.91) ${end}`;
      overshoot=`perspective(1100px) translate3d(0,-5px,0) rotateX(-1deg) scale(1.025) ${end}`;
    }
    track(record,node,[{opacity:0,transform:start,offset:0},{opacity:1,transform:overshoot,offset:.7},{opacity:1,transform:end||'none',offset:1}],{duration:kind==='sculpture'?920:kind==='copy'?650:780,delay});
  }
  function connectObserver(){
    observer?.disconnect();
    observer=new IntersectionObserver(entries=>{
      if(suspended)return;
      // Capture stable geometry first; movement never alters document flow.
      const entering=entries.filter(e=>e.isIntersecting&&records.has(e.target)&&!records.get(e.target).seen&& !e.target.closest('[data-page]')?.hidden);
      entering.sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      entering.forEach((entry,i)=>{const record=records.get(entry.target);play(record,Math.min(i*55,220));observer.unobserve(entry.target);});
    },{threshold:.08,rootMargin:`0px 0px -${Math.min(120,Math.round(innerHeight*.13))}px 0px`});
    records.forEach(record=>{if(!record.seen)observer.observe(record.node);});
  }
  function enterPage(root){
    suspended=false;
    const selected=[...records.values()].filter(record=>root.contains(record.node));
    // Arm only elements below the fold. Above-the-fold content never waits on an observer.
    const measured=selected.map(record=>({record,rect:record.node.getBoundingClientRect()}));
    measured.forEach(({record,rect})=>{
      finish(record);record.seen=false;
      const visible=rect.bottom>88&&rect.top<innerHeight*.84;
      if(reducedMotion()){finish(record);return;}
      if(visible)play(record,record.kind==='headline'?20:110);
      else{record.node.classList.toggle('pop-pending',rect.top>=innerHeight*.84);observer.observe(record.node);}
    });
  }
  function suspend(){
    suspended=true;
    // Navigation snapshots capture complete content, never half-hidden text.
    records.forEach(finish);
  }
  function settle(){records.forEach(finish);}
  function resume(){const root=document.querySelector('[data-page]:not([hidden])');if(root)enterPage(root);}
  function replayHeading(node){
    if(!node)return;
    if(!records.has(node))register(node,'headline');
    play(records.get(node));
  }
  function focus(e){
    // Keyboard users can always reach controls before an entrance has completed.
    let target=e.target;while(target&&target!==document.body){if(records.has(target))finish(records.get(target));target=target.parentElement;}
  }
  function resize(){connectObserver();}
  document.addEventListener('focusin',focus);window.addEventListener('resize',resize,{passive:true});
  connectObserver();
  return {enterPage,suspend,settle,resume,replayHeading,dispose(){disposed=true;observer.disconnect();settle();liveAnimations.forEach(a=>a.cancel());document.removeEventListener('focusin',focus);window.removeEventListener('resize',resize);}};
}
