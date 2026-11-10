/* I.T.E. 4.0.144 — quality gate and printable technical dossier, TEST only. */
(function(root){"use strict";
const s=x=>String(x??"").trim();
const find=(a,id)=>(a||[]).find(x=>x.id===id);
function audit(state,options={}){
 if(state?.schema!=="ITE_OPERATIONS_123"||!state.field?.catalog)throw Error("STATO_NON_VALIDO");
 const c=state.field.catalog, reports=state.technicalReports||[],rows=[],seen=new Set();
 for(const a of c.appointments||[]){
  if(options.clientId&&options.clientId!==a.clientId||options.operatorId&&options.operatorId!==a.operatorId)continue;
  const r=reports.find(x=>x.appointmentId===a.id),errors=[],warnings=[];
  const client=find(c.clients,a.clientId),site=find(c.sites,a.siteId),system=find(c.systems,a.systemId),equipment=a.equipmentId?find(c.equipment,a.equipmentId):null,operator=find(c.operators,a.operatorId);
  if(!client)errors.push("CLIENTE_ASSENTE");
  if(!site||site.clientId!==a.clientId)errors.push("SEDE_NON_COERENTE");
  if(!system||system.siteId!==a.siteId)errors.push("IMPIANTO_NON_COERENTE");
  if(a.equipmentId&&(!equipment||equipment.systemId!==a.systemId))errors.push("APPARECCHIATURA_NON_COERENTE");
  if(!operator)errors.push("TECNICO_ASSENTE");
  if(!r&&a.status!=="ANNULLATO")warnings.push("RAPPORTO_ASSENTE");
  if(r){
   if(seen.has(r.id))errors.push("RAPPORTO_DUPLICATO");seen.add(r.id);
   if(r.clientId!==a.clientId||r.siteId!==a.siteId||r.systemId!==a.systemId||r.equipmentId!==(a.equipmentId||""))errors.push("RAPPORTO_NON_COERENTE");
   if(r.status!=="COMPLETATO")warnings.push("RAPPORTO_NON_COMPLETATO");
   if(!r.notes?.trim())warnings.push("ESITO_NON_COMPILATO");
   if((r.checks||[]).some(x=>!x.done))warnings.push("CHECKLIST_INCOMPLETA");
   if((r.measurements||[]).some(x=>!Number.isFinite(x.value)))errors.push("MISURE_NON_VALIDE");
   if((r.attachments||[]).some(x=>x.data!==undefined||x.content!==undefined||x.base64!==undefined))errors.push("ALLEGATO_INCORPORATO");
  }
  rows.push({appointmentId:a.id,client:s(client?.name||a.clientId),site:s(site?.address||a.siteId),operator:s(operator?.name||a.operatorId),date:s(a.startAt).slice(0,10),reportId:r?.id||null,status:r?.status||"ASSENTE",checksDone:(r?.checks||[]).filter(x=>x.done).length,checksTotal:(r?.checks||[]).length,measurements:(r?.measurements||[]).length,attachments:(r?.attachments||[]).length,errors,warnings,ready:!!r&&r.status==="COMPLETATO"&&!errors.length&&!warnings.length});
 }
 const orphan=reports.filter(r=>!(c.appointments||[]).some(a=>a.id===r.appointmentId)).map(r=>r.id);
 return {version:"4.0.144",revision:state.revision,rows,orphan,summary:{total:rows.length,ready:rows.filter(x=>x.ready).length,withErrors:rows.filter(x=>x.errors.length).length,withWarnings:rows.filter(x=>x.warnings.length).length,orphan:orphan.length}};
}
function printable(result){
 const esc=x=>s(x).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const rows=result.rows.map(r=>"<tr>"+[r.date,r.client,r.site,r.operator,r.appointmentId,r.status,r.checksDone+"/"+r.checksTotal,r.errors.concat(r.warnings).join(", ")||"OK"].map(v=>"<td>"+esc(v)+"</td>").join("")+"</tr>").join("");
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Fascicoli TEST I.T.E.</title><style>body{font:14px Arial;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:7px;text-align:left}@media print{body{margin:10mm}}</style></head><body><h1>Fascicoli tecnici — TEST</h1><p>Solo dati fittizi. Non è un rapporto di conformità.</p><p>Revisione '+esc(result.revision)+'</p><table><thead><tr>'+["Data","Cliente","Sede","Tecnico","Appuntamento","Rapporto","Controlli","Anomalie"].map(x=>"<th>"+x+"</th>").join("")+"</tr></thead><tbody>"+rows+"</tbody></table></body></html>";
}
const api=Object.freeze({audit,printable});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_ReportQuality144=api;
})(typeof globalThis!=="undefined"?globalThis:this);
