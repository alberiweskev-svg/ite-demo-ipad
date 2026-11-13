/* I.T.E. 4.0.201 — atomic operational workflow on synthetic, in-memory archives. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperationalWorkflow201=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const requireArray=(x,k)=>{if(!x||!Array.isArray(x[k]))throw Error("ARCHIVIO_"+k);return x[k]};
const get=(a,id)=>a.find(x=>x.id===id);
const id=x=>typeof x==="string"&&x.trim().length>0;
const time=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(x)&&Number.isFinite(Date.parse(x))?Date.parse(x):NaN;
const cents=x=>Number.isSafeInteger(x)&&x>=0;
function validate(field,commercial){
 for(const k of ["clients","sites","systems","equipment","operators","appointments","interventions"])requireArray(field,k);
 for(const k of ["extras","quotes"])requireArray(commercial,k);
 for(const k of ["clients","sites","systems","equipment","operators","appointments","interventions"]){const seen=new Set();for(const x of field[k]){if(!x||!id(x.id)||seen.has(x.id))throw Error("ID_DUPLICATO_O_ASSENTE_"+k);seen.add(x.id);}}
 for(const k of ["extras","quotes"]){const seen=new Set();for(const x of commercial[k]){if(!x||!id(x.id)||seen.has(x.id))throw Error("ID_DUPLICATO_O_ASSENTE_"+k);seen.add(x.id);}}
 return true;
}
function run(field,commercial,action){
 validate(field,commercial);if(!action||!id(action.type))throw Error("AZIONE_NON_VALIDA");
 const f=copy(field),c=copy(commercial),a=action,ap=f.appointments,iv=f.interventions;
 const appointment=()=>{const x=get(ap,a.appointmentId);if(!x)throw Error("APPUNTAMENTO_ASSENTE");return x};
 const hierarchy=x=>{const e=get(f.equipment,x.equipmentId),s=e&&get(f.systems,e.systemId),site=s&&get(f.sites,s.siteId);if(!site||site.id!==x.siteId||site.clientId!==x.clientId||!get(f.clients,x.clientId))throw Error("GERARCHIA_NON_VALIDA");};
 const operator=x=>{if(!get(f.operators,x.operatorId))throw Error("OPERATORE_ASSENTE");};
 if(a.type==="APPOINTMENT_CREATE"){
  if(!id(a.id)||get(ap,a.id))throw Error("APPUNTAMENTO_ID");const x={id:a.id,clientId:a.clientId,siteId:a.siteId,equipmentId:a.equipmentId,operatorId:a.operatorId,start:a.start,end:a.end,status:"PIANIFICATO"};
  hierarchy(x);operator(x);if(!Number.isFinite(time(x.start))||!Number.isFinite(time(x.end))||time(x.end)<=time(x.start))throw Error("ORARIO_NON_VALIDO");
  for(const y of ap)if(y.operatorId===x.operatorId&&y.status!=="ANNULLATO"&&Number.isFinite(time(y.start))&&Number.isFinite(time(y.end))&&time(x.start)<time(y.end)&&time(y.start)<time(x.end))throw Error("SOVRAPPOSIZIONE_TECNICO");
  ap.push(x);
 }else if(a.type==="ARRIVAL"){
  const x=appointment();hierarchy(x);operator(x);if(x.status!=="PIANIFICATO")throw Error("STATO_APPUNTAMENTO");
  if(!id(a.interventionId)||get(iv,a.interventionId)||iv.some(i=>i.appointmentId===x.id))throw Error("INTERVENTO_DUPLICATO");
  if(!Number.isFinite(time(a.at))||time(a.at)<time(x.start))throw Error("ORA_ARRIVO");
  x.status="IN_CORSO";iv.push({id:a.interventionId,appointmentId:x.id,clientId:x.clientId,siteId:x.siteId,equipmentId:x.equipmentId,operatorId:x.operatorId,status:"APERTO",arrivedAt:a.at,exitedAt:null,durationMinutes:0});
 }else if(a.type==="CLOSE"){
  const x=get(iv,a.interventionId);if(!x||x.status!=="APERTO")throw Error("INTERVENTO_NON_APERTO");
  if(!Number.isFinite(time(a.at))||time(a.at)<time(x.arrivedAt))throw Error("ORA_USCITA");
  x.exitedAt=a.at;x.durationMinutes=Math.round((time(a.at)-time(x.arrivedAt))/60000);x.status="CHIUSO";const p=get(ap,x.appointmentId);if(!p||p.status!=="IN_CORSO")throw Error("APPUNTAMENTO_NON_IN_CORSO");p.status="ESEGUITO";
 }else if(a.type==="EXTRA_ADD"){
  const x=get(iv,a.interventionId);if(!x||x.status!=="APERTO")throw Error("INTERVENTO_NON_APERTO");
  if(!id(a.id)||get(c.extras,a.id)||!["FORNITURA","POSA"].includes(a.kind)||!id(a.description)||!cents(a.priceCents))throw Error("EXTRA_NON_VALIDO");
  c.extras.push({id:a.id,interventionId:x.id,kind:a.kind,description:a.description,priceCents:a.priceCents,status:"DA_APPROVARE"});
 }else if(a.type==="EXTRA_APPROVE"){
  const x=get(c.extras,a.id);if(!x||!get(iv,x.interventionId)||get(iv,x.interventionId).status!=="APERTO"||x.status!=="DA_APPROVARE"||!["APPROVATO","RIFIUTATO"].includes(a.status))throw Error("EXTRA_STATO");x.status=a.status;
 }else if(a.type==="QUOTE_CREATE"){
  const x=get(iv,a.interventionId);if(!x||x.status!=="APERTO")throw Error("INTERVENTO_NON_APERTO");
  if(!id(a.id)||get(c.quotes,a.id)||!Array.isArray(a.extraIds)||!a.extraIds.length||new Set(a.extraIds).size!==a.extraIds.length)throw Error("PREVENTIVO_NON_VALIDO");
  const lines=a.extraIds.map(k=>get(c.extras,k));if(lines.some(e=>!e||e.interventionId!==x.id||e.status==="RIFIUTATO"))throw Error("PREVENTIVO_EXTRA_NON_VALIDO");
  const total=lines.reduce((n,e)=>n+e.priceCents,0);if(!Number.isSafeInteger(total))throw Error("IMPORTO_NON_VALIDO");
  c.quotes.push({id:a.id,interventionId:x.id,extraIds:a.extraIds.slice(),totalCents:total,status:"DA_ACCETTARE"});
 }else if(a.type==="QUOTE_DECIDE"){
  const x=get(c.quotes,a.id);if(!x||x.status!=="DA_ACCETTARE"||!["ACCETTATO","NON_ACCETTATO"].includes(a.status))throw Error("PREVENTIVO_STATO");if(a.status==="ACCETTATO"){const lines=x.extraIds.map(k=>get(c.extras,k));if(lines.some(e=>!e||e.status!=="APPROVATO"))throw Error("PREVENTIVO_EXTRA_NON_APPROVATO");if(c.quotes.some(q=>q.id!==x.id&&q.status==="ACCETTATO"&&q.extraIds.some(k=>x.extraIds.includes(k))))throw Error("EXTRA_DOPPIO_PREVENTIVO");}x.status=a.status;
 }else throw Error("AZIONE_SCONOSCIUTA");
 return {field:f,commercial:c,event:{type:a.type,id:a.id||a.interventionId||a.appointmentId},schema:"ITE_WORKFLOW_TEST_201"};
}
return Object.freeze({validate,run});
});