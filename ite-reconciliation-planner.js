/* I.T.E. 4.0 — non-destructive cross-archive reconciliation planner.
 * Local metadata only. Never edits legacy archives or silently deletes records.
 */
(function(root){'use strict';
const X=root.ITECrossArchiveAudit||(typeof require==='function'?require('./ite-cross-archive-audit.js'):null);
const D=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const L=root.ITEDocumentHistory||(typeof require==='function'?require('./ite-document-history.js'):null);
function engines(){if(!X||!D||!H||!L)throw Error('MOTORI_NON_DISPONIBILI')}
function plan(snapshot,registry,links){
 engines();const report=X.audit(snapshot,registry,links),docs=D.validate(registry),hierarchy=H.validate(snapshot.data.hierarchy);
 const clients=new Set(hierarchy.clients.map(x=>x.id)),sites=new Map(hierarchy.sites.map(x=>[x.id,x.clientId]));
 const suggestions=[],blocked=[];
 for(const doc of docs.items){
  const invalidClient=!!doc.clientId&&!clients.has(doc.clientId);
  const invalidSite=!!doc.siteId&&(!sites.has(doc.siteId)||sites.get(doc.siteId)!==doc.clientId);
  if(invalidClient||invalidSite)blocked.push({documentId:doc.id,reason:'ANAGRAFICA_DA_VERIFICARE',clientId:doc.clientId||null,siteId:doc.siteId||null});
 }
 const seen=new Set();
 for(const entry of links){
  if(!entry||typeof entry.documentId!=='string'){blocked.push({documentId:null,reason:'COLLEGAMENTO_MALFORMATO'});continue}
  if(seen.has(entry.documentId)){blocked.push({documentId:entry.documentId,reason:'COLLEGAMENTO_DUPLICATO'});continue}
  seen.add(entry.documentId);
  try{L.validateLinks([entry],docs,hierarchy)}
  catch(e){blocked.push({documentId:entry.documentId,reason:e.message});continue}
  suggestions.push({documentId:entry.documentId,action:'CONSERVARE',reason:'COLLEGAMENTO_VALIDO'});
 }
 for(const doc of docs.items)if(!seen.has(doc.id)&&!blocked.some(x=>x.documentId===doc.id))
  suggestions.push({documentId:doc.id,action:'VERIFICARE_COLLEGAMENTO',reason:'DOCUMENTO_SENZA_STORICO'});
 return {format:'ITE40_RECONCILIATION_PLAN',version:1,sourceRevision:snapshot.revision,report,blocked,suggestions,automaticChanges:0};
}
function review(bundle,expectedRevision){
 if(!bundle||bundle.format!=='ITE40_RECONCILIATION_PLAN'||bundle.version!==1)throw Error('PIANO_NON_VALIDO');
 if(bundle.sourceRevision!==expectedRevision)throw Error('ARCHIVIO_MODIFICATO_RICARICARE');
 if(bundle.automaticChanges!==0)throw Error('MODIFICHE_AUTOMATICHE_NON_CONSENTITE');
 return {ready:bundle.blocked.length===0,blocked:bundle.blocked.length,actions:bundle.suggestions.length};
}
const api=Object.freeze({plan,review});
root.ITEReconciliationPlanner=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
