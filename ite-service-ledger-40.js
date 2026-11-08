/* I.T.E. 4.0.81 — Fascicolo intervento TEST: gerarchia, tempi, revisione e collegamenti. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEServiceLedger40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
const TYPES=["ordinary","extra"], STATES=["scheduled","arrived","closed","reopened"];
function clone(v){return JSON.parse(JSON.stringify(v));}
function assert(c,m){if(!c)throw Error(m);}
function date(s){assert(typeof s==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(s)&&Number.isFinite(Date.parse(s)),"Data/ora non valida");return Date.parse(s);}
function empty(){return {schema:"ITE-SERVICE-LEDGER-TEST-1",clients:[],sites:[],plants:[],equipment:[],operators:[],appointments:[],jobs:[]};}
function unique(items){const ids=new Set();for(const x of items){assert(x&&ID.test(x.id)&&!ids.has(x.id),"Identificativo TEST duplicato o non valido");ids.add(x.id);}return ids;}
function validate(s){
 assert(s&&s.schema==="ITE-SERVICE-LEDGER-TEST-1","Schema non valido");
 for(const k of ["clients","sites","plants","equipment","operators","appointments","jobs"])assert(Array.isArray(s[k])&&s[k].length<=2000,"Archivio non valido: "+k);
 const c=unique(s.clients),si=unique(s.sites),p=unique(s.plants),e=unique(s.equipment),o=unique(s.operators),a=unique(s.appointments);unique(s.jobs);
 for(const x of s.sites)assert(c.has(x.clientId),"Sede senza cliente");
 for(const x of s.plants)assert(si.has(x.siteId),"Impianto senza sede");
 for(const x of s.equipment)assert(p.has(x.plantId),"Apparecchiatura senza impianto");
 const site=new Map(s.sites.map(x=>[x.id,x])),plant=new Map(s.plants.map(x=>[x.id,x])),equip=new Map(s.equipment.map(x=>[x.id,x]));
 for(const x of s.appointments){
  assert(c.has(x.clientId)&&si.has(x.siteId)&&p.has(x.plantId)&&e.has(x.equipmentId)&&o.has(x.operatorId),"Appuntamento con riferimenti mancanti");
  assert(site.get(x.siteId).clientId===x.clientId&&plant.get(x.plantId).siteId===x.siteId&&equip.get(x.equipmentId).plantId===x.plantId,"Gerarchia appuntamento incoerente");
  date(x.scheduledAt);
 }
 const seen=new Set();
 for(const j of s.jobs){
  assert(a.has(j.appointmentId)&&!seen.has(j.appointmentId),"Intervento senza appuntamento o duplicato");seen.add(j.appointmentId);
  assert(STATES.includes(j.status)&&Array.isArray(j.events)&&j.events.length>0,"Stato o storico intervento non valido");
  let last=-Infinity,closed=0,opened=false;
  for(const ev of j.events){
   assert(["arrived","closed","reopened","amended"].includes(ev.type)&&o.has(ev.operatorId),"Evento/operatore non valido");
   const t=date(ev.at);assert(t>=last,"Cronologia non ordinata");last=t;
   if(ev.type==="arrived"){assert(!opened&&closed===0,"Arrivo non valido");opened=true;}
   if(ev.type==="closed"){assert(opened,"Chiusura senza apertura");opened=false;closed++;}
   if(ev.type==="reopened"){assert(!opened&&closed>0,"Revisione senza chiusura");opened=true;}
   if(ev.type==="amended")assert(opened,"Modifica fuori intervento");
  }
  const lastType=j.events[j.events.length-1].type;
  assert(j.status===(lastType==="closed"?"closed":closed>0?"reopened":"arrived"),"Stato non coerente con eventi");
 }
 return true;
}
function add(s,collection,item){validate(s);assert(["clients","sites","plants","equipment","operators","appointments"].includes(collection),"Collezione non ammessa");const n=clone(s);n[collection].push(clone(item));validate(n);return n;}
function event(s,appointmentId,type,operatorId,at,description){
 validate(s);assert(["arrived","closed","reopened","amended"].includes(type),"Tipo evento non valido");date(at);
 const n=clone(s),appointment=n.appointments.find(x=>x.id===appointmentId);assert(appointment,"Appuntamento inesistente");
 assert(n.operators.some(x=>x.id===operatorId),"Operatore inesistente");
 let job=n.jobs.find(x=>x.appointmentId===appointmentId);
 if(!job){assert(type==="arrived","Intervento avviabile solo con arrivo");job={id:"TEST-JOB-"+appointmentId.slice(5),appointmentId,status:"arrived",events:[]};n.jobs.push(job);}
 const last=job.events[job.events.length-1];
 assert(!last||date(at)>=date(last.at),"Evento precedente all'ultimo");
 const allowed=!last?["arrived"]:last.type==="closed"?["reopened"]:["closed","amended"];
 assert(allowed.includes(type),"Transizione intervento non consentita");
 job.events.push({type,operatorId,at,description:String(description||"").slice(0,1000)});
 job.status=type==="closed"?"closed":type==="reopened"||job.events.some(x=>x.type==="reopened")?"reopened":"arrived";
 validate(n);return n;
}
function report(s){
 validate(s);return s.appointments.map(a=>{const j=s.jobs.find(x=>x.appointmentId===a.id);let minutes=0,start=null;
 if(j)for(const ev of j.events){if(ev.type==="arrived"||ev.type==="reopened")start=date(ev.at);if(ev.type==="closed"&&start!==null){minutes+=(date(ev.at)-start)/60000;start=null;}}
 return {appointmentId:a.id,operatorId:a.operatorId,clientId:a.clientId,siteId:a.siteId,plantId:a.plantId,equipmentId:a.equipmentId,status:j?j.status:"scheduled",workedMinutes:minutes,revisionCount:j?j.events.filter(x=>x.type==="reopened").length:0,events:j?clone(j.events):[]};
 });}
function importJSON(raw){assert(typeof raw==="string"&&raw.length<=1000000,"Import troppo grande");const s=JSON.parse(raw);validate(s);return clone(s);}
function exportJSON(s){validate(s);return JSON.stringify(s,null,2);}
return Object.freeze({empty,validate,add,event,report,importJSON,exportJSON});
});