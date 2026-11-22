/* I.T.E. 4.0.261 — riconciliazione trasversale in sola lettura. Nessun dato reale. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ITEReconciliation261=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const arrays=['clients','sites','plants','equipment','appointments','interventions','quotes','invoices','documents'];
const safe=x=>String(x==null?'':x);
function audit(s){
 const issues=[],counts={},maps={};
 const add=(severity,code,type,id,detail)=>issues.push({severity,code,type,id:safe(id),detail:safe(detail)});
 for(const t of arrays){const rows=Array.isArray(s[t])?s[t]:[];counts[t]=rows.length;maps[t]=new Map();for(const r of rows){if(!r||!r.id){add('ERRORE','ID_ASSENTE',t,'','Record senza identificativo');continue}if(maps[t].has(r.id))add('ERRORE','ID_DUPLICATO',t,r.id,'Identificativo duplicato');maps[t].set(r.id,r)}}
 const requireRef=(r,type,key,target)=>{if(r[key]&&!maps[target].has(r[key]))add('ERRORE','RIFERIMENTO_ASSENTE',type,r.id,key+': '+r[key])};
 const siteOfEquipment=id=>{const e=maps.equipment.get(id),p=e&&maps.plants.get(e.plantId);return p&&p.siteId};
 for(const r of maps.sites.values())requireRef(r,'sites','clientId','clients');
 for(const r of maps.plants.values())requireRef(r,'plants','siteId','sites');
 for(const r of maps.equipment.values())requireRef(r,'equipment','plantId','plants');
 for(const r of maps.appointments.values()){requireRef(r,'appointments','siteId','sites');if(r.start&&r.end&&!(Date.parse(r.end)>Date.parse(r.start)))add('ERRORE','ORARIO_INVALIDO','appointments',r.id,'Fine non successiva a inizio');if(!r.operator)add('AVVISO','OPERATORE_ASSENTE','appointments',r.id,'Operatore non indicato')}
 for(const r of maps.interventions.values()){
  requireRef(r,'interventions','siteId','sites');requireRef(r,'interventions','equipmentId','equipment');requireRef(r,'interventions','appointmentId','appointments');
  if(r.equipmentId&&siteOfEquipment(r.equipmentId)&&siteOfEquipment(r.equipmentId)!==r.siteId)add('ERRORE','APPARECCHIO_SEDE_DIVERSA','interventions',r.id,r.equipmentId);
  const a=maps.appointments.get(r.appointmentId);if(a&&a.siteId!==r.siteId)add('ERRORE','APPUNTAMENTO_SEDE_DIVERSA','interventions',r.id,a.id);
  if(a&&r.operator&&a.operator&&r.operator!==a.operator)add('AVVISO','OPERATORE_DIFFERENTE','interventions',r.id,a.id);
  if(r.arrival&&r.exit&&Date.parse(r.exit)<Date.parse(r.arrival))add('ERRORE','USCITA_PRIMA_ARRIVO','interventions',r.id,'Tempi incoerenti');
 }
 for(const r of maps.quotes.values()){requireRef(r,'quotes','clientId','clients');for(const line of r.lines||[]){if(!Number.isSafeInteger(line.cents)||line.cents<0||!Number.isSafeInteger(line.qty)||line.qty<1)add('ERRORE','RIGA_IMPORTO_INVALIDO','quotes',r.id,line.id||'riga');}}
 for(const r of maps.invoices.values()){requireRef(r,'invoices','clientId','clients');requireRef(r,'invoices','quoteId','quotes');if(r.kind==='TD04'){if(!r.originalInvoiceId)add('AVVISO','TD04_ORIGINE_ASSENTE','invoices',r.id,'Manca riferimento fattura');else {const o=maps.invoices.get(r.originalInvoiceId);if(!o)add('ERRORE','TD04_ORIGINE_NON_TROVATA','invoices',r.id,r.originalInvoiceId);else if(o.kind!=='VENDITA'||o.clientId!==r.clientId)add('ERRORE','TD04_ORIGINE_INCOERENTE','invoices',r.id,r.originalInvoiceId)}}const q=maps.quotes.get(r.quoteId);if(q&&q.clientId!==r.clientId)add('ERRORE','FATTURA_CLIENTE_PREVENTIVO','invoices',r.id,r.quoteId);}
 for(const r of maps.documents.values()){for(const [key,target] of [['clientId','clients'],['siteId','sites'],['equipmentId','equipment'],['interventionId','interventions'],['replacesId','documents']])requireRef(r,'documents',key,target);const site=maps.sites.get(r.siteId);if(site&&r.clientId&&site.clientId!==r.clientId)add('ERRORE','DOCUMENTO_CLIENTE_SEDE','documents',r.id,r.siteId);if(r.equipmentId&&r.siteId&&siteOfEquipment(r.equipmentId)&&siteOfEquipment(r.equipmentId)!==r.siteId)add('ERRORE','DOCUMENTO_APPARECCHIO_SEDE','documents',r.id,r.equipmentId);const i=maps.interventions.get(r.interventionId);if(i&&r.siteId&&i.siteId!==r.siteId)add('ERRORE','DOCUMENTO_INTERVENTO_SEDE','documents',r.id,r.interventionId);}
 const byOperator=new Map();for(const a of maps.appointments.values()){if(!a.operator||!a.start||!a.end||!(Date.parse(a.end)>Date.parse(a.start)))continue;const k=a.operator.trim().toLowerCase();if(!byOperator.has(k))byOperator.set(k,[]);byOperator.get(k).push(a)}
 for(const rows of byOperator.values()){rows.sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length&&Date.parse(rows[j].start)<Date.parse(rows[i].end);j++)add('ERRORE','SOVRAPPOSIZIONE_OPERATORE','appointments',rows[j].id,rows[i].id)}
 issues.sort((a,b)=>a.severity.localeCompare(b.severity)||a.type.localeCompare(b.type)||a.id.localeCompare(b.id)||a.code.localeCompare(b.code));
 return {counts,issues,errors:issues.filter(x=>x.severity==='ERRORE').length,warnings:issues.filter(x=>x.severity==='AVVISO').length};
}
function csv(report){const cell=x=>{let v=safe(x);if(/^[\s]*[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};return ['Gravita;Codice;Archivio;ID;Dettaglio',...report.issues.map(x=>[x.severity,x.code,x.type,x.id,x.detail].map(cell).join(';'))].join('\r\n')}
return Object.freeze({audit,csv});
});
