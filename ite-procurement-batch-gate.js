/* I.T.E. 4.0 — pure batch acceptance gate for reviewed supplier documents.
 * No storage, PDF access, network requests or automatic approval.
 */
(function(root){'use strict';
const review=typeof module!=='undefined'&&module.exports?require('./ite-procurement-review.js'):root.ITEProcurementReview;
const str=v=>String(v??'').trim();
const types=new Set(['Preventivo fornitore','Offerta fornitore','Fattura acquisto']);
function validateBatch(documents){
 if(!Array.isArray(documents))throw Error('Elenco documenti non valido');
 const issues=[],ids=new Set(),quotes=new Map(),invoices=[];
 for(const [i,doc] of documents.entries()){
  const id=str(doc?.id),supplier=str(doc?.supplierId),type=str(doc?.type),prefix='DOCUMENT:'+i+':';
  if(!id||ids.has(id))issues.push(prefix+'ID_MISSING_OR_DUPLICATE');
  if(id)ids.add(id);
  if(!types.has(type))issues.push(prefix+'TYPE_UNSUPPORTED');
  const validation=review.validate(doc);
  validation.issues.forEach(issue=>issues.push(prefix+issue));
  if(review.needsReview(doc)||doc?.review?.status!=='confirmed'||!str(doc?.review?.operator)||!str(doc?.review?.reviewedAt))issues.push(prefix+'NOT_MANUALLY_CONFIRMED');
  if(type==='Preventivo fornitore'||type==='Offerta fornitore')quotes.set(id,{doc,index:i});
  if(type==='Fattura acquisto')invoices.push({doc,index:i,supplier});
 }
 for(const {doc,index,supplier} of invoices){
  const link=str(doc.supplierQuoteId),prefix='DOCUMENT:'+index+':';
  if(!link){issues.push(prefix+'QUOTE_LINK_MISSING');continue}
  const quote=quotes.get(link);
  if(!quote){issues.push(prefix+'QUOTE_NOT_FOUND');continue}
  if(str(quote.doc.supplierId)!==supplier)issues.push(prefix+'SUPPLIER_MISMATCH');
 }
 return {valid:issues.length===0,issues,documentCount:documents.length,quoteCount:quotes.size,invoiceCount:invoices.length};
}
function buildReport(documents){
 const result=validateBatch(documents);
 const lines=documents.map((doc,index)=>({
  index,id:str(doc?.id),type:str(doc?.type),supplierId:str(doc?.supplierId),
  quoteId:str(doc?.supplierQuoteId),articleCount:Array.isArray(doc?.lines)?doc.lines.length:0,
  reviewer:str(doc?.review?.operator),reviewedAt:str(doc?.review?.reviewedAt),
  status:result.issues.some(issue=>issue.startsWith('DOCUMENT:'+index+':'))?'requires_attention':'validated'
 }));
 return {...result,lines,readOnly:true,persisted:false,exportable:result.valid};
}
function exportSnapshot(documents){
 const report=buildReport(documents);
 if(!report.valid)throw Error('Blocco esportazione: '+report.issues.join(', '));
 // Only explicitly reviewed normalized business fields, never original PDF bytes or source text.
 return {schema:'ite-supplier-reviewed-batch-v1',documents:documents.map(doc=>({
  id:str(doc.id),type:str(doc.type),supplierId:str(doc.supplierId),
  ...(doc.type==='Fattura acquisto'?{supplierQuoteId:str(doc.supplierQuoteId)}:{}),
  lines:doc.lines.map(line=>({code:str(line.code),qty:Number(String(line.qty).replace(',','.')),unitPrice:review.cents(line.unitPrice)/100})),
  review:{status:'confirmed',operator:str(doc.review.operator),reviewedAt:str(doc.review.reviewedAt),source:'manual'}
 }))};
}
function importSnapshot(snapshot){
 if(snapshot?.schema!=='ite-supplier-reviewed-batch-v1'||!Array.isArray(snapshot.documents))throw Error('Formato snapshot non supportato');
 const documents=snapshot.documents.map(doc=>({...doc,lines:Array.isArray(doc.lines)?doc.lines.map(line=>({...line})):[],review:{...doc.review}}));
 const result=validateBatch(documents);
 if(!result.valid)throw Error('Snapshot non valido: '+result.issues.join(', '));
 return {documents,report:buildReport(documents),persisted:false};
}
const api=Object.freeze({validateBatch,buildReport,exportSnapshot,importSnapshot});
root.ITEProcurementBatchGate=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
