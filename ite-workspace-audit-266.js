/* I.T.E. 4.0.266 — integrated synthetic fiscal, document and job reconciliation. Read-only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workspace-audit-265.js"):root.ITEWorkspaceAudit265);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkspaceAudit266=api;})(typeof globalThis!=="undefined"?globalThis:this,function(previous){"use strict";
const rows=x=>Array.isArray(x)?x:[], str=x=>String(x??""), cents=x=>Number.isSafeInteger(x)&&Math.abs(x)<=100000000000;
function audit(field,commercial,fiscal=[],documents=[],links=[]){
 if(!previous||!field||!commercial||!Array.isArray(fiscal)||!Array.isArray(documents)||!Array.isArray(links))throw Error("ARCHIVIO_NON_VALIDO");
 const prior=previous.audit(field,commercial,fiscal,documents,links),issues=prior.issues.slice(),add=(code,id)=>issues.push({code,id:str(id)});
 const clients=new Map(rows(field.clients).map(x=>[x.id,x])),sites=new Map(rows(field.sites).map(x=>[x.id,x])),systems=new Map(rows(field.systems).map(x=>[x.id,x])),equipment=new Map(rows(field.equipment).map(x=>[x.id,x])),appointments=new Map(rows(field.appointments).map(x=>[x.id,x])),interventions=new Map(rows(field.interventions).map(x=>[x.id,x])),quotes=new Map(rows(commercial.quotes).map(x=>[x.id,x])),docs=new Map(documents.map(x=>[x.id,x])),invoices=new Map(fiscal.map(x=>[x.id,x]));
 const siteOfEquipment=id=>{const e=equipment.get(id),s=e&&systems.get(e.systemId);return s&&s.siteId;};
 const jobSite=id=>{const i=interventions.get(id),a=i&&appointments.get(i.appointmentId);return a&&a.siteId;};
 for(const i of rows(field.interventions)){const a=appointments.get(i.appointmentId);if(!a)continue;
   if(i.operatorId&&!rows(field.operators).some(o=>o.id===i.operatorId))add("INTERVENTO_OPERATORE_ASSENTE",i.id);
   if(i.arrivedAt&&!i.exitedAt&&i.status==="CHIUSO")add("INTERVENTO_CHIUSO_SENZA_USCITA",i.id);
   if(i.exitedAt&&!i.arrivedAt)add("INTERVENTO_USCITA_SENZA_ARRIVO",i.id);
   if(i.arrivedAt&&Number.isFinite(Date.parse(i.arrivedAt))&&Number.isFinite(Date.parse(a.start))&&Date.parse(i.arrivedAt)<Date.parse(a.start)-86400000)add("INTERVENTO_ARRIVO_INCOERENTE",i.id);
 }
 for(const q of rows(commercial.quotes)){const job=interventions.get(q.interventionId),a=job&&appointments.get(job.appointmentId);
   if(q.clientId&&a&&q.clientId!==a.clientId)add("PREVENTIVO_CLIENTE_INTERVENTO",q.id);
   if(q.siteId&&a&&q.siteId!==a.siteId)add("PREVENTIVO_SEDE_INTERVENTO",q.id);
   if(q.totalCents!==undefined&&!cents(q.totalCents))add("PREVENTIVO_TOTALE_NON_VALIDO",q.id);
 }
 for(const f of fiscal){if(!f||!f.id)continue;
   if(f.siteId&&f.clientId&&sites.has(f.siteId)&&sites.get(f.siteId).clientId!==f.clientId)add("FISCALE_SEDE_CLIENTE",f.id);
   if(f.quoteId){const q=quotes.get(f.quoteId);if(!q)add("FISCALE_PREVENTIVO_ASSENTE",f.id);else{
     if(q.clientId&&f.clientId&&q.clientId!==f.clientId)add("FISCALE_PREVENTIVO_CLIENTE",f.id);
     const sid=jobSite(q.interventionId);if(sid&&f.siteId&&sid!==f.siteId)add("FISCALE_PREVENTIVO_SEDE",f.id);
   }}
   if(f.type==="NOTA_CREDITO"){const orig=invoices.get(f.referenceId);
     if(orig&&cents(f.grossCents)&&cents(orig.grossCents)&&Math.abs(f.grossCents)>Math.abs(orig.grossCents))add("TD04_SUPERA_ORIGINALE",f.id);
     if(orig&&f.referenceId===f.id)add("TD04_AUTORIFERITA",f.id);
   }
   if(f.type==="PROFORMA"&&f.direction!=="OUT"&&f.direction!=="IN")add("PROFORMA_DIREZIONE",f.id);
 }
 for(const d of documents){if(!d||!d.id)continue;
   if(d.equipmentId&&d.interventionId){const es=siteOfEquipment(d.equipmentId),js=jobSite(d.interventionId);if(es&&js&&es!==js)add("DOCUMENTO_APPARECCHIATURA_INTERVENTO",d.id);}
   if(d.siteId&&d.clientId&&sites.has(d.siteId)&&sites.get(d.siteId).clientId!==d.clientId)add("DOCUMENTO_CLIENTE_SEDE",d.id);
   if(d.type&&["DICO","DIRI","POS","CAD","GAS"].includes(d.type)&&!d.siteId)add("DOCUMENTO_TECNICO_SEDE",d.id);
 }
 for(const l of links){if(!l||!l.documentId)continue;const f=invoices.get(l.documentId),d=docs.get(l.documentId),q=quotes.get(l.quoteId),i=interventions.get(l.interventionId);
   if(f&&l.clientId&&f.clientId&&l.clientId!==f.clientId)add("COLLEGAMENTO_FISCALE_CLIENTE",l.documentId);
   if(d&&l.clientId&&d.clientId&&l.clientId!==d.clientId)add("COLLEGAMENTO_TECNICO_CLIENTE",l.documentId);
   if(q&&i&&q.interventionId!==i.id)add("COLLEGAMENTO_PREVENTIVO_INTERVENTO_266",l.documentId);
   if(i&&l.clientId){const a=appointments.get(i.appointmentId);if(a&&a.clientId!==l.clientId)add("COLLEGAMENTO_INTERVENTO_CLIENTE",l.documentId);}
 }
 issues.sort((a,b)=>a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
 const categories={operativo:0,commerciale:0,fiscale:0,tecnico:0,altro:0};
 for(const i of issues){const k=/^(APPUNTAMENTO|OPERATORE|INTERVENTO|SEDE|IMPIANTO|APPARECCHIATURA)/.test(i.code)?"operativo":/^(EXTRA|PREVENTIVO)/.test(i.code)?"commerciale":/^(FISCALE|TD04|PROFORMA)/.test(i.code)?"fiscale":/^(DOCUMENTO|COLLEGAMENTO)/.test(i.code)?"tecnico":"altro";categories[k]++;}
 return {schema:"ITE_AUDIT_266",valid:!issues.length,counts:prior.counts,issues,categories,readOnly:true,source:"SYNTHETIC_TEST_ONLY"};
}
function csv(report){if(!report||report.schema!=="ITE_AUDIT_266"||!Array.isArray(report.issues))throw Error("REPORT_NON_VALIDO");
 const cell=v=>{let s=str(v);if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return "\uFEFF"+[["Codice","Riferimento"],...report.issues.map(i=>[i.code,i.id])].map(row=>row.map(cell).join(";")).join("\r\n")+"\r\n";
}
return Object.freeze({audit,csv});
});
