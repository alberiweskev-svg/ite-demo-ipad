/* I.T.E. 4.0 — supplier quote/invoice reconciliation (read-only).
 * Monetary unit = 1/100000 EUR to preserve five-decimal cable prices.
 * No real supplier/customer records or PDFs embedded in this module.
 */
(function(root){'use strict';
const norm=v=>String(v??'').trim().normalize('NFKC').toUpperCase().replace(/\s+/g,' ');
function decimal(v){
 if(v===null||v===undefined||String(v).trim()==='')return null;
 let s=String(v).trim().replace(/\s/g,'');
 if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
 if(!/^\d+(?:\.\d{1,5})?$/.test(s))return null;
 const [whole,fraction='']=s.split('.');
 const n=BigInt(whole)*100000n+BigInt((fraction+'00000').slice(0,5));
 return n<=BigInt(Number.MAX_SAFE_INTEGER)?Number(n):null;
}
const money5=v=>(v/100000).toFixed(5);
function key(line){return [norm(line.brand),norm(line.code),norm(line.unit||'PZ')].join('|')}
function prepare(doc,type){
 if(!doc||!Array.isArray(doc.lines)||!norm(doc.supplierId)||!norm(doc.documentId))throw Error(type+': intestazione documento non valida');
 const map=new Map(),issues=[];
 doc.lines.forEach((line,index)=>{
  const id=key(line),price=decimal(line.netUnitPrice),quantity=decimal(line.quantity);
  if(!norm(line.brand)||!norm(line.code)||price===null||quantity===null||quantity<=0){issues.push({type:type+'_INVALID',line:index+1});return}
  if(map.has(id)){issues.push({type:type+'_DUPLICATE',line:index+1,key:id});return}
  map.set(id,{line,price,quantity});
 });
 return {map,issues};
}
function compare(quote,invoice){
 if(norm(quote?.supplierId)!==norm(invoice?.supplierId)||!norm(quote?.supplierId))throw Error('Fornitori differenti');
 const q=prepare(quote,'QUOTE'),f=prepare(invoice,'INVOICE'),rows=[],issues=[...q.issues,...f.issues];
 for(const [id,item] of f.map){
  const original=q.map.get(id);
  if(!original){rows.push({key:id,status:'EXTRA',invoiceUnitPrice:money5(item.price)});continue}
  const diff=item.price-original.price,delta=Number((BigInt(diff)*BigInt(item.quantity)+50000n)/100000n);
  const quantityChanged=item.quantity!==original.quantity;
  rows.push({key:id,status:diff>0?'INCREASE':diff<0?'DECREASE':'UNCHANGED',
   quotedUnitPrice:money5(original.price),invoiceUnitPrice:money5(item.price),
   unitDifference:money5(diff),quantity:money5(item.quantity),
   quantityChanged,estimatedDifferenceCents:Math.round(delta/1000),
   percentage:original.price===0?null:Math.round(diff/original.price*10000)/100});
 }
 for(const [id,item] of q.map)if(!f.map.has(id))rows.push({key:id,status:'MISSING',quotedUnitPrice:money5(item.price)});
 const expired=!!(quote.validUntil&&invoice.date&&/^\d{4}-\d\d-\d\d$/.test(quote.validUntil)&&/^\d{4}-\d\d-\d\d$/.test(invoice.date)&&invoice.date>quote.validUntil);
 return {quoteId:quote.documentId,invoiceId:invoice.documentId,supplierId:quote.supplierId,rows,issues,quoteExpiredAtInvoice:expired,
  increases:rows.filter(r=>r.status==='INCREASE').length,
  estimatedNetIncreaseCents:rows.filter(r=>r.status==='INCREASE').reduce((s,r)=>s+Math.max(0,r.estimatedDifferenceCents),0),
  readOnly:true,stockChanged:false,requiresReview:true,
  warning:'Prezzi netti confrontati al netto di IVA/trasporto; verificare sconti, unità, quantità e validità offerta. Nessuna fattura registrata.'};
}
const api=Object.freeze({compare,decimal,key});root.ITESupplierReconciliation=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
