'use strict';
// Solo file e dati sintetici: lo ZIP incompleto non deve essere decompresso o registrato.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function expandFiles(files){');
const end=source.indexOf('\nasync function choose(files){',start);
assert(start>=0&&end>start,'Espansione ZIP non trovata');
let decompressions=0,reads=0;
const zipEntry={name:'fattura-fittizia.txt',dir:false,_data:{uncompressedSize:4},
  async:async()=>Uint8Array.from([65,66,67,68])};
const Z={loadAsync:async bytes=>{
  decompressions++;
  assert(bytes instanceof Uint8Array,'La libreria ZIP deve ricevere byte verificati');
  return {files:{'fattura-fittizia.txt':zipEntry}};
}};
class SyntheticFile{
  constructor(parts,name,options={}){this.name=name;this.type=options.type||'';
    this.bytes=Uint8Array.from(parts.flatMap(part=>Array.from(part)));
    this.size=this.bytes.byteLength;}
  async arrayBuffer(){return this.bytes.buffer.slice(0)}
}
const ctx={Number,Uint8Array,Object,Error,File:SyntheticFile,
  loadScript:async()=>Z};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end)+';this.expandDemo=expandFiles',ctx);
function input(size,bytes=Uint8Array.from([1,2,3,4])){
  return {name:'fatture-fittizie.zip',size,async arrayBuffer(){reads++;return bytes.buffer.slice(0)}};
}
(async()=>{
  await assert.rejects(ctx.expandDemo([input(5)]),/Acquisizione incompleta dello ZIP/);
  assert.equal(decompressions,0,'ZIP troncato: nessuna decompressione');
  await assert.rejects(ctx.expandDemo([input(0)]),/ZIP vuoto/);
  await assert.rejects(ctx.expandDemo([input(-1)]),/ZIP vuoto/);
  await assert.rejects(ctx.expandDemo([input(NaN)]),/ZIP vuoto/);
  await assert.rejects(ctx.expandDemo([input(100*1024*1024+1)]),/oltre 100 MB/);
  assert.equal(reads,1,'ZIP con dimensione invalida non va letto in memoria');
  assert.equal(decompressions,0,'ZIP con dimensione invalida non va decompresso');
  const out=await ctx.expandDemo([input(4)]);
  assert.equal(decompressions,1,'ZIP completo viene decompresso una volta');
  assert.equal(out.length,1);
  assert.equal(out[0].name,'fattura-fittizia.txt');
  assert.equal(out[0].size,4);
  const content=new Uint8Array(await out[0].arrayBuffer());
  assert.deepEqual(Array.from(content),[65,66,67,68]);
  console.log('OK: ZIP troncati, vuoti e sovradimensionati bloccati prima della decompressione');
})().catch(e=>{console.error(e);process.exitCode=1});
