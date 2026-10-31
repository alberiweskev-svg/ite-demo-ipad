/* I.T.E. 4.0 — safe operational persistence coordinator.
 * Requires an externally supplied encrypted transactional store.
 * No localStorage fallback; no fiscal issuance; no production integration.
 */
(function(root){'use strict';
const transaction=typeof module!=='undefined'&&module.exports?require('./ite-operational-transaction.js'):root.ITEOperationalTransaction;
const clone=x=>JSON.parse(JSON.stringify(x));
function assertStore(store){
 if(!store||!['read','begin','write','commit','rollback','backup'].every(k=>typeof store[k]==='function'))throw Error('Archivio transazionale cifrato non configurato');
 if(store.encrypted!==true||store.atomic!==true)throw Error('Archivio privo di garanzie di cifratura e atomicità');
}
async function commit(store,changeSet,options){
 assertStore(store);
 if(!options||options.confirmed!==true)throw Error('Conferma esplicita obbligatoria');
 let tx=null,phase='read';
 try{
  const current=await store.read();
  if(!current||!current.core||!current.commerce)throw Error('Archivi incompleti');
  const applied=transaction.apply(current,changeSet,options);
  phase='backup';
  const backupId=await store.backup();
  if(!backupId)throw Error('Backup non verificato');
  phase='begin';
  tx=await store.begin();
  if(!tx)throw Error('Transazione non avviata');
  phase='verify';
  const latest=await store.read(tx);
  if(JSON.stringify(latest)!==JSON.stringify(current))throw Error('Archivi modificati durante la transazione');
  phase='write';
  await store.write(tx,{core:clone(applied.next.core),commerce:clone(applied.next.commerce),events:clone(applied.events),backupId});
  phase='commit';
  await store.commit(tx);
  return {persisted:true,backupId,eventCount:applied.events.length,fiscalIssued:false,
   warning:'Conferma del solo adattatore: verificare durabilità e recupero backup nel backend effettivo.'};
 }catch(error){
  if(tx){try{await store.rollback(tx)}catch(rollbackError){throw Error('ERRORE CRITICO: '+error.message+'; rollback non riuscito: '+rollbackError.message)}}
  throw Error('Salvataggio annullato ('+phase+'): '+error.message);
 }
}
const api=Object.freeze({commit});
root.ITEOperationalPersistence=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
