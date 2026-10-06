import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

const MAX_BYTES=12288;
const audiences=new Set(['under-2000','2000-10000','10000-50000','50000-100000','over-100000']);
const creatorHosts=new Set(['instagram.com','www.instagram.com','youtube.com','www.youtube.com','youtu.be']);
const fields=new Set(['name','email','creatorUrl','niche','audience','audienceNeed','website','turnstileToken','requestId']);
const emailPattern=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const response=(status,message,extra={})=>({status,headers:{...headers,...extra},body:{ok:status<300,message}});

export function configuration(env=process.env){
  const required=['APPLICATION_ORIGIN','APPLICATION_TO','APPLICATION_FROM','APPLICATION_PRIVACY_NOTICE','RESEND_API_KEY','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','RATE_LIMIT_SALT'];
  if(env.APPLICATIONS_ENABLED!=='true'||required.some(k=>!env[k]?.trim()))return null;
  try{
    const origin=new URL(env.APPLICATION_ORIGIN),redis=new URL(env.UPSTASH_REDIS_REST_URL);
    if(origin.origin!==env.APPLICATION_ORIGIN||origin.username||origin.password)return null;
    if(origin.protocol!=='https:'&&!(origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname)))return null;
    if(redis.protocol!=='https:'||!redis.hostname.endsWith('.upstash.io')||redis.username||redis.password||redis.port)return null;
    if(!emailPattern.test(env.APPLICATION_TO)||/[\r\n]/.test(env.APPLICATION_FROM)||env.RATE_LIMIT_SALT.length<32||env.APPLICATION_PRIVACY_NOTICE.length<60)return null;
    return {origin:origin.origin,hostname:origin.hostname,to:env.APPLICATION_TO,from:env.APPLICATION_FROM,privacy:env.APPLICATION_PRIVACY_NOTICE,siteKey:env.TURNSTILE_SITE_KEY,turnstileSecret:env.TURNSTILE_SECRET_KEY,resendKey:env.RESEND_API_KEY,redisUrl:redis.origin,redisToken:env.UPSTASH_REDIS_REST_TOKEN,salt:env.RATE_LIMIT_SALT};
  }catch{return null;}
}

export function publicConfiguration(env=process.env){const config=configuration(env);return config?{enabled:true,turnstileSiteKey:config.siteKey,privacyNotice:config.privacy}:{enabled:false,turnstileSiteKey:null};}

export function parseApplication(body){
  let value=body;
  if(typeof body==='string'){if(Buffer.byteLength(body)>MAX_BYTES)throw new Error('size');try{value=JSON.parse(body);}catch{throw new Error('invalid');}}
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('invalid');
  if(Buffer.byteLength(JSON.stringify(value))>MAX_BYTES)throw new Error('size');
  if(Object.keys(value).some(k=>!fields.has(k)))throw new Error('invalid');
  for(const [key,min,max] of [['name',1,100],['email',3,254],['creatorUrl',10,500],['niche',1,150],['audienceNeed',15,2000],['turnstileToken',1,2048],['requestId',36,36]]){
    if(typeof value[key]!=='string')throw new Error('invalid');
    value={...value,[key]:value[key].trim()};
    if(value[key].length<min||value[key].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value[key]))throw new Error('invalid');
  }
  if(/[\r\n]/.test(value.name+value.email+value.niche+value.creatorUrl)||!emailPattern.test(value.email)||!audiences.has(value.audience)||!uuidPattern.test(value.requestId))throw new Error('invalid');
  if(value.website!==undefined&&typeof value.website!=='string')throw new Error('invalid');
  if(value.website?.trim())throw new Error('spam');
  try{const url=new URL(value.creatorUrl);if(url.protocol!=='https:'||!creatorHosts.has(url.hostname)||url.username||url.password||url.port||url.pathname==='/')throw new Error();url.hash='';value.creatorUrl=url.toString();}catch{throw new Error('invalid');}
  return {name:value.name,email:value.email.toLowerCase(),creatorUrl:value.creatorUrl,niche:value.niche,audience:value.audience,audienceNeed:value.audienceNeed,turnstileToken:value.turnstileToken,requestId:value.requestId};
}

const limiterScript=`local retry=0
for i,key in ipairs(KEYS) do
  local n=redis.call('INCR',key)
  local limit=tonumber(ARGV[(i-1)*2+1])
  local ttl=tonumber(ARGV[(i-1)*2+2])
  if n==1 then redis.call('PEXPIRE',key,ttl) end
  if n>limit then retry=math.max(retry,redis.call('PTTL',key)) end
end
return retry`;

export async function handleApplication(request,{env=process.env,fetchImpl=fetch}={}){
  if(request.method!=='POST')return response(405,'This endpoint accepts POST requests only.',{Allow:'POST'});
  const config=configuration(env);
  if(!config)return response(503,'Applications are not open yet. Please check back later.');
  if(request.headers.origin!==config.origin||request.headers['sec-fetch-site']==='cross-site')return response(403,'This request is not allowed.');
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type']||''))return response(415,'Send a JSON request.');
  if(Number(request.headers['content-length']||0)>MAX_BYTES)return response(413,'This application is too large.');
  let application;try{application=parseApplication(request.body);}catch(err){return response(err.message==='size'?413:400,err.message==='size'?'This application is too large.':'Please check the application fields and try again.');}
  const hash=s=>createHmac('sha256',config.salt).update(s).digest('hex');
  const keys=[`yga:application:email:${hash(application.email)}`,'yga:application:global'];
  const limits=['3','3600000','120','3600000'];
  if(isIP(request.ip||'')){keys.push(`yga:application:ip:${hash(request.ip)}`);limits.push('5','900000');}
  try{
    const rate=await fetchImpl(config.redisUrl,{method:'POST',headers:{Authorization:`Bearer ${config.redisToken}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',limiterScript,String(keys.length),...keys,...limits]),signal:AbortSignal.timeout(5000)});
    if(!rate.ok)throw new Error('rate service');
    const rateBody=await rate.json();if(typeof rateBody.result!=='number'||rateBody.error)throw new Error('rate result');
    if(rateBody.result>0)return response(429,'Too many attempts. Please wait before trying again.',{'Retry-After':String(Math.max(1,Math.ceil(rateBody.result/1000)))});
    const verification=await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:config.turnstileSecret,response:application.turnstileToken}),signal:AbortSignal.timeout(5000)});
    if(!verification.ok)throw new Error('verification service');
    const result=await verification.json();
    if(result.success!==true||result.hostname!==config.hostname||result.action!=='creator-application')return response(400,'Verification expired or failed. Please complete it again.');
    const message=['New YGA creator application','',`Name: ${application.name}`,`Email: ${application.email}`,`Creator link: ${application.creatorUrl}`,`Niche: ${application.niche}`,`Audience size: ${application.audience}`,'','What their audience asks for:',application.audienceNeed,'',`Reference: ${application.requestId}`].join('\n');
    const sent=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.resendKey}`,'Content-Type':'application/json','Idempotency-Key':`yga-application/${application.requestId}`},body:JSON.stringify({from:config.from,to:[config.to],reply_to:application.email,subject:'YGA — new creator partnership application',text:message}),signal:AbortSignal.timeout(10000)});
    if(!sent.ok)throw new Error('delivery service');
    const sentBody=await sent.json();if(typeof sentBody.id!=='string'||!sentBody.id)throw new Error('delivery result');
    return response(200,'Application received.');
  }catch{return response(503,'Your application could not be confirmed. Please wait and try again.');}
}
