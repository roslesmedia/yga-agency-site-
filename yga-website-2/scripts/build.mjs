import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {renderPage} from '../lib/render-page.js';
import {exportSource} from './export-source.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const publicDir=resolve(root,'public'),dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await cp(publicDir,dist,{recursive:true});
const read=name=>readFile(resolve(publicDir,name),'utf8');
const [html,css,experienceCss,data,router,popReveals,experience,scene,app,logo,favicon,font]=await Promise.all([read('index.html'),read('styles.css'),read('experience.css'),read('experience-data.js'),read('router.js'),read('pop-reveals.js'),read('experience.js'),read('scene.js'),read('app.js'),read('logo.svg'),read('favicon.svg'),readFile(resolve(publicDir,'fonts/yga-signal.woff'))]);
for(const page of ['home','approach','products','studio']){
  const folder=page==='home'?dist:resolve(dist,page);
  await mkdir(folder,{recursive:true});
  await writeFile(resolve(folder,'index.html'),renderPage(html,page));
}
const svgData=s=>'data:image/svg+xml;base64,'+Buffer.from(s).toString('base64');
const inlineCss=(css+'\n'+experienceCss).replace("url('/fonts/yga-signal.woff')",`url('data:font/woff;base64,${font.toString('base64')}')`);
const inlineScript=[data,router,popReveals,experience,scene,app].map(source=>source.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n').replace(/<\/script/gi,'<\\/script');
const standalone=renderPage(html,'home').replace('<html lang="en">','<html lang="en" data-standalone="true">').replace('<link rel="stylesheet" href="/styles.css">',()=>`<style>${inlineCss}</style>`).replace('<link rel="stylesheet" href="/experience.css">','').replaceAll('src="/logo.svg"',`src="${svgData(logo)}"`).replace('href="/favicon.svg"',`href="${svgData(favicon)}"`).replace('<script type="module" src="/app.js"></script>',()=>`<script type="module">${inlineScript}</script>`);
await writeFile(resolve(root,'yga-preview.html'),standalone);
await exportSource({root,dist,standalone});
console.log('Built 4 static pages, standalone HTML, readable HTML source and editable source ZIP.');
