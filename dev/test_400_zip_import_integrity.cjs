'use strict';
// Solo dati fittizi: verificare la completezza ZIP e i limiti prima di estrarre.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function expandFiles(files){');
const end=source.indexOf('\nasync function choose(files){',start);
assert(start>=0&&end>start,'Espansione ZIP non trovata');
let zipLoads=0,reads=0,extractions=0;
function entry(name,declared,bytes=Uint8Array.from([65,66,67,68])){
  return {name,dir:false,_data:declared===undefined?{}:{uncompressedSize:declared},
    async:async()=>{extractions++;return bytes}};
}
let zipEntries={'fattura-fittizia.txt':entry('fattura-fittizia.txt',4)};
const Z={loadAsync:async bytes=>{
  zipLoads++;
  assert(bytes instanceof Uint8Array,'La libreria ZIP deve ricevere byte verificati');
  return {files:zipEntries};
}};
class SyntheticFile{
  constructor(parts,name,options={}){this.name=name;this.type=options.type||'';
    this.bytes=Uint8Array.from(parts.flatMap(part=>Array.from(part)));
    this.size=this.bytes.byteLength;}
  async arrayBuffer(){return this.bytes.buffer.slice(0)}
}
const ctx={Number,Uint8Array,Object,Error,File:SyntheticFile,loadScript:async()=>Z};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end)+';this.expandDemo=expandFiles',ctx);
function input(size,bytes=Uint8Array.from([1,2,3,4])){
  return {name:'fatture-fittizie.zip',size,async arrayBuffer(){reads++;return bytes.buffer.slice(0)}};
}
(async()=>{
  await assert.rejects(ctx.expandDemo([input(5)]),/Acquisizione incompleta dello ZIP/);
  assert.equal(zipLoads,0,'ZIP troncato: nessun caricamento archivio');
  for(const invalid of [0,-1,NaN,100*1024*1024+1])
    await assert.rejects(ctx.expandDemo([input(invalid)]),/ZIP vuoto|oltre 100 MB/);
  assert.equal(reads,1,'ZIP con dimensione invalida non va letto in memoria');
  assert.equal(zipLoads,0,'ZIP con dimensione invalida non va decompresso');

  zipEntries={'ok.txt':entry('ok.txt',4),'troppo-grande.txt':entry('troppo-grande.txt',21*1024*1024)};
  await assert.rejects(ctx.expandDemo([input(4)]),/ZIP troppo grande/);
  assert.equal(extractions,0,'Controllare tutte le dimensioni prima di estrarre il primo file');

  zipEntries=Object.fromEntries(Array.from({length:6},(_,i)=>['file'+i+'.txt',entry('file'+i+'.txt',20*1024*1024)]));
  await assert.rejects(ctx.expandDemo([input(4)]),/ZIP troppo grande/);
  assert.equal(extractions,0,'Bloccare il totale dichiarato oltre 100 MB prima di estrarre');

  zipEntries=Object.fromEntries(Array.from({length:501},(_,i)=>['file'+i+'.txt',entry('file'+i+'.txt',4)]));
  await assert.rejects(ctx.expandDemo([input(4)]),/Massimo 500 file/);
  assert.equal(extractions,0,'Bloccare oltre 500 file prima di estrarre');

  zipEntries={'annidato.zip':entry('annidato.zip',4)};
  await assert.rejects(ctx.expandDemo([input(4)]),/ZIP annidati/);
  assert.equal(extractions,0,'Bloccare ZIP annidati prima di estrarre');

  for(const invalid of [undefined,-1,NaN,1.5]){
    zipEntries={'senza-dimensione.txt':entry('senza-dimensione.txt',invalid)};
    await assert.rejects(ctx.expandDemo([input(4)]),/Dimensione ZIP non verificabile/);
    assert.equal(extractions,0,'Dimensione non affidabile: non estrarre');
  }

  zipEntries={'file-incoerente.txt':entry('file-incoerente.txt',4,Uint8Array.from([65,66,67]))};
  await assert.rejects(ctx.expandDemo([input(4)]),/Contenuto ZIP non coerente/);
  assert.equal(extractions,1,'Il controllo della lunghezza effettiva avviene dopo estrazione');

  zipEntries={'fattura-fittizia.txt':entry('fattura-fittizia.txt',4)};
  const out=await ctx.expandDemo([input(4)]);
  assert.equal(out.length,1);
  assert.equal(out[0].name,'fattura-fittizia.txt');
  assert.equal(out[0].size,4);
  assert.deepEqual(Array.from(new Uint8Array(await out[0].arrayBuffer())),[65,66,67,68]);
  console.log('OK: ZIP incompleti, preflight dimensioni/numero file e coerenza byte estratti');
})().catch(e=>{console.error(e);process.exitCode=1});
