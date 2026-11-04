/* I.T.E. 4.0 — pianificazione integrata, report e controllo qualità. Dati immutabili. */
(function(root){'use strict';
const A=root.ITEFieldAgenda||(typeof require==='function'?require('./ite-field-agenda.js'):null);
const F=root.ITEFieldWorkflow||(typeof require==='function'?require('./ite-field-workflow.js'):null);
const clone=x=>JSON.parse(JSON.stringify(x));
function validPeriod(from,to){const a=Date.parse(from),b=Date.parse(to);if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw Error('PERIODO_NON_VALIDO');return [a,b]}
function plan(state,master,from,to,operatorId){
 const [lo,hi]=validPeriod(from,to),appointments=(state.appointments||[]).filter(a=>Date.parse(a.startsAt)<hi&&Date.parse(a.endsAt)>lo&&(!operatorId||a.operatorId===operatorId)).sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
 const byOperator={};const anomalies=[];const seen=new Set();
 for(const a of appointments){
  try{A.chain(master,a)}catch(e){anomalies.push({id:a.id,type:'GERARCHIA',detail:e.message})}
  if(seen.has(a.id))anomalies.push({id:a.id,type:'DUPLICATO'});seen.add(a.id);
  const s=Date.parse(a.startsAt),e=Date.parse(a.endsAt);
  if(!Number.isFinite(s)||!Number.isFinite(e)||e<=s){anomalies.push({id:a.id,type:'ORARIO_NON_VALIDO'});continue}
  const bucket=byOperator[a.operatorId]||(byOperator[a.operatorId]={operatorId:a.operatorId,appointments:0,scheduledMinutes:0,workedMinutes:0,open:0,closed:0,extraAcceptedCents:0});
  bucket.appointments++;bucket.scheduledMinutes+=Math.round((Math.min(e,hi)-Math.max(s,lo))/60000);
  bucket.workedMinutes+=F.summary(a).minutes;
  if(a.status==='closed')bucket.closed++;else bucket.open++;
  for(const extra of a.extraWorks||[])for(const line of extra.lines||[]){
   const q=Number(line.acceptedQuantity||0),c=Number(line.unitCents);
   if(!Number.isFinite(q)||q<0||!Number.isSafeInteger(c)||c<0){anomalies.push({id:a.id,type:'EXTRA_NON_VALIDO'});continue}
   bucket.extraAcceptedCents+=Math.round(q*c);
  }
 }
 for(let i=0;i<appointments.length;i++)for(let j=i+1;j<appointments.length;j++){
  const a=appointments[i],b=appointments[j];if(a.operatorId!==b.operatorId||a.status==='cancelled'||b.status==='cancelled')continue;
  if(Date.parse(a.startsAt)<Date.parse(b.endsAt)&&Date.parse(b.startsAt)<Date.parse(a.endsAt))anomalies.push({id:a.id,otherId:b.id,type:'SOVRAPPOSIZIONE'});
 }
 return {from,to,operatorId:operatorId||null,operators:Object.values(byOperator).sort((a,b)=>a.operatorId.localeCompare(b.operatorId)),appointments:clone(appointments),anomalies,readOnly:true};
}
function report(state,master,from,to,operatorId){
 const p=plan(state,master,from,to,operatorId);
 const rows=p.appointments.map(a=>{let hierarchy=null;try{const c=A.chain(master,a);hierarchy={client:c.client.name||c.client.id,site:c.site.address||c.site.name||c.site.id,equipment:c.equipment.model||c.equipment.name||c.equipment.id}}catch(_){hierarchy={client:'DA VERIFICARE',site:'DA VERIFICARE',equipment:'DA VERIFICARE'}}
 return {id:a.id,start:a.startsAt,end:a.endsAt,operator:a.operatorId,status:a.status,kind:a.kind,minutes:F.summary(a).minutes,...hierarchy}});
 return {period:{from,to},rows,operators:p.operators,anomalies:p.anomalies,readOnly:true};
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function printable(r){
 const cols=['start','end','operator','client','site','equipment','kind','status','minutes'];
 const th=cols.map(c=>'<th>'+escapeHtml(c)+'</th>').join('');
 const body=r.rows.map(row=>'<tr>'+cols.map(c=>'<td>'+escapeHtml(row[c])+'</td>').join('')+'</tr>').join('');
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Agenda I.T.E. 4.0 - Collaudo</title><style>body{font:14px sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;text-align:left}th{background:#eee}@media print{body{margin:8mm}}</style></head><body><h1>Agenda interventi I.T.E. 4.0</h1><p>'+escapeHtml(r.period.from)+' — '+escapeHtml(r.period.to)+'</p><table><thead><tr>'+th+'</tr></thead><tbody>'+body+'</tbody></table><p>Anomalie: '+r.anomalies.length+'</p></body></html>';
}
const api=Object.freeze({plan,report,printable});root.ITEAgendaPlanning=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
