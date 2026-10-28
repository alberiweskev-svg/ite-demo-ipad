'use strict';
// Synthetic invoice bytes only: full backups must reject altered accounting originals.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createHash,webcrypto}=require('node:crypto');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function attachmentDigest(bytes){');
const end=source.indexOf('\n// Resolve only the unambiguous owner of an attachment.',start);
assert(start>=0&&end>start,'Backup accounting integrity helper not found');
const packStart=source.indexOf('async function pack(){');
const packEnd=source.indexOf('\nfunction downloadObject(',packStart);
const restoreStart=source.indexOf('async function restore(input){');
const restoreEnd=source.indexOf('\nwindow.ITEBackup=',restoreStart);
assert(packStart>0&&packEnd>packStart&&restoreStart>0&&restoreEnd>restoreStart);
assert(source.slice(packStart,packEnd).includes('await verifyCommerceOriginals(backup.commerce);'),
 'Complete backup must verify accounting originals before export');
assert(source.slice(restoreStart,restoreEnd).includes('await verifyCommerceOriginals(b.commerce);'),
 'Restore must verify accounting originals before writing any records');
const context={crypto:webcrypto,Uint8Array,Number,Array,Error,atob};
vm.createContext(context);
vm.runInContext(source.slice(start,end)+';this.verifyOriginals=verifyCommerceOriginals;',context);
const bytes=Buffer.from('FATTURA FITTIZIA 2026 - NON FISCALE','utf8');
const digest=createHash('sha256').update(bytes).digest('hex');
const original={id:'file_'+digest,hash:digest,name:'fattura-demo.txt',size:bytes.length,base64:bytes.toString('base64')};
const check=file=>context.verifyOriginals({files:[file]});
(async()=>{
 await check(original);
 await context.verifyOriginals({files:[]});
 await context.verifyOriginals({documents:[],articles:[],movements:[]}); // old empty archive
 await assert.rejects(check({...original,size:bytes.length+1}),/Integrità originale contabile/);
 await assert.rejects(check({...original,base64:Buffer.from(bytes.map(x=>x^1)).toString('base64')}),/Integrità originale contabile/,
  'Same-size tampering must be detected');
 await assert.rejects(check({...original,hash:'0'.repeat(64)}),/Metadati originale contabile/);
 await assert.rejects(check({...original,id:'file_falso'}),/Metadati originale contabile/);
 await assert.rejects(check({...original,hash:'malformato'}),/Metadati originale contabile/);
 await assert.rejects(check({...original,base64:'!!!'}),/Originale contabile non leggibile/);
 await assert.rejects(context.verifyOriginals({files:'non-array'}),/Archivio originali contabili non valido/);
 console.log('OK: originali contabili SHA-256 verificati prima di backup e ripristino; alterazioni e metadati incoerenti bloccati');
})().catch(e=>{console.error(e);process.exitCode=1});
