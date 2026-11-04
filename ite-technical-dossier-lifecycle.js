/* I.T.E. 4.0 — technical dossier lifecycle and preflight; metadata only.
 * Pure operations; no original 2.7.5 documents or PDF bytes are modified.
 */
(function(root){'use strict';
const D=root.ITETechnicalDossier||(typeof require==='function'?require('./ite-technical-dossier.js'):null);
const I=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const clone=x=>JSON.parse(JSON.stringify(x));
function preflight(state,queue,master){
 const report={valid:false,linked:0,verifiedUnlinked:[],missingDocuments:[],inconsistent:[],byType:{},issues:[]};
 let docs,links,tree;
 try{docs=I.validate(queue);tree=H.validate(master)}catch(e){report.issues.push(String(e.message));return report}
 links=Array.isArray(state?.links)?state.links:[];
 const known=new Set(docs.items.map(x=>x.id));
 const linked=new Set(links.map(x=>x.documentId));
 report.missingDocuments=links.filter(x=>!known.has(x.documentId)).map(x=>x.documentId);
 report.verifiedUnlinked=docs.items.filter(x=>['VERIFICATO','ARCHIVIATO'].includes(x.status)&&['DICO_ELETTRICO','DICO_IDRICO','DIRI','ALLEGATI_GAS','POS','CAD'].includes(x.type)&&!linked.has(x.id)).map(x=>({id:x.id,type:x.type,clientId:x.clientId,siteId:x.siteId}));
 for(const link of links){
  try{D.validate({version:1,links:[link]},docs,tree)}
  catch(e){report.inconsistent.push({documentId:link.documentId||'',reason:String(e.message)})}
 }
 try{D.validate(state,docs,tree);report.valid=true}catch(e){report.issues.push(String(e.message))}
 report.linked=links.length;
 for(const x of docs.items){if(linked.has(x.id))report.byType[x.type]=(report.byType[x.type]||0)+1}
 return report;
}
function attachBatch(state,queue,master,refs){
 if(!Array.isArray(refs)||refs.length===0||refs.length>500)throw Error('LOTTO_NON_VALIDO');
 let next=D.validate(state,queue,master);
 for(const ref of refs)next=D.attach(next,queue,master,ref);
 return next;
}
function detach(state,queue,master,documentId,reason,operator){
 const current=D.validate(state,queue,master);
 if(typeof reason!=='string'||reason.trim().length<8||reason.length>1000)throw Error('MOTIVO_OBBLIGATORIO');
 if(typeof operator!=='string'||!operator.trim()||operator.length>120)throw Error('OPERATORE_OBBLIGATORIO');
 if(!current.links.some(x=>x.documentId===documentId))throw Error('DOCUMENTO_NON_COLLEGATO');
 const next={version:1,links:current.links.filter(x=>x.documentId!==documentId)};
 return {state:D.validate(next,queue,master),audit:{operation:'DISTACCO',documentId,reason:reason.trim(),operator:operator.trim()}};
}
function previewBatch(state,queue,master,refs){
 try{const next=attachBatch(state,queue,master,refs);return {ok:true,added:next.links.length-state.links.length,errors:[],state:next}}
 catch(e){return {ok:false,added:0,errors:[String(e.message)],state:clone(state)}}
}
const api=Object.freeze({preflight,attachBatch,previewBatch,detach});
root.ITETechnicalDossierLifecycle=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
