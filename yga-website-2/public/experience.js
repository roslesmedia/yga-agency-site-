import {createRouter} from './router.js';
import {createPopReveals} from './pop-reveals.js';
import {productConcepts,quizQuestions,getFitResult,storyState} from './experience-data.js';

export function setupExperience({scene,openDialog,closeMenu,onHeroProgress}) {
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:760px)'),finePointer=matchMedia('(hover:hover) and (pointer:fine)');
  const easing='cubic-bezier(.2,.75,.2,1)';
  let paused=false,disposed=false,scrollFrame=0,manualStory=0,chapter=-1,promptDismissed=false,router;
  const reduced=()=>preference.matches||paused;
  const listeners=[];
  const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
  const animate=(node,frames,options={})=>{if(reduced()||!node?.animate)return;node.getAnimations().forEach(a=>a.cancel());return node.animate(frames,{duration:300,easing,...options});};
  const enter=(node,delay=0)=>animate(node,[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,delay,fill:'backwards'});

  const popReveals=createPopReveals({reducedMotion:reduced});
  const stripes=qa('.kinetic-strip');
  const story=q('.scroll-story'),device=q('.story-device'),feed=q('.device-feed'),product=q('.device-product'),launch=q('.device-launch'),halo=q('.story-halo'),chipA=q('.chip-a'),chipB=q('.chip-b');
  const storyCopy=[['A question.','An opportunity.','It starts with a question your audience keeps asking—and a niche you know well.'],['Your knowledge.','Our creation.','We research, write, structure and design the whole product around your content and brand.'],['Fully custom.','Ready to share.','A complete product, built behind the scenes. You stay the face of your brand.']];
  function drawStory(progress){
    const state=storyState(progress),n=state.chapter;
    if(n!==chapter){chapter=n;const heading=q('#story-title');heading.replaceChildren(document.createTextNode(storyCopy[n][0]),document.createElement('br'));const accent=document.createElement('span');accent.textContent=storyCopy[n][1];heading.append(accent);q('#story-copy').textContent=storyCopy[n][2];popReveals.replayHeading(heading);q('.story-count').textContent=`0${n+1} / 03`;qa('[data-story]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.story)===n)));}
    q('.story-track>span').style.transform=`scaleX(${state.progress})`;
    if(reduced()){
      feed.style.transform='none';feed.style.opacity=n===0?'1':'0';product.style.opacity=n===1?'1':'0';launch.style.opacity=n===2?'1':'0';product.style.transform=launch.style.transform='none';device.style.transform='rotateY(-10deg)';halo.style.transform='translate(-50%,-50%) rotateY(55deg)';chipA.style.transform='rotate(6deg)';chipB.style.transform='rotate(-5deg)';return;
    }
    const p=state.progress;
    device.style.transform=`translateY(${Math.sin(p*Math.PI)*-18}px) rotateY(${-14+p*23}deg) rotateX(${7-p*11}deg) rotate(${-4+p*7}deg) scale(${1+Math.sin(p*Math.PI)*.08})`;
    feed.style.transform=`translateY(${-Math.min(p/.35,1)*150}px)`;feed.style.opacity=String(1-state.product);
    product.style.opacity=String(state.product*(1-state.launch));product.style.transform=`translateY(${(1-state.product)*90-state.launch*35}px) scale(${.92+state.product*.08})`;
    launch.style.opacity=String(state.launch);launch.style.transform=`translateY(${(1-state.launch)*75}px)`;
    halo.style.transform=`translate(-50%,-50%) rotateY(${55-p*105}deg) rotateZ(${p*80}deg)`;
    chipA.style.transform=`translate(${-p*20}px,${Math.sin(p*Math.PI)*-22}px) rotate(${6-p*12}deg)`;chipB.style.transform=`translate(${p*18}px,${Math.sin(p*Math.PI)*18}px) rotate(${-5+p*9}deg)`;
  }
  const chapterCards=qa('.chapter-card');
  function updateScroll(){
    scrollFrame=0;if(disposed||document.hidden)return;
    // Read geometry together, then update only transform/opacity in the effect layers.
    const active=router?.current.page||document.body.dataset.route||'home';
    const storyRect=active==='home'?story.getBoundingClientRect():null;
    const heroRect=active==='home'?q('.hero').getBoundingClientRect():null;
    const heroSceneRect=active==='home'&&compact.matches?q('#world').getBoundingClientRect():null;
    const stripeRects=stripes.map(node=>node.closest('[data-page]').hidden?null:node.getBoundingClientRect());
    const chapterRects=active==='approach'?chapterCards.map(node=>node.getBoundingClientRect()):[];
    const total=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=Math.max(0,Math.min(1,scrollY/total));
    q('.reading-progress>span').style.transform=`scaleX(${progress})`;
    q('.quick-fit-prompt').hidden=promptDismissed||scrollY<innerHeight*1.1||progress>.9||Boolean(q('dialog[open]'));
    if(heroRect&&heroRect.bottom>0&&heroRect.top<innerHeight&&!reduced()){const p=compact.matches?Math.max(0,Math.min(1,(innerHeight*.83-heroSceneRect.top)/(heroSceneRect.height+innerHeight*.3))):Math.max(0,Math.min(1,(88-heroRect.top)/Math.max(180,heroRect.height-innerHeight+88)));onHeroProgress(p);}
    if(storyRect&&storyRect.bottom>0&&storyRect.top<innerHeight){const p=reduced()?manualStory:Math.max(0,Math.min(1,((compact.matches?80:88)-storyRect.top)/Math.max(1,storyRect.height-(innerHeight-(compact.matches?80:88)))));drawStory(p);}

    stripes.forEach((stripe,i)=>{const rect=stripeRects[i];if(!rect||rect.bottom<0||rect.top>innerHeight)return;stripe.firstElementChild.style.transform=reduced()?'translateX(-3%)':`translateX(${-3-(1-rect.top/innerHeight)*7}%)`;});
    if(chapterRects.length){let selected=0;chapterRects.forEach((rect,i)=>{if(rect.top<innerHeight*.55)selected=i;});qa('.chapter-index nav a').forEach((a,i)=>{a.classList.toggle('is-active',i===selected);if(i===selected)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});}
  }
  function schedule(){if(!disposed&&!scrollFrame&&!document.hidden)scrollFrame=requestAnimationFrame(updateScroll);}
  listen(window,'scroll',schedule,{passive:true});listen(window,'resize',schedule,{passive:true});listen(document,'visibilitychange',schedule);
  const sizeObserver=new ResizeObserver(schedule);sizeObserver.observe(q('#main'));
  qa('[data-story]').forEach(button=>listen(button,'click',()=>{
    const p=[0,.53,1][Number(button.dataset.story)];manualStory=p;
    if(reduced()){drawStory(p);return;}
    const rect=story.getBoundingClientRect(),offset=compact.matches?80:88;window.scrollTo({top:scrollY+rect.top-offset+p*(rect.height-innerHeight+offset),behavior:'smooth'});
  }));
  listen(q('#dismiss-fit'),'click',()=>{promptDismissed=true;q('.quick-fit-prompt').hidden=true;});

  // A short measured accordion expansion, with reversal from its current height.
  qa('.faq details').forEach(details=>{
    const summary=details.querySelector('summary');let animation=null,targetOpen=details.open;
    listen(summary,'click',e=>{
      if(reduced()||!details.animate){targetOpen=!details.open;return;}
      e.preventDefault();const start=details.getBoundingClientRect().height;targetOpen=!targetOpen;
      animation?.cancel();details.style.height='';details.open=true;
      const end=targetOpen?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+1;
      details.style.overflow='hidden';
      const next=details.animate([{height:`${start}px`},{height:`${end}px`}],{duration:220,easing});animation=next;
      next.finished.then(()=>{if(animation===next){details.open=targetOpen;details.style.overflow='';animation=null;}}).catch(()=>{});
    });
    listeners.push(()=>animation?.cancel());
  });

  // An explicit motion control affects the whole experience, including WebGL.
  function syncMotion(resumeEntrances=true){
    const isReduced=reduced();document.body.classList.toggle('motion-paused',isReduced);scene?.setPaused(isReduced);
    const control=q('#global-motion');control.disabled=preference.matches;control.setAttribute('aria-pressed',String(isReduced));control.setAttribute('aria-label',preference.matches?'Reduced motion follows your device settings':isReduced?'Resume decorative motion':'Pause decorative motion');control.firstChild.textContent=isReduced?'▷ ':'Ⅱ ';control.querySelector('span').textContent=preference.matches?'Reduced motion':isReduced?'Motion paused':'Motion on';
    const heroControl=q('#motion-toggle');heroControl.setAttribute('aria-pressed',String(isReduced));heroControl.setAttribute('aria-label',isReduced?'Resume scene motion':'Pause scene motion');heroControl.textContent=isReduced?'▷':'Ⅱ';heroControl.disabled=preference.matches;
    if(isReduced){popReveals.settle();qa('[data-tilt]').forEach(n=>n.style.transform='');qa('.line-mask>span,[data-reveal],.lab-card,.page-link-card').forEach(n=>n.getAnimations().forEach(a=>a.cancel()));}
    if(!isReduced&&resumeEntrances)popReveals.resume();
    schedule();
  }
  listen(q('#global-motion'),'click',()=>{paused=!paused;syncMotion();});
  listen(q('#motion-toggle'),'click',()=>{paused=q('#motion-toggle').getAttribute('aria-pressed')==='true';syncMotion();});
  listen(preference,'change',syncMotion);listen(compact,'change',schedule);

  // Fine-pointer parallax is scoped to decorative objects and never captures touch scroll.
  qa('[data-tilt]').forEach(node=>{
    let raf=0,pointer=null,rect=null;
    const reset=()=>{if(raf)cancelAnimationFrame(raf);raf=0;node.style.transform='';};
    listen(node,'pointerenter',()=>{rect=node.getBoundingClientRect();});
    listen(node,'pointermove',e=>{if(reduced()||node.classList.contains('pop-is-running')||!finePointer.matches||e.pointerType!=='mouse')return;pointer={x:e.clientX,y:e.clientY};if(!rect)rect=node.getBoundingClientRect();if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(reduced()||!pointer||!rect)return;const x=Math.max(-.5,Math.min(.5,(pointer.x-rect.left)/rect.width-.5)),y=Math.max(-.5,Math.min(.5,(pointer.y-rect.top)/rect.height-.5));node.style.transform=`perspective(1200px) rotateX(${-y*8}deg) rotateY(${x*10}deg)`;});});
    listen(node,'pointerleave',reset);listen(node,'blur',reset);listeners.push(reset);
  });

  // Product pop-ups show how a complete bespoke product is made, not a catalogue.
  let selectedProduct=0,samplePage=0;
  function drawSample(direction=1){const concept=productConcepts[selectedProduct],page=concept.pages[samplePage];q('#sample-number').textContent=`Behind the scenes / 0${samplePage+1}`;q('#sample-title').textContent=page[0];q('#sample-copy').textContent=page[1];q('#sample-position').textContent=`0${samplePage+1} / 03`;q('#sample-prev').disabled=samplePage===0;q('#sample-next').disabled=samplePage===2;animate(q('.sample-pages'),[{opacity:.3,transform:`translateX(${direction*12}px)`},{opacity:1,transform:'translateX(0)'}],{duration:220});}
  qa('[data-preview]').forEach(button=>listen(button,'click',()=>{
    selectedProduct=Number(button.dataset.preview);samplePage=0;const concept=productConcepts[selectedProduct];q('#product-dialog').dataset.format=String(selectedProduct);q('#preview-format').textContent=concept.format;q('#preview-cover').textContent=concept.cover;q('#preview-title').textContent=concept.title;q('#preview-description').textContent=concept.description;q('#preview-glyph').textContent=concept.glyph;drawSample();openDialog(q('#product-dialog'),button);schedule();
  }));
  listen(q('#sample-prev'),'click',()=>{if(samplePage>0){samplePage--;drawSample(-1);}});listen(q('#sample-next'),'click',()=>{if(samplePage<2){samplePage++;drawSample(1);}});

  const chapterDetails=[
    ['Understand your world.','We begin with your content, brand, niche and ambitions.',['Explore your content and subject expertise','Understand your brand’s voice and visual identity','Discuss your audience, expectations and partnership fit']],
    ['Find the specific need.','Audience evidence gives the product its direction.',['Review recurring questions across your channels','Research the niche and existing offers','Identify the problem your particular audience wants solved']],
    ['Validate before building.','We turn the evidence into a focused custom-product proposal.',['Develop an original product promise and concept','Test interest with an appropriate sample or interest page','Review the evidence together before full production']],
    ['Create the whole product.','YGA handles the complete product behind the scenes.',['Research, write and structure the original content','Create the cover, layouts, visuals and brand-specific design','Build and prepare the finished product, with your review']],
    ['Make the launch feel like you.','We connect the finished product to the people it was created for.',['Build the product page and agreed delivery setup','Write the agreed launch and email content','Coordinate the release around your creator voice']],
    ['Keep improving the product.','Feedback guides what happens next.',['Review customer questions and actual responses','Improve the content, product experience or offer','Agree on the next useful iteration together']]
  ];
  qa('[data-chapter]').forEach(button=>listen(button,'click',()=>{const i=Number(button.dataset.chapter),data=chapterDetails[i];q('#chapter-dialog-step').textContent=`Inside the process / 0${i+1}`;q('#chapter-dialog-title').textContent=data[0];q('#chapter-dialog-copy').textContent=data[1];q('#chapter-dialog-list').replaceChildren(...data[2].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));openDialog(q('#chapter-dialog'),button);schedule();}));

  let quizStep=0,answers=[null,null,null];
  function renderQuiz(focus=false){
    q('#quiz-content').hidden=false;q('#quiz-result').hidden=true;q('#fit-dialog').setAttribute('aria-labelledby','fit-dialog-title');const item=quizQuestions[quizStep];q('#quiz-count').textContent=`0${quizStep+1} / 03`;q('#fit-dialog-title').textContent=item.title;
    q('#quiz-options').replaceChildren(...item.choices.map((text,i)=>{const label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');input.type='radio';input.name='quiz-choice';input.value=String(i);input.checked=answers[quizStep]===i;span.textContent=text;label.append(input,span);input.addEventListener('change',()=>{answers[quizStep]=i;q('#quiz-next').disabled=false;});return label;}));
    q('#quiz-next').disabled=answers[quizStep]===null;q('#quiz-next').firstChild.textContent=quizStep===2?'Explore my starting point ':'Next ';q('#quiz-back').disabled=quizStep===0;q('.quiz-progress>span').style.transform=`scaleX(${(quizStep+1)/3})`;
    enter(q('#quiz-content'));if(focus){q('#fit-dialog-title').tabIndex=-1;q('#fit-dialog-title').focus({preventScroll:true});}
  }
  qa('[data-fit]').forEach(button=>listen(button,'click',()=>{quizStep=0;answers=[null,null,null];renderQuiz();openDialog(q('#fit-dialog'),button);schedule();}));
  listen(q('#quiz-next'),'click',()=>{if(answers[quizStep]===null)return;if(quizStep<2){quizStep++;renderQuiz(true);return;}const result=getFitResult(answers);if(!result)return;q('#quiz-content').hidden=true;q('#quiz-result').hidden=false;q('#fit-dialog').setAttribute('aria-labelledby','quiz-result-title');q('#quiz-result-title').textContent=result.title;q('#quiz-result-copy').textContent=result.copy;q('#quiz-result-title').tabIndex=-1;q('#quiz-result-title').focus({preventScroll:true});enter(q('#quiz-result'));});
  listen(q('#quiz-back'),'click',()=>{if(quizStep){quizStep--;renderQuiz(true);}});listen(q('#quiz-reset'),'click',()=>{quizStep=0;answers=[null,null,null];renderQuiz(true);});

  function routeEnter(target,initial){
    const view=q(`[data-page="${target.page}"]`);
    popReveals.enterPage(view);
    schedule();
  }
  router=createRouter({reducedMotion:reduced,onBefore:(_target,changingPage)=>{if(changingPage)popReveals.suspend();closeMenu();q('.quick-fit-prompt').hidden=true;qa('dialog[open]').forEach(dialog=>{dialog.dataset.suppressReturn='true';dialog.close();});},onAfter:routeEnter});
  qa('dialog').forEach(dialog=>{listen(dialog,'close',schedule);listen(dialog,'toggle',schedule);});
  syncMotion(false);schedule();
  return {router,dispose(){disposed=true;cancelAnimationFrame(scrollFrame);popReveals.dispose();sizeObserver.disconnect();router.dispose();listeners.forEach(remove=>remove());}};
}
