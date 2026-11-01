/* I.T.E. 4.0 — local field workspace: schedule, lifecycle, export; never writes to vault. */
(function(root){'use strict';
const planning=root.ITEFieldPlanning||(typeof require==='function'?require('./ite-field-planning.js'):null);
const report=root.ITEFieldOperationsReport||(typeof require==='function'?require('./ite-field-operations-report.js'):null);
const copy=x=>JSON.parse(JSON.stringify(x));
function open(catalog,appointments=[]){
 const data={catalog:copy(catalog),appointments:copy(appointments)};
 const check=report.validate(data.catalog,data.appointments);
 if(!check.valid)throw Error('ARCHIVIO_CON_ANOMALIE:'+check.issues.map(x=>x.code).join(','));
 return data;
}
function apply(data,operation){
 const next=open(data.catalog,data.appointments),op=operation||{};
 if(op.type==='schedule')next.appointments=planning.schedule(next.catalog,next.appointments,op.appointment);
 else if(['arrive','close','reopen','reviseTimes','finishRevision','addExtra','decideExtra'].includes(op.type))next.appointments=planning.transition(next.appointments,op.id,op.type,op.operatorId,op.at,op.payload);
 else throw Error('OPERAZIONE_NON_SUPPORTATA');
 const check=report.validate(next.catalog,next.appointments);
 if(!check.valid)throw Error('OPERAZIONE_NON_VALIDA:'+check.issues.map(x=>x.code).join(','));
 return next;
}
function snapshot(data){
 const state=open(data.catalog,data.appointments);
 return {schema:'ITE_FIELD_WORKSPACE_V1',exportedAt:null,readOnlyImport:true,catalog:state.catalog,appointments:state.appointments};
}
function restore(value){
 if(value?.schema!=='ITE_FIELD_WORKSPACE_V1'||value.readOnlyImport!==true)throw Error('FORMATO_WORKSPACE_NON_VALIDO');
 return open(value.catalog,value.appointments);
}
const api=Object.freeze({open,apply,snapshot,restore});
root.ITEFieldWorkspace=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
