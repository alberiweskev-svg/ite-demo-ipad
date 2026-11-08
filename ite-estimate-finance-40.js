/* I.T.E. 4.0.78 — Preventivi/Extra TEST: approvazioni parziali e riconciliazione contabile. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-finance-workspace-40.js"):root.ITEFinanceWorkspace40);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEEstimateFinance40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(W){
"use strict";
const ID=/^TEST-[A-Z0-9-]{2,60}$/, TYPES=new Set(["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO"]), CATS=new Set(["IDRICO","RISCALDAMENTO","ELETTRICO","CONDIZIONAMENTO","OPERE_MURARIE","ALTRO"]);
function money(n){if(typeof n!=="number"||!Number.isFinite(n)||n<0||n>1e8||Math.abs(n*100-Math.round(n*100))>1e-6)throw Error("Importo non valido");return Math.round(n*100);}
function qty(n){if(typeof n!=="number"||!Number.isFinite(n)||n<=0||n>1e6||Math.abs(n*1000-Math.round(n*1000))>1e-6)throw Error("Quantita non valida");return Math.round(n*1000);}
function validate(estimates){
 if(!Array.isArray(estimates)||estimates.length>1000)throw Error("Preventivi non validi");
 const seen=new Set();
 for(const e of estimates){
  if(!e||!ID.test(e.id)||!ID.test(e.appointmentId)||seen.has(e.id)||!Array.isArray(e.lines)||!e.lines.length||e.lines.length>500)throw Error("Preventivo non valido");
  seen.add(e.id);const lines=new Set();
  for(const l of e.lines){
   if(!l||!ID.test(l.id)||lines.has(l.id)||!TYPES.has(l.type)||!CATS.has(l.category)||typeof l.description!=="string"||!l.description.trim()||l.description.length>500)throw Error("Voce non valida");
   lines.add(l.id);qty(l.quantity);money(l.unitPrice);
   if(!["PROPOSTA","ACCETTATA","RIFIUTATA"].includes(l.status))throw Error("Stato voce non valido");
   if(typeof l.extra!=="boolean")throw Error("Indicatore Extra obbligatorio");
  }
 }
 return true;
}
function summarize(estimates){
 validate(estimates);return estimates.map(e=>{
  let proposed=0,approved=0,extras=0;
  const groups={};
  for(const l of e.lines){
   const cents=Math.round(qty(l.quantity)*money(l.unitPrice)/1000);
   proposed+=cents;if(l.status==="ACCETTATA"){approved+=cents;if(l.extra)extras+=cents;}
   const g=groups[l.category]||(groups[l.category]={proposedCents:0,approvedCents:0,extraApprovedCents:0});
   g.proposedCents+=cents;if(l.status==="ACCETTATA"){g.approvedCents+=cents;if(l.extra)g.extraApprovedCents+=cents;}
  }
  return {estimateId:e.id,appointmentId:e.appointmentId,proposedCents:proposed,approvedCents:approved,extraApprovedCents:extras,groups};
 });
}
function approve(estimates,estimateId,decisions){
 validate(estimates);if(!ID.test(estimateId)||!Array.isArray(decisions)||!decisions.length)throw Error("Decisioni non valide");
 const next=JSON.parse(JSON.stringify(estimates)),e=next.find(x=>x.id===estimateId);if(!e)throw Error("Preventivo inesistente");
 const seen=new Set();
 for(const d of decisions){
  if(!d||!ID.test(d.lineId)||seen.has(d.lineId)||!["ACCETTATA","RIFIUTATA","PROPOSTA"].includes(d.status))throw Error("Decisione non valida");
  seen.add(d.lineId);const l=e.lines.find(x=>x.id===d.lineId);if(!l)throw Error("Voce inesistente");l.status=d.status;
 }
 validate(next);return next;
}
function reconcile(estimates,archive){
 const summaries=summarize(estimates);const report=W.report(archive),byAppointment=new Map();
 for(const s of summaries){const a=byAppointment.get(s.appointmentId)||{appointmentId:s.appointmentId,approvedCents:0,extraApprovedCents:0};a.approvedCents+=s.approvedCents;a.extraApprovedCents+=s.extraApprovedCents;byAppointment.set(s.appointmentId,a);}
 for(const s of report.summaries){const a=byAppointment.get(s.appointmentId)||{appointmentId:s.appointmentId,approvedCents:0,extraApprovedCents:0};a.salesCents=s.salesCents;a.proformaCents=s.proformaCents;a.creditCents=s.creditCents;a.receivedCents=s.receivedCents;byAppointment.set(s.appointmentId,a);}
 const warnings=[];for(const a of byAppointment.values()){a.salesCents||=0;a.proformaCents||=0;a.creditCents||=0;a.receivedCents||=0;a.unbilledCents=Math.max(0,a.approvedCents-a.salesCents);if(a.salesCents>a.approvedCents)warnings.push("FATTURATO_SUPERIORE_APPROVATO:"+a.appointmentId);if(a.approvedCents&&!a.salesCents)warnings.push("APPROVATO_NON_FATTURATO:"+a.appointmentId);}
 return {schema:"ITE-ESTIMATE-FINANCE-TEST-1",appointments:[...byAppointment.values()].sort((a,b)=>a.appointmentId.localeCompare(b.appointmentId)),warnings:[...new Set(warnings)].sort(),credits:report.credits};
}
return Object.freeze({validate,summarize,approve,reconcile});
});
