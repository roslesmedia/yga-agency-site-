import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseRoute,routeHref,routeInfo,storyState,getFitResult,productConcepts} from '../public/experience-data.js';
import {renderPage} from '../lib/render-page.js';

test('live and downloadable-preview routes address the same page and section',()=>{
  for(const page of Object.keys(routeInfo))for(const section of ['', 'partnership']){
    const online=new URL(routeHref(page,section),'https://yga.example');
    assert.deepEqual(parseRoute(online.pathname,online.hash),{page,section});
    assert.deepEqual(parseRoute('/Downloads/yga-preview.html',routeHref(page,section,true)),{page,section});
  }
});
test('direct nested pages and plain home anchors resolve without a prior navigation',()=>{
  assert.deepEqual(parseRoute('/approach/',''),{page:'approach',section:''});
  assert.deepEqual(parseRoute('/products/index.html',''),{page:'products',section:''});
  assert.deepEqual(parseRoute('/','#faq'),{page:'home',section:'faq'});
  assert.deepEqual(parseRoute('/unknown',''),{page:'home',section:''});
});
test('route construction rejects unrecognized destinations and unsafe sections',()=>{
  assert.equal(routeHref('javascript:alert(1)','<script>',false),'/');
  assert.equal(routeHref('studio','bad/section',true),'#/studio');
});
test('each generated document has exactly its own page visible before JavaScript',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  for(const page of Object.keys(routeInfo)){
    const rendered=renderPage(html,page),views=[...rendered.matchAll(/<div data-page="(\w+)" id="page-\w+"( hidden)?>/g)];
    assert.equal(views.length,4);assert.deepEqual(views.filter(v=>!v[2]).map(v=>v[1]),[page]);
    assert.ok(rendered.includes(`<title>${routeInfo[page].title}</title>`));
    assert.ok(rendered.includes(routeInfo[page].description));
  }
});
test('scroll story stays bounded and traverses audience, creation and launch in order',()=>{
  const chapters=[];for(let i=-5;i<106;i++){const state=storyState(i/100);assert.ok(state.progress>=0&&state.progress<=1);assert.ok(state.product>=0&&state.product<=1);assert.ok(state.launch>=0&&state.launch<=1);chapters.push(state.chapter);}
  assert.deepEqual([...new Set(chapters)],[0,1,2]);assert.ok(chapters.every((n,i)=>i===0||n>=chapters[i-1]));assert.equal(storyState(NaN).chapter,0);
});
test('quick-fit suggestions need three complete valid answers',()=>{
  for(const answers of [[],[0],[0,1],[0,null,2],[0,1,3],['0',1,2]])assert.equal(getFitResult(answers),null);
  for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){const result=getFitResult([a,b,c]);assert.equal(typeof result.title,'string');assert.equal(typeof result.copy,'string');assert.ok(result.copy.length>60);}
});
test('uncertain audience demand prioritizes research over a product promise',()=>{
  for(let a=0;a<3;a++)assert.match(getFitResult([a,2,0]).title,/research/i);
  assert.match(getFitResult([0,0,2]).title,/research/i);
});
test('product previews explain original custom production and have complete chapters',()=>{
  assert.equal(productConcepts.length,3);
  for(const concept of productConcepts){assert.equal(concept.pages.length,3);assert.match(concept.description,/complete|original/);assert.ok(concept.pages.every(([title,copy])=>title.length>10&&copy.length>40));assert.doesNotMatch(JSON.stringify(concept),/template pack|ready-to-use template/i);}
});
