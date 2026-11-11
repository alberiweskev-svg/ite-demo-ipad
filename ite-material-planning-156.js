/* I.T.E. 4.0.156 — pianificazione materiali per righe FORNITURA, solo TEST. */
(function(root){"use strict";
const I=typeof module!=="undefined"&&module.exports?require("./ite-inventory-154.js"):root.ITE_Inventory154;
const clone=x=>JSON.parse(JSON.stringify(x));
const key=x=>String(x??"").trim();
const milli=x=>{if(typeof x!=="number"||!Number.isFinite(x)||x<=0||x>1000000||Math.abs(x*1000-Math.round(x*1000))>1e-7)throw Error("QUANTITA_NON_VALIDA");return Math.round(x*1000);};
function validate(s){if(s?.schema!=="ITE_OPERATIONS_123"||!Array.isArray(s.commercial?.estimates)||!I)throw Error("ARCHIVIO_NON_VALIDO");return s;}
function lines(s,estimateId,mappings){validate(s);const e=s.commercial.estimates.find(x=>x.id===estimateId);if(!e||e.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");if(!Array.isArray(mappings)||!mappings.length)throw Error("MAPPATURE_OBBLIGATORIE");
const seen=new Set(),inv=s.inventory||{items:[],movements:[],reservations:[]};
return mappings.map(m=>{const line=e.lines?.find(x=>x.id===m.lineId);if(!line||line.kind!=="FORNITURA")throw Error("RIGA_FORNITURA_INESISTENTE");if(seen.has(m.lineId))throw Error("RIGA_DUPLICATA");seen.add(m.lineId);
const article=inv.items.find(x=>x.id===m.itemId);if(!article)throw Error("ARTICOLO_INESISTENTE");
const requested=milli(m.quantity??line.quantity),maximum=milli(line.quantity);if(requested>maximum)throw Error("QUANTITA_SUPERA_PREVENTIVO");
const existing=inv.reservations.filter(r=>r.estimateId===estimateId&&r.lineId===m.lineId&&r.status!=="ANNULLATA").reduce((a,r)=>a+milli(r.quantity),0);
if(existing+requested>maximum)throw Error("RIGA_GIA_PRENOTATA");
return {lineId:m.lineId,itemId:m.itemId,quantity:requested/1000,description:line.description,code:article.code};});}
function plan(s,estimateId,mappings){const rows=lines(s,estimateId,mappings),stock=I.overview(s),available=new Map(stock.items.map(i=>[i.id,Math.round(i.available*1000)])),shortages=[];
for(const r of rows){const left=(available.get(r.itemId)||0)-milli(r.quantity);available.set(r.itemId,left);if(left<0)shortages.push({itemId:r.itemId,code:r.code,missing:Math.round(-left)/1000});}
return {schema:"ITE_MATERIAL_PLAN_156",estimateId,revision:s.revision,rows,shortages,canReserve:shortages.length===0};}
function reserveAll(s,estimateId,mappings,actor,expectedRevision,batchId){validate(s);if(expectedRevision!==s.revision)throw Error("REVISIONE_OBSOLETA");if(!key(actor))throw Error("OPERATORE_OBBLIGATORIO");if(!key(batchId)||!/^[a-zA-Z0-9_-]{1,80}$/.test(batchId))throw Error("ID_LOTTO_NON_VALIDO");
const p=plan(s,estimateId,mappings);if(!p.canReserve)throw Error("GIACENZA_DISPONIBILE_INSUFFICIENTE");
let next=clone(s);next.inventory=next.inventory||{items:[],movements:[],reservations:[]};
if(next.inventory.reservations.some(r=>String(r.id).startsWith(batchId+":")))throw Error("LOTTO_DUPLICATO");
for(let n=0;n<p.rows.length;n++){const r=p.rows[n],id=batchId+":"+(n+1);next=I.reserve(next,{id,estimateId,itemId:r.itemId,quantity:r.quantity},actor,next.revision);next.inventory.reservations.find(x=>x.id===id).lineId=r.lineId;next.inventory.reservations.find(x=>x.id===id).batchId=batchId;}
return next;}
function audit(s){validate(s);const problems=[],inv=s.inventory||{items:[],movements:[],reservations:[]},seen=new Set();
for(const r of inv.reservations){if(seen.has(r.id))problems.push({id:r.id,code:"PRENOTAZIONE_DUPLICATA"});seen.add(r.id);
if(!r.lineId)continue;const e=s.commercial.estimates.find(x=>x.id===r.estimateId),line=e?.lines?.find(x=>x.id===r.lineId);
if(!line||line.kind!=="FORNITURA")problems.push({id:r.id,code:"RIGA_FORNITURA_NON_VALIDA"});
if(e?.status!=="ACCETTATO"&&r.status==="ATTIVA")problems.push({id:r.id,code:"PREVENTIVO_NON_ACCETTATO"});
}
for(const e of s.commercial.estimates)for(const line of e.lines||[]){const reservations=inv.reservations.filter(r=>r.estimateId===e.id&&r.lineId===line.id&&r.status!=="ANNULLATA");if(!reservations.length)continue;
try{if(reservations.reduce((n,r)=>n+milli(r.quantity),0)>milli(line.quantity))problems.push({id:e.id+":"+line.id,code:"RIGA_SOVRAPRENOTATA"});}catch(err){problems.push({id:e.id+":"+line.id,code:err.message});}}
return {schema:"ITE_MATERIAL_AUDIT_156",revision:s.revision,problems};}
const api=Object.freeze({plan,reserveAll,audit});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_MaterialPlanning156=api;
})(typeof globalThis!=="undefined"?globalThis:this);
