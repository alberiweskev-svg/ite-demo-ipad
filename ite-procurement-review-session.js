/* I.T.E. 4.0 — local, non-persistent supplier quote/invoice review session.
 * No vault writes, no PDF storage, no implicit links or approvals.
 */
(function(root){'use strict';
const workspace=typeof module!=='undefined'&&module.exports?require('./ite-procurement-review-workspace.js'):root.ITEProcurementReviewWorkspace;
const bridge=typeof module!=='undefined'&&module.exports?require('./ite-procurement-document-bridge.js'):root.ITEProcurementDocumentBridge;
const prices=typeof module!=='undefined'&&module.exports?require('./ite-procurement-audit.js'):root.ITEProcurementAudit;
const quantities=typeof module!=='undefined'&&module.exports?require('./ite-procurement-quantity-audit.js'):root.ITEProcurementQuantityAudit;
const str=v=>String(v??'').trim();
function create(){return {documents:[],issues:[],readOnly:true,persisted:false}}
function add(session,prepared,lines,operator,at,quoteId){
 if(!session||!Array.isArray(session.documents))throw Error('Sessione non valida');
 const corrected=workspace.correct(prepared,lines);
 if(!corrected.ready)throw Error('Righe non valide: '+corrected.issues.join(', '));
 const doc=workspace.confirm(corrected,operator,at);
 if(session.documents.some(x=>x.id===doc.id))throw Error('ID documento duplicato');
 const linked={...doc,...(doc.type==='Fattura acquisto'?{supplierQuoteId:str(quoteId)}:{})};
 return {...session,documents:[...session.documents,linked]};
}
function inspect(session){
 if(!session||!Array.isArray(session.documents))throw Error('Sessione non valida');
 const extracted=bridge.extract({documents:session.documents});
 const q=extracted.quotes,i=extracted.invoices;
 // Both audit engines operate on explicit supplier/quote/article IDs only.
 const priceResult=prices.inspect?prices.inspect(q,i):null;
 const quantityResult=quantities.inspect?quantities.inspect(q,i):null;
 return {documents:session.documents.length,quotes:q.length,invoices:i.length,issues:extracted.issues,priceResult,quantityResult,readOnly:true,persisted:false};
}
const api=Object.freeze({create,add,inspect});
root.ITEProcurementReviewSession=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
