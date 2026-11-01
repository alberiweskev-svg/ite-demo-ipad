/* I.T.E. 4.0 — adapter read-only from legacy persisted schema to field planning.
 * No writes, no fabricated visits or operator assignments. */
(function(root){'use strict';
const id=v=>String(v??'').trim(),arr=v=>Array.isArray(v)?v:[],copy=v=>JSON.parse(JSON.stringify(v));
function adapt(core){
 if(!core||!Array.isArray(core.clienti)||!Array.isArray(core.immobili))throw Error('ARCHIVIO_NON_VALIDO');
 const issues=[],catalog={clients:[],sites:[],systems:[],equipment:[],operators:[]},appointments=[];
 const seen={};
 function push(key,obj){if(!obj.id){issues.push({collection:key,code:'ID_ASSENTE'});return}const set=seen[key]||(seen[key]=new Set());if(set.has(obj.id)){issues.push({collection:key,id:obj.id,code:'ID_DUPLICATO'});return}set.add(obj.id);catalog[key].push(obj)}
 for(const x of core.clienti)push('clients',{id:id(x.id),name:id(x.name||x.ragione_sociale||x.id)});
 for(const x of core.immobili)push('sites',{id:id(x.id),clientId:id(x.client_id),name:id(x.name||x.indirizzo||x.id),address:id(x.indirizzo)});
 for(const x of arr(core.impianti))push('systems',{id:id(x.id),siteId:id(x.immobile_id),name:id(x.name||x.tipo||x.id)});
 for(const x of arr(core.apparecchiature))push('equipment',{id:id(x.id),systemId:id(x.impianto_id),name:id(x.name||x.modello||x.id)});
 for(const x of arr(core.operatori))push('operators',{id:id(x.id),name:id(x.name||x.nome||x.id),active:x.active!==false});
 const refs=[['sites','clients','clientId'],['systems','sites','siteId'],['equipment','systems','systemId']];
 for(const [collection,parent,field] of refs){const ids=new Set(catalog[parent].map(x=>x.id));for(const item of catalog[collection])if(!ids.has(item[field]))issues.push({collection,id:item.id,code:'RIFERIMENTO_ORFANO_'+field})}
 // Only accept explicit, complete field-workflow records. Never invent an operator or audit trail.
 for(const x of arr(core.appuntamenti)){
  const a=copy(x);
  if(!['id','clientId','siteId','systemId','equipmentId','operatorId','kind','startsAt','endsAt'].every(k=>id(a[k]))||!Array.isArray(a.audit)||!Array.isArray(a.visits)||!Array.isArray(a.extraWorks)){
   issues.push({collection:'appointments',id:id(a.id),code:'SCHEMA_APPUNTAMENTO_NON_COMPATIBILE'});continue;
  }
  if(!Number.isFinite(Date.parse(a.startsAt))||!Number.isFinite(Date.parse(a.endsAt))||Date.parse(a.endsAt)<=Date.parse(a.startsAt)){
   issues.push({collection:'appointments',id:id(a.id),code:'DATE_APPUNTAMENTO_NON_VALIDE'});continue;
  }
  const known=k=>catalog[k[0]].some(y=>y.id===id(a[k[1]]));
  if(![['clients','clientId'],['sites','siteId'],['systems','systemId'],['equipment','equipmentId'],['operators','operatorId']].every(known)){
   issues.push({collection:'appointments',id:id(a.id),code:'RIFERIMENTI_APPUNTAMENTO_MANCANTI'});continue;
  }
  const site=catalog.sites.find(y=>y.id===a.siteId),system=catalog.systems.find(y=>y.id===a.systemId),device=catalog.equipment.find(y=>y.id===a.equipmentId);
  if(site.clientId!==a.clientId||system.siteId!==a.siteId||device.systemId!==a.systemId){issues.push({collection:'appointments',id:id(a.id),code:'GERARCHIA_APPUNTAMENTO_INCOERENTE'});continue}
  if(appointments.some(y=>y.id===a.id)){issues.push({collection:'appointments',id:id(a.id),code:'APPUNTAMENTO_DUPLICATO'});continue}
  appointments.push(a);
 }
 return {catalog,appointments,issues,readOnly:true,persisted:false,skippedLegacyAppointments:arr(core.appuntamenti).length-appointments.length};
}
const api=Object.freeze({adapt});root.ITEFieldLegacyAdapter=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
