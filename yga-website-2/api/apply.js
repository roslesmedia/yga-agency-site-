import { handleApplication } from '../lib/application.js';
export default async function handler(req,res){
  const ip=process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for']||'').split(',')[0].trim() : req.socket?.remoteAddress;
  const result=await handleApplication({method:req.method,headers:req.headers,body:req.body,ip});
  Object.entries(result.headers).forEach(([key,value])=>res.setHeader(key,value));
  res.statusCode=result.status;res.end(JSON.stringify(result.body));
}
