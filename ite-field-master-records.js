/* I.T.E. 4.0 — immutable customer, site, system, equipment and operator management. */
(function(root){'use strict';
const workspace=root.ITEFieldWorkspace||(typeof require==='function'?require('./ite-field-workspace.js'):null);
const copy=v=>JSON.parse(JSON.stringify(v)),s=v=>String(v??'').trim();
const spec={clients:null,sites:['clients','clientId'],systems:['sites','siteId'],equipment:['systems','systemId'],operators:null};
function apply(data,operation){
 const state=workspace.open(data.catalog,data.appointments),op=operation||{},collection=op.collection;
 if(!Object.prototype.hasOwnProperty.call(spec,collection))throw Error('ANAGRAFICA_NON_SUPPORTATA');
 if(!['create','update','delete'].includes(op.action))throw Error('AZIONE_ANAGRAFICA_NON_SUPPORTATA');
 const rows=state.catalog[collection],id=s(op.id||op.record?.id),index=rows.findIndex(x=>s(x.id)===id);
 if(!id)throw Error('ID_OBBLIGATORIO');
 if(op.action==='create'){
  if(index>=0)throw Error('ID_DUPLICATO');
  if(!op.record||typeof op.record!=='object'||Array.isArray(op.record))throw Error('RECORD_NON_VALIDO');
  rows.push({...copy(op.record),id});
 }else if(op.action==='update'){
  if(index<0)throw Error('RECORD_NON_TROVATO');
  if(!op.record||typeof op.record!=='object'||Array.isArray(op.record))throw Error('RECORD_NON_VALIDO');
  if(op.record.id!==undefined&&s(op.record.id)!==id)throw Error('MODIFICA_ID_NON_CONSENTITA');
  rows[index]={...rows[index],...copy(op.record),id};
 }else{
  if(index<0)throw Error('RECORD_NON_TROVATO');
  const dependents={clients:['sites','clientId'],sites:['systems','siteId'],systems:['equipment','systemId'],equipment:['appointments','equipmentId'],operators:['appointments','operatorId']};
  const [child,key]=dependents[collection];
  const records=child==='appointments'?state.appointments:state.catalog[child];
  if(records.some(x=>s(x[key])===id))throw Error('RECORD_CON_COLLEGAMENTI');
  rows.splice(index,1);
 }
 const [parent,foreignKey]=spec[collection]||[];
 if(parent&&rows.some(x=>!state.catalog[parent].some(y=>s(y.id)===s(x[foreignKey]))))throw Error('COLLEGAMENTO_ANAGRAFICO_NON_VALIDO');
 return workspace.open(state.catalog,state.appointments);
}
function batch(data,operations){if(!Array.isArray(operations)||!operations.length)throw Error('OPERAZIONI_MANCANTI');return operations.reduce(apply,workspace.open(data.catalog,data.appointments))}
const api=Object.freeze({apply,batch});root.ITEFieldMasterRecords=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
