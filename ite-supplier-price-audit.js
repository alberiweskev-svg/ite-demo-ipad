/* I.T.E. 4.0 — supplier quotation vs invoice price audit.
 * Deterministic read-only comparison. No invoice posting or stock movement.
 * Only compare supplier net unit prices, excluding VAT and shipping.
 */
(function(root){'use strict';
const clean=v=>String(v??'').trim();
const norm=v=>clean(v).normalize('NFKC').toUpperCase().replace(/\s+/g,' ');
const cents=v=>{if(typeof v==='number')return Number.isFinite(v)?Math.round(v*100):null;
 const s=clean(v).replace(/\s/g,'');if(!s)return null;
 const normalized=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s;
 return /^-?\d+(?:\.\d+)?$/.test(normalized)?Math.round(Number(normalized)*100):null;};
function articleKey(row){return norm(row.brand||row.producer)+'|'+norm(row.code||row.manufacturerCode)+'|'+norm(row.unit||'PZ')}
function compare(quote,invoice,{toleranceCents=1}={}){
 if(!quote||!invoice||!Array.isArray(quote.lines)||!Array.isArray(invoice.lines))throw Error('Documenti o righe non validi');
 if(!clean(quote.supplierId)||norm(quote.supplierId)!==norm(invoice.supplierId))throw Error('Fornitore diverso o non identificato');
 if(!Number.isInteger(toleranceCents)||toleranceCents<0)throw Error('Tolleranza non valida');
 const q=new Map(),used=new Set(),rows=[],issues=[];
 for(const [i,line] of quote.lines.entries()){
  const key=articleKey(line),price=cents(line.netUnitPrice);
  if(!norm(line.brand||line.producer)||!norm(line.code||line.manufacturerCode)||price===null||price<0){issues.push({type:'QUOTE_INVALID',line:i+1});continue}
  if(q.has(key)){issues.push({type:'QUOTE_DUPLICATE',line:i+1,key});continue}
  q.set(key,{line,price});
 }
 for(const [i,line] of invoice.lines.entries()){
  const key=articleKey(line),price=cents(line.netUnitPrice),qty=Number(line.quantity);
  if(!norm(line.brand||line.producer)||!norm(line.code||line.manufacturerCode)||price===null||price<0||!Number.isFinite(qty)||qty<=0){issues.push({type:'INVOICE_INVALID',line:i+1});continue}
  if(used.has(key)){issues.push({type:'INVOICE_DUPLICATE',line:i+1,key});continue}
  used.add(key);
  const original=q.get(key);
  if(!original){rows.push({key,status:'NOT_IN_QUOTE',invoiceUnitCents:price,quantity:qty});continue}
  const diff=price-original.price,percent=original.price===0?null:Math.round(diff/original.price*10000)/100;
  const status=Math.abs(diff)<=toleranceCents?'UNCHANGED':diff>0?'INCREASE':'DECREASE';
  rows.push({key,status,quotedUnitCents:original.price,invoiceUnitCents:price,differenceUnitCents:diff,
   differencePercent:percent,quantity:qty,estimatedLineDifferenceCents:Math.round(diff*qty),
   quoteQuantity:Number(original.line.quantity),quantityChanged:Number(original.line.quantity)!==qty});
 }
 for(const [key,entry] of q)if(!used.has(key))rows.push({key,status:'NOT_IN_INVOICE',quotedUnitCents:entry.price});
 const increases=rows.filter(x=>x.status==='INCREASE');
 return {quoteId:clean(quote.documentId),invoiceId:clean(invoice.documentId),supplierId:clean(quote.supplierId),
  rows,issues,increases:increases.length,estimatedIncreaseCents:increases.reduce((s,x)=>s+Math.max(0,x.estimatedLineDifferenceCents||0),0),
  quoteValidUntil:clean(quote.validUntil),invoiceDate:clean(invoice.date),readOnly:true,stockChanged:false,
  requiresReview:issues.length>0||rows.some(x=>x.status!=='UNCHANGED'||x.quantityChanged),
  warning:'Confronto netto unitario: verificare sconti, quantità, condizioni, scadenza offerta e corrispondenza codici prima di contestare.'};
}
const api=Object.freeze({compare,cents,articleKey});root.ITESupplierPriceAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
