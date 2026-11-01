/* I.T.E. 4.0 — supplier document correction workspace, pure and local.
 * No PDF bytes, no persistence, no implicit confirmation.
 */
(function(root){'use strict';
const staging=typeof module!=='undefined'&&module.exports?require('./ite-procurement-pdf-staging.js'):root.ITEProcurementPdfStaging;
const review=typeof module!=='undefined'&&module.exports?require('./ite-procurement-review.js'):root.ITEProcurementReview;
const str=x=>String(x??'').trim();
function prepare(input){
 const result=staging.stage(input);
 return {document:result.document,issues:[...result.issues],rejected:[...result.rejected],sourceText:str(input?.text),ready:false};
}
function correct(workspace,lines){
 if(!workspace?.document||!Array.isArray(lines))throw Error('Revisione non valida');
 const copy=lines.map(x=>({code:str(x.code),qty:x.qty,unitPrice:x.unitPrice}));
 const candidate={...workspace.document,lines:copy,review:{status:'pending'}};
 const check=review.validate(candidate);
 return {...workspace,document:candidate,issues:check.issues,rejected:[],ready:check.valid};
}
function confirm(workspace,operator,timestamp){
 if(!workspace?.ready)throw Error('Correggere e validare tutte le righe prima della conferma');
 const check=review.validate(workspace.document);
 if(!check.valid)throw Error('Dati modificati dopo la validazione');
 return review.review(workspace.document,operator,timestamp);
}
function parseManual(text){
 const rows=str(text).split(/\r?\n/).filter(Boolean);
 return rows.map((row,i)=>{
  const parts=row.split('|').map(str);
  if(parts.length!==3)throw Error('Riga '+(i+1)+': usare CODICE | QUANTITÀ | PREZZO');
  return {code:parts[0],qty:parts[1],unitPrice:parts[2]};
 });
}
const api=Object.freeze({prepare,correct,confirm,parseManual});
root.ITEProcurementReviewWorkspace=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
