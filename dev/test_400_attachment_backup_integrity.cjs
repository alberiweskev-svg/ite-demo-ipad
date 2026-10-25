'use strict';
// Backup allegati: soli byte e anagrafiche fittizie.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto,createHash}=require('node:crypto');
const source=fs.readFileSync('app.js','utf8');
const digestStart=source.indexOf('async function attachmentDigest(bytes){');
const packStart=source.indexOf('async function pack(){',digestStart);
const packEnd=source.indexOf('\nfunction downloadObject(',packStart);
const restoreStart=source.indexOf('async function restore(input){',packEnd);
const restoreEnd=source.indexOf('\nwindow.ITEBackup=',restoreStart);
assert(digestStart>=0&&packStart>digestStart&&packEnd>packStart&&restoreEnd>restoreStart,'Backup helpers not found');
const data={clienti:[{id:1,name:'Cliente fittizio'}],immobili:[],impianti:[],apparecchiature:[],interventi:[],cantieri:[]};
const fileBytes=Uint8Array.from([1,2,3,4]).buffer;
const commerce={documents:[],articles:[],movements:[]};
async function build({bytes=fileBytes,size=4}={}){
 const ctx={KEY:'ite_demo_test',crypto:webcrypto,Uint8Array,btoa,JSON,Date,Error,
   window:{ITECommerce:{exportState:async()=>commerce}},
   ITECommerce:{exportState:async()=>commerce},
   ITE:{archiveReadable:()=>true,validate:()=>true,snapshot:()=>data},
   ITEVault:{storage:{getItem:()=>null}},
   ITEDocs:{listDocs:async()=>[{id:'d-demo',parentType:'clienti',parentId:'1',subjectId:'1',fileName:'foto-fittizia.png',size,fileBytes:bytes}]}};
 vm.createContext(ctx);
 vm.runInContext(source.slice(digestStart,packEnd)+';this.makeBackup=pack',ctx);
 return ctx.makeBackup();
}
async function attempt(backup){
 const messages=[];let writes=0;
 const ctx={crypto:webcrypto,Uint8Array,atob,JSON,Set,Array,Object,Number,String,Error,
   busy:false,
   window:{ITECommerce:{busy:()=>false,validate:()=>{},replaceState:async()=>{writes++}},
     ITEHistory:{create:async()=>{}},ITEAgenda:{validateDatabase:()=>{}},ITEOperators:{validateDatabase:()=>{}}},
   document:{getElementById:()=>({hidden:true})},
   message:s=>messages.push(s),
   ITEVault:{openBackup:async()=>backup},
   ITE:{validate:()=>true,replaceData:()=>{writes++}},
   ITEDocs:{validDate:()=>true,replaceDocs:async()=>{writes++}},
   pack:async()=>({data,docs:[],commerce}),
   downloadObject:()=>{},confirm:()=>true,location:{reload:()=>messages.push('reload')}};
 ctx.ITECommerce=ctx.window.ITECommerce;ctx.ITEHistory=ctx.window.ITEHistory;
 ctx.ITEAgenda=ctx.window.ITEAgenda;ctx.ITEOperators=ctx.window.ITEOperators;
 vm.createContext(ctx);
 vm.runInContext(source.slice(digestStart,packStart)+source.slice(restoreStart,restoreEnd)+';this.runRestore=restore',ctx);
 await ctx.runRestore({files:[{text:async()=>JSON.stringify(backup)}],value:''});
 return {writes,messages};
}
(async()=>{
 const backup=await build();
 await assert.rejects(build({size:5}),/Allegato incompleto/,'Mismatched attachment size must prevent unusable backups');
 await assert.rejects(build({bytes:new ArrayBuffer(0),size:0}),/Allegato incompleto/,'Empty attachments must prevent unusable backups');
 assert.equal(backup.docs.length,1);
 assert.equal(backup.docs[0].sha256,createHash('sha256').update(Buffer.from(fileBytes)).digest('hex'));
 let r=await attempt(backup);
 assert.equal(r.writes,3,'Valid checksum must allow complete restore');
 assert(r.messages.includes('reload'));
 const tampered=structuredClone(backup);
 tampered.docs[0].base64=btoa(String.fromCharCode(1,2,3,5));
 r=await attempt(tampered);
 assert.equal(r.writes,0,'Modified bytes must be rejected before any restore writes');
 assert(r.messages.some(x=>x.includes('Integrità allegato non valida')));
 const empty=structuredClone(backup);
 empty.docs[0].size=0;
 empty.docs[0].base64='';
 empty.docs[0].sha256=createHash('sha256').update(Buffer.alloc(0)).digest('hex');
 r=await attempt(empty);
 assert.equal(r.writes,0,'Empty attachment with a valid SHA-256 must not replace any existing data');
 assert(r.messages.some(x=>x.includes('Dimensione allegato non valida')));

 const invalid=structuredClone(backup);invalid.docs[0].sha256='not-a-checksum';
 r=await attempt(invalid);
 assert.equal(r.writes,0,'Invalid checksum format must be rejected');
 const mismatched=structuredClone(backup);
 mismatched.data.clienti.push({id:2,name:'Cliente fittizio 2'});
 mismatched.data.interventi.push({id:7,appointment:'1',client_id:'1'});
 mismatched.docs[0].parentType='interventi';
 mismatched.docs[0].parentId='7';
 mismatched.docs[0].subjectId='2';
 r=await attempt(mismatched);
 assert.equal(r.writes,0,'Cross-client intervention attachment must block restore before writes');
 assert(r.messages.some(x=>x.includes('Soggetto allegato incoerente')));
 const matched=structuredClone(mismatched);matched.docs[0].subjectId='1';
 r=await attempt(matched);
 assert.equal(r.writes,3,'Attachment with matching intervention client must restore normally');
 // Il modulo documenti vincola il soggetto per clienti, impianti e apparecchiature.
 // Un backup alterato non deve aggirare questo vincolo né sostituire i dati esistenti.
 const wrongClient=structuredClone(backup);
 wrongClient.data.clienti.push({id:2,name:'Cliente fittizio 2'});
 wrongClient.docs[0].subjectId='2';
 r=await attempt(wrongClient);
 assert.equal(r.writes,0,'Client document with a different subject must be rejected');
 assert(r.messages.some(x=>x.includes('Soggetto allegato incoerente')));
 const hierarchy=structuredClone(wrongClient);
 hierarchy.data.immobili.push({id:3,client_id:'1'});
 hierarchy.data.impianti.push({id:4,immobile_id:'3'});
 hierarchy.data.apparecchiature.push({id:5,impianto_id:'4'});
 for(const [type,id] of [['impianti','4'],['apparecchiature','5']]){
  const tampered=structuredClone(hierarchy);
  tampered.docs[0].parentType=type;
  tampered.docs[0].parentId=id;
  r=await attempt(tampered);
  assert.equal(r.writes,0,'Cross-client '+type+' attachment must not restore');
  assert(r.messages.some(x=>x.includes('Soggetto allegato incoerente')));
  tampered.docs[0].subjectId='1';
  r=await attempt(tampered);
  assert.equal(r.writes,3,'Correctly linked '+type+' attachment must restore');
 }
 const legacy=structuredClone(backup);delete legacy.docs[0].sha256;
 r=await attempt(legacy);
 assert.equal(r.writes,3,'Legacy backups without per-file hashes remain importable');
 console.log('OK: attachment backup SHA-256, tamper rejection, cross-client isolation for client, plant, equipment and intervention, and legacy compatibility');
})().catch(e=>{console.error(e);process.exitCode=1});
