/* I.T.E. 4.0 — coherent local snapshot across hierarchy, quotes and accounting.
 * Opt-in staging archive. Does not modify the 3.0.74 or 2.7.5 stores.
 */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const Q=root.ITECommercialWorkspace||(typeof require==='function'?require('./ite-commercial-workspace.js'):null);
const A=root.ITEAccountingWorkspace||(typeof require==='function'?require('./ite-accounting-workspace.js'):null);
const T=root.ITEOperationalTransactions||(typeof require==='function'?require('./ite-operational-transactions.js'):null);
const KEY='ite40_integrated_atomic_v1',PREVIOUS=KEY+'_previous';
function engine(){if(!H||!Q||!A||!T)throw Error('MOTORI_NON_DISPONIBILI')}
function clean(value){engine();return T.checked(value)}
function empty(){engine();const hierarchy=H.empty();return clean({hierarchy,commercial:Q.empty(hierarchy),accounting:A.empty()})}
function parse(raw){let item;try{item=JSON.parse(raw)}catch(_){throw Error('ARCHIVIO_JSON_NON_VALIDO')}
 if(!item||item.format!=='ITE40_ATOMIC'||item.version!==1||!Number.isSafeInteger(item.revision)||item.revision<0)throw Error('VERSIONE_ARCHIVIO_NON_SUPPORTATA');
 return {format:'ITE40_ATOMIC',version:1,revision:item.revision,data:clean(item.data)}
}
function wrap(data,revision){if(!Number.isSafeInteger(revision)||revision<0)throw Error('REVISIONE_NON_VALIDA');return {format:'ITE40_ATOMIC',version:1,revision,data:clean(data)}}
function read(storage){const raw=storage.getItem(KEY);return raw===null?wrap(empty(),0):parse(raw)}
function save(storage,data,expectedRevision){
 const oldRaw=storage.getItem(KEY),current=oldRaw===null?wrap(empty(),0):parse(oldRaw);
 if(expectedRevision!==current.revision)throw Error('ARCHIVIO_MODIFICATO_RICARICARE');
 const next=wrap(data,current.revision+1);
 const nextRaw=JSON.stringify(next);
 // The authoritative state changes with ONE storage write; failed writes cannot
 // leave hierarchy, accounting and commercial data at different revisions.
 // Preserve the last valid snapshot BEFORE committing the new one.
 // If the backup cannot be written, refuse the update rather than silently
 // leaving the user without a recovery point.
 if(oldRaw!==null)storage.setItem(PREVIOUS,oldRaw);
 storage.setItem(KEY,nextRaw);
 return next;
}
function transact(storage,expectedRevision,operation,...args){
 if(typeof operation!=='string'||!Object.prototype.hasOwnProperty.call(T,operation)||!['scheduleAppointment','beginService','clockService','createEstimate','acceptAndReserve','dischargeMaterials','registerDocument'].includes(operation))throw Error('OPERAZIONE_NON_SUPPORTATA');
 const current=read(storage);if(current.revision!==expectedRevision)throw Error('ARCHIVIO_MODIFICATO_RICARICARE');
 const next=T[operation](current.data,...args);return save(storage,next,expectedRevision);
}
function restorePrevious(storage,expectedRevision){
 const current=read(storage);if(current.revision!==expectedRevision)throw Error('ARCHIVIO_MODIFICATO_RICARICARE');
 const raw=storage.getItem(PREVIOUS);if(!raw)throw Error('BACKUP_NON_DISPONIBILE');
 return save(storage,parse(raw).data,expectedRevision);
}
function exportJSON(snapshot){return JSON.stringify(wrap(snapshot.data,snapshot.revision),null,2)}
function importJSON(storage,raw,expectedRevision){const imported=parse(raw);return save(storage,imported.data,expectedRevision)}
const api=Object.freeze({KEY,PREVIOUS,empty,parse,read,save,transact,restorePrevious,exportJSON,importJSON});
root.ITEAtomicWorkspace=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
