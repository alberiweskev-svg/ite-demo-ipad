/* I.T.E. 4.0 — transactional in-memory adapter for operational change sets.
 * No disk/browser storage, fiscal issuance, or encrypted archive integration.
 * Caller must persist BOTH archives and audit atomically using its own verified adapter.
 */
(function(root){'use strict';
const changeset=typeof module!=='undefined'&&module.exports?require('./ite-operational-changeset.js'):root.ITEOperationalChangeSet;
const clone=x=>JSON.parse(JSON.stringify(x));
const id=x=>String(x??'');
const permitted={core:new Set(['appuntamenti','interventi']),commerce:new Set(['quotes','extras','documents'])};
function validate(base,changeSet){
 if(!changeset||!changeSet||!changeSet.base||!changeSet.preview||!Array.isArray(changeSet.changes))throw Error('Change set non valido');
 if(changeSet.persisted||changeSet.fiscalIssued)throw Error('Stato fiscale o persistenza non consentiti');
 const current=changeset.snapshot(base.core,base.commerce);
 if(current.core!==changeSet.base.core||current.commerce!==changeSet.base.commerce)throw Error('Conflitto di versione: archivi modificati');
 if(!changeSet.changes.length||changeSet.changes.length>100)throw Error('Numero modifiche non valido');
 const touched=new Set();
 for(const change of changeSet.changes){
  if(!permitted[change.scope]?.has(change.collection))throw Error('Archivio non consentito');
  const key=[change.scope,change.collection,id(change.id)].join('/');
  if(touched.has(key)||!id(change.id))throw Error('Modifica duplicata o senza ID');
  touched.add(key);
  if(!['CREATE','UPDATE'].includes(change.operation)||!change.after||id(change.after.id)!==id(change.id))throw Error('Operazione non valida');
 }
 return current;
}
function apply(base,changeSet,options){
 validate(base,changeSet);
 if(!options||options.confirmed!==true||!id(options.operatorId).trim()||!id(options.reason).trim())throw Error('Conferma, operatore e motivazione obbligatori');
 if(changeSet.requiresReview&&options.reviewApproved!==true)throw Error('Revisione obbligatoria prima di applicare');
 const next=clone(base),events=[];
 for(const change of changeSet.changes){
  const list=next[change.scope][change.collection];
  if(!Array.isArray(list))throw Error('Archivio mancante: '+change.collection);
  const idx=list.findIndex(x=>id(x.id)===id(change.id));
  if(change.operation==='CREATE'){
   if(idx>=0)throw Error('ID già presente');
   list.push(clone(change.after));
  }else{
   if(idx<0||JSON.stringify(list[idx])!==JSON.stringify(change.before))throw Error('Conflitto sul record');
   list[idx]=clone(change.after);
  }
  events.push({operation:change.operation,scope:change.scope,collection:change.collection,recordId:id(change.id),
   operatorId:id(options.operatorId),reason:id(options.reason),before:change.before?clone(change.before):null,after:clone(change.after)});
 }
 for(const scope of Object.keys(permitted))for(const collection of permitted[scope]){
  const planned=changeSet.preview[scope][collection]||[];
  if(JSON.stringify(next[scope][collection])!==JSON.stringify(planned))throw Error('Riconciliazione finale fallita');
 }
 return {next,events,appliedInMemory:true,persisted:false,fiscalIssued:false,
  warning:'Modifiche solo in memoria: backup e scrittura cifrata atomica non ancora collegati.'};
}
const api=Object.freeze({validate,apply});
root.ITEOperationalTransaction=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
