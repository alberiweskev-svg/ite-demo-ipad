/* I.T.E. 4.0 — read-only bridge from persisted core schema to operational hierarchy.
 * Does not modify source objects, invoice state or encrypted vault.
 */
(function(root){'use strict';
const rows=v=>Array.isArray(v)?v:[],id=v=>String(v??'').trim();
function bridge(core){
 if(!core||!Array.isArray(core.clienti)||!Array.isArray(core.immobili))throw Error('Archivio operativo non valido');
 const issues=[],state={clients:[],sites:[],systems:[],devices:[],operators:[],appointments:[],interventions:[],audit:[]};
 const seen={};
 function add(table,record){if(!record.id){issues.push({table,code:'ID_ASSENTE'});return}
  const ids=seen[table]||(seen[table]=new Set());if(ids.has(record.id)){issues.push({table,id:record.id,code:'ID_DUPLICATO'});return}ids.add(record.id);state[table].push(record)}
 for(const x of core.clienti)add('clients',{id:id(x.id),name:id(x.name||x.ragione_sociale||x.id)});
 for(const x of core.immobili)add('sites',{id:id(x.id),clientId:id(x.client_id),name:id(x.name||x.indirizzo||x.id)});
 for(const x of rows(core.impianti))add('systems',{id:id(x.id),siteId:id(x.immobile_id),name:id(x.name||x.tipo||x.id)});
 for(const x of rows(core.apparecchiature))add('devices',{id:id(x.id),systemId:id(x.impianto_id),name:id(x.name||x.modello||x.id)});
 const clientIds=new Set(state.clients.map(x=>x.id)),siteIds=new Set(state.sites.map(x=>x.id)),systemIds=new Set(state.systems.map(x=>x.id));
 for(const x of state.sites)if(!clientIds.has(x.clientId))issues.push({table:'sites',id:x.id,code:'CLIENTE_ASSENTE'});
 for(const x of state.systems)if(!siteIds.has(x.siteId))issues.push({table:'systems',id:x.id,code:'SEDE_ASSENTE'});
 for(const x of state.devices)if(!systemIds.has(x.systemId))issues.push({table:'devices',id:x.id,code:'IMPIANTO_ASSENTE'});
 // Appointment/visit schemas differ from the pure workspace: do not fabricate operator, audit or lifecycle states.
 return {state,issues,readOnly:true,importedAppointments:false,importedInterventions:false,persisted:false};
}
const api=Object.freeze({bridge});root.ITECoreOperationsBridge=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
