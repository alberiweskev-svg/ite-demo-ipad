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
async function build(){
 const ctx={crypto:webcrypto,Uint8Array,btoa,JSON,Date,Error,
   window:{ITECommerce:{exportState:async()=>commerce}},
   ITECommerce:{exportState:async()=>commerce},
   ITE:{archiveReadable:()=>true,validate:()=>true,snapshot:()=>data},
   ITEVault:{storage:{getItem:()=>null}},
   ITEDocs:{listDocs:async()=>[{id:'d-demo',parentType:'clienti',parentId:'1',subjectId:'1',fileName:'foto-fittizia.png',size:4,fileBytes}]}};
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
 const invalid=structuredClone(backup);invalid.docs[0].sha256='not-a-checksum';
 r=await attempt(invalid);
 assert.equal(r.writes,0,'Invalid checksum format must be rejected');
 const legacy=structuredClone(backup);delete legacy.docs[0].sha256;
 r=await attempt(legacy);
 assert.equal(r.writes,3,'Legacy backups without per-file hashes remain importable');
 console.log('OK: attachment backup SHA-256, valid restore, tamper rejection, invalid hash and legacy compatibility');
})().catch(e=>{console.error(e);process.exitCode=1});
