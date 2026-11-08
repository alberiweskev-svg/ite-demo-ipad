/* I.T.E. 4.0.88 — audit registri TEST reali, senza copie e senza scritture. */
(function(root,factory){
 const api=factory(
  typeof module==="object"&&module.exports?require("./ite-service-ledger-40.js"):root.ITEServiceLedger40,
  typeof module==="object"&&module.exports?require("./ite-estimate-finance-40.js"):root.ITEEstimateFinance40,
  typeof module==="object"&&module.exports?require("./ite-finance-workspace-40.js"):root.ITEFinanceWorkspace40,
  typeof module==="object"&&module.exports?require("./ite-integrated-dossier-83.js"):root.ITEIntegratedDossier83
 );
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITESharedAudit88=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(L,E,F,D){
 "use strict";
 const KEYS=Object.freeze({service:"ite-40-service-workspace-test-v1",finance:"ITE-4-FINANCE-WORKSPACE-TEST-1",estimates:"ite-40-integrated-estimates-test-v1"});
 const LIMIT=1000000;
 function read(storage){
  if(!storage||typeof storage.getItem!=="function")throw Error("Archivio locale non disponibile");
  const get=k=>{const v=storage.getItem(k);if(v!==null&&v.length>LIMIT)throw Error("Archivio TEST oltre 1 MB: "+k);return v;};
  const rawService=get(KEYS.service),rawFinance=get(KEYS.finance),rawEstimates=get(KEYS.estimates);
  if(!rawService)throw Error("Fascicolo TEST assente: inizializzare gli appuntamenti dimostrativi");
  const service=L.importJSON(rawService);
  const finance=rawFinance?F.importJSON(rawFinance):F.empty();
  const estimates=rawEstimates?D.importEstimates(rawEstimates,service,finance):[];
  return {service,finance,estimates,missing:{finance:!rawFinance,estimates:!rawEstimates}};
 }
 function inspect(snapshot){
  const {service,finance,estimates}=snapshot;
  L.validate(service);F.validateArchive(finance);E.validate(estimates);
  const dossier=D.report(service,estimates,finance);
  const issues=[];
  const add=(level,code,appointmentId,detail)=>issues.push({level,code,appointmentId:appointmentId||null,detail:String(detail)});
  if(snapshot.missing&&snapshot.missing.finance)add("info","FINANCE_ARCHIVE_ABSENT",null,"Nessun archivio contabile TEST: usato archivio vuoto in memoria");
  if(snapshot.missing&&snapshot.missing.estimates)add("info","ESTIMATES_ARCHIVE_ABSENT",null,"Nessun preventivo integrato TEST");
  for(const warning of dossier.warnings)add("warning","DOSSIER_WARNING",null,warning);
  for(const row of dossier.rows){
   if(row.unbilledCents>0)add("info","APPROVED_NOT_INVOICED",row.appointmentId,row.unbilledCents+" centesimi");
   if(row.salesCents>row.approvedCents)add("warning","INVOICED_OVER_APPROVED",row.appointmentId,(row.salesCents-row.approvedCents)+" centesimi");
  }
  const ids=new Set(service.appointments.map(a=>a.id));
  for(const estimate of estimates)if(!ids.has(estimate.appointmentId))add("error","ORPHAN_ESTIMATE",estimate.appointmentId,estimate.id);
  for(const link of finance.links)if(!ids.has(link.appointmentId))add("error","ORPHAN_FINANCE_LINK",link.appointmentId,link.documentId);
  issues.sort((a,b)=>a.level.localeCompare(b.level)||a.code.localeCompare(b.code)||String(a.appointmentId).localeCompare(String(b.appointmentId)));
  return {schema:"ITE-SHARED-AUDIT-TEST-1",appointmentCount:dossier.rows.length,estimateCount:estimates.length,issues,rows:dossier.rows,counts:{errors:issues.filter(x=>x.level==="error").length,warnings:issues.filter(x=>x.level==="warning").length,info:issues.filter(x=>x.level==="info").length}};
 }
 function auditStorage(storage){return inspect(read(storage));}
 function mount(doc){
  if(!doc||!doc.defaultView||doc.getElementById("ite-shared-audit-88"))return false;
  const parent=doc.getElementById("ite-integrity-workspace-87")||doc.querySelector("main");if(!parent)return false;
  const section=doc.createElement("div");section.id="ite-shared-audit-88";
  const h=doc.createElement("h3");h.textContent="Verifica registri condivisi TEST — 4.0.88";section.appendChild(h);
  const p=doc.createElement("p");p.textContent="Legge fascicolo, preventivi integrati e contabilità TEST direttamente dalle chiavi esistenti. Nessun import duplicato e nessuna modifica agli archivi.";section.appendChild(p);
  const button=doc.createElement("button");button.type="button";button.textContent="Controlla registri condivisi";section.appendChild(button);
  const status=doc.createElement("p");status.setAttribute("role","status");section.appendChild(status);
  const output=doc.createElement("div");section.appendChild(output);
  button.addEventListener("click",()=>{
   try{
    const result=auditStorage(doc.defaultView.localStorage);output.replaceChildren();
    const summary=doc.createElement("p");summary.textContent="Appuntamenti: "+result.appointmentCount+" · Preventivi: "+result.estimateCount+" · Errori: "+result.counts.errors+" · Avvisi: "+result.counts.warnings+" · Informazioni: "+result.counts.info;output.appendChild(summary);
    const ul=doc.createElement("ul");for(const issue of result.issues){const li=doc.createElement("li");li.textContent=issue.level.toUpperCase()+" · "+issue.code+" · "+(issue.appointmentId||"Generale")+" · "+issue.detail;ul.appendChild(li);}output.appendChild(ul);
    status.textContent="Verifica completata in sola lettura";
   }catch(e){output.replaceChildren();status.textContent="Verifica non eseguita: "+e.message;}
  });
  parent.appendChild(section);return true;
 }
 if(typeof document!=="undefined"){const start=()=>mount(document);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();}
 return Object.freeze({KEYS,read,inspect,auditStorage,mount});
});
