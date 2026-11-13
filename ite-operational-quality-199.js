/* I.T.E. 4.0.199 — operational quality audit; read-only TEST data. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperationalQuality199=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const array=(x,k)=>{if(!x||!Array.isArray(x[k]))throw Error("ARCHIVIO_"+k.toUpperCase()+"_NON_VALIDO");return x[k]};
const map=a=>new Map(a.map(x=>[x.id,x]));
const minutes=x=>{if(typeof x!=="string"||!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(x))return NaN;return Date.parse(x)};
function audit(field,commercial){
 const clients=array(field,"clients"),sites=array(field,"sites"),systems=array(field,"systems"),equipment=array(field,"equipment"),operators=array(field,"operators"),appointments=array(field,"appointments"),interventions=array(field,"interventions");
 const extras=array(commercial,"extras"),quotes=array(commercial,"quotes");
 const C=map(clients),S=map(sites),Y=map(systems),E=map(equipment),O=map(operators),A=map(appointments),I=map(interventions),X=map(extras);
 const issues=[],warnings=[],schedule=[],timeline=[];
 const error=(code,id)=>issues.push(code+":"+id),warn=(code,id)=>warnings.push(code+":"+id);
 for(const [kind,items] of [["CLIENTE",clients],["SEDE",sites],["IMPIANTO",systems],["APPARECCHIATURA",equipment],["OPERATORE",operators],["APPUNTAMENTO",appointments],["INTERVENTO",interventions],["EXTRA",extras],["PREVENTIVO",quotes]]){
  const seen=new Set();for(const x of items){if(!x||typeof x.id!=="string"||!x.id.trim())error("ID_NON_VALIDO",kind);else if(seen.has(x.id))error("ID_DUPLICATO",kind+"_"+x.id);else seen.add(x.id);}
 }
 for(const s of sites)if(!C.has(s.clientId))error("SEDE_CLIENTE",s.id);
 for(const y of systems)if(!S.has(y.siteId))error("IMPIANTO_SEDE",y.id);
 for(const e of equipment)if(!Y.has(e.systemId))error("APPARECCHIATURA_IMPIANTO",e.id);
 const ownerOf=e=>{const eq=E.get(e),sy=eq&&Y.get(eq.systemId),site=sy&&S.get(sy.siteId);return site?{siteId:site.id,clientId:site.clientId}:null};
 for(const a of appointments){
  const owner=ownerOf(a.equipmentId);
  if(!owner||!C.has(a.clientId)||!S.has(a.siteId))error("APPUNTAMENTO_ORFANO",a.id);
  else if(owner.siteId!==a.siteId||owner.clientId!==a.clientId)error("APPUNTAMENTO_GERARCHIA",a.id);
  if(!O.has(a.operatorId))error("APPUNTAMENTO_OPERATORE",a.id);
  const start=minutes(a.start),end=minutes(a.end);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)error("APPUNTAMENTO_ORARIO",a.id);
  else schedule.push({id:a.id,operatorId:a.operatorId,start,end});
  timeline.push({id:a.id,kind:"APPUNTAMENTO",start:a.start||"",end:a.end||"",operatorId:a.operatorId||"",status:a.status||""});
 }
 schedule.sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
 const active=new Map();
 for(const item of schedule){const previous=active.get(item.operatorId);if(previous&&previous.end>item.start)error("SOVRAPPOSIZIONE_TECNICO",previous.id+"_"+item.id);if(!previous||item.end>previous.end)active.set(item.operatorId,item);}
 const count=new Map();
 for(const i of interventions){
  const a=A.get(i.appointmentId);if(!a){error("INTERVENTO_SENZA_APPUNTAMENTO",i.id);continue;}
  count.set(a.id,(count.get(a.id)||0)+1);
  if(i.clientId!==a.clientId||i.siteId!==a.siteId||i.equipmentId!==a.equipmentId)error("INTERVENTO_GERARCHIA",i.id);
  if(!Number.isSafeInteger(i.durationMinutes)||i.durationMinutes<0)error("INTERVENTO_DURATA",i.id);
  else {const start=minutes(a.start),end=minutes(a.end);if(Number.isFinite(start)&&Number.isFinite(end)&&i.durationMinutes>(end-start)/60000)warn("DURATA_SUPERA_APPUNTAMENTO",i.id);}
  if(i.status==="CHIUSO"&&i.durationMinutes===0)warn("CHIUSO_SENZA_DURATA",i.id);
  timeline.push({id:i.id,kind:"INTERVENTO",start:a.start||"",end:a.end||"",operatorId:a.operatorId||"",status:i.status||""});
 }
 for(const [id,n] of count)if(n>1)error("INTERVENTI_MULTIPLI_APPUNTAMENTO",id);
 for(const e of extras){if(!I.has(e.interventionId))error("EXTRA_INTERVENTO",e.id);if(e.kind!=="FORNITURA"&&e.kind!=="POSA")warn("EXTRA_TIPO_DA_VERIFICARE",e.id);}
 for(const q of quotes){if(!I.has(q.interventionId))error("PREVENTIVO_INTERVENTO",q.id);if(!Number.isSafeInteger(q.totalCents)||q.totalCents<0)error("PREVENTIVO_IMPORTO",q.id);for(const id of q.extraIds||[])if(!X.has(id)||X.get(id).interventionId!==q.interventionId)error("PREVENTIVO_EXTRA",q.id+"_"+id);}
 timeline.sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
 return {schema:"ITE_OPERATIONAL_QUALITY_TEST_199",valid:issues.length===0,issues:[...new Set(issues)],warnings:[...new Set(warnings)],timeline,totals:{appointments:appointments.length,interventions:interventions.length,extras:extras.length,quotes:quotes.length,overlaps:issues.filter(x=>x.startsWith("SOVRAPPOSIZIONE_TECNICO:")).length},warning:"Solo dati TEST; nessuna modifica agli archivi."};
}
return Object.freeze({audit});
});