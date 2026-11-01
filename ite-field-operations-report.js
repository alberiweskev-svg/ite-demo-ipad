/* I.T.E. 4.0 — report operativi stampabili e diagnostica, sola lettura. */
(function(root){'use strict';
const planning=root.ITEFieldPlanning||(typeof require==='function'?require('./ite-field-planning.js'):null);
const workflow=root.ITEFieldWorkflow||(typeof require==='function'?require('./ite-field-workflow.js'):null);
const s=v=>String(v??'').trim(),rows=v=>Array.isArray(v)?v:[];
const esc=v=>s(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(catalog,appointments){
 const issues=[],ids=new Set(),byOperator=new Map();
 for(const a of rows(appointments)){
  const id=s(a.id);
  if(!id||ids.has(id))issues.push({id,code:'ID_APPUNTAMENTO_ASSENTE_O_DUPLICATO'});ids.add(id);
  try{planning.refs(catalog,a)}catch(e){issues.push({id,code:s(e.message)})}
  const start=Date.parse(a.startsAt),end=Date.parse(a.endsAt);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)issues.push({id,code:'FASCIA_ORARIA_NON_VALIDA'});
  const audit=rows(a.audit),visits=rows(a.visits);
  if(!audit.length)issues.push({id,code:'STORICO_ASSENTE'});
  for(const v of visits)if(!Number.isFinite(Date.parse(v.arrivedAt))||(v.leftAt&&(Date.parse(v.leftAt)<Date.parse(v.arrivedAt))))issues.push({id,code:'VISITA_ORARI_NON_VALIDI'});
  if(a.status==='closed'&&visits.some(v=>!v.leftAt))issues.push({id,code:'VISITA_NON_CHIUSA'});
  if(a.status!=='cancelled'&&Number.isFinite(start)&&Number.isFinite(end)){
   const key=s(a.operatorId),arr=byOperator.get(key)||[];
   for(const b of arr)if(start<b.end&&b.start<end)issues.push({id,otherId:b.id,code:'CONFLITTO_OPERATORE'});
   arr.push({id,start,end});byOperator.set(key,arr);
  }
 }
 return {issues,valid:issues.length===0,readOnly:true};
}
function report(catalog,appointments,filters={}){
 const selected=planning.calendar(appointments,filters),check=validate(catalog,appointments);
 const lookup=(table,id)=>rows(catalog[table]).find(x=>s(x.id)===s(id))||{};
 const entries=selected.map(a=>({id:a.id,start:a.startsAt,end:a.endsAt,operator:s(lookup('operators',a.operatorId).name||a.operatorId),client:s(lookup('clients',a.clientId).name||a.clientId),site:s(lookup('sites',a.siteId).address||lookup('sites',a.siteId).name||a.siteId),equipment:s(lookup('equipment',a.equipmentId).name||a.equipmentId),kind:s(a.kind),status:s(a.status),minutes:workflow.summary(a).minutes,extraCents:planning.extrasTotals(a).totalCents}));
 const html='<section class="ite-print-report"><h1>Agenda interventi I.T.E. 4.0 — collaudo</h1><table><thead><tr>'+['Data','Cliente','Sede','Apparecchiatura','Operatore','Tipo','Stato','Minuti','Extra €'].map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+entries.map(e=>'<tr>'+[e.start,e.client,e.site,e.equipment,e.operator,e.kind,e.status,e.minutes,(e.extraCents/100).toFixed(2)].map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></section>';
 return {entries,html,issues:check.issues,readOnly:true,printReady:check.valid};
}
const api=Object.freeze({validate,report});root.ITEFieldOperationsReport=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
