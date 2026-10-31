/* I.T.E. 4.0 — cautious document-to-procurement adapter.
 * Read-only. Explicit IDs, supplier and article codes required; never fuzzy-match PDFs.
 */
(function(root){'use strict';
const arr=v=>Array.isArray(v)?v:[],str=v=>String(v??'').trim();
const review=typeof module!=='undefined'&&module.exports?require('./ite-procurement-review.js'):root.ITEProcurementReview;
const quoteTypes=new Set(['Preventivo fornitore','Offerta fornitore']);
const invoiceTypes=new Set(['Fattura acquisto']);
function extract(commerce={}){
 const issues=[],quotes=[],invoices=[],seen=new Set(),sources=[];
 const all=[...arr(commerce.documents),...arr(commerce.supplierDocuments)];
 for(const doc of all){
  if(!doc||typeof doc!=='object')continue;
  const type=str(doc.type),isQuote=quoteTypes.has(type),isInvoice=invoiceTypes.has(type);
  if(!isQuote&&!isInvoice)continue;
  const id=str(doc.id);
  if(review.needsReview(doc)){issues.push({code:'IMPORTED_DOCUMENT_REVIEW_REQUIRED',id});continue}
  if(!id||seen.has(id)){issues.push({code:'DOCUMENT_ID_MISSING_OR_DUPLICATE',id});continue}seen.add(id);
  const supplierId=str(doc.supplierId||doc.supplier_id||doc.party?.supplierId);
  const rawLines=arr(doc.lines||doc.items);
  const lines=rawLines.map(x=>({code:str(x?.code||x?.sku),unitPrice:x?.unitPrice}));
  const validation=review.validate(doc);
  const ready=!!supplierId&&validation.valid;
  if(!ready){issues.push({code:'SUPPLIER_LINES_NEED_REVIEW',id,details:validation.issues});continue}
  if(isQuote){quotes.push({id,supplierId,lines});sources.push({id,type,source:'document',role:'quote'})}
  else {
   const supplierQuoteId=str(doc.supplierQuoteId||doc.supplier_quote_id||doc.procurement?.quoteId);
   if(!supplierQuoteId)issues.push({code:'EXPLICIT_QUOTE_LINK_MISSING',id});
   invoices.push({id,supplierId,supplierQuoteId,lines});
   sources.push({id,type,source:'document',role:'invoice'});
  }
 }
 return {quotes,invoices,issues,sources,readOnly:true,requiresManualConfirmation:true};
}
function merge(commerce={}){
 const extracted=extract(commerce),issues=[...extracted.issues];
 const q=new Map(),i=new Map();
 for(const item of arr(commerce.supplierQuotes||commerce.supplier_quotes)){const id=str(item?.id);if(!id||q.has(id)){issues.push({code:'DUPLICATE_QUOTE',id});continue}q.set(id,item)}
 for(const item of arr(commerce.purchaseInvoices||commerce.purchase_invoices)){const id=str(item?.id);if(!id||i.has(id)){issues.push({code:'DUPLICATE_INVOICE',id});continue}i.set(id,item)}
 for(const item of extracted.quotes){if(q.has(item.id))issues.push({code:'QUOTE_SOURCE_COLLISION',id:item.id});else q.set(item.id,item)}
 for(const item of extracted.invoices){if(i.has(item.id))issues.push({code:'INVOICE_SOURCE_COLLISION',id:item.id});else i.set(item.id,item)}
 return {quotes:[...q.values()],invoices:[...i.values()],issues,sources:extracted.sources,readOnly:true};
}
const api=Object.freeze({extract,merge});root.ITEProcurementDocumentBridge=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
