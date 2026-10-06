import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../public/scene.js',import.meta.url),'utf8'),context=vm.createContext({});
vm.runInContext(source.replace('export function createScene','function createScene')+';globalThis.math={I,mul,transform,normalMatrix,perspective,lookAt,chamferBox,cylinder};',context);
const {math}=context;
const close=(a,b)=>{assert.equal(a.length,b.length);a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-6,`coordinate ${i}: ${v} != ${b[i]}`));};
test('identity and translated transforms preserve all three axes',()=>{
  close(math.transform(),math.I());close(math.transform([2,3,4],[0,0,0],[2,3,4]),[2,0,0,0,0,3,0,0,0,0,4,0,2,3,4,1]);
});
test('rotation preserves unit lengths, orthogonality and normals',()=>{
  const m=math.transform([0,0,0],[.3,.5,.8]);for(let a=0;a<3;a++){const column=m.slice(a*4,a*4+3);assert.ok(Math.abs(Math.hypot(...column)-1)<1e-6);for(let b=a+1;b<3;b++)assert.ok(Math.abs(column.reduce((n,v,i)=>n+v*m[b*4+i],0))<1e-6);}close(math.normalMatrix(m),[...m.slice(0,3),...m.slice(4,7),...m.slice(8,11)]);
});
test('camera projections stay finite for desktop and mobile ratios',()=>{
  for(const ratio of [320/460,1440/900])assert.ok(math.mul(math.perspective(.58,ratio),math.lookAt([7.8,4.3,12.3],[0,.6,0])).every(Number.isFinite));
});
test('meshes contain complete triangles, UVs and normalized normals',()=>{
  for(const make of [math.chamferBox,math.cylinder]){const shape=make();assert.equal(shape.verts.length%9,0);assert.equal(shape.normals.length,shape.verts.length);assert.equal(shape.uvs.length,shape.verts.length/3*2);assert.ok([...shape.verts,...shape.normals,...shape.uvs].every(Number.isFinite));for(let i=0;i<shape.normals.length;i+=3)assert.ok(Math.abs(Math.hypot(...shape.normals.slice(i,i+3))-1)<1e-6);}
});
