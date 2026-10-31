/* I.T.E. 4.0 - Material import workflow: deterministic, read-only preflight.
 * Requires ite-material-import.js and ite-material-receipts.js.
 * No stock or catalogue writes are performed here.
 */
(function(root){'use strict';
const importApi=typeof require==='function'&&typeof module!=='undefined'&&module.exports?require('./ite-material-import.js'):root.ITEMaterialImport;
const receiptApi=typeof require==='function'&&typeof module!=='undefined'&&module.exports?require('./ite-material-receipts.js'):root.ITEMaterialReceiptReconciliation;
function plan(mode,articles,documents,loadHistory=[]){
 const preview=importApi.prepare(mode,articles,documents);
 if(mode==='catalogue')return {mode,preview,receipts:null,canConfirm:preview.issues.length===0&&preview.rows.length>0,readOnly:true,stockChanged:false};
 if(!Array.isArray(loadHistory))throw Error('Storico carichi non valido');
 const receipts=receiptApi.reconcile(preview,loadHistory);
 return {mode,preview,receipts,canConfirm:receipts.readyToConfirm,readOnly:true,stockChanged:false};
}
const api=Object.freeze({plan});
root.ITEMaterialWorkflow=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
