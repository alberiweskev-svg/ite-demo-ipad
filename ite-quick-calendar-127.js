/* I.T.E. 4.0.127 — touch calendar slots, TEST-only. No network or persistence. */
(function(root){"use strict";
const validDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T12:00:00Z"))&&new Date(s+"T12:00:00Z").toISOString().slice(0,10)===s;
const clock=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
function slots(state,{date,operatorId,startHour=8,endHour=19,step=30,duration=60}={}){
 if(!root.ITE_Calendar125||!root.ITE_Audit124)throw Error("DIPENDENZE_ASSENTI");
 if(!validDay(date))throw Error("DATA_NON_VALIDA");
 if(!state?.field?.catalog?.operators?.some(o=>o.id===operatorId))throw Error("OPERATORE_NON_VALIDO");
 if(!Number.isInteger(startHour)||!Number.isInteger(endHour)||startHour<0||endHour>24||endHour<=startHour||![15,30,60].includes(step)||!Number.isInteger(duration)||duration<15||duration>480||duration%15)throw Error("PARAMETRI_ORARI_NON_VALIDI");
 if(!root.ITE_Audit124.audit(state).ok)throw Error("AUDIT_NON_SUPERATO");
 const result=[];
 for(let m=startHour*60;m+duration<=endHour*60;m+=step){
  const startAt=date+"T"+clock(m),endAt=date+"T"+clock(m+duration);
  const conflicts=root.ITE_Calendar125.conflicts(state,{operatorId,startAt,endAt});
  result.push({startAt,endAt,available:conflicts.length===0,conflicts});
 }
 return result;
}
function bookSlot(state,{slot,clientId,siteId,systemId,equipmentId="",operatorId,kind="ALTRO",notes="",id},actor){
 if(!slot||!slot.available)throw Error("FASCIA_OCCUPATA");
 if(!root.ITE_Booking126)throw Error("BOOKING_ASSENTE");
 return root.ITE_Booking126.book(state,{id,clientId,siteId,systemId,equipmentId,operatorId,startAt:slot.startAt,endAt:slot.endAt,kind,notes},actor);
}
const api=Object.freeze({slots,bookSlot});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_QuickCalendar127=api;
})(typeof globalThis!=="undefined"?globalThis:this);
