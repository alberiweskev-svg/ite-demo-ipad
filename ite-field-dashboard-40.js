/* I.T.E. 4.0.28 — Cruscotto integrato pianificazione, interventi e preventivi TEST. */
(function(root){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const validId=x=>typeof x==='string'&&/^TEST-[\w-]{1,70}$/.test(x);
const date=x=>{const n=Date.parse(x);if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(x)||!Number.isFinite(n))throw Error('DATA_NON_VALIDA');return n};
const cents=x=>Math.round(x*100);
function build(state,from,to,operatorId){
 if(!state||!['clients','operators','appointments','interventions','quotes','audit'].every(k=>Array.isArray(state[k])))throw Error('ARCHIVIO_NON_VALIDO');
 const begin=date(from),end=date(to);if(end<=begin||end-begin>93*86400000)throw Error('INTERVALLO_NON_VALIDO');
 if(operatorId&&!validId(operatorId))throw Error('SOLO_DATI_TEST');
 const warnings=[],items=[],byOperator={},byClient={},seen=new Set();
 for(const op of state.operators){if(!validId(op.id))throw Error('SOLO_DATI_TEST');byOperator[op.id]={id:op.id,name:op.name,scheduledMinutes:0,workedMinutes:0,appointments:0,closed:0,open:0,cancelled:0};}
 for(const a of state.appointments){
  if(!validId(a.id)||!validId(a.clientId)||!validId(a.operatorId))throw Error('SOLO_DATI_TEST');
  if(seen.has(a.id)){warnings.push({code:'APPUNTAMENTO_DUPLICATO',id:a.id});continue}seen.add(a.id);
  const start=date(a.start),finish=date(a.end);if(finish<=start){warnings.push({code:'ORARIO_NON_VALIDO',id:a.id});continue}
  if(start>=end||finish<=begin||operatorId&&a.operatorId!==operatorId)continue;
  const client=state.clients.find(c=>c.id===a.clientId);
  const site=client?.sites?.find(s=>s.id===a.siteId),plant=site?.plants?.find(p=>p.id===a.plantId);
  if(!client||!plant||a.deviceId&&!plant.devices?.some(d=>d.id===a.deviceId))warnings.push({code:'GERARCHIA_NON_VALIDA',id:a.id});
  const op=byOperator[a.operatorId];if(!op)warnings.push({code:'OPERATORE_ASSENTE',id:a.id});
  const interventions=state.interventions.filter(i=>i.appointmentId===a.id);
  if(interventions.length>1)warnings.push({code:'INTERVENTI_MULTIPLI',id:a.id});
  if(a.status==='CHIUSO'&&!interventions.length)warnings.push({code:'INTERVENTO_MANCANTE',id:a.id});
  const intervention=interventions[0],minutes=Math.round((Math.min(finish,end)-Math.max(start,begin))/60000);
  let worked=0;
  if(intervention?.arrival&&intervention?.departure){
   const arrive=date(intervention.arrival),depart=date(intervention.departure);
   if(depart<arrive)warnings.push({code:'TEMPI_INCOERENTI',id:a.id});
   else worked=Math.max(0,Math.round((Math.min(depart,end)-Math.max(arrive,begin))/60000));
  }
  const row={id:a.id,clientId:a.clientId,clientName:client?.name||'Cliente non trovato',siteAddress:site?.address||'',operatorId:a.operatorId,start:a.start,end:a.end,status:a.status,kind:a.kind||'',scheduledMinutes:a.status==='ANNULLATO'?0:minutes,workedMinutes:worked,interventionId:intervention?.id||null};
  items.push(row);
  if(op){op.appointments++;if(a.status==='ANNULLATO')op.cancelled++;else{op.scheduledMinutes+=minutes;if(a.status==='CHIUSO')op.closed++;else op.open++;op.workedMinutes+=worked}}
  const c=byClient[a.clientId]||(byClient[a.clientId]={clientId:a.clientId,name:client?.name||'Cliente non trovato',appointments:0,scheduledMinutes:0,workedMinutes:0,quotes:0,approvedCents:0,pendingExtraCents:0});
  c.appointments++;c.scheduledMinutes+=row.scheduledMinutes;c.workedMinutes+=worked;
 }
 // Importi preventivi contabilizzati una sola volta per cliente, mai una volta per appuntamento.
 const clientIds=new Set(items.map(x=>x.clientId));
 for(const q of state.quotes){if(!clientIds.has(q.clientId))continue;
  if(!validId(q.id)||!validId(q.clientId))throw Error('SOLO_DATI_TEST');
  const c=byClient[q.clientId];c.quotes++;
  for(const l of q.lines||[]){const amount=cents(Number(l.quantity)*Number(l.unitPrice));if(!Number.isSafeInteger(amount)||amount<0)throw Error('IMPORTO_NON_VALIDO');if(l.extra&&!l.approved)c.pendingExtraCents+=amount;else c.approvedCents+=amount}
 }
 items.sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
 return copy({from,to,operatorId:operatorId||null,appointments:items,operators:Object.values(byOperator).filter(x=>!operatorId||x.id===operatorId),clients:Object.values(byClient).sort((a,b)=>a.name.localeCompare(b.name)),warnings,summary:{appointments:items.length,scheduledMinutes:items.reduce((n,x)=>n+x.scheduledMinutes,0),workedMinutes:items.reduce((n,x)=>n+x.workedMinutes,0),approvedCents:Object.values(byClient).reduce((n,x)=>n+x.approvedCents,0),pendingExtraCents:Object.values(byClient).reduce((n,x)=>n+x.pendingExtraCents,0)}});
}
const api=Object.freeze({build});root.ITE40FieldDashboard=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
