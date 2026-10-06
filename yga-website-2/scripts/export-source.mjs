import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// A dependency-free, deterministic ZIP of explicitly selected project files.
// Runtime configuration, Git metadata and hosting credentials are never exported.
const crcTable=Uint32Array.from({length:256},(_,n)=>{
  for(let bit=0;bit<8;bit++)n=n&1?0xedb88320^(n>>>1):n>>>1;
  return n>>>0;
});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zip(files){
  const local=[],directory=[];let offset=0;
  for(const [path,content] of files){
    const name=Buffer.from('yga-website/'+path),data=Buffer.isBuffer(content)?content:Buffer.from(content),crc=crc32(data);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);
    const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(33,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(data.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(name.length,28);entry.writeUInt32LE(offset,42);
    local.push(header,name,data);directory.push(entry,name);offset+=header.length+name.length+data.length;
  }
  const central=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,central,end]);
}
export async function exportSource({root,dist,standalone}){
  const files=[];
  async function collect(path){
    const entries=await readdir(resolve(root,path),{withFileTypes:true});
    for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
      if(entry.name.startsWith('.')||entry.name==='__pycache__')continue;
      const next=path+'/'+entry.name;
      if(entry.isDirectory())await collect(next);
      else if(entry.isFile())files.push([next,await readFile(resolve(root,next))]);
    }
  }
  for(const path of ['public','api','lib','scripts','tests'])await collect(path);
  for(const path of ['package.json','server.mjs','vercel.json','README.md','DESIGN.md','ASSET-LICENSE.md','LOVABLE-HANDOFF.md','.env.example','.gitignore'])files.push([path,await readFile(resolve(root,path))]);
  files.push(['yga-preview.html',standalone]);
  const destination=resolve(dist,'source');await mkdir(destination,{recursive:true});
  await Promise.all([
    writeFile(resolve(destination,'yga.html.txt'),standalone),
    writeFile(resolve(destination,'yga-preview.html'),standalone),
    writeFile(resolve(destination,'yga-source.zip'),zip(files)),
    writeFile(resolve(destination,'README.txt'),await readFile(resolve(root,'LOVABLE-HANDOFF.md')))
  ]);
}
