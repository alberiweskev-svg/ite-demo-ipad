/* I.T.E. 4.0.158 — bulk dispatch and site traceability. TEST only. */
(function(root){"use strict";
const Inventory=typeof module!=="undefined"&&module.exports?require("./ite-inventory-154.js"):root.ITE_Inventory154;
const copy=x=>JSON.parse(JSON.stringify(x));
const id=x=>String(x??"").trim();
const units=x=>{if(typeof x!=="number"||!Number.isFinite(x)||x<=0||Math.abs(x*1000-Math.round(x*1000))>1e-6)throw Error("QUANTITA_NON_VALIDA");return Math.round(x*1000);};
function validate(s){if(s?.schema!=="ITE_OPERATIONS_123"||!Number.isSafeInteger(s.revision)||!Array.isArray(s.commercial?.estimates)||!Array.isArray(s.inventory?.reservations)||!Array.isArray(s.inventory?.movements)||!Array.isArray(s.inventory?.items)||!Array.isArray(s.events)||!Inventory)throw Error("ARCHIVIO_NON_VALIDO");}
function inspect(s,estimateId,reservationIds){validate(s);const estimate=s.commercial.estimates.find(e=>e.id===estimateId);if(!estimate||estimate.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");
if(!Array.isArray(reservationIds)||!reservationIds.length)throw Error("PRENOTAZIONI_OBBLIGATORIE");
const seen=new Set(),rows=[],stock=new Map(Inventory.overview(s).items.map(i=>[i.id,Math.round(i.onHand*1000)]));
for(const raw of reservationIds){const rid=id(raw);if(!rid||seen.has(rid))throw Error("PRENOTAZIONE_DUPLICATA");seen.add(rid);
const r=s.inventory.reservations.find(x=>x.id===rid);if(!r||r.status!=="ATTIVA")throw Error("PRENOTAZIONE_NON_ATTIVA");if(r.estimateId!==estimateId)throw Error("PRENOTAZIONE_ALTRO_PREVENTIVO");
const eLine=estimate.lines?.find(l=>l.id===r.lineId);if(r.lineId&&(!eLine||eLine.kind!=="FORNITURA"))throw Error("RIGA_FORNITURA_NON_VALIDA");
const article=s.inventory.items.find(i=>i.id===r.itemId);if(!article)throw Error("ARTICOLO_INESISTENTE");
const left=(stock.get(r.itemId)||0)-units(r.quantity);if(left<0)throw Error("GIACENZA_INSUFFICIENTE");stock.set(r.itemId,left);
rows.push({reservationId:rid,itemId:r.itemId,code:article.code,quantity:r.quantity,lineId:r.lineId||null});}
return {schema:"ITE_DISPATCH_PLAN_158",estimateId,revision:s.revision,rows,siteId:estimate.siteId||null,canDispatch:true};}
function dispatchAll(s,estimateId,reservationIds,actor,expectedRevision,batchId){validate(s);if(s.revision!==expectedRevision)throw Error("REVISIONE_OBSOLETA");if(!id(actor))throw Error("OPERATORE_OBBLIGATORIO");if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id(batchId)))throw Error("LOTTO_NON_VALIDO");
const p=inspect(s,estimateId,reservationIds);if(s.inventory.movements.some(m=>id(m.id).startsWith(batchId+":")))throw Error("LOTTO_DUPLICATO");
let next=copy(s);
for(let i=0;i<p.rows.length;i++){const r=p.rows[i],movementId=batchId+":"+(i+1);next=Inventory.dispatch(next,r.reservationId,movementId,actor,next.revision);
const m=next.inventory.movements.find(x=>x.id===movementId);m.batchId=batchId;m.siteId=p.siteId;m.lineId=r.lineId;m.reservationId=r.reservationId;}
return next;}
function report(s,estimateId){validate(s);const e=s.commercial.estimates.find(x=>x.id===estimateId);if(!e)throw Error("PREVENTIVO_INESISTENTE");
const rows=s.inventory.reservations.filter(r=>r.estimateId===estimateId).map(r=>({reservationId:r.id,lineId:r.lineId||null,itemId:r.itemId,quantity:r.quantity,status:r.status,movementId:r.movementId||null}));
return {schema:"ITE_SITE_MATERIAL_REPORT_158",estimateId,siteId:e.siteId||null,revision:s.revision,active:rows.filter(r=>r.status==="ATTIVA"),dispatched:rows.filter(r=>r.status==="SCARICATA"),cancelled:rows.filter(r=>r.status==="ANNULLATA")};}
const api=Object.freeze({inspect,dispatchAll,report});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Dispatch158=api;
})(typeof globalThis!=="undefined"?globalThis:this);
