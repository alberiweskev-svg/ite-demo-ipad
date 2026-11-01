/* I.T.E. 4.0 — operational dashboard and customer/equipment history, read-only. */
(function(root){'use strict';
const planning=root.ITEFieldPlanning||(typeof require==='function'?require('./ite-field-planning.js'):null);
const report=root.ITEFieldOperationsReport||(typeof require==='function'?require('./ite-field-operations-report.js'):null);
const s=v=>String(v??'').trim(),rows=v=>Array.isArray(v)?v:[];
function build(data,filters={}){
 const catalog=data?.catalog,appointments=data?.appointments;
 const check=report.validate(catalog,appointments);
 if(!check.valid)throw Error('ARCHIVIO_CON_ANOMALIE:'+check.issues.map(x=>x.code).join(','));
 const list=planning.calendar(appointments,filters),byStatus={},byOperator={},byClient={},byEquipment={};
 const totals={FORNITURA:0,POSA:0,SMONTAGGIO:0,SMALTIMENTO:0,totalCents:0,minutes:0,appointments:0};
 for(const a of list){
  const amounts=planning.extrasTotals(a);
  totals.appointments++;
  const duration=rows(a.visits).reduce((n,v)=>n+(v.leftAt?Math.round((Date.parse(v.leftAt)-Date.parse(v.arrivedAt))/60000):0),0);
  if(!Number.isSafeInteger(duration)||duration<0)throw Error('DURATA_NON_VALIDA');
  totals.minutes+=duration;
  byStatus[a.status]=(byStatus[a.status]||0)+1;
  byOperator[a.operatorId]=(byOperator[a.operatorId]||0)+1;
  for(const key of ['FORNITURA','POSA','SMONTAGGIO','SMALTIMENTO','totalCents']){
   totals[key]+=amounts[key];if(!Number.isSafeInteger(totals[key]))throw Error('TOTALE_NON_VALIDO');
  }
  const entry={id:a.id,clientId:a.clientId,siteId:a.siteId,systemId:a.systemId,equipmentId:a.equipmentId,operatorId:a.operatorId,startsAt:a.startsAt,kind:a.kind,status:a.status,minutes:duration,extraCents:amounts.totalCents};
  (byClient[a.clientId]??=[]).push(entry);
  (byEquipment[a.equipmentId]??=[]).push(entry);
 }
 for(const group of [byClient,byEquipment])for(const entries of Object.values(group))entries.sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt));
 return {totals,byStatus,byOperator,byClient,byEquipment,readOnly:true};
}
const api=Object.freeze({build});root.ITEFieldDashboard=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
