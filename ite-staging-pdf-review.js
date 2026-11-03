/* I.T.E. 4.0 — conservative local PDF review for the document staging register.
 * No PDF bytes or extracted text are persisted or transmitted.
 */
(function(root){'use strict';
const Intake=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const Review=root.ITEDocumentReview||(typeof require==='function'?require('./ite-document-review.js'):null);
function normalizeDate(value){
 const s=String(value||'').trim(),m=s.match(/^(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})$/);
 if(!m)return null;const date=m[3]+'-'+m[2]+'-'+m[1];
 const parsed=new Date(date+'T12:00:00Z');return Number.isNaN(parsed.getTime())?null:parsed.toISOString().slice(0,10)===date?date:null;
}
function inspect(filename,text){
 if(!Intake||!Review)throw Error('MOTORI_DOCUMENTALI_NON_DISPONIBILI');
 const preview=Review.inspect(filename,text);
 const classified=Intake.classify(filename,text);
 const type=classified==='ALTRO'?null:classified;
 const date=preview.date?normalizeDate(preview.date):null;
 return Object.freeze({type,number:preview.number||null,date,pagesTextAvailable:text.trim().length>=20,
  requiresReview:true,warning:'Valori indicativi: verificare sul PDF originale prima di archiviare'});
}
const api=Object.freeze({normalizeDate,inspect});
root.ITEStagingPDFReview=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
