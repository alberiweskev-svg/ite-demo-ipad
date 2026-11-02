/* I.T.E. 4.0: validated operational planning, no persistence. */
(function(root){'use strict';
const gateway=root.ITEWorkorderGateway||(typeof require==='function'?require('./ite-workorder-gateway.js'):null);
const ledger=root.ITEWorkorderLedger||(typeof require==='function'?require('./ite-workorder-ledger.js'):null);
const clone=x=>JSON.parse(JSON.stringify(x));
function schedule(data){gateway.verify(data);if(data.appointments.some(a=>data.operators.some(o=>o.id===a.operatorId&&o.active===false)))throw Error('OPERATORE_DISATTIVATO');if(gateway.overlaps(data).length)throw Error('OPERATORE_SOVRAPPOSTO');return true}
function createBatch(state,revision,orders,actor,at,data){
 ledger.validate(state);schedule(data);
 if(state.revision!==revision)throw Error('REVISIONE_NON_CORRENTE');
 if(!Array.isArray(orders)||!orders.length||orders.length>100)throw Error('LOTTO_NON_VALIDO');
 const ids=new Set(),appointments=new Set();
 for(const o of orders){
  if(!o||ids.has(o.id)||appointments.has(o.appointmentId))throw Error('LOTTO_DUPLICATI');
  ids.add(o.id);appointments.add(o.appointmentId);gateway.checkOrder(data,o);
  const a=data.appointments.find(a=>a.id===o.appointmentId);
  if((o.equipmentId||a.equipmentId)&&o.equipmentId!==a.equipmentId)throw Error('APPARECCHIO_DIVERSO');
 }
 let next=state;for(const o of orders)next=gateway.addOrder(next,next.revision,o,actor,at,data);
 return next;
}
function reschedule(data,state,id,patch){
 ledger.validate(state);schedule(data);
 if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(k=>!['start','end','operatorId'].includes(k)))throw Error('MODIFICA_NON_VALIDA');
 const old=data.appointments.find(a=>a.id===id);if(!old)throw Error('APPUNTAMENTO_NON_TROVATO');
 const order=state.orders.find(o=>o.appointmentId===id);
 if(order&&order.status!=='PIANIFICATO')throw Error('INTERVENTO_AVVIATO');
 if(order&&patch.operatorId!==undefined&&patch.operatorId!==order.operatorId)throw Error('OPERATORE_ORDINE_DIVERSO');
 const next=clone(data);next.appointments=next.appointments.map(a=>a.id===id?{...a,...patch}:a);schedule(next);return next;
}
function audit(data,state){
 ledger.validate(state);const issues=[];
 try{gateway.verify(data)}catch(e){return {ok:false,issues:[{code:e.message}]}}
 for(const a of data.appointments)if(data.operators.some(o=>o.id===a.operatorId&&o.active===false))issues.push({code:'OPERATORE_DISATTIVATO',appointmentId:a.id});
 for(const overlap of gateway.overlaps(data))issues.push({code:'OPERATORE_SOVRAPPOSTO',...overlap});
 const seen=new Set();
 for(const o of state.orders){
  try{gateway.checkOrder(data,o);const a=data.appointments.find(x=>x.id===o.appointmentId);if((o.equipmentId||a.equipmentId)&&o.equipmentId!==a.equipmentId)throw Error('APPARECCHIO_DIVERSO')}catch(e){issues.push({code:e.message,orderId:o.id})}
  if(seen.has(o.appointmentId))issues.push({code:'APPUNTAMENTO_GIA_UTILIZZATO',orderId:o.id});seen.add(o.appointmentId);
 }
 return {ok:!issues.length,issues,appointments:data.appointments.length,orders:state.orders.length,quotes:state.quotes.length,extras:state.extras.length,revision:state.revision};
}
const api=Object.freeze({schedule,createBatch,reschedule,audit});root.ITEWorkorderCoordination=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
