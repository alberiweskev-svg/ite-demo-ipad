/* I.T.E. 4.0 — guarded operational change-set preparation.
 * Pure in-memory validation. Does NOT persist, invoice, or alter archives.
 */
(function(root){'use strict';
const batch=typeof module!=='undefined'&&module.exports?require('./ite-operational-batch.js'):root.ITEOperationalBatch;
const copy=x=>JSON.parse(JSON.stringify(x));
const stable=x=>JSON.stringify(x);
const arrays={core:['appuntamenti','interventi'],commerce:['quotes','extras','documents']};
const id=x=>String(x??'');
function prepare(core,commerce,steps,expected){
 if(!batch)throw Error('Modulo workflow mancante');
 if(!core||!commerce||!expected||typeof expected!=='object')throw Error('Snapshot di origine obbligatorio');
 const actual={core:stable(core),commerce:stable(commerce)};
 if(expected.core!==actual.core||expected.commerce!==actual.commerce)throw Error('Archivi modificati: aggiornare prima di proseguire');
 const result=batch.plan(core,commerce,steps);
 const changes=[];
 for(const scope of Object.keys(arrays))for(const collection of arrays[scope]){
  const before=Array.isArray((scope==='core'?core:commerce)[collection])?(scope==='core'?core:commerce)[collection]:[];
  const after=result.preview[scope][collection]||[];
  const previous=new Map(before.map(x=>[id(x.id),x]));
  for(const record of after){
   const old=previous.get(id(record.id));
   if(!old)changes.push({scope,collection,id:id(record.id),operation:'CREATE',after:copy(record)});
   else if(stable(old)!==stable(record))changes.push({scope,collection,id:id(record.id),operation:'UPDATE',before:copy(old),after:copy(record)});
  }
  if(before.some(x=>!after.some(y=>id(y.id)===id(x.id))))throw Error('Eliminazione implicita vietata');
 }
 if(changes.length>result.staged.length)throw Error('Sequenza non riconciliata');
 return {changes,audit:copy(result.audit),requiresReview:result.requiresReview,
  base:actual,preview:copy(result.preview),persisted:false,fiscalIssued:false,
  warning:'Proposta non salvata: serve un adattatore di persistenza con backup e conferma.'};
}
function snapshot(core,commerce){return {core:stable(core),commerce:stable(commerce)};}
const api=Object.freeze({snapshot,prepare});
root.ITEOperationalChangeSet=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
