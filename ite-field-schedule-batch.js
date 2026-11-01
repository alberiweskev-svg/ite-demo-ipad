/* I.T.E. 4.0: atomic scheduling preview, technician utilization and conflict diagnostics. */
(function(root){'use strict';
const planning=root.ITEFieldPlanning||(typeof require==='function'?require('./ite-field-planning.js'):null);
const capacity=root.ITEFieldTechnicianCapacity||(typeof require==='function'?require('./ite-field-technician-capacity.js'):null);
const clone=v=>JSON.parse(JSON.stringify(v));
function preview(catalog,existing,proposals){
 if(!Array.isArray(existing)||!Array.isArray(proposals))throw Error('APPUNTAMENTI_NON_VALIDI');
 let accepted=clone(existing);const results=[];
 for(let i=0;i<proposals.length;i++){
  const input=proposals[i];
  try{
   if(!input||typeof input!=='object')throw Error('PROPOSTA_NON_VALIDA');
   accepted=planning.schedule(catalog,accepted,input);
   results.push({index:i,id:input.id,accepted:true,reason:null});
  }catch(e){results.push({index:i,id:input&&input.id||null,accepted:false,reason:String(e.message)})}
 }
 const ok=results.every(x=>x.accepted);
 return {ok,results,proposedCount:proposals.length,acceptedCount:results.filter(x=>x.accepted).length,appointments:ok?accepted:clone(existing),readOnly:true};
}
function conflicts(appointments){
 if(!Array.isArray(appointments))throw Error('APPUNTAMENTI_NON_VALIDI');
 const ordered=appointments.filter(a=>a.status!=='cancelled').slice().sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
 const issues=[];
 for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
  const a=ordered[i],b=ordered[j];
  if(Date.parse(b.startsAt)>=Date.parse(a.endsAt))break;
  if(a.operatorId===b.operatorId&&Date.parse(a.startsAt)<Date.parse(b.endsAt))issues.push({operatorId:a.operatorId,firstId:a.id,secondId:b.id,code:'OPERATORE_OCCUPATO'});
 }
 return issues;
}
function utilization(catalog,appointments,day,{workingMinutes=480}={}){
 if(!Number.isFinite(workingMinutes)||workingMinutes<=0)throw Error('MINUTI_LAVORATIVI_NON_VALIDI');
 return capacity.workload(catalog,appointments,day).map(x=>({...x,workingMinutes,loadPercent:Math.round(x.busyMinutes/workingMinutes*100),overbooked:x.busyMinutes>workingMinutes}));
}
const api=Object.freeze({preview,conflicts,utilization});root.ITEFieldScheduleBatch=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
