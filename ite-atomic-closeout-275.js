/* I.T.E. 4.0.275 — atomic synthetic closeout: report, intervention, quote in one verified dossier write. */
(function(root,factory){const api=factory(root.ITEDossier269,root.ITEDossier270,root.ITEFieldReport273,root.ITEReportBridge274);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-dossier-269.js"),require("./ite-dossier-270.js"),require("./ite-field-report-273.js"),require("./ite-report-bridge-274.js"));root.ITEAtomicCloseout275=api;})(typeof globalThis!=="undefined"?globalThis:this,function(dossier,editor,reports,bridge){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
function closeout(state,report,{departure,notes="",otherWorkConfirmed=false,prices=[],classifications={}}={}){
 const original=dossier.validate(state);
 if((original.reports||[]).some(x=>x.appointmentId===report.appointmentId))throw Error("RAPPORTINO_GIA_REGISTRATO");
 if(report.status!=="IN_CORSO")throw Error("RAPPORTINO_NON_APERTO");
 bridge.verify(original,report);
 const closed=reports.close(report,{departure,notes,otherWorkConfirmed});
 const intervention=original.interventions.find(x=>x.appointmentId===report.appointmentId);
 const updated=editor.closeIntervention(original,intervention.id,closed.departure);
 const classified=copy(closed);
 classified.activities=classified.activities.map((a,i)=>{
  if(a.type!=="EXTRA")return a;
  const kind=classifications[i];
  if(!["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO"].includes(kind))throw Error("EXTRA_DA_CLASSIFICARE");
  return {...a,type:kind,extra:true};
 });
 if(!classified.activities.length)throw Error("ATTIVITA_MANCANTI");
 if(prices.length!==classified.activities.length)throw Error("PREZZI_INCOMPLETI");
 const quoted=bridge.commitQuote(updated,classified,prices);
 quoted.reports=[...(original.reports||[]),closed];
 quoted.revision=original.revision+1;
 return dossier.validate(quoted);
}
function persist(storage,original,report,options){const next=closeout(original,report,options);return dossier.persist(storage,original,next);}
function reportsFor(state,interventionId){const s=dossier.validate(state);return (s.reports||[]).filter(x=>s.interventions.some(i=>i.id===interventionId&&i.appointmentId===x.appointmentId)).map(copy);}
return Object.freeze({closeout,persist,reportsFor});
});
