'use strict';
const assert=require('node:assert/strict');
const transfer=require('./ite-field-encrypted-transfer.js');
const data={catalog:{clients:[{id:'C'}],sites:[{id:'S',clientId:'C'}],systems:[{id:'I',siteId:'S'}],equipment:[{id:'E',systemId:'I'}],operators:[{id:'O',active:true}]},appointments:[]};
let opened=0;
const vault={isUnlocked:()=>true,sealBackup:payload=>({format:'ITE-encrypted-backup',payload:JSON.stringify(payload)}),openBackup:async value=>{opened++;return JSON.parse(value.payload)}};
(async()=>{
 const encrypted=transfer.exportEncrypted(data,vault);
 assert.equal(encrypted.format,'ITE-encrypted-backup');
 assert.deepEqual(await transfer.importEncrypted(encrypted,vault),data);
 assert.equal(opened,1);
 assert.throws(()=>transfer.exportEncrypted(data,{...vault,isUnlocked:()=>false}),/BLOCCATO/);
 await assert.rejects(()=>transfer.importEncrypted({format:'invalid'},vault),/NON_VALIDO/);
 await assert.rejects(()=>transfer.importEncrypted(encrypted,{...vault,isUnlocked:()=>false}),/BLOCCATO/);
 const corrupted={...encrypted,payload:JSON.stringify({schema:'ITE_FIELD_WORKSPACE_V1',readOnlyImport:true,catalog:{},appointments:[]})};
 await assert.rejects(()=>transfer.importEncrypted(corrupted,vault),/ARCHIVIO_CON_ANOMALIE/);
 console.log('PASS field encrypted transfer contracts and rejection cases');
})().catch(e=>{console.error(e);process.exitCode=1});
