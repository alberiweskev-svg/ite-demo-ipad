/* I.T.E. 4.0.162 — procurement planning and receipt reconciliation, TEST only.
 * Pure functions: no network, files, customer data or browser storage. */
(function(root){"use strict";
const Inventory=typeof module!=="undefined"&&module.exports?require("./ite-inventory-154.js"):root.ITE_Inventory154;
const Supplier=typeof module!=="undefined"&&module.exports?require("./ite-supplier-import-160.js"):root.ITE_SupplierImport160;
const copy=x=>JSON.parse(JSON.stringify(x)),key=x=>String(x??"").trim();
const milli=x=>{if(typeof x!=="number"||!Number.isFinite(x)||x<0||x>1000000||Math.abs(x*1000-Math.round(x*1000))>1e-6)throw Error("QUANTITA_NON_VALIDA");return Math.round(x*1000)};
function check(s){if(s?.schema!=="ITE_OPERATIONS_123"||!Number.isSafeInteger(s.revision)||!Array.isArray(s.events)||!Array.isArray(s.inventory?.items)||!Array.isArray(s.inventory?.movements)||!Array.isArray(s.inventory?.reservations)||!Array.isArray(s.commercial?.estimates)||!Inventory||!Supplier)throw Error("ARCHIVIO_NON_VALIDO");}
function requirements(s,estimateIds){
 check(s);if(!Array.isArray(estimateIds)||!estimateIds.length||new Set(estimateIds).size!==estimateIds.length)throw Error("PREVENTIVI_NON_VALIDI");
 const estimates=estimateIds.map(id=>{const e=s.commercial.estimates.find(x=>x.id===id);if(!e||e.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");return e});
 const articles=new Map(s.inventory.items.map(i=>[i.id,i])),totals=new Map(),errors=[];
 for(const e of estimates){for(const l of e.lines||[]){if(l.kind!=="FORNITURA"||!l.itemId)continue;
 const item=articles.get(l.itemId);if(!item){errors.push({estimateId:e.id,lineId:l.id,code:"ARTICOLO_INESISTENTE"});continue;}
 const needed=milli(l.quantity),id=item.id;
 const row=totals.get(id)||{itemId:id,code:item.code,description:item.description,requiredMilli:0,lines:[]};
 row.requiredMilli+=needed;row.lines.push({estimateId:e.id,lineId:l.id,quantity:needed/1000});totals.set(id,row);
 }}
 const stock=new Map(Inventory.overview(s).items.map(i=>[i.id,i]));
 const rows=[...totals.values()].map(r=>{const i=stock.get(r.itemId),available=milli(i?.available||0),onHand=milli(i?.onHand||0),reserved=milli(i?.reserved||0);
 // Requirements may overlap with already reserved quantities: subtract only active reservations for selected estimates.
 const covered=s.inventory.reservations.filter(x=>x.itemId===r.itemId&&x.status==="ATTIVA"&&estimateIds.includes(x.estimateId)).reduce((n,x)=>n+milli(x.quantity),0);
 const uncovered=Math.max(0,r.requiredMilli-covered);
 return {itemId:r.itemId,code:r.code,description:r.description,required:r.requiredMilli/1000,alreadyReserved:covered/1000,uncovered:uncovered/1000,onHand:onHand/1000,reserved:reserved/1000,available:available/1000,toOrder:Math.max(0,uncovered-available)/1000,lines:r.lines};
 }).sort((a,b)=>a.code.localeCompare(b.code));
 return {schema:"ITE_PROCUREMENT_PLAN_162",revision:s.revision,estimateIds:[...estimateIds],rows,errors,hasShortage:rows.some(r=>r.toOrder>0)};
}
function receiveAgainstPlan(s,plan,delivery,actor,expectedRevision){
 check(s);if(s.revision!==expectedRevision||plan?.revision!==s.revision)throw Error("REVISIONE_OBSOLETA");
 if(plan?.schema!=="ITE_PROCUREMENT_PLAN_162"||!key(actor))throw Error("PIANO_NON_VALIDO");
 const fresh=requirements(s,plan.estimateIds);
 if(JSON.stringify(fresh.rows)!==JSON.stringify(plan.rows)||fresh.errors.length)throw Error("PIANO_NON_VALIDO");
 if(!Array.isArray(delivery?.lines)||!delivery.lines.length)throw Error("RIGHE_NON_VALIDE");
 const allowed=new Map(fresh.rows.map(r=>[r.itemId,r])),seen=new Set();
 for(const line of delivery.lines){const id=key(line.itemId),r=allowed.get(id);if(!r)throw Error("ARTICOLO_FUORI_PIANO");if(seen.has(id))throw Error("ARTICOLO_DUPLICATO_NEL_DOCUMENTO");seen.add(id);
 if(milli(line.quantity)===0)throw Error("QUANTITA_NON_VALIDA");
 // Oversupply is explicitly rejected to prevent accidental stock inflation in TEST.
 if(milli(line.quantity)>milli(r.toOrder))throw Error("QUANTITA_SUPERA_FABBISOGNO");
 }
 const next=Supplier.receiveDelivery(s,delivery,actor,expectedRevision);
 next.events.push({revision:next.revision,type:"PROCUREMENT_RECEIPT_162",reference:key(delivery.reference),estimateIds:[...plan.estimateIds],actor:key(actor),at:new Date().toISOString()});
 return {state:next,remaining:requirements(next,plan.estimateIds)};
}
function audit(s){check(s);const errors=[],ids=new Set(),codes=new Set(),movements=new Set();
 for(const i of s.inventory.items){if(ids.has(i.id))errors.push({code:"ID_ARTICOLO_DUPLICATO",id:i.id});ids.add(i.id);const c=key(i.code).toLowerCase();if(codes.has(c))errors.push({code:"CODICE_ARTICOLO_DUPLICATO",id:i.id});codes.add(c);}
 for(const m of s.inventory.movements){if(movements.has(m.id))errors.push({code:"MOVIMENTO_DUPLICATO",id:m.id});movements.add(m.id);if(!ids.has(m.itemId))errors.push({code:"MOVIMENTO_ARTICOLO_ASSENTE",id:m.id});}
 for(const r of s.inventory.reservations){if(!ids.has(r.itemId))errors.push({code:"PRENOTAZIONE_ARTICOLO_ASSENTE",id:r.id});if(!s.commercial.estimates.some(e=>e.id===r.estimateId))errors.push({code:"PRENOTAZIONE_PREVENTIVO_ASSENTE",id:r.id});}
 const overview=Inventory.overview(s);errors.push(...overview.errors);
 return {schema:"ITE_PROCUREMENT_AUDIT_162",revision:s.revision,errors,ok:errors.length===0};
}
const api=Object.freeze({requirements,receiveAgainstPlan,audit});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Procurement162=api;
})(typeof globalThis!=="undefined"?globalThis:this);
