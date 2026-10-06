import { publicConfiguration } from '../lib/application.js';
export default function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');res.end(JSON.stringify({message:'Method not allowed.'}));return;}
  res.statusCode=200;res.end(JSON.stringify(publicConfiguration()));
}
