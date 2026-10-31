/* I.T.E. 4.0 — supplier quantity and total reconciliation, read-only. */
(function(root){'use strict';
const arr=v=>Array.isArray(v)?v:[],txt=v=>String(v??'').trim();
function decimal(v){if(v===null||v===undefined||v===''||typeof v==='boolean')return null;const n=typeof v==='number'?v:Number(String(v).replace(',','.'));return Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER?n:null}
function audit(quotes,invoices){
 const issues=[],records=[],index=new Map();
 for(const q of arr(quotes)){const id=txt(q?.id);if(!id||index.has(id)){issues.push({code:'QUOTE_ID_INVALID',id});continue}index.set(id,q)}
 for(const invoice of arr(invoices)){
  const invoiceId=txt(invoice?.id),quoteId=txt(invoice?.supplierQuoteId||invoice?.supplier_quote_id),differences=[];
  const record={invoiceId,quoteId,status:'NON_ASSOCIATA',differences};records.push(record);
  if(!quoteId)continue;
  const quote=index.get(quoteId);
  if(!quote){record.status='PREVENTIVO_ASSENTE';continue}
  if(!txt(invoice?.supplierId||invoice?.supplier_id)||txt(invoice.supplierId||invoice.supplier_id)!==txt(quote.supplierId||quote.supplier_id)){record.status='FORNITORE_DIVERSO';continue}
  const qlines=new Map(),ilines=new Map();let invalid=false;
  for(const [doc,lines,map] of [['quote',quote.lines,qlines],['invoice',invoice.lines,ilines]]){
   for(const line of arr(lines)){
    const code=txt(line?.code||line?.sku),quantity=decimal(line?.qty??line?.quantity),price=decimal(line?.unitPrice);
    if(!code||map.has(code)||quantity===null||price===null){issues.push({code:'INVALID_LINE',document:doc,invoiceId,quoteId,article:code});invalid=true;continue}
    map.set(code,{quantity,price});
   }
  }
  for(const [code,line] of ilines){
   const original=qlines.get(code);
   if(!original){differences.push({code,kind:'NUOVO_ARTICOLO'});continue}
   const qDelta=Math.round((line.quantity-original.quantity)*1000)/1000;
   if(qDelta!==0)differences.push({code,kind:qDelta>0?'QUANTITA_AUMENTATA':'QUANTITA_RIDOTTA',oldQuantity:original.quantity,newQuantity:line.quantity,deltaQuantity:qDelta});
   const pDelta=Math.round((line.price-original.price)*100)/100;
   if(pDelta!==0)differences.push({code,kind:pDelta>0?'PREZZO_AUMENTATO':'PREZZO_RIDOTTO',oldPrice:original.price,newPrice:line.price,deltaPrice:pDelta});
  }
  for(const code of qlines.keys())if(!ilines.has(code))differences.push({code,kind:'NON_FATTURATO'});
  record.status=invalid?'DATI_DA_VERIFICARE':differences.length?'DIFFERENZE':'CONFORME';
 }
 return {records,issues,readOnly:true,changesApplied:false};
}
const api=Object.freeze({audit});root.ITEProcurementQuantityAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
