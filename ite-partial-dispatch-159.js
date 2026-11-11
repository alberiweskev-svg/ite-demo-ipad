/* I.T.E. 4.0.159 — partial site dispatch, synthetic TEST state only. */
(function(root){"use strict";
const I=typeof module!=="undefined"&&module.exports?require("./ite-inventory-154.js"):root.ITE_Inventory154;
const D=typeof module!=="undefined"&&module.exports?require("./ite-dispatch-158.js"):root.ITE_Dispatch158;
const clone=x=>JSON.parse(JSON.stringify(x));
const key=x=>String(x??"").trim();
function milli(n){if(typeof n!=="number"||!Number.isFinite(n)||n<=0||n>1000000||Math.abs(n*1000-Math.round(n*1000))>1e-7)throw Error("QUANTITA_NON_VALIDA");return Math.round(n*1000);}
function inspect(s,estimateId,rows){
 if(s?.schema!=="ITE_OPERATIONS_123"||!Array.isArray(s.inventory?.reservations)||!Array.isArray(s.inventory?.movements)||!Array.isArray(s.commercial?.estimates)||!I||!D)throw Error("ARCHIVIO_NON_VALIDO");
 const e=s.commercial.estimates.find(x=>x.id===estimateId);
 if(!e||e.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");
 if(!Array.isArray(rows)||!rows.length)throw Error("RIGHE_OBBLIGATORIE");
 const seen=new Set(),stock=new Map(I.overview(s).items.map(x=>[x.id,Math.round(x.onHand*1000)]));
 const result=rows.map(x=>{
 const rid=key(x.reservationId);if(!rid||seen.has(rid))throw Error("PRENOTAZIONE_DUPLICATA");seen.add(rid);
 const r=s.inventory.reservations.find(v=>v.id===rid);
 if(!r||r.status!=="ATTIVA"||r.estimateId!==estimateId)throw Error("PRENOTAZIONE_NON_ATTIVA");
 if(r.lineId&&!e.lines?.some(l=>l.id===r.lineId&&l.kind==="FORNITURA"))throw Error("RIGA_FORNITURA_NON_VALIDA");
 const requested=milli(x.quantity),remaining=milli(r.quantity);
 if(requested>remaining)throw Error("QUANTITA_SUPERA_PRENOTAZIONE");
 const left=(stock.get(r.itemId)||0)-requested;if(left<0)throw Error("GIACENZA_INSUFFICIENTE");stock.set(r.itemId,left);
 return {reservationId:rid,itemId:r.itemId,quantity:requested/1000,remaining:(remaining-requested)/1000,lineId:r.lineId||null};
 });
 return {schema:"ITE_PARTIAL_DISPATCH_PLAN_159",estimateId,siteId:e.siteId||null,revision:s.revision,rows:result};
}
function dispatch(s,estimateId,rows,actor,expectedRevision,batchId){
 if(s?.revision!==expectedRevision)throw Error("REVISIONE_OBSOLETA");
 if(!key(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(!/^[A-Za-z0-9_-]{1,80}$/.test(key(batchId)))throw Error("LOTTO_NON_VALIDO");
 const plan=inspect(s,estimateId,rows);
 if(s.inventory.movements.some(m=>key(m.batchId)===batchId||key(m.id).startsWith(batchId+":")))throw Error("LOTTO_DUPLICATO");
 let next=clone(s);
 for(let i=0;i<plan.rows.length;i++){
  const row=plan.rows[i],r=next.inventory.reservations.find(x=>x.id===row.reservationId);
  const movementId=batchId+":"+(i+1);
  if(next.inventory.movements.some(m=>m.id===movementId))throw Error("MOVIMENTO_DUPLICATO");
  if(row.remaining===0){
   next=I.dispatch(next,row.reservationId,movementId,actor,next.revision);
  }else{
   const childId=batchId+":R"+(i+1);
   if(next.inventory.reservations.some(v=>v.id===childId))throw Error("PRENOTAZIONE_DUPLICATA");
   const child={...clone(r),id:childId,quantity:row.quantity,status:"SCARICATA",movementId,parentReservationId:r.id,batchId};
   r.quantity=row.remaining;
   next.inventory.reservations.push(child);
   next.inventory.movements.push({id:movementId,itemId:r.itemId,direction:"OUT",quantity:row.quantity,reference:"PREVENTIVO:"+estimateId,actor:key(actor)});
   next.revision++;
   next.events.push({revision:next.revision,type:"PARTIAL_DISPATCH_RESERVED_INVENTORY",actor:key(actor),at:new Date().toISOString()});
  }
  const m=next.inventory.movements.find(x=>x.id===movementId);
  Object.assign(m,{batchId,siteId:plan.siteId,lineId:row.lineId,reservationId:row.reservationId});
 }
 return next;
}
function report(s,estimateId){
 const e=s.commercial?.estimates?.find(x=>x.id===estimateId);if(!e)throw Error("PREVENTIVO_INESISTENTE");
 const rows=(s.inventory?.reservations||[]).filter(r=>r.estimateId===estimateId);
 return {schema:"ITE_PARTIAL_SITE_REPORT_159",estimateId,revision:s.revision,active:rows.filter(r=>r.status==="ATTIVA"),dispatched:rows.filter(r=>r.status==="SCARICATA"),cancelled:rows.filter(r=>r.status==="ANNULLATA"),movements:(s.inventory?.movements||[]).filter(m=>m.reference==="PREVENTIVO:"+estimateId&&m.direction==="OUT")};
}
const api=Object.freeze({inspect,dispatch,report});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_PartialDispatch159=api;
})(typeof globalThis!=="undefined"?globalThis:this);
