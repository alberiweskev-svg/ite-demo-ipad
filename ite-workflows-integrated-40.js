/* I.T.E. 4.0.41 — demo-only integrated scheduling and service workflow.
 * Pure, dependency-free engine; no customer data or network calls. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkflows40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const validId=v=>typeof v==="string"&&/^TEST-[A-Z0-9-]{2,60}$/.test(v);
const iso=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(v)&&Number.isFinite(Date.parse(v));
const clone=v=>JSON.parse(JSON.stringify(v));
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const find=(rows,id,label)=>{const x=rows.find(r=>r.id===id);assert(x,label+" inesistente: "+id);return x;};
function validate(db){
 assert(db&&typeof db==="object","Archivio mancante");
 for(const key of ["clients","sites","plants","equipment","operators","appointments","interventions","estimates"])assert(Array.isArray(db[key]),"Archivio "+key+" mancante");
 const ids=new Set();
 for(const key of ["clients","sites","plants","equipment","operators","appointments","interventions","estimates"]){
  for(const r of db[key]){assert(r&&validId(r.id),"Identificativo TEST non valido in "+key);assert(!ids.has(r.id),"ID duplicato "+r.id);ids.add(r.id);}
 }
 for(const s of db.sites)find(db.clients,s.clientId,"Cliente");
 for(const p of db.plants)find(db.sites,p.siteId,"Sede");
 for(const e of db.equipment)find(db.plants,e.plantId,"Impianto");
 for(const a of db.appointments){
  assert(iso(a.start)&&iso(a.end)&&Date.parse(a.end)>Date.parse(a.start),"Orario appuntamento non valido");
  find(db.operators,a.operatorId,"Operatore");const eq=find(db.equipment,a.equipmentId,"Apparecchiatura");
  const plant=find(db.plants,eq.plantId,"Impianto"),site=find(db.sites,plant.siteId,"Sede");
  assert(a.clientId===site.clientId&&a.siteId===site.id,"Appuntamento non coerente con anagrafica");
  assert(["PLANNED","ARRIVED","CLOSED","CANCELLED"].includes(a.status),"Stato appuntamento non valido");
 }
 for(const w of db.interventions){
  const a=find(db.appointments,w.appointmentId,"Appuntamento");
  assert(w.operatorId===a.operatorId,"Operatore intervento diverso da appuntamento");
  assert(["OPEN","CLOSED","REVISED"].includes(w.status),"Stato intervento non valido");
  assert(Array.isArray(w.history),"Storico mancante");
  if(w.arrival)assert(iso(w.arrival),"Arrivo non valido");
  if(w.exit){assert(iso(w.exit)&&w.arrival&&Date.parse(w.exit)>=Date.parse(w.arrival),"Uscita non valida");}
  if(w.status==="CLOSED")assert(!!w.exit,"Intervento chiuso senza uscita");
 }
 for(const q of db.estimates){
  find(db.clients,q.clientId,"Cliente");assert(Array.isArray(q.lines),"Righe preventivo mancanti");
  for(const l of q.lines){assert(["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","EXTRA"].includes(l.type),"Tipo riga non valido");assert(Number.isFinite(l.amount)&&l.amount>=0,"Importo non valido");assert(["PROPOSED","ACCEPTED","REJECTED"].includes(l.status),"Stato riga non valido");}
 }
 return true;
}
function conflicts(db,candidate,ignoreId){
 return db.appointments.filter(a=>a.id!==ignoreId&&a.operatorId===candidate.operatorId&&a.status!=="CANCELLED"&&candidate.start<a.end&&a.start<candidate.end);
}
function schedule(db,a){
 const next=clone(db);assert(validId(a.id),"ID TEST obbligatorio");assert(!next.appointments.some(x=>x.id===a.id),"Appuntamento duplicato");
 next.appointments.push({...a,status:"PLANNED"});validate(next);
 assert(!conflicts(next,a,a.id).length,"Operatore già impegnato nella fascia oraria");return next;
}
function transition(db,appointmentId,action,at,operatorId,description=""){
 const next=clone(db),a=find(next.appointments,appointmentId,"Appuntamento");
 assert(a.operatorId===operatorId,"Operatore non autorizzato");assert(iso(at),"Data e ora non valide");
 let w=next.interventions.find(x=>x.appointmentId===appointmentId);
 if(action==="ARRIVE"){
  assert(a.status==="PLANNED","Appuntamento non programmato");assert(!w,"Intervento già esistente");
  w={id:"TEST-W-"+a.id.slice(5),appointmentId,operatorId,status:"OPEN",arrival:at,exit:null,history:[{action,at,operatorId}]};
  assert(!next.interventions.some(x=>x.id===w.id),"ID intervento duplicato");next.interventions.push(w);a.status="ARRIVED";
 }else if(action==="CLOSE"){
  assert(a.status==="ARRIVED"&&w&&w.status!=="CLOSED","Intervento non aperto");
  assert(Date.parse(at)>=Date.parse(w.arrival),"Uscita prima dell'arrivo");
  w.exit=at;w.status="CLOSED";a.status="CLOSED";w.history.push({action,at,operatorId,description});
 }else if(action==="REVISE"){
  assert(a.status==="CLOSED"&&w&&w.status==="CLOSED","Intervento non chiuso");
  w.status="REVISED";a.status="ARRIVED";w.history.push({action,at,operatorId,description});
 }else throw new Error("Azione non prevista");
 validate(next);return next;
}
function addExtra(db,estimateId,line){
 const next=clone(db),q=find(next.estimates,estimateId,"Preventivo");
 assert(validId(line.id),"ID riga TEST non valido");assert(!q.lines.some(l=>l.id===line.id),"Riga duplicata");
 q.lines.push({...line,type:"EXTRA",status:"PROPOSED"});validate(next);return next;
}
function approveExtra(db,estimateId,lineId,accepted){
 const next=clone(db),q=find(next.estimates,estimateId,"Preventivo"),l=find(q.lines,lineId,"Riga");
 assert(l.type==="EXTRA"&&l.status==="PROPOSED","Extra già deciso o non valido");
 l.status=accepted?"ACCEPTED":"REJECTED";validate(next);return next;
}
function totals(db,estimateId){
 validate(db);const q=find(db.estimates,estimateId,"Preventivo");
 return q.lines.reduce((a,l)=>{a[l.type]=(a[l.type]||0)+(l.status==="ACCEPTED"?l.amount:0);return a;},{FORNITURA:0,POSA:0,SMONTAGGIO:0,SMALTIMENTO:0,EXTRA:0});
}
return {validate,schedule,transition,conflicts,addExtra,approveExtra,totals};
});
