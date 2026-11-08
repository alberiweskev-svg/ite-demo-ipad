/* I.T.E. 4.0.86 — audit integrato archivi TEST, sola lettura. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-service-ledger-40.js"):root.ITEServiceLedger40,typeof module==="object"&&module.exports?require("./ite-estimate-workflow-40.js"):root.ITEEstimateWorkflow40,typeof module==="object"&&module.exports?require("./ite-calendar-84.js"):root.ITECalendar84);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEIntegrity86=api;})(typeof globalThis!=="undefined"?globalThis:this,function(L,E,C){
"use strict";
const check=(v,m)=>{if(!v)throw Error(m);};
function inspect(service,commerce){
 check(L&&E&&C,"Motori TEST mancanti");
 L.validate(service);E.validate(commerce);
 const issues=[],add=(severity,code,appointmentId,detail)=>issues.push({severity,code,appointmentId:appointmentId||null,detail:String(detail||"")});
 const sa=new Map(service.appointments.map(a=>[a.id,a]));
 const ea=new Map(commerce.appointments.map(a=>[a.id,a]));
 for(const [id,a] of sa){const b=ea.get(id);if(!b){add("warning","MISSING_ESTIMATE_APPOINTMENT",id,"Appuntamento non presente nell'archivio preventivi");continue;}
  for(const field of ["clientId","siteId","plantId","equipmentId","operatorId"])if(a[field]!==b[field])add("error","APPOINTMENT_REFERENCE_DRIFT",id,field+" differente tra archivi");
 }
 for(const id of ea.keys())if(!sa.has(id))add("warning","MISSING_SERVICE_APPOINTMENT",id,"Appuntamento presente solo nell'archivio preventivi");
 const planned=C.plan(service);
 for(const row of planned.rows)if(row.conflicts&&row.conflicts.length)add("warning","OPERATOR_OVERLAP",row.id,row.conflicts.join(", "));
 const report=E.report(commerce);
 for(const row of report.rows){
  if(row.unbilledCents>0)add("info","APPROVED_NOT_INVOICED",row.appointmentId,String(row.unbilledCents)+" centesimi");
  if(row.salesCents>row.approvedCents)add("warning","INVOICED_OVER_APPROVED",row.appointmentId,String(row.salesCents-row.approvedCents)+" centesimi");
 }
 for(const warning of report.warnings||[])add("warning","FINANCE_RECONCILIATION",null,warning);
 for(const credit of report.credits||[])if(credit.residualCents>0)add("info","TD04_OUTSTANDING",null,credit.documentId+": "+credit.residualCents+" centesimi");
 const rank={error:0,warning:1,info:2};issues.sort((a,b)=>rank[a.severity]-rank[b.severity]||String(a.appointmentId).localeCompare(String(b.appointmentId))||a.code.localeCompare(b.code));
 return {schema:"ITE-INTEGRITY-REPORT-TEST-1",serviceAppointments:sa.size,estimateAppointments:ea.size,issues,counts:{errors:issues.filter(i=>i.severity==="error").length,warnings:issues.filter(i=>i.severity==="warning").length,info:issues.filter(i=>i.severity==="info").length}};
}
function auditJSON(serviceRaw,commerceRaw){
 check(typeof serviceRaw==="string"&&serviceRaw.length<=1000000,"Archivio interventi troppo grande");
 check(typeof commerceRaw==="string"&&commerceRaw.length<=1000000,"Archivio preventivi troppo grande");
 return inspect(L.importJSON(serviceRaw),E.importJSON(commerceRaw));
}
return Object.freeze({inspect,auditJSON});
});
