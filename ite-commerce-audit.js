/* I.T.E. 4.0 — audit contabile non distruttivo: riconciliazione, scadenziario e cassa. */
(function(root){'use strict';
const Ledger=root.ITECommerceLedger||(typeof require==='function'?require('./ite-commerce-ledger.js'):null);
const Commerce=root.ITECommerce||(typeof require==='function'?require('./ite-commerce.js'):null);
const dateOK=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const copy=o=>JSON.parse(JSON.stringify(o));
function audit(ledger,commerce,options={}){
 Ledger.validate(ledger,commerce);
 const asOf=options.asOf||new Date().toISOString().slice(0,10);
 if(!dateOK(asOf))throw Error('DATA_NON_VALIDA');
 const entries=ledger.entries.filter(e=>e.date<=asOf);
 const report={asOf,documents:[],warnings:[],totals:{receivablesCents:0,payablesCents:0,creditsToRecoverCents:0,settledCents:0},cashByMonth:[]};
 const months=new Map();
 for(const e of entries){
  const f=commerce.invoices.find(x=>x.id===e.invoiceId);
  const month=e.date.slice(0,7),sign=f.kind==='TD04'?-1:f.direction==='VENDITA'?1:-1;
  const row=months.get(month)||{month,incomingCents:0,outgoingCents:0,netCents:0};
  if(sign>0)row.incomingCents+=e.amountCents;else row.outgoingCents+=e.amountCents;
  row.netCents+=sign*e.amountCents;months.set(month,row);
 }
 for(const f of commerce.invoices){
  const paid=entries.filter(e=>e.invoiceId===f.id).reduce((a,e)=>a+e.amountCents,0);
  const remaining=f.totalCents-paid;
  const expected=f.kind==='TD04'?(paid===0?'DA_RECUPERARE':remaining===0?'RECUPERATA':'PARZIALMENTE_RECUPERATA'):(paid===0?'DA_PAGARE':remaining===0?'PAGATA':'PARZIALE');
  const row={invoiceId:f.id,number:f.number,kind:f.kind,direction:f.direction,totalCents:f.totalCents,settledCents:paid,remainingCents:remaining,expectedStatus:expected,storedStatus:f.status};
  report.documents.push(row);
  report.totals.settledCents+=paid;
  if(f.kind==='TD04')report.totals.creditsToRecoverCents+=remaining;
  else if(f.direction==='VENDITA')report.totals.receivablesCents+=remaining;
  else report.totals.payablesCents+=remaining;
  if(f.status!==expected)report.warnings.push({code:'STATO_NON_ALLINEATO',invoiceId:f.id,stored:f.status,expected});
  if(f.kind==='PROFORMA'&&paid>0)report.warnings.push({code:'PAGAMENTO_SU_PROFORMA_DA_VERIFICARE',invoiceId:f.id});
 }
 report.cashByMonth=[...months.values()].sort((a,b)=>a.month.localeCompare(b.month));
 return copy(report);
}
function proposeStatuses(ledger,commerce,options={}){
 const report=audit(ledger,commerce,options);
 return {asOf:report.asOf,proposals:report.warnings.filter(w=>w.code==='STATO_NON_ALLINEATO').map(w=>({invoiceId:w.invoiceId,from:w.stored,to:w.expected})),applied:false};
}
const api=Object.freeze({audit,proposeStatuses});
root.ITECommerceAudit=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
