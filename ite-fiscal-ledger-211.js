/* I.T.E. 4.0.211 — isolated fiscal classification and reconciliation; TEST ONLY.
   No XML/PDF parsing, no fiscal transmission, no production storage. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFiscalLedger211=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const TYPES=["ACQUISTO","VENDITA","PROFORMA","NOTA_CREDITO"];
const DOCS=["TD01","TD04","PR"];
const err=s=>{throw Error(s);};
function money(n){if(!Number.isSafeInteger(n)||Math.abs(n)>100000000000)err("IMPORTO_NON_VALIDO");return n;}
function date(s){if(typeof s!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s)||!Number.isFinite(Date.parse(s+"T00:00:00Z"))||new Date(s+"T00:00:00Z").toISOString().slice(0,10)!==s)err("DATA_NON_VALIDA");return s;}
function normalize(raw){if(!raw||typeof raw!=="object"||Array.isArray(raw))err("DOCUMENTO_NON_VALIDO");
const d={id:String(raw.id||"").trim(),direction:raw.direction,type:raw.type,documentCode:raw.documentCode,number:String(raw.number||"").trim(),date:date(raw.date),counterpartyId:String(raw.counterpartyId||"").trim(),currency:"EUR",netCents:money(raw.netCents),vatCents:money(raw.vatCents),grossCents:money(raw.grossCents),referenceId:raw.referenceId||null,status:raw.status||"REGISTRATO"};
if(!d.id||d.id.length>100||!d.number||d.number.length>100||!d.counterpartyId||d.counterpartyId.length>100||!["IN","OUT"].includes(d.direction)||!TYPES.includes(d.type)||!DOCS.includes(d.documentCode))err("CAMPI_NON_VALIDI");
if(d.type==="ACQUISTO"&&d.direction!=="IN"||d.type==="VENDITA"&&d.direction!=="OUT"||d.type==="PROFORMA"&&d.documentCode!=="PR"||d.type==="NOTA_CREDITO"&&d.documentCode!=="TD04"||!["PROFORMA","NOTA_CREDITO"].includes(d.type)&&d.documentCode!=="TD01")err("CLASSIFICAZIONE_NON_VALIDA");
if(d.netCents+d.vatCents!==d.grossCents||d.type!=="NOTA_CREDITO"&&(d.netCents<0||d.vatCents<0||d.grossCents<0))err("TOTALI_NON_COHERENTI");
if(d.type==="NOTA_CREDITO"&&(d.netCents>0||d.vatCents>0||d.grossCents>0||!d.referenceId))err("NOTA_CREDITO_NON_VALIDA");
if(d.type!=="NOTA_CREDITO"&&d.referenceId)err("RIFERIMENTO_NON_CONSENTITO");
if(!["REGISTRATO","DA_VERIFICARE","ANNULLATO"].includes(d.status))err("STATO_NON_VALIDO");
return d;}
function validate(items){if(!Array.isArray(items)||items.length>5000)err("ARCHIVIO_NON_VALIDO");const docs=items.map(normalize),ids=new Map(),numbers=new Set();
for(const d of docs){if(ids.has(d.id))err("ID_DUPLICATO");ids.set(d.id,d);const key=[d.direction,d.type,d.counterpartyId,d.number,d.date.slice(0,4)].join("|");if(numbers.has(key))err("NUMERO_DUPLICATO");numbers.add(key);}
for(const d of docs)if(d.type==="NOTA_CREDITO"){const ref=ids.get(d.referenceId);if(!ref||ref.type!=="VENDITA"&&ref.type!=="ACQUISTO"||ref.direction!==d.direction||ref.counterpartyId!==d.counterpartyId||d.date<ref.date)err("RIFERIMENTO_NOTA_CREDITO_NON_VALIDO");}
return docs;}
function create(initial=[]){let docs=validate(initial);function snapshot(){return copy(docs);}function insert(raw){const next=validate([...docs,raw]);docs=next;return snapshot();}
function changeStatus(id,status){const next=docs.map(d=>d.id===id?{...d,status}:d);if(!docs.some(d=>d.id===id))err("DOCUMENTO_NON_TROVATO");docs=validate(next);return snapshot();}
function totals(){const out={acquisti:0,vendite:0,proforma:0,noteCreditoAcquisto:0,noteCreditoVendita:0,saldoVendite:0,saldoAcquisti:0};for(const d of docs){if(d.status==="ANNULLATO")continue;const n=d.grossCents;if(d.type==="ACQUISTO")out.acquisti+=n;if(d.type==="VENDITA")out.vendite+=n;if(d.type==="PROFORMA")out.proforma+=n;if(d.type==="NOTA_CREDITO"){if(d.direction==="IN")out.noteCreditoAcquisto+=n;else out.noteCreditoVendita+=n;}}out.saldoVendite=out.vendite+out.noteCreditoVendita;out.saldoAcquisti=out.acquisti+out.noteCreditoAcquisto;return out;}
return Object.freeze({snapshot,insert,changeStatus,totals});}
return Object.freeze({normalize,validate,create,TYPES,DOCS});});
