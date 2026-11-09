/* I.T.E. 4.0.124 — read-only integrity audit, safe TEST snapshots and printable reporting. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const id=x=>String(x??"").trim();
const finite=x=>typeof x==="number"&&Number.isFinite(x);
function audit(state){
 const errors=[],warnings=[];
 if(!state||state.schema!=="ITE_OPERATIONS_123"||!state.field?.catalog||!state.commercial)return {ok:false,errors:["SCHEMA_NON_VALIDO"],warnings};
 const c=state.field.catalog,m=state.commercial;
 try{const v=root.ITE_FieldWorkspace121.validate(state.field);errors.push(...v.errors);}catch(e){errors.push("CAMPO:"+e.message);}
 const uniq=(items,label)=>{if(!Array.isArray(items)){errors.push("COLLEZIONE:"+label);return [];}const seen=new Set();for(const x of items){if(!id(x?.id)||seen.has(id(x.id)))errors.push("ID_DUPLICATO:"+label+":"+id(x?.id));seen.add(id(x?.id));}return items;};
 const apps=uniq(c.appointments,"appuntamenti"),interventions=uniq(c.interventions,"interventi");
 const estimates=uniq(m.estimates,"preventivi"),extras=uniq(m.extras,"extra"),invoices=uniq(m.invoices,"fatture");
 const byId=(xs,k)=>xs.find(x=>x.id===k);
 for(let i=0;i<apps.length;i++)for(let j=i+1;j<apps.length;j++){const a=apps[i],b=apps[j];if(a.operatorId===b.operatorId&&a.status!=="ANNULLATO"&&b.status!=="ANNULLATO"&&Date.parse(a.startAt)<Date.parse(b.endAt)&&Date.parse(b.startAt)<Date.parse(a.endAt))errors.push("SOVRAPPOSIZIONE:"+a.id+":"+b.id);}
 for(const a of apps){const job=interventions.filter(x=>x.appointmentId===a.id);if(job.length>1)errors.push("INTERVENTI_MULTIPLI:"+a.id);if(a.status==="IN_CORSO"&&!job.some(x=>x.status==="APERTO"))errors.push("INTERVENTO_APERTO_MANCANTE:"+a.id);if(a.status==="CHIUSO"&&!job.some(x=>x.status==="CHIUSO"))errors.push("CHIUSURA_INCOERENTE:"+a.id);}
 for(const i of interventions){const a=byId(apps,i.appointmentId);if(!a)errors.push("INTERVENTO_ORFANO:"+i.id);if(!Array.isArray(i.revisions))errors.push("REVISIONI_NON_VALIDE:"+i.id);}
 const location=(x,label)=>{if(!c.clients.some(y=>y.id===x.clientId)||!c.sites.some(y=>y.id===x.siteId&&y.clientId===x.clientId))errors.push("SEDE_CLIENTE:"+label+":"+x.id);};
 const lines=(x,label)=>{if(!Array.isArray(x.lines)||!x.lines.length){errors.push("RIGHE_ASSENTI:"+label+":"+x.id);return;}const seen=new Set();for(const l of x.lines){if(seen.has(l.id))errors.push("RIGA_DUPLICATA:"+x.id);seen.add(l.id);if(!["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO"].includes(l.type)||!finite(l.quantity)||l.quantity<=0||!finite(l.unitPrice)||l.unitPrice<0||![0,4,5,10,22].includes(l.vat))errors.push("RIGA_INVALIDA:"+x.id+":"+l.id);}};
 for(const x of estimates){location(x,"PREVENTIVO");lines(x,"PREVENTIVO");}
 for(const x of extras){location(x,"EXTRA");lines(x,"EXTRA");const a=byId(apps,x.appointmentId);if(!a||a.clientId!==x.clientId||a.siteId!==x.siteId)errors.push("EXTRA_SCOLLEGATO:"+x.id);for(const [key,qty] of Object.entries(x.approved||{})){const l=x.lines?.find(l=>l.id===key);if(!l||!finite(qty)||qty<0||qty>l.quantity)errors.push("APPROVAZIONE_INVALIDA:"+x.id+":"+key);}}
 const totals=ls=>root.ITE_Commercial122.totals(ls);
 for(const x of invoices){location(x,"FATTURA");lines(x,"FATTURA");if(!["VENDITA","ACQUISTO","PROFORMA","TD04"].includes(x.type))errors.push("TIPO_FATTURA:"+x.id);if(Array.isArray(x.lines)&&x.lines.length){const t=totals(x.lines);if(!x.totals||["net","tax","gross"].some(k=>Math.abs(t[k]-x.totals[k])>0.009))errors.push("TOTALI_ALTERATI:"+x.id);}if(x.type==="TD04"){const original=byId(invoices,x.originalId);if(!original||original.type!=="VENDITA"||original.clientId!==x.clientId)errors.push("ORIGINE_TD04:"+x.id);}}
 for(const orig of invoices.filter(x=>x.type==="VENDITA")){const credit=invoices.filter(x=>x.type==="TD04"&&x.originalId===orig.id).reduce((sum,x)=>sum+(x.totals?.gross||0),0);if(credit>orig.totals.gross+0.009)errors.push("CREDITO_ECCESSIVO:"+orig.id);}
 if(!Number.isSafeInteger(state.revision)||state.revision<0||!Array.isArray(state.events)||state.events.length!==state.revision)errors.push("REVISIONE_EVENTI_INCOERENTE");
 else state.events.forEach((e,i)=>{if(e.revision!==i+1||!id(e.actor)||!id(e.type))errors.push("EVENTO_INVALIDO:"+(i+1));});
 if(state.revision>0&&state.events?.length===0)warnings.push("STORICO_VUOTO");
 return {ok:errors.length===0,errors,warnings,counts:{clients:c.clients.length,sites:c.sites.length,systems:c.systems.length,equipment:c.equipment.length,appointments:apps.length,interventions:interventions.length,estimates:estimates.length,extras:extras.length,invoices:invoices.length}};
}
function report(state,{date,operatorId}={}){
 const a=audit(state);if(!a.ok)throw Error("AUDIT_NON_SUPERATO:"+a.errors.join("|"));
 const c=state.field.catalog,filtered=c.appointments.filter(x=>(!date||x.startAt.slice(0,10)===date)&&(!operatorId||x.operatorId===operatorId)).sort((x,y)=>x.startAt.localeCompare(y.startAt));
 return {schema:"ITE_REPORT_124",filters:{date:date||null,operatorId:operatorId||null},counts:a.counts,appointments:filtered.map(x=>({id:x.id,when:x.startAt,until:x.endAt,status:x.status,operator:c.operators.find(o=>o.id===x.operatorId)?.name||x.operatorId,client:c.clients.find(o=>o.id===x.clientId)?.name||x.clientId,site:c.sites.find(o=>o.id===x.siteId)?.address||x.siteId,equipment:c.equipment.find(o=>o.id===x.equipmentId)?.model||x.equipmentId||"",intervention:c.interventions.find(i=>i.appointmentId===x.id)?.status||"NON_AVVIATO"}))};
}
function snapshot(state){const a=audit(state);if(!a.ok)throw Error("BACKUP_BLOCCATO:"+a.errors.join("|"));return {schema:"ITE_SNAPSHOT_124",createdAt:new Date().toISOString(),data:copy(state)};}
function restore(snapshot){if(!snapshot||snapshot.schema!=="ITE_SNAPSHOT_124")throw Error("FORMATO_BACKUP");const a=audit(snapshot.data);if(!a.ok)throw Error("BACKUP_NON_INTEGRO:"+a.errors.join("|"));return copy(snapshot.data);}
const api=Object.freeze({audit,report,snapshot,restore});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Audit124=api;
})(typeof globalThis!=="undefined"?globalThis:this);
