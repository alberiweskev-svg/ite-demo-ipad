/* I.T.E. 4.0 — cumulative supplier delivery and invoice exposure, read-only.
 * Multiple invoices can refer to one supplier quote. No implicit matching or storage.
 */
(function(root){'use strict';
const str=v=>String(v??'').trim();
function number(v){if(v===null||v===undefined||v===''||typeof v==='boolean')return null;const n=typeof v==='number'?v:Number(String(v).replace(',','.'));return Number.isFinite(n)&&n>=0&&n<=1000000000?n:null}
function cents(v){const n=number(v);return n===null||n>Number.MAX_SAFE_INTEGER/100?null:Math.round(n*100)}
function parseLines(doc,issues){
 const lines=new Map();
 if(!Array.isArray(doc?.lines)||!doc.lines.length){issues.push('LINES_MISSING:'+str(doc?.id));return lines}
 for(const [i,line] of doc.lines.entries()){
  const code=str(line?.code||line?.sku),qty=number(line?.qty??line?.quantity),price=cents(line?.unitPrice);
  if(!code||lines.has(code)||qty===null||qty<=0||price===null){issues.push('INVALID_LINE:'+str(doc.id)+':'+i);continue}
  lines.set(code,{qty,price});
 }
 return lines;
}
function analyze(documents){
 if(!Array.isArray(documents))throw Error('Elenco documenti non valido');
 const issues=[],quotes=new Map(),invoices=[],ids=new Set(),records=[];
 for(const doc of documents){
  const id=str(doc?.id),type=str(doc?.type),supplier=str(doc?.supplierId);
  if(!id||ids.has(id))issues.push('DUPLICATE_OR_MISSING_ID:'+id);
  ids.add(id);
  if(!supplier)issues.push('SUPPLIER_MISSING:'+id);
  if(doc?.review?.status!=='confirmed'||!str(doc?.review?.operator))issues.push('REVIEW_REQUIRED:'+id);
  const lines=parseLines(doc,issues);
  if(type==='Preventivo fornitore'||type==='Offerta fornitore')quotes.set(id,{id,supplier,lines});
  else if(type==='Fattura acquisto')invoices.push({id,supplier,quoteId:str(doc?.supplierQuoteId),lines});
  else issues.push('UNSUPPORTED_TYPE:'+id);
 }
 const grouped=new Map();
 for(const inv of invoices){
  const quote=quotes.get(inv.quoteId);
  if(!quote){issues.push('QUOTE_NOT_FOUND:'+inv.id);continue}
  if(inv.supplier!==quote.supplier){issues.push('SUPPLIER_MISMATCH:'+inv.id);continue}
  if(!grouped.has(quote.id))grouped.set(quote.id,[]);
  grouped.get(quote.id).push(inv);
 }
 for(const quote of quotes.values()){
  const related=grouped.get(quote.id)||[],totals=new Map(),extras=new Map();
  for(const inv of related)for(const [code,line] of inv.lines){
   const target=quote.lines.has(code)?totals:extras;
   const prev=target.get(code)||{qty:0,amountCents:0,invoiceIds:[]};
   prev.qty+=line.qty;prev.amountCents+=Math.round(line.qty*line.price);prev.invoiceIds.push(inv.id);target.set(code,prev);
  }
  const articles=[];
  for(const [code,line] of quote.lines){
   const actual=totals.get(code)||{qty:0,amountCents:0,invoiceIds:[]};
   const orderedCents=Math.round(line.qty*line.price);
   articles.push({code,orderedQty:line.qty,invoicedQty:actual.qty,remainingQty:Math.round((line.qty-actual.qty)*1000)/1000,orderedCents,invoicedCents:actual.amountCents,deltaCents:actual.amountCents-orderedCents,overInvoiced:actual.qty>line.qty+1e-9,invoiceIds:actual.invoiceIds});
  }
  for(const [code,actual] of extras)articles.push({code,orderedQty:0,invoicedQty:actual.qty,remainingQty:-actual.qty,orderedCents:0,invoicedCents:actual.amountCents,deltaCents:actual.amountCents,unquoted:true,overInvoiced:true,invoiceIds:actual.invoiceIds});
  records.push({quoteId:quote.id,supplierId:quote.supplier,invoiceIds:related.map(x=>x.id),articles,status:articles.some(x=>x.overInvoiced)?'ECCEDENZA':related.length?'PARZIALE_O_COMPLETO':'NON_FATTURATO'});
 }
 return {records,issues,valid:issues.length===0,readOnly:true,persisted:false};
}
const api=Object.freeze({analyze});root.ITEProcurementCumulativeAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
