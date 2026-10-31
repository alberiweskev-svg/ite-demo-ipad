/* I.T.E. 4.0 — cross-module operational projection, pure read-only.
 * Join customer/site/system/device, calendar, visits and commercial extras.
 * Never infer approval, invoicing, receipt, or stock from descriptive notes.
 */
(function(root){'use strict';
const clean=v=>String(v??'').trim(),copy=v=>JSON.parse(JSON.stringify(v));
function index(rows,label){if(!Array.isArray(rows))throw Error(label+' non valido');const map=new Map();for(const row of rows){const id=clean(row?.id);if(!id||map.has(id))throw Error(label+': identificativo assente o duplicato');map.set(id,row)}return map}
function project(state,{from,to,operatorId='',extras=[]}={}){
 if(!state||!Array.isArray(state.appointments)||!Array.isArray(state.interventions)||!Array.isArray(extras))throw Error('Stato non valido');
 const clients=index(state.clients,'Clienti'),sites=index(state.sites,'Sedi'),systems=index(state.systems,'Impianti'),devices=index(state.devices,'Apparecchiature'),operators=index(state.operators,'Operatori');
 const visits=index(state.interventions,'Interventi'),issues=[],rows=[];
 const start=from?Date.parse(from):-Infinity,end=to?Date.parse(to):Infinity;
 if(Number.isNaN(start)||Number.isNaN(end)||end<=start)throw Error('Periodo non valido');
 const used=new Set();
 for(const appointment of state.appointments){
  const a=Date.parse(appointment.start),z=Date.parse(appointment.end);
  if(!Number.isFinite(a)||!Number.isFinite(z)||z<=a){issues.push({type:'INVALID_APPOINTMENT_TIME',appointmentId:appointment.id});continue}
  if(a>=end||z<=start||(operatorId&&appointment.operatorId!==operatorId))continue;
  const device=devices.get(appointment.deviceId),system=device&&systems.get(device.systemId),site=system&&sites.get(system.siteId),client=site&&clients.get(site.clientId),operator=operators.get(appointment.operatorId);
  if(!device||!system||!site||!client||!operator){issues.push({type:'BROKEN_HIERARCHY',appointmentId:appointment.id});continue}
  const visit=state.interventions.find(x=>x.appointmentId===appointment.id);
  if(visit&&used.has(visit.id)){issues.push({type:'DUPLICATE_VISIT_LINK',appointmentId:appointment.id});continue}
  if(visit)used.add(visit.id);
  const linkedExtras=extras.filter(x=>x.appointmentId===appointment.id).map(x=>{
   const lines=Array.isArray(x.lines)?x.lines:[];
   const valid=lines.every(l=>['Fornitura','Posa'].includes(l.line_type)&&Number.isFinite(Number(l.qty))&&Number(l.qty)>0&&Number.isFinite(Number(l.price))&&Number(l.price)>=0);
   if(!valid)issues.push({type:'INVALID_EXTRA_LINES',appointmentId:appointment.id,extraId:x.id});
   return {id:x.id,status:clean(x.status)||'DA_ACCETTARE',lineCount:lines.length,valid,hasFornitura:lines.some(l=>l.line_type==='Fornitura'),hasPosa:lines.some(l=>l.line_type==='Posa')};
  });
  const arrival=visit?.arrivalAt?Date.parse(visit.arrivalAt):null,departure=visit?.exitAt?Date.parse(visit.exitAt):null;
  const minutes=Number.isFinite(arrival)&&Number.isFinite(departure)&&departure>=arrival?Math.round((departure-arrival)/60000):null;
  rows.push({appointmentId:appointment.id,appointmentStatus:appointment.status,clientId:client.id,clientName:client.name,
   siteId:site.id,siteName:site.name,systemId:system.id,systemName:system.name,deviceId:device.id,deviceName:device.name,
   operatorId:operator.id,operatorName:operator.name,start:appointment.start,end:appointment.end,
   interventionId:visit?.id||null,interventionStatus:visit?.status||null,minutesOnSite:minutes,
   revisionCount:visit?.revisionCount||0,extraWorksCount:visit?.extraWorks?.length||0,commercialExtras:linkedExtras});
 }
 rows.sort((a,b)=>a.start.localeCompare(b.start)||a.appointmentId.localeCompare(b.appointmentId));
 return {rows:copy(rows),issues,summary:{appointments:rows.length,closed:rows.filter(x=>x.interventionStatus==='CLOSED').length,
  open:rows.filter(x=>['OPEN','REOPENED'].includes(x.interventionStatus)).length,
  minutesOnSite:rows.reduce((s,x)=>s+(x.minutesOnSite||0),0),
  extrasToApprove:rows.reduce((s,x)=>s+x.commercialExtras.filter(e=>e.status==='DA_ACCETTARE').length,0)},
  readOnly:true,stockChanged:false,financialDocumentsChanged:false};
}
const api=Object.freeze({project});root.ITEOperationsProjection=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
