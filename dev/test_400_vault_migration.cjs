'use strict';
// Regression: opening an encrypted archive must not rewrite existing IndexedDB rows.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('vault.js','utf8');
const start=source.indexOf('async function migrateDatabase(name){');
const end=source.indexOf('\nasync function migrate(){',start);
assert(start>=0&&end>start,'Vault database migration not found');
const migration=source.slice(start,end)+'\nthis.runMigration=migrateDatabase;';
function scenario(rows){
 const state={reads:0,writes:[],transactions:[],closed:0,stored:[]};
 const database={
  objectStoreNames:['docs'],
  close(){state.closed++},
  transaction(_names,mode){
   state.transactions.push(mode);
   const tx={
    abort(){tx.onabort?.()},
    objectStore(){
     return {
      getAll(){
       const request={result:rows.slice()};
       queueMicrotask(()=>tx.oncomplete?.());
       return request;
      },
      put(record){state.writes.push(record)}
     };
    }
   };
   if(mode==='readwrite')queueMicrotask(()=>tx.oncomplete?.());
   return tx;
  }
 };
 const context={
  nativeOpen(){
   const request={result:database};
   queueMicrotask(()=>request.onsuccess?.());
   return request;
  },
  readRecord(row){
   state.reads++;
   if(row.__iteVault?.valid===false)throw Error('Encrypted record corrupted');
   return row;
  },
  materialize:async row=>row,
  storedRecord(value,name,store){
   state.stored.push({value,name,store});
   return {id:value.id,__iteVault:{valid:true}};
  },
  Promise,Error,ArrayBuffer
 };
 vm.createContext(context);
 vm.runInContext(migration,context);
 return {run:()=>context.runMigration('ITE_DEMO_DOCUMENTI_312'),state};
}
(async()=>{
 const encrypted=scenario([{id:'already',__iteVault:{valid:true}}]);
 await encrypted.run();
 assert.equal(encrypted.state.reads,1,'Encrypted record was not validated');
 assert.deepEqual(encrypted.state.transactions,['readonly'],'Already encrypted records must not open a write transaction');
 assert.equal(encrypted.state.writes.length,0);
 assert.equal(encrypted.state.closed,1);

 const binary=new Uint8Array([1,2,3]).buffer;
 const mixed=scenario([{id:'already',__iteVault:{valid:true}},{id:'legacy',file:binary}]);
 await mixed.run();
 assert.equal(mixed.state.reads,1);
 assert.equal(mixed.state.writes.length,1,'Only plaintext records should be migrated');
 assert.equal(mixed.state.writes[0].id,'legacy');
 assert.equal(mixed.state.stored[0].value.fileBytes,binary,'Legacy file bytes must be retained');
 assert.equal(Object.hasOwn(mixed.state.stored[0].value,'file'),false,'Legacy file field should be normalized');
 assert.equal(mixed.state.closed,1);

 const corrupt=scenario([{id:'bad',__iteVault:{valid:false}}]);
 await assert.rejects(corrupt.run(),/Encrypted record corrupted/,'Damaged encrypted records must stop migration');
 assert.equal(corrupt.state.writes.length,0,'Corrupt archive must not be rewritten');
 assert.equal(corrupt.state.closed,1);
 console.log('OK: encrypted IndexedDB rows are validated without rewrite; legacy rows migrate; corruption blocks writes');
})().catch(error=>{console.error(error);process.exitCode=1});
