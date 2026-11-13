/* I.T.E. 4.0.198 — integrated operational dossier, TEST-only, read-only. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperationalDossier198=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const arr=(x,k)=>{if(!x||!Array.isArray(x[k]))throw Error("ARCHIVIO_"+k.toUpperCase()+"_NON_VALIDO");return x[k]};
const by=(a,id)=>a.find(x=>x.id===id);
const safeMoney=x=>Number.isSafeInteger(x)&&x>=0;
function build(field,commercial,options={}){
 const clients=arr(field,"clients"),sites=arr(field,"sites"),systems=arr(field,"systems"),equipment=arr(field,"equipment"),operators=arr(field,"operators"),appointments=arr(field,"appointments"),interventions=arr(field,"interventions");
 const extras=arr(commercial,"extras"),quotes=arr(commercial,"quotes"),issues=[],rows=[];
 const selected=options.clientId||"";
 if(selected&&!by(clients,selected))throw Error("CLIENTE_NON_TROVATO");
 const ids=(items)=>new Set(items.map(x=>x.id));
 for(const [kind,items] of [["CLIENTE",clients],["SEDE",sites],["IMPIANTO",systems],["APPARECCHIATURA",equipment],["OPERATORE",operators],["APPUNTAMENTO",appointments],["INTERVENTO",interventions],["EXTRA",extras],["PREVENTIVO",quotes]]){
  if(ids(items).size!==items.length)issues.push("ID_DUPLICATO:"+kind);
 }
 const scoped=clients.filter(c=>!selected||c.id===selected);
 for(const c of scoped){
  const cSites=sites.filter(s=>s.clientId===c.id);
  for(const site of cSites){
   const cSystems=systems.filter(s=>s.siteId===site.id);
   for(const system of cSystems){
    const cEquipment=equipment.filter(e=>e.systemId===system.id);
    for(const eq of cEquipment){
     const eqAppointments=appointments.filter(a=>a.equipmentId===eq.id);
     for(const appt of eqAppointments){
      if(appt.clientId!==c.id||appt.siteId!==site.id)issues.push("APPUNTAMENTO_GERARCHIA:"+appt.id);
      if(!by(operators,appt.operatorId))issues.push("OPERATORE_ASSENTE:"+appt.id);
      const interventionsForAppointment=interventions.filter(i=>i.appointmentId===appt.id);
      if(interventionsForAppointment.length>1)issues.push("INTERVENTI_DUPLICATI:"+appt.id);
      for(const intervention of interventionsForAppointment){
       if(intervention.clientId!==c.id||intervention.siteId!==site.id||intervention.equipmentId!==eq.id)issues.push("INTERVENTO_GERARCHIA:"+intervention.id);
      }
      rows.push({clientId:c.id,client:c.name||c.id,siteId:site.id,site:site.name||site.id,systemId:system.id,system:system.name||system.id,equipmentId:eq.id,equipment:eq.name||eq.id,appointmentId:appt.id,operatorId:appt.operatorId,start:appt.start,end:appt.end,status:appt.status,interventions:interventionsForAppointment.map(i=>({id:i.id,status:i.status,durationMinutes:i.durationMinutes||0,extras:extras.filter(e=>e.interventionId===i.id).map(e=>({id:e.id,kind:e.kind,status:e.status,description:e.description})),quotes:quotes.filter(q=>q.interventionId===i.id).map(q=>({id:q.id,status:q.status,totalCents:q.totalCents}))}))});
     }
    }
   }
  }
 }
 for(const site of sites)if(!by(clients,site.clientId))issues.push("SEDE_ORFANA:"+site.id);
 for(const sys of systems)if(!by(sites,sys.siteId))issues.push("IMPIANTO_ORFANO:"+sys.id);
 for(const eq of equipment)if(!by(systems,eq.systemId))issues.push("APPARECCHIATURA_ORFANA:"+eq.id);
 for(const a of appointments)if(!by(equipment,a.equipmentId)||!by(clients,a.clientId)||!by(sites,a.siteId))issues.push("APPUNTAMENTO_ORFANO:"+a.id);
 for(const i of interventions)if(!by(appointments,i.appointmentId))issues.push("INTERVENTO_ORFANO:"+i.id);
 for(const e of extras)if(!by(interventions,e.interventionId))issues.push("EXTRA_ORFANO:"+e.id);
 for(const q of quotes){if(!by(interventions,q.interventionId))issues.push("PREVENTIVO_ORFANO:"+q.id);if(!safeMoney(q.totalCents))issues.push("PREVENTIVO_IMPORTO:"+q.id);for(const id of q.extraIds||[])if(!extras.some(e=>e.id===id&&e.interventionId===q.interventionId))issues.push("PREVENTIVO_EXTRA:"+q.id+":"+id);}
 rows.sort((a,b)=>String(a.start).localeCompare(String(b.start))||a.appointmentId.localeCompare(b.appointmentId));
 const seenInterventions=new Set(rows.flatMap(r=>r.interventions.map(i=>i.id)));
 const relevantQuotes=quotes.filter(q=>seenInterventions.has(q.interventionId));
 const totals={clients:scoped.length,sites:sites.filter(s=>scoped.some(c=>c.id===s.clientId)).length,appointments:rows.length,interventions:seenInterventions.size,extras:extras.filter(e=>seenInterventions.has(e.interventionId)).length,quotes:relevantQuotes.length,quoteCents:relevantQuotes.reduce((sum,q)=>sum+(safeMoney(q.totalCents)?q.totalCents:0),0),workedMinutes:rows.reduce((sum,r)=>sum+r.interventions.reduce((n,i)=>n+i.durationMinutes,0),0)};
 return clone({schema:"ITE_OPERATIONAL_DOSSIER_TEST_198",valid:issues.length===0,issues:[...new Set(issues)],rows,totals,warning:"Dati TEST in sola lettura; nessuna modifica agli archivi, nessun documento fiscale o dato cliente reale."});
}
function csv(report){if(!report||report.schema!=="ITE_OPERATIONAL_DOSSIER_TEST_198"||!report.valid)throw Error("REPORT_NON_VALIDO");const safe=x=>{let s=String(x??"");if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return "\uFEFF"+[["Cliente","Sede","Impianto","Apparecchiatura","Appuntamento","Tecnico","Inizio","Stato","Interventi","Extra","Preventivi"],...report.rows.map(r=>[r.client,r.site,r.system,r.equipment,r.appointmentId,r.operatorId,r.start,r.status,r.interventions.map(i=>i.id).join("|"),r.interventions.flatMap(i=>i.extras.map(e=>e.id)).join("|"),r.interventions.flatMap(i=>i.quotes.map(q=>q.id)).join("|")])].map(r=>r.map(safe).join(";")).join("\r\n")+"\r\n";}
return Object.freeze({build,csv});
});