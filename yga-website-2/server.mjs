import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import apply from './api/apply.js';
import config from './api/config.js';
import {renderPage} from './lib/render-page.js';
const root=fileURLToPath(new URL('./public/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png'};
const csp="default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
export function createServer(){return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Content-Security-Policy',csp);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/config'){config(req,res);return;}
  if(url.pathname==='/api/apply'){
    if(req.method!=='POST'){await apply(req,res);return;}
    let size=0;const chunks=[];
    try{for await(const chunk of req){size+=chunk.length;if(size>12288){res.statusCode=413;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:'This application is too large.'}));return;}chunks.push(chunk);}req.body=Buffer.concat(chunks).toString('utf8');await apply(req,res);}catch{if(!res.headersSent){res.statusCode=400;res.end('Invalid request');}}
    return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');res.end();return;}
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.statusCode=400;res.end('Invalid path');return;}
  const route=pathname.match(/^\/(approach|products|studio)\/?$/);
  if(route){try{const content=renderPage(await readFile(resolve(root,'index.html'),'utf8'),route[1]);res.setHeader('Content-Type',types['.html']);res.setHeader('Cache-Control','no-cache');res.end(req.method==='HEAD'?undefined:content);}catch{res.statusCode=500;res.end('Page unavailable');}return;}
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(root)||pathname.split('/').some(p=>p.startsWith('.'))||!types[extname(path)]){res.statusCode=404;res.end('Not found');return;}
  try{const content=await readFile(path);res.setHeader('Content-Type',types[extname(path)]);res.setHeader('Cache-Control','no-cache');res.end(req.method==='HEAD'?undefined:content);}catch{res.statusCode=404;res.end('Not found');}
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||3000;createServer().listen(port,'127.0.0.1',()=>console.log(`YGA preview: http://127.0.0.1:${port}`));}
