/* I.T.E. 4.0 - Procurement reconciliation: deterministic, read-only, synthetic-testable. */
(function(root){'use strict';
const txt=v=>String(v??'').trim(),arr=v=>Array.isArray(v)?v:[],own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function money(v){if(v===null||v===undefined||v===''||typeof v==='boolean')return null;const n=typeof v==='number'?v:Number(String(v).replace(',','.'));return Number.isFinite(n)&&n>=0&&Math.round(n*100)<=Number.MAX_SAFE_INTEGER?Math.round(n*100):null}
function analyze(quotes,invoices){
 const issues=[],records=[],index=new Map(),seenInvoices=new Set();
 for(const q of arr(quotes)){const id=txt(q?.id);if(!id||index.has(id)){issues.push({code:'DUPLICATE_OR_MISSING_QUOTE_ID',id});continue}index.set(id,q)}
 for(const invoice of arr(invoices)){
  const id=txt(invoice?.id),quoteId=txt(invoice?.supplierQuoteId||invoice?.supplier_quote_id),differences=[];
  if(!id||seenInvoices.has(id)){issues.push({code:'DUPLICATE_OR_MISSING_INVOICE_ID',id});continue}seenInvoices.add(id);
  const record={invoiceId:id,quoteId,status:'NON_ASSOCIATA',differences};
  records.push(record);
  if(!quoteId)continue;
  const q=index.get(quoteId);
  if(!q){record.status='PREVENTIVO_ASSENTE';issues.push({code:'QUOTE_NOT_FOUND',invoiceId:id,quoteId});continue}
  const supplier=txt(invoice.supplierId||invoice.supplier_id),expected=txt(q.supplierId||q.supplier_id);
  if(!supplier||!expected||supplier!==expected){record.status='FORNITORE_DIVERSO';issues.push({code:'SUPPLIER_MISMATCH',invoiceId:id,quoteId});continue}
  const qlines=new Map(),seen=new Set();let invalid=false;
  for(const line of arr(q.lines)){
   const code=txt(line?.code||line?.sku),price=money(line?.unitPrice);
   if(!code||qlines.has(code)||price===null){invalid=true;issues.push({code:'INVALID_QUOTE_LINE',quoteId,article:code});continue}
   qlines.set(code,price)
  }
  for(const line of arr(invoice.lines)){
   const code=txt(line?.code||line?.sku),price=money(line?.unitPrice);
   if(!code||seen.has(code)||price===null){invalid=true;issues.push({code:'INVALID_INVOICE_LINE',invoiceId:id,article:code});continue}
   seen.add(code);
   if(!qlines.has(code)){differences.push({code,kind:'NUOVO_ARTICOLO'});continue}
   const old=qlines.get(code),delta=price-old;
   if(delta!==0)differences.push({code,kind:delta>0?'AUMENTO':'RIDUZIONE',oldPrice:old/100,newPrice:price/100,delta:delta/100,percent:old===0?null:Math.round(delta/old*10000)/100})
  }
  for(const code of qlines.keys())if(!seen.has(code))differences.push({code,kind:'NON_FATTURATO'});
  record.status=invalid?'DATI_DA_VERIFICARE':differences.length?'DIFFERENZE':'CONFORME';
  if(differences.length)issues.push({code:'PRICE_DIFFERENCES',invoiceId:id,count:differences.length})
 }
 const summary={quotes:arr(quotes).length,invoices:arr(invoices).length,conformi:records.filter(r=>r.status==='CONFORME').length,daVerificare:records.filter(r=>r.status!=='CONFORME').length,aumenti:records.reduce((n,r)=>n+r.differences.filter(d=>d.kind==='AUMENTO').length,0),riduzioni:records.reduce((n,r)=>n+r.differences.filter(d=>d.kind==='RIDUZIONE').length,0)};
 return {records,issues,summary,readOnly:true,changesApplied:false};
}
const api=Object.freeze({analyze});root.ITEProcurementAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
