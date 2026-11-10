/* I.T.E. 4.0.131 — unified read-only TEST dashboard over the 4.0.129 shared session. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
function view(state,{clientId="",date="",operatorId="",status=""}={}){
 const audit=root.ITE_Audit124.audit(state);
 if(!audit.ok)throw Error("AUDIT_NON_SUPERATO:"+audit.errors.join("|"));
 const c=state.field.catalog,m=state.commercial;
 const clients=c.clients.map(x=>({id:x.id,name:x.name||x.id,sites:c.sites.filter(s=>s.clientId===x.id).length,appointments:c.appointments.filter(a=>a.clientId===x.id).length}));
 const apps=c.appointments.filter(a=>(!clientId||a.clientId===clientId)&&(!date||a.startAt.slice(0,10)===date)&&(!operatorId||a.operatorId===operatorId)&&(!status||a.status===status)).sort((a,b)=>a.startAt.localeCompare(b.startAt));
 const appointments=apps.map(a=>({id:a.id,startAt:a.startAt,endAt:a.endAt,status:a.status,clientId:a.clientId,client:c.clients.find(x=>x.id===a.clientId)?.name||a.clientId,site:c.sites.find(x=>x.id===a.siteId)?.address||a.siteId,operator:c.operators.find(x=>x.id===a.operatorId)?.name||a.operatorId,equipment:c.equipment.find(x=>x.id===a.equipmentId)?.model||"",intervention:c.interventions.find(x=>x.appointmentId===a.id)?.status||"NON_AVVIATO"}));
 const estimates=m.estimates.filter(x=>!clientId||x.clientId===clientId).map(x=>({id:x.id,clientId:x.clientId,status:x.status,totals:root.ITE_Commercial122.totals(x.lines)}));
 const extras=m.extras.filter(x=>!clientId||x.clientId===clientId).map(x=>({id:x.id,clientId:x.clientId,appointmentId:x.appointmentId,approved:copy(x.approved),totals:root.ITE_Commercial122.totals(x.lines)}));
 const invoices=m.invoices.filter(x=>!clientId||x.clientId===clientId).map(x=>({id:x.id,clientId:x.clientId,type:x.type,totals:copy(x.totals)}));
 const dossier=clientId?root.ITE_Operations123.dossier(state,clientId):null;
 return copy({revision:state.revision,counts:audit.counts,clients,operators:c.operators.map(x=>({id:x.id,name:x.name||x.id})),appointments,estimates,extras,invoices,dossier});
}
const api=Object.freeze({view});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Dashboard131=api;
})(typeof globalThis!=="undefined"?globalThis:this);
