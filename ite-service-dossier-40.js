/* I.T.E. 4.0.67 — read-only integrated TEST service/contract/finance dossier. */
(function(root,factory){
 const api=factory(
 typeof module==="object"&&module.exports?require("./ite-service-registry-40.js"):root.ITEServiceRegistry40,
 typeof module==="object"&&module.exports?require("./ite-service-workflow-40.js"):root.ITEServiceWorkflow40,
 typeof module==="object"&&module.exports?require("./ite-service-contract-40.js"):root.ITEServiceContract40,
 typeof module==="object"&&module.exports?require("./ite-quotes-40.js"):root.ITEQuotes40,
 typeof module==="object"&&module.exports?require("./ite-invoice-ledger-40.js"):root.ITEInvoiceLedger40,
 typeof module==="object"&&module.exports?require("./ite-contract-settlement-40.js"):root.ITEContractSettlement40
 );if(typeof module==="object"&&module.exports)module.exports=api;root.ITEServiceDossier40=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R,W,B,Q,I,S){
"use strict";
if(!R||!W||!B||!Q||!I||!S)throw Error("Missing TEST domain engines");
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
function dossier(s,q,b,i,settlement,appointmentId){
 R.check(s);Q.validate(q);I.validate(i);B.check(b,s,q);S.validate(settlement,q,i);
 const ctx=W.context(s,appointmentId),service=W.report(s,appointmentId),contract=B.summary(b,s,q,appointmentId);
 const financial=contract.quotes.map(c=>{
   const detail=S.report(settlement,q,i,c.id);
   const linked=settlement.links.filter(x=>x.quoteId===c.id);
   const documents=linked.map(l=>{const doc=i.documents.find(d=>d.id===l.invoiceId);return {id:doc.id,number:doc.number,date:doc.date,kind:l.kind,total:doc.total,paid:money(i.payments.filter(p=>p.documentId===doc.id).reduce((sum,p)=>sum+p.amount,0))};});
   return {quoteId:c.id,status:c.status,contractTotal:c.contractTotal,approvedExtras:c.approvedExtras,pendingExtras:c.pendingExtras,billed:detail.billed,paid:detail.paid,unpaid:detail.unpaid,remainingToInvoice:detail.remainingToInvoice,overbilled:detail.overbilled,documents};
 });
 const warnings=[];
 if(!financial.length)warnings.push("NESSUN_PREVENTIVO_COLLEGATO");
 for(const f of financial){if(f.status!=="ACCEPTED")warnings.push("PREVENTIVO_NON_ACCETTATO:"+f.quoteId);if(f.overbilled)warnings.push("FATTURATO_SUPERIORE_AL_CONTRATTO:"+f.quoteId);if(f.pendingExtras>0)warnings.push("EXTRA_IN_ATTESA:"+f.quoteId);}
 return {schema:"ITE-SERVICE-DOSSIER-TEST-1",appointmentId,client:{id:ctx.client.id,name:ctx.client.name},site:{id:ctx.site.id,name:ctx.site.name,address:ctx.site.address||""},plant:{id:ctx.plant.id,name:ctx.plant.name},equipment:{id:ctx.equipment.id,name:ctx.equipment.name,model:ctx.equipment.model||""},operator:{id:ctx.operator.id,name:ctx.operator.name},appointment:{start:ctx.appointment.start,end:ctx.appointment.end},intervention:service,financial,warnings,notice:"Ambiente TEST, sola consultazione: nessuna emissione fiscale e nessun trasferimento dati."};
}
function csv(d){
 if(!d||d.schema!=="ITE-SERVICE-DOSSIER-TEST-1")throw Error("Invalid dossier");
 const cell=v=>'"'+String(v??"").replace(/^[=+@\-\t\r]/,m=>"'"+m).replace(/"/g,'""')+'"';
 const rows=[["Appuntamento","Cliente","Sede","Apparecchiatura","Operatore","Preventivo","Stato","Contratto EUR","Fatturato EUR","Incassato EUR","Da fatturare EUR","Segnalazioni"]];
 for(const f of d.financial.length?d.financial:[{}])rows.push([d.appointmentId,d.client.name,d.site.name,d.equipment.name,d.operator.name,f.quoteId||"",f.status||"",f.contractTotal??"",f.billed??"",f.paid??"",f.remainingToInvoice??"",d.warnings.join("|")]);
 return "\uFEFF"+rows.map(r=>r.map(cell).join(";")).join("\r\n")+"\r\n";
}
return Object.freeze({dossier,csv});
});