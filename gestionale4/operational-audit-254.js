/* I.T.E. 4.0.254 — consolidated operational audit, synthetic/local data only. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperationalAudit254=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const parse=v=>typeof v==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(v)&&Number.isFinite(Date.parse(v))?Date.parse(v):NaN;
const clean=v=>String(v??"").trim();
function report(s){
 const issues=[],rows=[],byId=(key)=>new Map((s[key]||[]).map(x=>[x.id,x]));
 const clients=byId("clients"),sites=byId("sites"),plants=byId("plants"),equipment=byId("equipment"),appointments=byId("appointments");
 const add=(severity,code,id,detail="")=>issues.push({severity,code,id:String(id||""),detail});
 for(const site of s.sites||[])if(!clients.has(site.clientId))add("ERROR","CLIENTE_SEDE_ASSENTE",site.id);
 for(const p of s.plants||[])if(!sites.has(p.siteId))add("ERROR","SEDE_IMPIANTO_ASSENTE",p.id);
 for(const e of s.equipment||[])if(!plants.has(e.plantId))add("ERROR","IMPIANTO_APPARECCHIO_ASSENTE",e.id);
 const sorted=[...(s.appointments||[])].sort((a,b)=>String(a.operator).localeCompare(String(b.operator))||String(a.start).localeCompare(String(b.start)));
 for(let k=0;k<sorted.length;k++){
  const a=sorted[k],start=parse(a.start),end=parse(a.end);
  if(!sites.has(a.siteId))add("ERROR","SEDE_APPUNTAMENTO_ASSENTE",a.id);
  if(!clean(a.operator))add("ERROR","OPERATORE_ASSENTE",a.id);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)add("ERROR","FASCIA_NON_VALIDA",a.id);
  else rows.push({id:a.id,operator:clean(a.operator),siteId:a.siteId,start:a.start,end:a.end,minutes:(end-start)/60000});
  for(let j=k+1;j<sorted.length;j++){
   const b=sorted[j];if(clean(a.operator).toLocaleLowerCase("it")!==clean(b.operator).toLocaleLowerCase("it"))break;
   if(Number.isFinite(start)&&Number.isFinite(end)&&Number.isFinite(parse(b.start))&&Number.isFinite(parse(b.end))&&start<parse(b.end)&&parse(b.start)<end)add("ERROR","SOVRAPPOSIZIONE_OPERATORE",a.id,b.id);
  }
 }
 for(const i of s.interventions||[]){
  if(!sites.has(i.siteId))add("ERROR","SEDE_INTERVENTO_ASSENTE",i.id);
  if(i.appointmentId){const a=appointments.get(i.appointmentId);if(!a)add("ERROR","APPUNTAMENTO_ASSENTE",i.id);else{if(a.siteId!==i.siteId)add("ERROR","SEDE_INTERVENTO_DIVERSA",i.id);if(a.operator!==i.operator)add("ERROR","OPERATORE_INTERVENTO_DIVERSO",i.id);}}
  if(i.equipmentId){const e=equipment.get(i.equipmentId),p=e&&plants.get(e.plantId);if(!p||p.siteId!==i.siteId)add("ERROR","APPARECCHIATURA_SEDE_DIVERSA",i.id);}
  if(i.status==="CHIUSO"&&(!Number.isFinite(parse(i.arrival))||!Number.isFinite(parse(i.exit))||parse(i.exit)<parse(i.arrival)))add("ERROR","CHIUSURA_INCOERENTE",i.id);
  if(i.status==="IN_CORSO"&&!Number.isFinite(parse(i.arrival)))add("WARNING","ARRIVO_MANCANTE",i.id);
 }
 issues.sort((a,b)=>a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
 const totals={appointments:rows.length,minutes:rows.reduce((n,r)=>n+r.minutes,0),interventions:(s.interventions||[]).length,open:(s.interventions||[]).filter(i=>i.status==="APERTO").length,inProgress:(s.interventions||[]).filter(i=>i.status==="IN_CORSO").length,closed:(s.interventions||[]).filter(i=>i.status==="CHIUSO").length,errors:issues.filter(i=>i.severity==="ERROR").length,warnings:issues.filter(i=>i.severity==="WARNING").length};
 return {totals,issues,rows};
}
function csv(report){const safe=v=>{let x=String(v??"");if(/^\s*[=+@\-]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';};return [["severity","code","id","detail"],...report.issues.map(i=>[i.severity,i.code,i.id,i.detail])].map(r=>r.map(safe).join(",")).join("\r\n")+"\r\n";}
return Object.freeze({report,csv});
});
