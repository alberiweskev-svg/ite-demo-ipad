/* I.T.E. 4.0 - opt-in migration from isolated demo stores to coherent atomic store.
 * No production/2.7.5/3.0.74 keys are read or written. Source stores remain intact.
 */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const Q=root.ITECommercialWorkspace||(typeof require==='function'?require('./ite-commercial-workspace.js'):null);
const A=root.ITEAccountingWorkspace||(typeof require==='function'?require('./ite-accounting-workspace.js'):null);
const W=root.ITEAtomicWorkspace||(typeof require==='function'?require('./ite-atomic-workspace.js'):null);
const T=root.ITEOperationalTransactions||(typeof require==='function'?require('./ite-operational-transactions.js'):null);
function engines(){if(!H||!Q||!A||!W||!T)throw Error('MOTORI_NON_DISPONIBILI')}
function source(storage){
 engines();
 const hierarchy=H.load(storage),commercial=Q.load(storage,hierarchy),accounting=A.load(storage);
 return T.checked({hierarchy,commercial,accounting});
}
function counts(data){return Object.freeze({clients:data.hierarchy.clients.length,sites:data.hierarchy.sites.length,plants:data.hierarchy.plants.length,devices:data.hierarchy.devices.length,appointments:data.hierarchy.appointments.length,interventions:data.hierarchy.interventions.length,quotes:data.commercial.quotes.length,stock:data.commercial.stock.length,reservations:data.commercial.reservations.length,documents:data.accounting.documents.length})}
function preview(storage){
 const data=source(storage),target=W.read(storage),existing=counts(target.data),incoming=counts(data);
 const occupied=Object.values(existing).some(Boolean);
 return {source:incoming,target:existing,revision:target.revision,occupied,hasSource:Object.values(incoming).some(Boolean)};
}
function migrate(storage,expectedRevision,confirmReplace){
 if(confirmReplace!==true)throw Error('CONFERMA_ESPLICITA_OBBLIGATORIA');
 const before=W.read(storage);
 if(before.revision!==expectedRevision)throw Error('ARCHIVIO_MODIFICATO_RICARICARE');
 const data=source(storage);
 if(!Object.values(counts(data)).some(Boolean))throw Error('ARCHIVI_ORIGINE_VUOTI');
 // Never silently replace a populated atomic workspace, even if revision is zero.
 if(Object.values(counts(before.data)).some(Boolean))throw Error('DESTINAZIONE_NON_VUOTA');
 // W.save validates all three datasets before one authoritative write.
 const saved=W.save(storage,data,expectedRevision);
 return {revision:saved.revision,counts:counts(saved.data),sourceKeysPreserved:[H.KEY,Q.KEY,A.KEY]};
}
const api=Object.freeze({source,counts,preview,migrate});
root.ITEAtomicMigration=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
