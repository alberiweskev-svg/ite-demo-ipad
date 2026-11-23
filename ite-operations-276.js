/* I.T.E. 4.0.276 — synthetic integrated operations: worklist, technician load, commercial traceability. */
(function(root,factory){const api=factory(root.ITEDossier269);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-dossier-269.js"));root.ITEOperations276=api;})(typeof globalThis!=="undefined"?globalThis:this,function(dossier){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
function snapshot(state,{from,to,operator}={}){
 const s=dossier.validate(state),start=from?Date.parse(from):-Infinity,end=to?Date.parse(to):Infinity;
 if(Number.isNaN(start)||Number.isNaN(end)||end<=start)throw Error("INTERVALLO_NON_VALIDO");
 const work=s.appointments.filter(a=>(!operator||a.operator===operator)&&Date.parse(a.start)<end&&Date.parse(a.end)>start).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 const rows=work.map(a=>{
  const i=s.interventions.find(x=>x.appointmentId===a.id);
  const report=(s.reports||[]).find(x=>x.appointmentId===a.id);
  const site=s.sites.find(x=>x.id===a.siteId),device=s.devices.find(x=>x.id===a.deviceId);
  const quotes=i?s.commercial.quotes.filter(q=>q.interventionId===i.id):[];
  return {appointmentId:a.id,operator:a.operator,clientId:site.clientId,siteId:site.id,deviceId:device.id,start:a.start,end:a.end,plannedMinutes:Math.round((Date.parse(a.end)-Date.parse(a.start))/60000),interventionId:i?.id||null,interventionStatus:i?.status||"DA_APRIRE",reportStatus:report?.status||"ASSENTE",actualMinutes:report?.durationMinutes??null,quoteIds:quotes.map(q=>q.id),requiresReview:!!(i?.status==="CHIUSO"&&!report)};
 });
 const byOperator={};for(const row of rows){const item=byOperator[row.operator]||(byOperator[row.operator]={appointments:0,plannedMinutes:0,actualMinutes:0,closed:0,pending:0});item.appointments++;item.plannedMinutes+=row.plannedMinutes;item.actualMinutes+=row.actualMinutes||0;if(row.interventionStatus==="CHIUSO")item.closed++;else item.pending++;}
 const issues=[];for(const row of rows){if(row.requiresReview)issues.push({code:"CHIUSURA_SENZA_RAPPORTINO",appointmentId:row.appointmentId});if(row.interventionStatus==="CHIUSO"&&!row.quoteIds.length)issues.push({code:"CHIUSURA_SENZA_PREVENTIVO",appointmentId:row.appointmentId});if(row.reportStatus==="CHIUSO"&&row.interventionStatus!=="CHIUSO")issues.push({code:"RAPPORTINO_NON_ALLINEATO",appointmentId:row.appointmentId});}
 for(const report of s.reports||[]){if(!s.appointments.some(a=>a.id===report.appointmentId))issues.push({code:"RAPPORTINO_ORFANO",reportId:report.id});}
 return copy({schema:"ITE_OPERATIONS_276",revision:s.revision,rows,byOperator,issues});
}
function exportSynthetic(state,options){const data=snapshot(state,options);return JSON.stringify(data,null,2);}
return Object.freeze({snapshot,exportSynthetic});
});
