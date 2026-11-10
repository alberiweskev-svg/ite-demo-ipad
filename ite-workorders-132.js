/* I.T.E. 4.0.132 — integrated work-order / commercial reconciliation, TEST read-only. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
function build(state,{clientId="",operatorId="",from="",to=""}={}){
 const audit=root.ITE_Audit124.audit(state);
 if(!audit.ok)throw Error("AUDIT_NON_SUPERATO:"+audit.errors.join("|"));
 const c=state.field.catalog,m=state.commercial;
 const by=(arr,id)=>arr.find(x=>x.id===id);
 const filtered=c.appointments.filter(a=>(!clientId||a.clientId===clientId)&&(!operatorId||a.operatorId===operatorId)&&(!from||a.startAt.slice(0,10)>=from)&&(!to||a.startAt.slice(0,10)<=to));
 const jobs=filtered.map(a=>{
  const intervention=c.interventions.find(x=>x.appointmentId===a.id)||null;
  const extras=m.extras.filter(x=>x.appointmentId===a.id);
  const estimates=m.estimates.filter(x=>x.clientId===a.clientId&&x.siteId===a.siteId);
  const invoices=m.invoices.filter(x=>x.clientId===a.clientId&&x.siteId===a.siteId);
  const approvedExtras=extras.map(e=>({id:e.id,approved:copy(e.approved||{}),approvedTotals:root.ITE_Commercial122.totals(e.lines.filter(l=>Number(e.approved?.[l.id])>0).map(l=>({...l,quantity:Number(e.approved[l.id])})))}));
  return {id:a.id,startAt:a.startAt,endAt:a.endAt,status:a.status,kind:a.kind||"",client:by(c.clients,a.clientId)?.name||a.clientId,site:by(c.sites,a.siteId)?.address||a.siteId,system:by(c.systems,a.systemId)?.description||"",equipment:by(c.equipment,a.equipmentId)?.model||"",operator:by(c.operators,a.operatorId)?.name||a.operatorId,intervention:intervention?copy(intervention):null,estimates:estimates.map(e=>({id:e.id,status:e.status})),extras:approvedExtras,invoices:invoices.map(i=>({id:i.id,type:i.type})),warnings:[...(intervention?[]:["INTERVENTO_NON_AVVIATO"]),...(extras.length&&!intervention?["EXTRA_SENZA_INTERVENTO"]:[])]};
 });
 return copy({revision:state.revision,count:jobs.length,jobs,summary:{withoutIntervention:jobs.filter(x=>!x.intervention).length,withExtras:jobs.filter(x=>x.extras.length).length,withInvoices:jobs.filter(x=>x.invoices.length).length}});
}
const api=Object.freeze({build});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_WorkOrders132=api;
})(typeof globalThis!=="undefined"?globalThis:this);
