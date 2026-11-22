/* I.T.E. 4.0.273 — rapportini sintetici; nessun dato cliente reale. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFieldReport273=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const types=["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","EXTRA"];
function assert(ok,msg){if(!ok)throw Error(msg);}
function iso(value){const n=Date.parse(value);assert(Number.isFinite(n),"Data/ora non valida");return new Date(n).toISOString();}
function clone(x){return JSON.parse(JSON.stringify(x));}
function newReport({id,appointmentId,clientId,siteId,plantId,equipmentId,operatorId,arrival}){
for(const [k,v] of Object.entries({id,appointmentId,clientId,siteId,plantId,equipmentId,operatorId}))assert(typeof v==="string"&&v.trim(),k+" obbligatorio");
return {schema:"ite-field-report-273",id,appointmentId,clientId,siteId,plantId,equipmentId,operatorId,arrival:iso(arrival),departure:null,status:"IN_CORSO",activities:[],photos:[],notes:"",revision:0};
}
function addActivity(report,{type,description,quantity=1,unit="pz",extra=false}){
assert(report.status==="IN_CORSO","Intervento già chiuso");
assert(types.includes(type),"Tipologia non valida");
assert(typeof description==="string"&&description.trim(),"Descrizione obbligatoria");
assert(Number.isFinite(quantity)&&quantity>0&&quantity<=100000,"Quantità non valida");
const next=clone(report);next.activities.push({type,description:description.trim(),quantity,unit:String(unit).slice(0,12),extra:!!extra});next.revision++;return next;
}
function addPhotoMetadata(report,{name,size,type}){
assert(report.status==="IN_CORSO","Intervento già chiuso");
assert(typeof name==="string"&&name.length>0&&name.length<=180,"Nome foto non valido");
assert(Number.isInteger(size)&&size>=0&&size<=20*1024*1024,"Dimensione foto non valida");
assert(["image/jpeg","image/png","image/heic"].includes(type),"Formato foto non supportato");
const next=clone(report);next.photos.push({name,size,type});next.revision++;return next;
}
function close(report,{departure,notes="",otherWorkConfirmed=false}){
assert(report.status==="IN_CORSO","Intervento già chiuso");
const end=iso(departure);assert(Date.parse(end)>=Date.parse(report.arrival),"Uscita precedente all'arrivo");
assert(typeof notes==="string"&&notes.length<=5000,"Note non valide");
assert(typeof otherWorkConfirmed==="boolean","Conferma altri lavori obbligatoria");
const next=clone(report);next.departure=end;next.notes=notes;next.otherWorkConfirmed=otherWorkConfirmed;next.status="CHIUSO";next.durationMinutes=Math.round((Date.parse(end)-Date.parse(next.arrival))/60000);next.revision++;return next;
}
function validate(report){
const errors=[];if(!report||report.schema!=="ite-field-report-273")return ["Schema non valido"];
for(const key of ["id","appointmentId","clientId","siteId","plantId","equipmentId","operatorId"])if(!report[key])errors.push(key+" mancante");
if(report.status==="CHIUSO"&&(!report.departure||!Number.isFinite(report.durationMinutes)))errors.push("Chiusura incompleta");
for(const a of report.activities||[])if(!types.includes(a.type)||!(a.quantity>0))errors.push("Attività non valida");
return errors;
}
function save(storage,key,report){assert(validate(report).length===0,"Rapporto non valido");const payload=JSON.stringify(report);const previous=storage.getItem(key);try{storage.setItem(key,payload);assert(storage.getItem(key)===payload,"Verifica scrittura fallita");}catch(e){try{if(previous===null)storage.removeItem(key);else storage.setItem(key,previous);}catch(_){}throw e;}return true;}
function load(storage,key){const raw=storage.getItem(key);if(!raw)return null;const data=JSON.parse(raw);assert(validate(data).length===0,"Archivio non valido");return data;}
return {newReport,addActivity,addPhotoMetadata,close,validate,save,load};
});
