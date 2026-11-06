/* I.T.E. 4.0.45 — Fascicolo tecnico TEST. No PDF contents, no network, no customer data.
 * Immutable, validated linkage to client/site/plant/equipment and appointment.
 * Does not replace Di.Co., Di.Ri., GAS, POS or CAD 2.7.5. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITETechnicalDossier40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const TYPES=["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","ITE_CAD","RAPPORTO_INTERVENTO"];
const STATES=["DRAFT","REVIEW","APPROVED","ARCHIVED"];
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
const clone=x=>JSON.parse(JSON.stringify(x));
function check(x,msg){if(!x)throw new Error(msg);}
function id(x){return typeof x==="string"&&ID.test(x);}
function date(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T12:00:00Z"))&&new Date(x+"T12:00:00Z").toISOString().slice(0,10)===x;}
function record(rows,key){return rows.find(r=>r.id===key);}
function context(h,link){
 check(h&&["clients","sites","plants","equipment","appointments"].every(k=>Array.isArray(h[k])),"Gerarchia incompleta");
 const client=record(h.clients,link.clientId);check(client,"Cliente mancante");
 const site=record(h.sites,link.siteId);check(site&&site.clientId===client.id,"Sede non appartenente al cliente");
 if(link.plantId){
  const plant=record(h.plants,link.plantId);check(plant&&plant.siteId===site.id,"Impianto non appartenente alla sede");
  if(link.equipmentId){const eq=record(h.equipment,link.equipmentId);check(eq&&eq.plantId===plant.id,"Apparecchiatura non appartenente all'impianto");}
 }else check(!link.equipmentId,"Apparecchiatura senza impianto");
 if(link.appointmentId){
  const ap=record(h.appointments,link.appointmentId);
  check(ap&&ap.clientId===client.id&&ap.siteId===site.id,"Appuntamento non coerente");
  if(link.equipmentId)check(ap.equipmentId===link.equipmentId,"Apparecchiatura diversa dall'appuntamento");
 }
 return true;
}
function validate(db,h){
 check(db&&Array.isArray(db.documents)&&Array.isArray(db.audit),"Fascicolo non valido");
 const used=new Set();
 for(const d of db.documents){
  check(id(d.id)&&!used.has(d.id),"ID documento non valido o duplicato");used.add(d.id);
  check(TYPES.includes(d.type),"Tipo documento non supportato");
  check(STATES.includes(d.state),"Stato documento non supportato");
  check(typeof d.title==="string"&&d.title.trim().length>=3&&d.title.length<=180,"Titolo non valido");
  check(date(d.date),"Data documento non valida");context(h,d.link);
  check(Array.isArray(d.attachments),"Allegati mancanti");
  const attachments=new Set();
  for(const a of d.attachments){
   check(id(a.id)&&!attachments.has(a.id),"ID allegato duplicato");attachments.add(a.id);
   check(typeof a.name==="string"&&a.name.length>0&&a.name.length<=180&&!/[\\/]/.test(a.name),"Nome allegato non valido");
   check(a.mime==="application/pdf"&&Number.isSafeInteger(a.bytes)&&a.bytes>0&&a.bytes<=25000000,"Metadati PDF non validi");
   check(typeof a.sha256==="string"&&/^[a-f0-9]{64}$/.test(a.sha256),"Impronta SHA-256 obbligatoria");
   check(!("data" in a)&&!("content" in a)&&!("base64" in a)&&!("url" in a),"Non archiviare contenuti o URL PDF nel fascicolo TEST");
  }
 }
 for(const e of db.audit)check(id(e.documentId)&&id(e.operatorId)&&["CREATE","ATTACH","SUBMIT","APPROVE","ARCHIVE","REOPEN"].includes(e.action)&&date(e.date),"Storico non valido");
 return true;
}
function empty(){return {schema:"ITE-DOSSIER-40-1",documents:[],audit:[]};}
function transact(db,h,operatorId,day,documentId,action,apply){
 check(id(operatorId)&&date(day),"Operatore TEST e data obbligatori");
 const next=clone(db);apply(next);next.audit.push({documentId,operatorId,date:day,action});
 validate(next,h);return next;
}
function create(db,h,d,operatorId){
 check(d&&id(d.id)&&!db.documents.some(x=>x.id===d.id),"ID documento duplicato");
 return transact(db,h,operatorId,d.date,d.id,"CREATE",n=>n.documents.push({id:d.id,type:d.type,title:d.title,date:d.date,link:clone(d.link),state:"DRAFT",attachments:[]}));
}
function attach(db,h,documentId,a,operatorId,day){
 return transact(db,h,operatorId,day,documentId,"ATTACH",n=>{
  const d=record(n.documents,documentId);check(d&&d.state==="DRAFT","Allegati modificabili solo in bozza");
  check(!d.attachments.some(x=>x.id===a.id||x.sha256===a.sha256),"Allegato duplicato");
  d.attachments.push(clone(a));
 });
}
function transition(db,h,documentId,target,operatorId,day){
 const moves={DRAFT:{REVIEW:"SUBMIT"},REVIEW:{APPROVED:"APPROVE",DRAFT:"REOPEN"},APPROVED:{ARCHIVED:"ARCHIVE"}};
 const current=record(db.documents,documentId);check(current,"Documento mancante");
 const action=(moves[current.state]||{})[target];check(action,"Transizione non consentita");
 return transact(db,h,operatorId,day,documentId,action,n=>{
  const d=record(n.documents,documentId);
  if(target==="REVIEW")check(d.attachments.length>0,"Serve almeno un PDF verificato prima della revisione");
  d.state=target;
 });
}
function list(db,h,filter={}){
 validate(db,h);
 return db.documents.filter(d=>["clientId","siteId","plantId","equipmentId","appointmentId"].every(k=>!filter[k]||d.link[k]===filter[k])&&(!filter.type||d.type===filter.type)&&(!filter.state||d.state===filter.state)).map(clone);
}
function exportJson(db,h){validate(db,h);return JSON.stringify(db,null,2);}
function importJson(json,h){check(typeof json==="string"&&json.length<=2000000,"Dimensione archivio non valida");const db=JSON.parse(json);check(db.schema==="ITE-DOSSIER-40-1","Schema incompatibile");validate(db,h);return clone(db);}
return {TYPES,STATES,empty,validate,create,attach,transition,list,exportJson,importJson};
});
