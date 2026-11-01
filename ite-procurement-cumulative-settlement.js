/* I.T.E. 4.0 — read-only cumulative supplier settlement.
 * Requires manually confirmed documents; never posts stock, payments or invoices.
 */
(function(root){'use strict';
const gate=typeof module!=='undefined'&&module.exports?require('./ite-procurement-batch-gate.js'):root.ITEProcurementBatchGate;
const cumulative=typeof module!=='undefined'&&module.exports?require('./ite-procurement-cumulative-audit.js'):root.ITEProcurementCumulativeAudit;
const round=v=>Math.round((v+Number.EPSILON)*1000)/1000;
function inspect(documents){
 const validation=gate.buildReport(documents);
 const analysis=cumulative.analyze(documents);
 const issues=[...new Set([...validation.issues,...analysis.issues])];
 // Never present unvalidated monetary totals as approved commercial figures.
 if(issues.length)return {valid:false,blocked:true,issues,quotes:[],totals:null,readOnly:true,persisted:false};
 const quotes=analysis.records.map(record=>{
  const rows=record.articles.map(a=>{
   const remainingQty=round(a.orderedQty-a.invoicedQty);
   const orderedCents=a.orderedCents,invoicedCents=a.invoicedCents;
   return {code:a.code,orderedQty:a.orderedQty,invoicedQty:a.invoicedQty,remainingQty,
    orderedCents,invoicedCents,unquoted:!!a.unquoted,overInvoiced:!!a.overInvoiced,
    invoiceIds:[...a.invoiceIds],
    state:a.unquoted?'NON_PREVISTO':a.overInvoiced?'ECCEDENZA':a.invoicedQty===0?'NON_FATTURATO':remainingQty>0?'PARZIALE':'COMPLETO'};
  });
  const sum=key=>rows.reduce((n,r)=>n+r[key],0);
  const orderedCents=sum('orderedCents'),invoicedCents=sum('invoicedCents');
  return {quoteId:record.quoteId,supplierId:record.supplierId,invoiceIds:[...record.invoiceIds],rows,
   orderedCents,invoicedCents,deltaCents:invoicedCents-orderedCents,
   status:rows.some(r=>r.overInvoiced)?'DA_VERIFICARE':rows.every(r=>r.state==='COMPLETO')?'COMPLETO':record.invoiceIds.length?'PARZIALE':'NON_FATTURATO'};
 });
 const sum=key=>quotes.reduce((n,q)=>n+q[key],0);
 return {valid:true,blocked:false,issues:[],quotes,
  totals:{quoteCount:quotes.length,invoiceCount:validation.invoiceCount,orderedCents:sum('orderedCents'),
   invoicedCents:sum('invoicedCents'),deltaCents:sum('deltaCents'),
   excessQuotes:quotes.filter(q=>q.status==='DA_VERIFICARE').length},
  readOnly:true,persisted:false};
}
const api=Object.freeze({inspect});root.ITEProcurementCumulativeSettlement=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
