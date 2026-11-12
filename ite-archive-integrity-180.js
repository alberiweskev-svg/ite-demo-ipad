/* I.T.E. 4.0.180 — cross-domain consistency report, read-only, synthetic TEST archives. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const keys=['clients','sites','systems','equipment','operators','appointments','interventions'];
function inspect(field,commercial){
 const issues=[],stats={};const issue=(code,kind,id)=>issues.push({code,kind,id:String(id??'')});
 if(!field||!commercial||keys.some(k=>!Array.isArray(field[k]))||!Array.isArray(commercial.extras)||!Array.isArray(commercial.quotes))throw Error('ARCHIVIO_NON_VALIDO');
 const maps={};for(const k of keys){maps[k]=new Map();stats[k]=field[k].length;for(const x of field[k]){if(!x||typeof x.id!=='string'||!x.id){issue('ID_MANCANTE',k,x&&x.id);continue}if(maps[k].has(x.id))issue('ID_DUPLICATO',k,x.id);else maps[k].set(x.id,x)}}
 for(const [kind,parent,fk] of [['sites','clients','clientId'],['systems','sites','siteId'],['equipment','systems','systemId']])for(const x of field[kind])if(x&&!maps[parent].has(x[fk]))issue('RIFERIMENTO_MANCANTE',kind,x.id);
 for(const a of field.appointments){if(!a)continue;const s=maps.sites.get(a.siteId),e=maps.equipment.get(a.equipmentId),system=e&&maps.systems.get(e.systemId);
 if(!maps.clients.has(a.clientId)||!s||s.clientId!==a.clientId||!system||system.siteId!==a.siteId||!maps.operators.has(a.operatorId))issue('GERARCHIA_APPUNTAMENTO', 'appointments',a.id);
 const start=Date.parse(a.start),end=Date.parse(a.end);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)issue('ORARIO_APPUNTAMENTO','appointments',a.id);
 }
 const active=field.appointments.filter(a=>a&&a.status!=='ANNULLATO'&&Number.isFinite(Date.parse(a.start))&&Number.isFinite(Date.parse(a.end))).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length&&Date.parse(active[j].start)<Date.parse(active[i].end);j++)if(active[i].operatorId===active[j].operatorId)issue('SOVRAPPOSIZIONE_TECNICO','appointments',active[i].id+' / '+active[j].id);
 for(const i of field.interventions){if(!i)continue;const a=maps.appointments.get(i.appointmentId);if(!a||a.clientId!==i.clientId||a.siteId!==i.siteId||a.equipmentId!==i.equipmentId||a.operatorId!==i.operatorId)issue('INTERVENTO_APPUNTAMENTO','interventions',i.id);
 if(i.status==='CHIUSO'&&(!Number.isFinite(Date.parse(i.closedAt))||Date.parse(i.closedAt)<Date.parse(i.arrivedAt)))issue('CHIUSURA_NON_VALIDA','interventions',i.id);
 }
 const extraMap=new Map(),quoteMap=new Map();stats.extras=commercial.extras.length;stats.quotes=commercial.quotes.length;
 for(const x of commercial.extras){if(!x||!x.id||extraMap.has(x.id)){issue('EXTRA_ID_DUPLICATO','extras',x&&x.id);continue}extraMap.set(x.id,x);if(!maps.interventions.has(x.interventionId))issue('EXTRA_ORFANO','extras',x.id);
 if(!['FORNITURA','POSA','SMONTAGGIO','SMALTIMENTO','ALTRO'].includes(x.kind)||!Number.isFinite(x.quantity)||x.quantity<=0||!Number.isFinite(x.unitPrice)||x.unitPrice<0)issue('EXTRA_IMPORTO_TIPO','extras',x.id);
 }
 const quoted=new Set();
 for(const q of commercial.quotes){if(!q||!q.id||quoteMap.has(q.id)){issue('PREVENTIVO_ID_DUPLICATO','quotes',q&&q.id);continue}quoteMap.set(q.id,q);const i=maps.interventions.get(q.interventionId);
 if(!i||q.clientId!==i.clientId||q.siteId!==i.siteId)issue('PREVENTIVO_GERARCHIA','quotes',q.id);
 if(!Array.isArray(q.extraIds)||!q.extraIds.length||new Set(q.extraIds).size!==q.extraIds.length){issue('PREVENTIVO_RIGHE','quotes',q.id);continue}
 let total=0;for(const id of q.extraIds){const x=extraMap.get(id);if(!x||x.interventionId!==q.interventionId||x.status!=='ACCETTATO'){issue('PREVENTIVO_EXTRA_NON_VALIDO','quotes',q.id);continue}total+=Math.round(x.quantity*x.unitPrice*100);
 if(q.status!=='ANNULLATO'){if(quoted.has(id))issue('EXTRA_PREVENTIVATO_DUE_VOLTE','quotes',q.id);quoted.add(id)}
 }
 if(!Number.isSafeInteger(q.totalCents)||q.totalCents!==total)issue('PREVENTIVO_TOTALE','quotes',q.id);
 }
 return {valid:issues.length===0,issues:clone(issues),stats:clone(stats)};
}
const api=Object.freeze({inspect});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ITE_ArchiveIntegrity180=api;
})(typeof globalThis!=='undefined'?globalThis:this);
