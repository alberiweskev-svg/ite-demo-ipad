/* I.T.E. 4.0.79 — Workflow integrato preventivi/Extra TEST. Solo dati fittizi. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-estimate-finance-40.js"):root.ITEEstimateFinance40,typeof module==="object"&&module.exports?require("./ite-finance-workspace-40.js"):root.ITEFinanceWorkspace40);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEEstimateWorkflow40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(E,W){
"use strict";
if(!E||!W)throw Error("Dipendenze preventivi/contabilita mancanti");
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
function copy(x){return JSON.parse(JSON.stringify(x));}
function validate(state){
 if(!state||!Array.isArray(state.appointments)||!Array.isArray(state.estimates)||!state.finance)throw Error("Workspace TEST non valido");
 if(state.appointments.length>2000)throw Error("Troppi appuntamenti");
 const ids=new Set();
 for(const a of state.appointments){if(!a||!ID.test(a.id)||ids.has(a.id)||!ID.test(a.operatorId)||!ID.test(a.clientId)||!ID.test(a.siteId)||!ID.test(a.plantId)||!ID.test(a.equipmentId))throw Error("Gerarchia appuntamento non valida");ids.add(a.id);}
 E.validate(state.estimates);W.validateArchive(state.finance);
 for(const e of state.estimates)if(!ids.has(e.appointmentId))throw Error("Preventivo senza appuntamento");
 for(const l of state.finance.links)if(!ids.has(l.appointmentId))throw Error("Fattura collegata a appuntamento assente");
 return true;
}
function empty(){return {schema:"ITE-ESTIMATE-WORKFLOW-TEST-1",appointments:[],estimates:[],finance:W.empty()};}
function registerAppointment(state,appointment){
 validate(state);const next=copy(state);next.appointments.push(copy(appointment));validate(next);return next;
}
function registerEstimate(state,estimate){
 validate(state);const next=copy(state);next.estimates.push(copy(estimate));validate(next);return next;
}
function decide(state,estimateId,decisions){
 validate(state);const next=copy(state);next.estimates=E.approve(next.estimates,estimateId,decisions);validate(next);return next;
}
function report(state){
 validate(state);const finance=E.reconcile(state.estimates,state.finance),estimates=E.summarize(state.estimates);
 const byId=new Map(state.appointments.map(a=>[a.id,{appointmentId:a.id,operatorId:a.operatorId,clientId:a.clientId,siteId:a.siteId,plantId:a.plantId,equipmentId:a.equipmentId,estimateCount:0,proposedCents:0,approvedCents:0,extraApprovedCents:0,salesCents:0,receivedCents:0,unbilledCents:0}]));
 for(const s of estimates){const a=byId.get(s.appointmentId);a.estimateCount++;a.proposedCents+=s.proposedCents;a.approvedCents+=s.approvedCents;a.extraApprovedCents+=s.extraApprovedCents;}
 for(const a of finance.appointments){const row=byId.get(a.appointmentId);if(!row)continue;row.salesCents=a.salesCents;row.receivedCents=a.receivedCents;row.unbilledCents=Math.max(0,row.approvedCents-row.salesCents);}
 const rows=[...byId.values()].sort((a,b)=>a.appointmentId.localeCompare(b.appointmentId));
 return {schema:"ITE-ESTIMATE-WORKFLOW-REPORT-1",rows,warnings:finance.warnings,credits:finance.credits,totals:rows.reduce((t,a)=>{for(const k of ["proposedCents","approvedCents","extraApprovedCents","salesCents","receivedCents","unbilledCents"])t[k]=(t[k]||0)+a[k];return t;},{})};
}
function exportJSON(state){validate(state);return JSON.stringify(state,null,2);}
function importJSON(raw){if(typeof raw!=="string"||raw.length>1000000)throw Error("File troppo grande");const s=JSON.parse(raw);if(s.schema!=="ITE-ESTIMATE-WORKFLOW-TEST-1")throw Error("Schema non supportato");validate(s);return copy(s);}
return Object.freeze({empty,validate,registerAppointment,registerEstimate,decide,report,exportJSON,importJSON});
});