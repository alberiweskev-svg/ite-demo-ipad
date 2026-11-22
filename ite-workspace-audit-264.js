/* I.T.E. 4.0.264 — synthetic workspace cross-domain audit. Read-only, no uploads. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkspaceAudit264=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const arr=(o,k)=>Array.isArray(o&&o[k])?o[k]:[];
const ids=(o,k)=>new Map(arr(o,k).map(x=>[x.id,x]));
const validTime=x=>typeof x==="string"&&Number.isFinite(Date.parse(x));
function audit(field,commercial,fiscal=[],documents=[]){
 const issues=[],counts={},add=(code,id)=>issues.push({code,id:String(id||"")});
 if(!field||!commercial||!Array.isArray(fiscal)||!Array.isArray(documents))throw Error("ARCHIVIO_NON_VALIDO");
 for(const k of ["clients","sites","systems","equipment","operators","appointments","interventions"])counts[k]=arr(field,k).length;
 for(const k of ["extras","quotes"])counts[k]=arr(commercial,k).length;
 counts.fiscal=fiscal.length;counts.documents=documents.length;
 const C=ids(field,"clients"),S=ids(field,"sites"),Y=ids(field,"systems"),E=ids(field,"equipment"),O=ids(field,"operators"),A=ids(field,"appointments"),I=ids(field,"interventions"),X=ids(commercial,"extras");
 for(const [key,records] of Object.entries({clients:arr(field,"clients"),sites:arr(field,"sites"),systems:arr(field,"systems"),equipment:arr(field,"equipment"),operators:arr(field,"operators"),appointments:arr(field,"appointments"),interventions:arr(field,"interventions"),extras:arr(commercial,"extras"),quotes:arr(commercial,"quotes"),fiscal,documents})){
 const seen=new Set();for(const r of records){if(!r||!r.id){add("ID_MANCANTE",key);continue;}if(seen.has(r.id))add("ID_DUPLICATO",key+":"+r.id);seen.add(r.id);}
 }
 for(const s of arr(field,"sites"))if(!C.has(s.clientId))add("SEDE_CLIENTE",s.id);
 for(const y of arr(field,"systems"))if(!S.has(y.siteId))add("IMPIANTO_SEDE",y.id);
 for(const e of arr(field,"equipment"))if(!Y.has(e.systemId))add("APPARECCHIATURA_IMPIANTO",e.id);
 const belongs=(clientId,siteId,equipmentId)=>{const s=S.get(siteId),e=E.get(equipmentId),y=e&&Y.get(e.systemId);return !!(s&&s.clientId===clientId&&y&&y.siteId===siteId);};
 for(const a of arr(field,"appointments")){
 if(!C.has(a.clientId)||!S.has(a.siteId)||!E.has(a.equipmentId)||!belongs(a.clientId,a.siteId,a.equipmentId))add("APPUNTAMENTO_GERARCHIA",a.id);
 if(!O.has(a.operatorId))add("APPUNTAMENTO_OPERATORE",a.id);
 if(!validTime(a.start)||!validTime(a.end)||Date.parse(a.end)<=Date.parse(a.start))add("APPUNTAMENTO_ORARIO",a.id);
 }
 const ap=arr(field,"appointments").filter(a=>O.has(a.operatorId)&&validTime(a.start)&&validTime(a.end)&&Date.parse(a.end)>Date.parse(a.start)).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 for(let i=0;i<ap.length;i++)for(let j=i+1;j<ap.length&&Date.parse(ap[j].start)<Date.parse(ap[i].end);j++)if(ap[i].operatorId===ap[j].operatorId)add("OPERATORE_SOVRAPPOSTO",ap[i].id+"/"+ap[j].id);
 for(const i of arr(field,"interventions")){
 const a=A.get(i.appointmentId);if(!a)add("INTERVENTO_APPUNTAMENTO",i.id);
 if(i.operatorId&&a&&i.operatorId!==a.operatorId)add("INTERVENTO_OPERATORE",i.id);
 if(i.arrivedAt&&i.exitedAt&&(!validTime(i.arrivedAt)||!validTime(i.exitedAt)||Date.parse(i.exitedAt)<Date.parse(i.arrivedAt)))add("INTERVENTO_ORARIO",i.id);
 }
 for(const x of arr(commercial,"extras")){if(!I.has(x.interventionId))add("EXTRA_INTERVENTO",x.id);if(!["FORNITURA","POSA"].includes(x.kind))add("EXTRA_TIPO",x.id);if(!Number.isSafeInteger(x.priceCents)||x.priceCents<0)add("EXTRA_PREZZO",x.id);}
 for(const q of arr(commercial,"quotes")){if(!I.has(q.interventionId))add("PREVENTIVO_INTERVENTO",q.id);for(const id of q.extraIds||[]){const x=X.get(id);if(!x||x.interventionId!==q.interventionId)add("PREVENTIVO_EXTRA",q.id+":"+id);}}
 for(const d of documents){if(d.clientId&&!C.has(d.clientId))add("DOCUMENTO_CLIENTE",d.id);if(d.siteId&&!S.has(d.siteId))add("DOCUMENTO_SEDE",d.id);if(d.clientId&&d.siteId&&S.get(d.siteId)&&S.get(d.siteId).clientId!==d.clientId)add("DOCUMENTO_GERARCHIA",d.id);if(d.interventionId&&!I.has(d.interventionId))add("DOCUMENTO_INTERVENTO",d.id);}
 for(const d of fiscal){if(d.clientId&&!C.has(d.clientId))add("FISCALE_CLIENTE",d.id);if(d.siteId&&!S.has(d.siteId))add("FISCALE_SEDE",d.id);}
 issues.sort((a,b)=>a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
 return {schema:"ITE_AUDIT_264",valid:issues.length===0,counts,issues,readOnly:true};
}
function csv(report){if(!report||report.schema!=="ITE_AUDIT_264")throw Error("REPORT_NON_VALIDO");const cell=v=>{let s=String(v??"");if(/^\\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return "\uFEFF"+[["Codice","Riferimento"],...report.issues.map(i=>[i.code,i.id])].map(r=>r.map(cell).join(";")).join("\r\n")+"\r\n";}
return Object.freeze({audit,csv});
});
