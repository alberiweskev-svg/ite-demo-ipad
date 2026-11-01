/* I.T.E. 4.0 — conservative staging of supplier PDF text, never auto-approve.
 * Accepts extracted text, NOT PDF bytes. OCR/scanned documents require a separate extractor.
 */
(function(root){'use strict';
const review=typeof module!=='undefined'&&module.exports?require('./ite-procurement-review.js'):root.ITEProcurementReview;
const clean=v=>String(v??'').trim();
function amount(v){const s=clean(v).replace(/\s/g,'');if(!/^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$|^\d+(?:[.,]\d{1,2})?$/.test(s))return null;const normalized=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s;const n=Number(normalized);return Number.isFinite(n)&&n>=0?n:null}
function stage({id,type,supplierId,text,sourceName}={}){
 const issues=[],lines=[],rejected=[],seen=new Set();const raw=clean(text);
 if(!raw)issues.push('EMPTY_EXTRACTED_TEXT');
 if(!['Preventivo fornitore','Offerta fornitore','Fattura acquisto'].includes(type))issues.push('UNSUPPORTED_DOCUMENT_TYPE');
 if(!clean(id))issues.push('DOCUMENT_ID_MISSING');
 if(!clean(supplierId))issues.push('SUPPLIER_ID_MISSING');
 // Deliberately strict: CODE | QUANTITY | UNIT PRICE, one item per row.
 // Unstructured PDF layouts are flagged for manual transcription, not guessed.
 const rows=raw.split(/\r?\n/);
 for(let i=0;i<rows.length;i++){
  const row=rows[i].trim();if(!row)continue;
  if(!row.includes('|'))continue;
  const parts=row.split('|').map(clean);
  if(![3,4].includes(parts.length)||!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(parts[0])){
   rejected.push({row:i+1,reason:'FORMAT_NON_RICONOSCIUTO'});continue;
  }
  const qty=amount(parts[1]),unitPrice=amount(parts[2]);
  if(qty===null||qty<=0||unitPrice===null){rejected.push({row:i+1,reason:'QUANTITA_O_PREZZO_NON_VALIDO'});continue}
  if(seen.has(parts[0])){rejected.push({row:i+1,reason:'CODICE_ARTICOLO_DUPLICATO',code:parts[0]});continue}
  if(parts.length===4){
   const total=amount(parts[3]);
   if(total===null||Math.abs(Math.round(qty*unitPrice*100)-Math.round(total*100))>1){
    rejected.push({row:i+1,reason:'TOTALE_RIGA_NON_COINCIDE',code:parts[0]});continue
   }
  }
  seen.add(parts[0]);lines.push({code:parts[0],qty,unitPrice});
 }
 if(!lines.length)issues.push('NO_STRUCTURED_LINES');
 if(raw&&!rows.some(row=>row.includes('|')))issues.push('MANUAL_TRANSCRIPTION_REQUIRED');
 if(rejected.length)issues.push('LINES_REQUIRE_CORRECTION');
 const document={id:clean(id),type,supplierId:clean(supplierId),source:'pdf',importedFromPdf:true,sourceName:clean(sourceName),lines,review:{status:'pending'}};
 const validation=review.validate(document);
 return {document,issues:[...issues,...validation.issues],rejected,requiresManualConfirmation:true,readOnly:true};
}
const api=Object.freeze({stage,amount});root.ITEProcurementPdfStaging=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
