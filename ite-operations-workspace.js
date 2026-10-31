/* I.T.E. 4.0 — integrated operational command boundary.
 * One coherent API for hierarchy, calendar, intervention lifecycle and review.
 * Pure immutable transitions; persistence requires separate verified adapter.
 */
(function(root){'use strict';
const lifecycle=typeof module!=='undefined'&&module.exports?require('./ite-service-lifecycle.js'):root.ITEServiceLifecycle;
const integrity=typeof module!=='undefined'&&module.exports?require('./ite-operations-integrity.js'):root.ITEOperationsIntegrity;
const projection=typeof module!=='undefined'&&module.exports?require('./ite-operations-projection.js'):root.ITEOperationsProjection;
const copy=x=>JSON.parse(JSON.stringify(x));
function execute(state,command,{extras=[]}={}){
 if(!command||typeof command!=='object')throw Error('Comando non valido');
 const baseline=integrity.check(state,{extras});
 if(!baseline.valid)throw Error('Stato iniziale non integro: '+baseline.issues.filter(x=>x.severity==='error').map(x=>x.type).join(', '));
 let next;
 switch(command.type){
  case 'ADD_CLIENT':next=lifecycle.add(state,'client',command.item);break;
  case 'ADD_SITE':next=lifecycle.add(state,'site',command.item);break;
  case 'ADD_SYSTEM':next=lifecycle.add(state,'system',command.item);break;
  case 'ADD_DEVICE':next=lifecycle.add(state,'device',command.item);break;
  case 'ADD_OPERATOR':next=lifecycle.add(state,'operator',command.item);break;
  case 'SCHEDULE':next=lifecycle.appointment(state,command.item);break;
  case 'ARRIVE':case 'CLOSE':case 'REOPEN':
   next=lifecycle.event(state,command.appointmentId,command.type,{at:command.at,operatorId:command.operatorId,notes:command.notes,attachments:command.attachments||[]});break;
  case 'ADD_EXTRA_WORK':
   next=lifecycle.addExtra(state,command.appointmentId,{description:command.description,attachments:command.attachments||[]});break;
  default:throw Error('Comando non supportato: '+command.type);
 }
 const checked=integrity.check(next,{extras});
 if(!checked.valid)throw Error('Operazione annullata: '+checked.issues.filter(x=>x.severity==='error').map(x=>x.type).join(', '));
 return {state:copy(next),validation:checked,readOnly:false,persisted:false};
}
function dashboard(state,options={}){
 const validation=integrity.check(state,{extras:options.extras||[]});
 if(!validation.valid)return {validation,projection:null,readOnly:true};
 return {validation,projection:projection.project(state,options),readOnly:true};
}
const api=Object.freeze({execute,dashboard,empty:lifecycle.empty});
root.ITEOperationsWorkspace=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
