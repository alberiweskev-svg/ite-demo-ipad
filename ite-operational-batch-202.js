/* I.T.E. 4.0.202 — atomic TEST workflow batches, audit and commercial consistency. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-operational-workflow-201.js"):root.ITEOperationalWorkflow201);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperationalBatch202=api;})(typeof globalThis!=="undefined"?globalThis:this,function(W){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
function assert(condition,code){if(!condition)throw Error(code);}
function audit(field,commercial){
 W.validate(field,commercial);const issues=[],warnings=[];
 const by=(arr,id)=>arr.find(x=>x.id===id);
 const validTime=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(x)&&Number.isFinite(Date.parse(x));
 const check=(ok,code)=>{if(!ok)issues.push(code);};
 for(const s of field.sites)check(!!by(field.clients,s.clientId),"SEDE_CLIENTE_"+s.id);
 for(const s of field.systems)check(!!by(field.sites,s.siteId),"IMPIANTO_SEDE_"+s.id);
 for(const e of field.equipment)check(!!by(field.systems,e.systemId),"APPARECCHIATURA_IMPIANTO_"+e.id);
 for(const a of field.appointments){
  const e=by(field.equipment,a.equipmentId),sys=e&&by(field.systems,e.systemId),site=sys&&by(field.sites,sys.siteId);
  check(!!site&&site.id===a.siteId&&site.clientId===a.clientId,"APPUNTAMENTO_GERARCHIA_"+a.id);
  check(!!by(field.operators,a.operatorId),"APPUNTAMENTO_OPERATORE_"+a.id);
  check(validTime(a.start)&&validTime(a.end)&&Date.parse(a.end)>Date.parse(a.start),"APPUNTAMENTO_ORARIO_"+a.id);
  check(["PIANIFICATO","IN_CORSO","ESEGUITO","ANNULLATO"].includes(a.status),"APPUNTAMENTO_STATO_"+a.id);
 }
 const ordered=field.appointments.filter(a=>a.status!=="ANNULLATO").slice().sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
  const a=ordered[i],b=ordered[j];if(a.operatorId===b.operatorId&&Date.parse(a.start)<Date.parse(b.end)&&Date.parse(b.start)<Date.parse(a.end))issues.push("TECNICO_SOVRAPPOSTO_"+a.id+"_"+b.id);
 }
 const linkedAppointments=new Set();
 for(const v of field.interventions){
  check(!linkedAppointments.has(v.appointmentId),"INTERVENTO_DUPLICATO_APPUNTAMENTO_"+v.appointmentId);linkedAppointments.add(v.appointmentId);
  const a=by(field.appointments,v.appointmentId);
  check(!!a&&a.clientId===v.clientId&&a.siteId===v.siteId&&a.equipmentId===v.equipmentId&&a.operatorId===v.operatorId,"INTERVENTO_APPUNTAMENTO_"+v.id);
  check(!!a&&((v.status==="APERTO"&&a.status==="IN_CORSO")||(v.status==="CHIUSO"&&a.status==="ESEGUITO")),"INTERVENTO_STATO_"+v.id);
  check(["APERTO","CHIUSO"].includes(v.status),"INTERVENTO_STATO_NON_VALIDO_"+v.id);
  check(validTime(v.arrivedAt)&&(!a||Date.parse(v.arrivedAt)>=Date.parse(a.start)),"INTERVENTO_ARRIVO_"+v.id);
  if(v.status==="CHIUSO")check(validTime(v.exitedAt)&&Date.parse(v.exitedAt)>=Date.parse(v.arrivedAt)&&v.durationMinutes===Math.round((Date.parse(v.exitedAt)-Date.parse(v.arrivedAt))/60000),"INTERVENTO_TEMPI_"+v.id);
 }
 const quoted=new Map();
 for(const e of commercial.extras){check(!!by(field.interventions,e.interventionId),"EXTRA_INTERVENTO_"+e.id);check(["FORNITURA","POSA"].includes(e.kind)&&Number.isSafeInteger(e.priceCents)&&e.priceCents>=0,"EXTRA_IMPORTO_"+e.id);check(["DA_APPROVARE","APPROVATO","RIFIUTATO"].includes(e.status),"EXTRA_STATO_"+e.id);}
 for(const q of commercial.quotes){
  check(["DA_ACCETTARE","ACCETTATO","NON_ACCETTATO"].includes(q.status),"PREVENTIVO_STATO_"+q.id);
  const lines=Array.isArray(q.extraIds)?q.extraIds:[],items=lines.map(id=>by(commercial.extras,id));
  check(!!by(field.interventions,q.interventionId)&&lines.length>0&&new Set(lines).size===lines.length&&items.every(e=>e&&e.interventionId===q.interventionId),"PREVENTIVO_RIGHE_"+q.id);
  const sum=items.reduce((n,e)=>n+(e?e.priceCents:0),0);
  check(Number.isSafeInteger(sum)&&q.totalCents===sum,"PREVENTIVO_TOTALE_"+q.id);
  if(q.status==="ACCETTATO"){for(const e of items)if(e){check(e.status==="APPROVATO","PREVENTIVO_EXTRA_NON_APPROVATO_"+q.id+"_"+e.id);if(quoted.has(e.id))issues.push("EXTRA_DOPPIO_PREVENTIVO_"+e.id);quoted.set(e.id,q.id);}}
 }
 const total=arr=>arr.reduce((n,e)=>n+e.priceCents,0);
 const approved=commercial.extras.filter(e=>e.status==="APPROVATO"),accepted=commercial.quotes.filter(q=>q.status==="ACCETTATO");
 const byKind=kind=>total(approved.filter(e=>e.kind===kind));
 const acceptedCents=accepted.reduce((n,q)=>n+q.totalCents,0);
 check(Number.isSafeInteger(acceptedCents)&&Number.isSafeInteger(byKind("FORNITURA")+byKind("POSA")),"IMPORTO_OVERFLOW");
 return {valid:issues.length===0,issues,warnings,totals:{clients:field.clients.length,appointments:field.appointments.length,interventions:field.interventions.length,approvedSupplyCents:byKind("FORNITURA"),approvedInstallationCents:byKind("POSA"),acceptedQuotesCents:acceptedCents}};
}
function transact(field,commercial,actions,options){
 assert(Array.isArray(actions)&&actions.length>0&&actions.length<=100,"LOTTO_NON_VALIDO");
 const opts=options||{},initial=audit(field,commercial);
 assert(initial.valid,"ARCHIVIO_INIZIALE_NON_VALIDO: "+initial.issues.join(","));
 let state={field:clone(field),commercial:clone(commercial)},events=[];
 for(let i=0;i<actions.length;i++){
  try{state=W.run(state.field,state.commercial,actions[i]);events.push({sequence:i+1,type:actions[i].type,reference:actions[i].id||actions[i].interventionId||actions[i].appointmentId||null});}
  catch(e){throw Error("LOTTO_ANNULLATO_PASSO_"+(i+1)+": "+e.message);}
 }
 const report=audit(state.field,state.commercial);
 if(!report.valid&&!opts.allowInvalid)throw Error("LOTTO_ANNULLATO_INTEGRITA: "+report.issues.join(","));
 return {field:state.field,commercial:state.commercial,events,report,schema:"ITE_OPERATIONAL_BATCH_TEST_202"};
}
return Object.freeze({audit,transact});
});