/* I.T.E. 4.0 — verify receipt documents before any warehouse load.
 * Read-only planning; no state mutation or inferred physical receipt.
 */
(function(root){'use strict';
const rows=x=>Array.isArray(x)?x:[];
const clean=x=>String(x??'').trim().toUpperCase();
const qty=x=>{const n=Number(x);if(!Number.isFinite(n)||n<=0||Math.abs(n*1000-Math.round(n*1000))>1e-7)throw Error('Quantità non valida');return n};
function reconcile(preview,history){
 if(preview?.mode!=='warehouse'||!Array.isArray(preview.rows)||!Array.isArray(history))throw Error('Anteprima o storico non validi');
 const issues=rows(preview.issues).map(message=>({code:'PREVIEW_ISSUE',message})),candidates=[],keys=new Set();
 const ledger=new Map();
 for(const h of history){
  const key=clean(h.documentId)+'|'+String(h.lineIndex)+'|'+clean(h.key);
  if(!h.documentId||!Number.isSafeInteger(h.lineIndex)||!h.key||ledger.has(key)){issues.push({code:'HISTORY_INVALID',message:'Storico importazioni duplicato o incompleto'});continue}
  ledger.set(key,h);
 }
 for(const row of preview.rows){
  const ref={documentId:row.documentId,lineIndex:row.lineIndex,key:row.key},id=clean(row.documentId)+'|'+row.lineIndex+'|'+clean(row.key);
  if(keys.has(id)){issues.push({...ref,code:'DUPLICATE_BATCH',message:'Riga duplicata nel lotto'});continue}
  keys.add(id);
  try{qty(row.quantity)}catch(e){issues.push({...ref,code:'QUANTITY',message:e.message});continue}
  if(row.documentKind!=='DDT'&&row.documentKind!=='FATTURA_ACQUISTO'){issues.push({...ref,code:'SOURCE',message:'Documento non ammesso'});continue}
  if(!row.received){issues.push({...ref,code:'NOT_RECEIVED',message:'Merce non confermata come ricevuta'});continue}
  if(ledger.has(id)){issues.push({...ref,code:'ALREADY_LOADED',message:'Documento e riga già caricati'});continue}
  if(row.documentKind==='FATTURA_ACQUISTO'&&row.linkedDdtId){
   const ddt=clean(row.linkedDdtId);
   if(history.some(h=>clean(h.documentId)===ddt&&clean(h.key)===clean(row.key))){
    issues.push({...ref,code:'DDT_ALREADY_LOADED',message:'Articolo già caricato dal DDT collegato'});continue;
   }
   issues.push({...ref,code:'DDT_RECONCILIATION',message:'Fattura collegata a DDT: verificare corrispondenza e quantità prima del carico'});continue;
  }
  candidates.push({...ref,documentKind:row.documentKind,quantity:row.quantity,article:row.article,existingId:row.existingId});
 }
 return {candidates,issues,readOnly:true,stockChanged:false,requiresExplicitConfirmation:true,
  readyToConfirm:issues.length===0&&candidates.length>0};
}
const api=Object.freeze({reconcile});
root.ITEMaterialReceiptReconciliation=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
