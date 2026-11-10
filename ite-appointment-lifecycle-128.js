/* I.T.E. 4.0.128 — TEST-only appointment lifecycle. Immutable operations, no storage. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const stamp=s=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).getFullYear()===Number(s.slice(0,4))&&new Date(s).getMonth()+1===Number(s.slice(5,7))&&new Date(s).getDate()===Number(s.slice(8,10));
function change(state,{type,id,startAt,endAt,operatorId,reason},actor){
 if(!root.ITE_Audit124||!root.ITE_Operations123||!root.ITE_Calendar125)throw Error("DIPENDENZE_ASSENTI");
 if(!root.ITE_Audit124.audit(state).ok)throw Error("AUDIT_NON_SUPERATO");
 if(!String(actor||"").trim())throw Error("OPERATORE_OBBLIGATORIO");
 if(!String(reason||"").trim())throw Error("MOTIVO_OBBLIGATORIO");
 if(!["RESCHEDULE","CANCEL"].includes(type))throw Error("AZIONE_NON_VALIDA");
 const next=copy(state),c=next.field.catalog,ap=c.appointments.find(a=>a.id===id);
 if(!ap)throw Error("APPUNTAMENTO_INESISTENTE");
 if(ap.status!=="PROGRAMMATO"||c.interventions.some(i=>i.appointmentId===id))throw Error("APPUNTAMENTO_NON_MODIFICABILE");
 const before=copy(ap);
 if(type==="RESCHEDULE"){
  if(!stamp(startAt)||!stamp(endAt)||Date.parse(endAt)<=Date.parse(startAt)||startAt.slice(0,10)!==endAt.slice(0,10))throw Error("ORARIO_NON_VALIDO");
  if(!c.operators.some(o=>o.id===operatorId))throw Error("OPERATORE_NON_VALIDO");
  const conflicts=root.ITE_Calendar125.conflicts(state,{operatorId,startAt,endAt}).filter(x=>x!==id);
  if(conflicts.length)throw Error("SOVRAPPOSIZIONE_OPERATORE:"+conflicts.join(","));
  ap.startAt=startAt;ap.endAt=endAt;ap.operatorId=operatorId;
 }else ap.status="ANNULLATO";
 const at=new Date().toISOString();
 ap.changes=Array.isArray(ap.changes)?ap.changes:[];
 ap.changes.push({type,actor:String(actor).trim(),reason:String(reason).trim(),at,before:{startAt:before.startAt,endAt:before.endAt,operatorId:before.operatorId,status:before.status}});
 next.field.revision++;next.field.history.push({revision:next.field.revision,action:type,actor:String(actor).trim(),at});
 next.revision++;next.events.push({revision:next.revision,type,actor:String(actor).trim(),at,appointmentId:id});
 if(!root.ITE_Audit124.audit(next).ok)throw Error("AUDIT_FINALE_NON_SUPERATO");
 return next;
}
function list(state,{date,operatorId,includeCancelled=false}={}){
 if(!root.ITE_Audit124.audit(state).ok)throw Error("AUDIT_NON_SUPERATO");
 return copy(state.field.catalog.appointments.filter(a=>(!date||a.startAt.slice(0,10)===date)&&(!operatorId||a.operatorId===operatorId)&&(includeCancelled||a.status!=="ANNULLATO")).sort((a,b)=>a.startAt.localeCompare(b.startAt)));
}
const api=Object.freeze({change,list});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_AppointmentLifecycle128=api;
})(typeof globalThis!=="undefined"?globalThis:this);
