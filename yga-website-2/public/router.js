import {routeInfo,parseRoute,routeHref} from './experience-data.js';

export function createRouter({reducedMotion,onBefore=()=>{},onAfter=()=>{}}) {
  const pages=[...document.querySelectorAll('[data-page]')];
  const offline=location.protocol==='file:'||document.documentElement.dataset.standalone==='true';
  const curtain=document.querySelector('.route-curtain');
  let current=parseRoute(location.pathname,location.hash),busy=false,pending=null,transition=null;
  const positions=new Map();
  try{history.scrollRestoration='manual';}catch{}
  function refreshLinks(){
    document.querySelectorAll('a[data-route]').forEach(a=>{a.href=routeHref(a.dataset.route,a.dataset.section||'',offline);if(a.dataset.route===current.page&&!a.dataset.section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  }
  function apply(target,{restore=false,initial=false,samePage=false}={}) {
    pages.forEach(page=>{page.hidden=page.dataset.page!==target.page;});
    current=target;document.body.dataset.route=target.page;
    const info=routeInfo[target.page];document.title=info.title;
    document.querySelector('meta[name="description"]').content=info.description;
    document.querySelector('meta[property="og:title"]').content=info.title;
    document.querySelector('meta[property="og:description"]').content=info.description;
    refreshLinks();
    const visible=document.querySelector(`[data-page="${target.page}"]`);
    const section=target.section?document.getElementById(target.section):null;
    const behavior=samePage&&!reducedMotion()?'smooth':'instant';
    if(section&&visible.contains(section))section.scrollIntoView({behavior,block:'start'});
    else window.scrollTo({top:restore?(positions.get(target.page)||0):0,behavior});
    if(!initial){const heading=samePage&&section?(section.querySelector('h2,h3')||section):visible.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});if(!samePage)document.querySelector('#route-announcement').textContent=`${info.label} page`;}
    if(initial)onAfter(target,true);
  }
  async function navigate(target,options={}) {
    if(!Object.hasOwn(routeInfo,target.page))target={page:'home',section:''};
    if(busy){pending={target,options};transition?.skipTransition();return;}
    if(current.page===target.page){
      onBefore(target,false);
      if(!options.history)history.pushState({},'',routeHref(target.page,target.section,offline));
      apply(target,{restore:options.history,samePage:true});return;
    }
    busy=true;positions.set(current.page,scrollY);onBefore(target,true);
    const update=()=>{if(!options.history)history.pushState({},'',routeHref(target.page,target.section,offline));apply(target,{restore:options.history});};
    try{
      if(reducedMotion()||document.hidden){update();}
      else if(typeof document.startViewTransition==='function'){
        transition=document.startViewTransition(update);
        // Update still runs if a snapshot is skipped or the animation is interrupted.
        await transition.finished.catch(()=>{});
      }else if(curtain.animate){
        curtain.hidden=false;
        await curtain.animate([{transform:'translateY(101%)'},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.77,0,.175,1)',fill:'forwards'}).finished;
        update();
        await curtain.animate([{transform:'translateY(0)'},{transform:'translateY(-101%)'}],{duration:280,easing:'cubic-bezier(.2,.75,.2,1)',fill:'forwards'}).finished;
        curtain.getAnimations().forEach(a=>a.cancel());
      }else update();
    }finally{busy=false;transition=null;curtain.style.transform='';if(pending){const next=pending;pending=null;navigate(next.target,next.options);}else onAfter(target,false);}
  }
  function click(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest('a');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    if(a.dataset.route){e.preventDefault();navigate({page:a.dataset.route,section:a.dataset.section||''});return;}
    const href=a.getAttribute('href');
    if(href?.startsWith('#')&&!href.startsWith('#/')){
      const target=href==='#'?null:document.getElementById(href.slice(1));
      const parent=target?.closest('[data-page]');
      if(parent){e.preventDefault();navigate({page:parent.dataset.page,section:target.id});}
      else if(href==='#'){e.preventDefault();navigate({page:current.page,section:''});}
    }
  }
  function historyChange(){const target=parseRoute(location.pathname,location.hash);if(target.page!==current.page||target.section!==current.section)navigate(target,{history:true});}
  document.addEventListener('click',click);window.addEventListener('popstate',historyChange);window.addEventListener('hashchange',historyChange);
  document.querySelectorAll('.brand').forEach(a=>{a.dataset.route='home';});
  apply(current,{initial:true});
  return {navigate,get current(){return current;},dispose(){document.removeEventListener('click',click);window.removeEventListener('popstate',historyChange);window.removeEventListener('hashchange',historyChange);transition?.skipTransition();}};
}
