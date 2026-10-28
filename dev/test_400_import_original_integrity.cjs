'use strict';
// Solo dati fittizi: l'originale importato non deve essere scaricato se incompleto o manomesso.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createHash,webcrypto}=require('node:crypto');
const source=fs.readFileSync('app.js','utf8');
const hashStart=source.indexOf('async function hash(bytes){');
const hashEnd=source.indexOf('function encode(bytes){',hashStart);
const start=source.indexOf('async function openOriginal(docId){');
const end=source.indexOf('\nfunction build(){',start);
assert(hashStart>=0&&hashEnd>hashStart&&start>=0&&end>start,'Funzioni originali non trovate');
const code=source.slice(hashStart,hashEnd)+'\n'+source.slice(start,end)+';this.openDemo=openOriginal';
const bytes=Uint8Array.from([70,65,84,84,85,82,65,32,84,69,83,84]);
const digest=createHash('sha256').update(bytes).digest('hex');
async function scenario(overrides={},missing=false){
 const events={urls:0,clicks:0,downloads:[],revocations:0};
 const file={id:'file_demo',name:'fattura-fittizia.txt',type:'text/plain',size:bytes.length,base64:Buffer.from(bytes).toString('base64'),hash:digest,...overrides};
 const ctx={
  ready:Promise.resolve(),
  state:{documents:[{id:'doc_demo',fileId:'file_demo'}],files:missing?[]:[file]},
  decode:s=>Uint8Array.from(Buffer.from(s,'base64')),
  crypto:webcrypto,Uint8Array,TextDecoder,Blob,Promise,Error,Number,
  URL:{createObjectURL:()=>{events.urls++;return 'blob:demo'},revokeObjectURL:()=>{events.revocations++}},
  document:{
   body:{append:()=>{}},
   createElement:()=>({click(){events.clicks++;events.downloads.push(this.download)},remove(){}})
  },
  setTimeout:()=>{}
 };
 vm.createContext(ctx);
 vm.runInContext(code,ctx);
 let error=null;
 try{await ctx.openDemo('doc_demo')}catch(e){error=e}
 return {events,error};
}
(async()=>{
 let r=await scenario();
 assert.equal(r.error,null,'Originale integro deve aprirsi');
 assert.equal(r.events.urls,1);
 assert.equal(r.events.clicks,1);
 assert.deepEqual(r.events.downloads,['fattura-fittizia.txt']);
 r=await scenario({size:bytes.length+1});
 assert.match(r.error?.message||'',/Originale incompleto/);
 assert.equal(r.events.urls,0,'Non creare URL per un originale troncato');
 assert.equal(r.events.clicks,0);
 r=await scenario({base64:Buffer.from(bytes.slice(0,-1)).toString('base64'),size:bytes.length});
 assert.match(r.error?.message||'',/Originale incompleto/);
 assert.equal(r.events.clicks,0);
 r=await scenario({hash:'0'.repeat(64)});
 assert.match(r.error?.message||'',/Impronta SHA-256/);
 assert.equal(r.events.urls,0,'Non creare URL per byte alterati');
 r=await scenario({hash:'non-valida'});
 assert.match(r.error?.message||'',/Impronta SHA-256/);
 assert.equal(r.events.clicks,0);
 r=await scenario({hash:digest.toUpperCase()});
 assert.match(r.error?.message||'',/Impronta SHA-256/);
 assert.equal(r.events.clicks,0);
 r=await scenario({},true);
 assert.match(r.error?.message||'',/Originale non trovato/);
 assert.equal(r.events.clicks,0);
 console.log('OK: apertura originale integro e blocco di file incompleti, hash errati e originali mancanti');
})().catch(e=>{console.error(e);process.exitCode=1});
