/* I.T.E. 4.0 — deterministic human review gate for imported supplier documents.
 * Pure functions: no persistence, no OCR assumptions, no automatic approvals.
 */
(function(root){'use strict';
const str=v=>String(v??'').trim(),arr=v=>Array.isArray(v)?v:[];
function cents(v){if(v===null||v===undefined||v===''||typeof v==='boolean')return null;const n=typeof v==='number'?v:Number(String(v).replace(',','.'));return Number.isFinite(n)&&n>=0&&Math.round(n*100)<=Number.MAX_SAFE_INTEGER?Math.round(n*100):null}
function validate(doc){
 const issues=[],id=str(doc?.id),supplierId=str(doc?.supplierId||doc?.supplier_id||doc?.party?.supplierId);
 const lines=arr(doc?.lines||doc?.items),codes=new Set();
 if(!id)issues.push('DOCUMENT_ID_MISSING');
 if(!supplierId)issues.push('SUPPLIER_ID_MISSING');
 if(!lines.length)issues.push('LINES_MISSING');
 for(const [i,line] of lines.entries()){
  const code=str(line?.code||line?.sku),price=cents(line?.unitPrice),rawQty=line?.qty??line?.quantity,qty=typeof rawQty==='number'?rawQty:Number(String(rawQty??'').replace(',','.'));
  if(!code)issues.push('ARTICLE_CODE_MISSING:'+i);
  else if(codes.has(code))issues.push('ARTICLE_CODE_DUPLICATE:'+code);
  codes.add(code);
  if(price===null)issues.push('UNIT_PRICE_INVALID:'+i);
  if(rawQty===null||rawQty===undefined||rawQty===''||typeof rawQty==='boolean'||!Number.isFinite(qty)||qty<=0||qty>1000000000)issues.push('QUANTITY_INVALID:'+i);
 }
 return {valid:issues.length===0,issues};
}
function review(doc,operator,reviewedAt){
 const check=validate(doc);
 if(!check.valid)throw Error('Document requires correction: '+check.issues.join(','));
 if(!str(operator))throw Error('Reviewer required');
 if(typeof reviewedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(reviewedAt)||!Number.isFinite(Date.parse(reviewedAt)))throw Error('Valid timestamp required');
 const lines=arr(doc.lines||doc.items).map(line=>({...line,code:str(line.code||line.sku),unitPrice:cents(line.unitPrice)/100,qty:Number(String(line.qty??line.quantity).replace(',','.'))}));
 return {...doc,lines,review:{status:'confirmed',operator:str(operator),reviewedAt,source:'manual'}};
}
function needsReview(doc){
 const source=str(doc?.source||doc?.origin||doc?.importSource).toLowerCase();
 const imported=source==='pdf'||source==='import'||source==='ocr'||source==='pdf-import'||doc?.importedFromPdf===true;
 return imported&&!(doc?.review?.status==='confirmed'&&str(doc?.review?.operator)&&str(doc?.review?.reviewedAt));
}
const api=Object.freeze({validate,review,needsReview,cents});root.ITEProcurementReview=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
