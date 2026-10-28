'use strict';
// Solo dati sintetici: verifica l'originale nella coda prima di creare backup o scrivere.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createHash,webcrypto}=require('node:crypto');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function verifyQueuedOriginal(d){');
const end=source.indexOf('\nasync function applyQueue(){',start);
const apply=source.indexOf('async function applyQueue(){',end);
const guard=source.indexOf('for(const item of selected)await verifyQueuedOriginal(item);',apply);
const history=source.indexOf("await ITEHistory.create('Prima importazione documenti');",apply);
assert(start>=0&&end>start&&apply>0&&guard>apply&&history>guard,
 'La verifica deve precedere il backup e la registrazione');
const bytes=Uint8Array.from([70,65,84,84,85,82,65,32,70,73,84,84,73,90,73,65]);
const digest=createHash('sha256').update(bytes).digest('hex');
const base64=Buffer.from(bytes).toString('base64');
const original={id:'file_'+digest,hash:digest,size:bytes.length,base64,name:'fattura-fittizia.txt'};
async function verify(fileChanges={},docChanges={},stored=[]){
 const f={...original,...fileChanges};
 const ctx={state:{files:stored},decode:s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),
  hash:async b=>createHash('sha256').update(b).digest('hex'),
  Number,Error,Uint8Array,Promise};
 vm.createContext(ctx);
 vm.runInContext(source.slice(start,end)+';this.check=verifyQueuedOriginal;',ctx);
 return ctx.check({file:f,fileId:f.id,...docChanges});
}
(async()=>{
 await verify();
 await verify({}, {}, [{...original}]);
 await assert.rejects(()=>verify({size:bytes.length+1}),/Originale incompleto/);
 await assert.rejects(()=>verify({size:0}),/Originale incompleto/);
 await assert.rejects(()=>verify({base64:Buffer.from(bytes.slice(0,-1)).toString('base64')}),/Originale incompleto/);
 await assert.rejects(()=>verify({base64:'!!!'}),/Originale non leggibile/);
 await assert.rejects(()=>verify({hash:'0'.repeat(64)}),/Integrità originale/);
 await assert.rejects(()=>verify({hash:'non-valida'}),/Integrità originale/);
 await assert.rejects(()=>verify({id:'file_falso'}),/Integrità originale/);
 await assert.rejects(()=>verify({}, {fileId:'file_altro'}),/Integrità originale/);
 await assert.rejects(()=>verify({base64:Buffer.from(bytes.map(x=>x^1)).toString('base64')}),/Integrità originale/);
 await assert.rejects(()=>verify({}, {}, [{...original,base64:'QUJD'}]),/Originale già archiviato discordante/);
 await assert.rejects(()=>verify({}, {}, [{...original,size:bytes.length+1}]),/Originale già archiviato discordante/);
 await assert.rejects(()=>verify({base64:''}),/Originale mancante/);
 console.log('OK: preflight coda importazioni prima del backup, hash/byte/id coerenti, originali discordanti bloccati');
})().catch(e=>{console.error(e);process.exitCode=1});
