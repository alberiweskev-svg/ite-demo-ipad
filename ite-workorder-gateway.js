/* I.T.E. 4.0 — guarded work-order entry point; no external storage. */
(function(root){'use strict';
const ledger=root.ITEWorkorderLedger||(typeof require==='function'?require('./ite-workorder-ledger.js'):null);
const err=code=>{throw Error(code)},id=x=>typeof x==='string'&&!!x.trim();
function verify(data){
 if(!data||typeof data!=='object')err('CATALOGO_MANCANTE');
 const types=['clients','sites','systems','equipment','operators','appointments'],c={};
 for(const k of types){if(!Array.isArray(data[k]))err('CATALOGO_'+k);const seen=new Set();for(const x of data[k]){if(!x||!id(x.id)||seen.has(x.id))err('IDENTIFICATIVO_'+k);seen.add(x.id)}c[k]=data[k]}
 const get=(k,v)=>c[k].find(x=>x.id===v);
 for(const s of c.sites)if(!get('clients',s.clientId))err('SEDE_CLIENTE');
 for(const p of c.systems)if(!get('sites',p.siteId))err('IMPIANTO_SEDE');
 for(const e of c.equipment)if(!get('systems',e.systemId))err('APPARECCHIO_IMPIANTO');
 for(const a of c.appointments){
  if(!get('clients',a.clientId)||!get('sites',a.siteId)||!get('systems',a.systemId)||!get('operators',a.operatorId))err('APPUNTAMENTO_RIFERIMENTI');
  if(!Number.isFinite(Date.parse(a.start))||!Number.isFinite(Date.parse(a.end))||Date.parse(a.end)<=Date.parse(a.start))err('APPUNTAMENTO_ORARIO');
  if(get('sites',a.siteId).clientId!==a.clientId||get('systems',a.systemId).siteId!==a.siteId)err('APPUNTAMENTO_GERARCHIA');
  if(a.equipmentId&&(!get('equipment',a.equipmentId)||get('equipment',a.equipmentId).systemId!==a.systemId))err('APPUNTAMENTO_APPARECCHIO');
 }
 return {c,get};
}
function overlaps(data){const {c}=verify(data),out=[];for(let i=0;i<c.appointments.length;i++)for(let j=i+1;j<c.appointments.length;j++){const a=c.appointments[i],b=c.appointments[j];if(a.operatorId===b.operatorId&&Date.parse(a.start)<Date.parse(b.end)&&Date.parse(b.start)<Date.parse(a.end))out.push({operatorId:a.operatorId,appointmentIds:[a.id,b.id]})}return out}
function checkOrder(data,order){const {get}=verify(data),a=get('appointments',order&&order.appointmentId),op=get('operators',order&&order.operatorId);if(!a||!op||op.active===false)err('ORDINE_RIFERIMENTI');if(['clientId','siteId','systemId','operatorId'].some(k=>a[k]!==order[k]))err('ORDINE_APPUNTAMENTO_DIVERSO');return true}
function addOrder(state,revision,order,actor,at,data){checkOrder(data,order);if(overlaps(data).some(x=>x.appointmentIds.includes(order.appointmentId)))err('OPERATORE_SOVRAPPOSTO');if(state.orders.some(x=>x.appointmentId===order.appointmentId))err('APPUNTAMENTO_GIA_UTILIZZATO');return ledger.addOrder(state,revision,order,actor,at)}
function audit(state,data){ledger.validate(state);const problems=[];for(const o of state.orders){try{checkOrder(data,o)}catch(e){problems.push({orderId:o.id,code:e.message})}}for(const x of overlaps(data))problems.push({code:'OPERATORE_SOVRAPPOSTO',...x});return {ok:!problems.length,problems,orders:state.orders.length,quotes:state.quotes.length,extras:state.extras.length,revision:state.revision}}
const api=Object.freeze({verify,overlaps,checkOrder,addOrder,audit});root.ITEWorkorderGateway=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
