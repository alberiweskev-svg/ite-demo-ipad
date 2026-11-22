/* I.T.E. 4.0.265 — cross-domain synthetic archive audit. Read-only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workspace-audit-264.js"):root.ITEWorkspaceAudit264);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkspaceAudit265=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){"use strict";
const rows=(v)=>Array.isArray(v)?v:[], key=(v)=>String(v??"").trim();
const money=(v)=>Number.isSafeInteger(v)&&Math.abs(v)<=100000000000;
const date=(v)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T00:00:00Z"))&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
function audit(field,commercial,fiscal=[],documents=[],links=[]){
 if(!base||!Array.isArray(fiscal)||!Array.isArray(documents)||!Array.isArray(links))throw Error("ARCHIVIO_NON_VALIDO");
 const previous=base.audit(field,commercial,fiscal,documents),issues=previous.issues.slice(),add=(code,id)=>issues.push({code,id:key(id)});
 const C=new Map(rows(field.clients).map(x=>[x.id,x])),S=new Map(rows(field.sites).map(x=>[x.id,x])),Y=new Map(rows(field.systems).map(x=>[x.id,x])),E=new Map(rows(field.equipment).map(x=>[x.id,x])),A=new Map(rows(field.appointments).map(x=>[x.id,x])),I=new Map(rows(field.interventions).map(x=>[x.id,x])),X=new Map(rows(commercial.extras).map(x=>[x.id,x])),F=new Map(fiscal.map(x=>[x.id,x])),Q=new Map(rows(commercial.quotes).map(x=>[x.id,x])),D=new Map(documents.map(x=>[x.id,x]));
 const siteForEquipment=(id)=>{const e=E.get(id),y=e&&Y.get(e.systemId);return y&&y.siteId;};
 for(const a of rows(field.appointments)){if(S.has(a.siteId)&&siteForEquipment(a.equipmentId)&&siteForEquipment(a.equipmentId)!==a.siteId)add("APPUNTAMENTO_APPARECCHIATURA_SEDE",a.id);}
 for(const i of rows(field.interventions)){const a=A.get(i.appointmentId);if(!a)continue;if(i.arrivedAt&&i.exitedAt&&Date.parse(i.exitedAt)<Date.parse(i.arrivedAt))add("INTERVENTO_TEMPI",i.id);if(i.operatorId&&i.operatorId!==a.operatorId)add("INTERVENTO_TECNICO_DIVERSO",i.id);}
 for(const q of rows(commercial.quotes)){if(!Array.isArray(q.extraIds))add("PREVENTIVO_RIGHE_NON_VALIDE",q.id);else{const seen=new Set();for(const id of q.extraIds){if(seen.has(id))add("PREVENTIVO_RIGA_DUPLICATA",q.id+":"+id);seen.add(id);}if(q.totalCents!==undefined){const selected=q.extraIds.map(id=>X.get(id));if(selected.every(Boolean)&&selected.every(x=>money(x.priceCents))&&selected.reduce((n,x)=>n+x.priceCents,0)!==q.totalCents)add("PREVENTIVO_TOTALE_DIVERSO",q.id);}}}
 const numberSet=new Set();
 for(const f of fiscal){if(!f||!f.id)continue;
 if(!["ACQUISTO","VENDITA","PROFORMA","NOTA_CREDITO"].includes(f.type)||!["IN","OUT"].includes(f.direction)||!["TD01","TD04","PR"].includes(f.documentCode))add("FISCALE_CLASSIFICAZIONE",f.id);
 if(f.type==="ACQUISTO"&&f.direction!=="IN"||f.type==="VENDITA"&&f.direction!=="OUT"||f.type==="PROFORMA"&&f.documentCode!=="PR"||f.type==="NOTA_CREDITO"&&f.documentCode!=="TD04")add("FISCALE_TIPO_DIREZIONE",f.id);
 if(!date(f.date))add("FISCALE_DATA",f.id);
 if(!money(f.netCents)||!money(f.vatCents)||!money(f.grossCents)||f.netCents+f.vatCents!==f.grossCents)add("FISCALE_IMPORTI",f.id);
 const number=[f.direction,f.type,f.counterpartyId,f.number,key(f.date).slice(0,4)].join("|");if(numberSet.has(number))add("FISCALE_NUMERO_DUPLICATO",f.id);numberSet.add(number);
 if(f.type==="NOTA_CREDITO"){const original=F.get(f.referenceId);if(!original||!["VENDITA","ACQUISTO"].includes(original.type)||original.direction!==f.direction||original.counterpartyId!==f.counterpartyId||date(f.date)&&date(original.date)&&f.date<original.date)add("TD04_RIFERIMENTO",f.id);if(f.grossCents>0||f.netCents>0||f.vatCents>0)add("TD04_SEGNO",f.id);}
 }
 for(const d of documents){if(!d||!d.id)continue;
 if(d.equipmentId){const sid=siteForEquipment(d.equipmentId);if(!sid)add("DOCUMENTO_APPARECCHIATURA",d.id);else if(d.siteId&&sid!==d.siteId)add("DOCUMENTO_APPARECCHIATURA_SEDE",d.id);}
 if(d.interventionId){const i=I.get(d.interventionId),a=i&&A.get(i.appointmentId);if(a&&d.siteId&&a.siteId!==d.siteId)add("DOCUMENTO_INTERVENTO_SEDE",d.id);}
 }
 const linkIds=new Set();
 for(const l of links){if(!l||!l.documentId){add("COLLEGAMENTO_ID", "");continue;}if(linkIds.has(l.documentId))add("COLLEGAMENTO_DUPLICATO",l.documentId);linkIds.add(l.documentId);if(!F.has(l.documentId)&&!D.has(l.documentId))add("COLLEGAMENTO_DOCUMENTO_ASSENTE",l.documentId);if(!C.has(l.clientId))add("COLLEGAMENTO_CLIENTE",l.documentId);if(l.quoteId&&!Q.has(l.quoteId))add("COLLEGAMENTO_PREVENTIVO",l.documentId);if(l.interventionId&&!I.has(l.interventionId))add("COLLEGAMENTO_INTERVENTO",l.documentId);if(l.quoteId&&l.interventionId&&Q.has(l.quoteId)&&Q.get(l.quoteId).interventionId!==l.interventionId)add("COLLEGAMENTO_PREVENTIVO_INTERVENTO",l.documentId);}
 issues.sort((a,b)=>a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
 return {schema:"ITE_AUDIT_265",valid:issues.length===0,counts:{...previous.counts,links:links.length},issues,readOnly:true,source:"SYNTHETIC_TEST_ONLY"};
}
function csv(report){if(!report||report.schema!=="ITE_AUDIT_265")throw Error("REPORT_NON_VALIDO");const cell=v=>{let s=key(v);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return "\uFEFF"+[["Codice","Riferimento"],...report.issues.map(x=>[x.code,x.id])].map(x=>x.map(cell).join(";")).join("\r\n")+"\r\n";}
return Object.freeze({audit,csv});
});
