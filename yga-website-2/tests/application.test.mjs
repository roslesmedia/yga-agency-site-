import test from 'node:test';
import assert from 'node:assert/strict';
import {configuration,publicConfiguration,parseApplication,handleApplication} from '../lib/application.js';
const env={APPLICATIONS_ENABLED:'true',APPLICATION_ORIGIN:'https://yga.example',APPLICATION_TO:'owner@yga.example',APPLICATION_FROM:'YGA <forms@yga.example>',APPLICATION_PRIVACY_NOTICE:'YGA uses your application to assess partnership fit. Contact the agency to request removal of your data.',RESEND_API_KEY:'test-resend-secret',TURNSTILE_SITE_KEY:'public-site-key',TURNSTILE_SECRET_KEY:'test-turnstile-secret',UPSTASH_REDIS_REST_URL:'https://example.upstash.io',UPSTASH_REDIS_REST_TOKEN:'test-redis-secret',RATE_LIMIT_SALT:'test-secret-salt-at-least-32-characters'};
const body={name:'Sample Creator',email:'CREATOR@example.com',creatorUrl:'https://www.instagram.com/sample_creator/#bio',niche:'Photography',audience:'2000-10000',audienceNeed:'My audience asks how to edit their first photo.',website:'',turnstileToken:'test-token',requestId:'bbd27493-7923-4c23-8a72-86b87a995f22'};
const request=overrides=>({method:'POST',headers:{origin:env.APPLICATION_ORIGIN,'content-type':'application/json','sec-fetch-site':'same-origin'},body:{...body},ip:'203.0.113.6',...overrides});
function mockServices({rate=0,redisStatus=200,verify={success:true,hostname:'yga.example',action:'creator-application'},verifyStatus=200,delivery={id:'test-message'},deliveryStatus=200,throws=false}={}){
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,options});if(throws)throw new Error('service unavailable');let status,data;if(url.endsWith('.upstash.io')){status=redisStatus;data={result:rate};}else if(url.includes('siteverify')){status=verifyStatus;data=verify;}else if(url==='https://api.resend.com/emails'){status=deliveryStatus;data=delivery;}else throw new Error('Unexpected URL');return{ok:status>=200&&status<300,status,json:async()=>data};};
  return{calls,fetchImpl};
}
const run=(req,services=mockServices(),config=env)=>handleApplication(req,{env:config,fetchImpl:services.fetchImpl});
test('disabled or incomplete configuration fails closed',async()=>{
  for(const config of [{},{...env,APPLICATIONS_ENABLED:'false'},...Object.keys(env).filter(k=>k!=='APPLICATIONS_ENABLED').map(k=>({...env,[k]:''}))]){assert.equal(configuration(config),null);assert.equal((await run(request(),mockServices(),config)).status,503);}
});
test('configuration requires exact origin and trusted rate-limit endpoint',()=>{
  for(const change of [{APPLICATION_ORIGIN:'https://yga.example/path'},{APPLICATION_ORIGIN:'http://yga.example'},{UPSTASH_REDIS_REST_URL:'https://upstash.io.attacker.example'},{RATE_LIMIT_SALT:'short'},{APPLICATION_FROM:'x\r\nBcc: other@example.com'}])assert.equal(configuration({...env,...change}),null);
  assert.ok(configuration({...env,APPLICATION_ORIGIN:'http://localhost:3000'}));
});
test('public config contains only public site key and privacy notice',()=>{
  assert.deepEqual(publicConfiguration(env),{enabled:true,turnstileSiteKey:env.TURNSTILE_SITE_KEY,privacyNotice:env.APPLICATION_PRIVACY_NOTICE});
  for(const secret of [env.RESEND_API_KEY,env.TURNSTILE_SECRET_KEY,env.UPSTASH_REDIS_REST_TOKEN,env.RATE_LIMIT_SALT])assert.ok(!JSON.stringify(publicConfiguration(env)).includes(secret));
});
test('method, origin and content type rejected before providers are called',async()=>{
  const s=mockServices();assert.equal((await run(request({method:'GET'}),s)).status,405);
  assert.equal((await run(request({headers:{origin:'https://other.example','content-type':'application/json'}}),s)).status,403);
  assert.equal((await run(request({headers:{origin:env.APPLICATION_ORIGIN,'content-type':'application/json','sec-fetch-site':'cross-site'}}),s)).status,403);
  assert.equal((await run(request({headers:{origin:env.APPLICATION_ORIGIN,'content-type':'text/plain'}}),s)).status,415);assert.equal(s.calls.length,0);
});
test('normalization is non-mutating and strips URL fragments',()=>{
  const input={...body,name:' Sample Creator '},parsed=parseApplication(input);assert.equal(parsed.name,'Sample Creator');assert.equal(parsed.email,'creator@example.com');assert.equal(parsed.creatorUrl,'https://www.instagram.com/sample_creator/');assert.equal(input.name,' Sample Creator ');
});
test('invalid fields, honeypot, types and unknown fields rejected',async()=>{
  for(const payload of [null,[],{},'{broken',{...body,name:123},{...body,name:'Creator\nInjected'},{...body,email:'not-an-email'},{...body,audience:'millions'},{...body,audienceNeed:'short'},{...body,website:'https://spam.example'},{...body,requestId:'invalid'},{...body,admin:true},{...body,turnstileToken:''}]){const s=mockServices();assert.equal((await run(request({body:payload}),s)).status,400);assert.equal(s.calls.length,0);}
});
test('creator URLs require real platform HTTPS hosts and a profile path',async()=>{
  for(const creatorUrl of ['http://instagram.com/creator','https://instagram.com/','https://instagram.com.evil.example/creator','https://instagram.com@evil.example/creator','https://user:pass@instagram.com/creator','https://localhost/creator','https://youtube.com:8080/creator'])assert.equal((await run(request({body:{...body,creatorUrl}}))).status,400);
  for(const creatorUrl of ['https://instagram.com/creator','https://www.youtube.com/@creator','https://youtu.be/example'])assert.ok(parseApplication({...body,creatorUrl}));
});
test('body limit uses actual bytes as well as content-length',async()=>{
  assert.equal((await run(request({body:'x'.repeat(13000)}))).status,413);assert.equal((await run(request({headers:{...request().headers,'content-length':'13000'}}))).status,413);
});
test('rate limit returns retry delay and prevents delivery',async()=>{
  const s=mockServices({rate:12501}),result=await run(request(),s);assert.equal(result.status,429);assert.equal(result.headers['Retry-After'],'13');assert.equal(s.calls.length,1);
});
test('Redis receives HMAC identifiers, no raw email or IP',async()=>{
  const s=mockServices();await run(request(),s);const payload=s.calls[0].options.body;assert.ok(!payload.includes('creator@example.com'));assert.ok(!payload.includes('203.0.113.6'));assert.match(payload,/yga:application:email:[a-f0-9]{64}/);assert.match(payload,/yga:application:ip:[a-f0-9]{64}/);
});
test('rate and verification service failures fail closed',async()=>{
  for(const options of [{throws:true},{redisStatus:503},{rate:'bad'},{verifyStatus:503}]){const s=mockServices(options);assert.equal((await run(request(),s)).status,503);assert.ok(s.calls.every(c=>c.url!=='https://api.resend.com/emails'));}
});
test('failed, wrong-host and wrong-action challenges never reach email',async()=>{
  for(const verify of [{success:false},{success:true,hostname:'other.example',action:'creator-application'},{success:true,hostname:'yga.example',action:'different-action'}]){const s=mockServices({verify});assert.equal((await run(request(),s)).status,400);assert.equal(s.calls.length,2);}
});
test('provider refusal or missing receipt cannot produce success',async()=>{
  for(const options of [{deliveryStatus:500},{delivery:{}},{delivery:{id:''}}])assert.equal((await run(request(),mockServices(options))).status,503);
});
test('valid submission has configured recipient, plain text and idempotency key',async()=>{
  const s=mockServices(),result=await run(request(),s);assert.equal(result.status,200);assert.equal(result.body.ok,true);assert.equal(s.calls.length,3);const sent=s.calls[2],payload=JSON.parse(sent.options.body);assert.deepEqual(payload.to,[env.APPLICATION_TO]);assert.equal(payload.reply_to,'creator@example.com');assert.ok(payload.text.includes(body.audienceNeed));assert.equal(payload.html,undefined);assert.equal(sent.options.headers['Idempotency-Key'],`yga-application/${body.requestId}`);assert.equal(result.headers['Cache-Control'],'no-store');
});
