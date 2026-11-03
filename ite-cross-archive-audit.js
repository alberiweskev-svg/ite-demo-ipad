/* I.T.E. 4.0 — cross-archive integrity and safe local snapshot.
 * Read-only: no PDF content, network access or legacy archive writes.
 */
(function(root){'use strict';
const A=root.ITEAtomicWorkspace||(typeof require==='function'?require('./ite-atomic-workspace.js'):null);
const D=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const L=root.ITEDocumentHistory||(typeof require==='function'?require('./ite-document-history.js'):null);
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
function engines(){if(!A||!D||!L||!H)throw Error('MOTORI_NON_DISPONIBILI')}
function audit(snapshot,registry,links){
 engines();
 const atom=A.parse(JSON.stringify(snapshot)),docs=D.validate(registry),hierarchy=H.validate(atom.data.hierarchy);
 if(!Array.isArray(links)||links.length>5000)throw Error('COLLEGAMENTI_NON_VALIDI');
 const clients=new Set(hierarchy.clients.map(x=>x.id)),sites=new Map(hierarchy.sites.map(x=>[x.id,x.clientId]));
 const issues=[];
 for(const doc of docs.items){
  if(doc.clientId&&!clients.has(doc.clientId))issues.push({documentId:doc.id,code:'CLIENTE_INESISTENTE'});
  if(doc.siteId&&(!sites.has(doc.siteId)||sites.get(doc.siteId)!==doc.clientId))issues.push({documentId:doc.id,code:'SEDE_CLIENTE_INCOERENTE'});
 }
 const result=L.inspect(docs,hierarchy,links);
 for(const item of result.invalid)issues.push({documentId:item.documentId,code:item.reason});
 return {revision:atom.revision,documents:docs.items.length,linked:result.summary.linked,unlinked:result.summary.unlinked,issues,ok:issues.length===0};
}
function capture(storage,documentKey,linksKey){
 engines();
 const snapshot=A.read(storage);
 const raw=storage.getItem(documentKey),registry=raw===null?D.empty():D.importJSON(raw);
 const linksRaw=storage.getItem(linksKey),links=linksRaw===null?[]:JSON.parse(linksRaw);
 const result=audit(snapshot,registry,links);
 // Refuse a mixed-revision snapshot if another tab modified the atomic archive.
 if(A.read(storage).revision!==snapshot.revision)throw Error('ARCHIVIO_MODIFICATO_RICARICARE');
 return {format:'ITE40_DOCUMENT_AUDIT',version:1,capturedAt:null,atomic:snapshot,registry,links,report:result};
}
function exportJSON(bundle){if(!bundle||bundle.format!=='ITE40_DOCUMENT_AUDIT'||bundle.version!==1)throw Error('FORMATO_NON_SUPPORTATO');
 const result=audit(bundle.atomic,bundle.registry,bundle.links);
 if(JSON.stringify(result)!==JSON.stringify(bundle.report))throw Error('RIEPILOGO_NON_COHERENTE');
 return JSON.stringify(bundle,null,2);
}
function parse(raw){let bundle;try{bundle=JSON.parse(raw)}catch(_){throw Error('JSON_NON_VALIDO')}
 exportJSON(bundle);return bundle;
}
const api=Object.freeze({audit,capture,exportJSON,parse});
root.ITECrossArchiveAudit=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
