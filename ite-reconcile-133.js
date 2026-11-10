/* I.T.E. 4.0.133 — per-intervention reconciliation. TEST only, read-only. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const cents=n=>Math.round((Number(n)+Number.EPSILON)*100);
const euros=n=>Math.round(n)/100;
function reconcile(state,filters={}){
 const audit=root.ITE_Audit124.audit(state);
 if(!audit.ok)throw Error("AUDIT_NON_SUPERATO:"+audit.errors.join("|"));
 const C=root.ITE_Commercial122,c=state.field.catalog,m=state.commercial;
 const base=root.ITE_WorkOrders132.build(state,filters);
 const jobs=base.jobs.map(job=>{
  const appointment=c.appointments.find(a=>a.id===job.id);
  const match=x=>x.clientId===appointment.clientId&&x.siteId===appointment.siteId;
  const estimates=m.estimates.filter(match);
  const invoices=m.invoices.filter(match);
  const linked=x=>x.appointmentId===job.id;
  const directEstimates=estimates.filter(linked),directInvoices=invoices.filter(linked);
  const siteEstimates=estimates.filter(x=>!x.appointmentId),siteInvoices=invoices.filter(x=>!x.appointmentId);
  const extras=m.extras.filter(linked);
  const approved=extras.flatMap(e=>e.lines.filter(l=>Number(e.approved?.[l.id])>0).map(l=>({...l,quantity:Number(e.approved[l.id])})));
  const total=ls=>C.totals(ls);
  const estimateTotal=total(directEstimates.flatMap(e=>e.lines));
  const extraTotal=total(approved);
  const invoiceTotal=total(directInvoices.filter(i=>i.type==="VENDITA").flatMap(i=>i.lines));
  const creditTotal=total(directInvoices.filter(i=>i.type==="TD04").flatMap(i=>i.lines));
  const netBilled=euros(cents(invoiceTotal.gross)-cents(creditTotal.gross));
  const expected=euros(cents(estimateTotal.gross)+cents(extraTotal.gross));
  return {...job,reconciliation:{
   estimates:directEstimates.map(x=>({id:x.id,status:x.status,totals:total(x.lines)})),
   invoices:directInvoices.map(x=>({id:x.id,type:x.type,status:x.status,totals:clone(x.totals)})),
   siteUnassigned:{estimates:siteEstimates.map(x=>x.id),invoices:siteInvoices.map(x=>x.id)},
   totals:{estimate:estimateTotal,approvedExtras:extraTotal,sales:invoiceTotal,credits:creditTotal,netBilled,expected,difference:euros(cents(expected)-cents(netBilled))},
   warnings:[...(siteEstimates.length||siteInvoices.length?["DOCUMENTI_SEDE_NON_ATTRIBUITI"]:[]),
    ...(directEstimates.some(x=>x.status!=="ACCETTATO")?["PREVENTIVO_NON_ACCETTATO"]:[]),
    ...(directInvoices.some(x=>x.type==="TD04"&&!invoices.some(y=>y.id===x.originalId&&y.type==="VENDITA"))?["NOTA_CREDITO_ORIGINE_NON_COLLEGATA"]:[])]
  }};
 });
 return clone({revision:state.revision,count:jobs.length,jobs,notice:"I documenti senza appointmentId sono solo riferimenti di sede: mai conteggiati nel singolo intervento. Valori TEST, non contabilità ufficiale."});
}
function checkLinks(state){
 const c=state.field.catalog,m=state.commercial,issues=[];
 for(const group of ["estimates","invoices"]){
  for(const x of m[group])if(x.appointmentId){
   const ap=c.appointments.find(a=>a.id===x.appointmentId);
   if(!ap||ap.clientId!==x.clientId||ap.siteId!==x.siteId)issues.push({group,id:x.id,code:"COLLEGAMENTO_INTERVENTO_NON_VALIDO"});
  }
 }
 return issues;
}
const api=Object.freeze({reconcile,checkLinks});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_Reconcile133=api;
})(typeof globalThis!=="undefined"?globalThis:this);
