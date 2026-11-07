/* I.T.E. 4.0.74 - TEST-only accounting reconciliation; no uploads, no fiscal issuance. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinanceReconcile40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const TEST=/^TEST-[A-Z0-9-]{2,60}$/;
const STATES=Object.freeze({INVOICE:"FATTURA",PROFORMA:"PROFORMA",CREDIT:"NOTA_CREDITO"});
function cents(v){if(typeof v!=="number"||!Number.isFinite(v)||v<0||v>1e9)throw Error("Importo non valido");const n=Math.round(v*100);if(Math.abs(v*100-n)>1e-6)throw Error("Importo con piu di due decimali");return n;}
function classify(doc){
 if(!doc||typeof doc!=="object")throw Error("Documento non valido");
 const type=String(doc.td||"").toUpperCase().trim(),number=String(doc.number||"").trim().toUpperCase();
 const note=String(doc.description||"").toUpperCase();
 if(type==="TD04")return STATES.CREDIT;
 if(type&&type!=="TD01"&&type!=="TD24"&&type!=="TD25")throw Error("Tipo documento da verificare");
 if(/^PR(?:[- /]|[0-9])/.test(number)||/PRO\s?FORMA/.test(note))return STATES.PROFORMA;
 return STATES.INVOICE;
}
function validate(doc){
 if(!doc||!TEST.test(doc.id)||!TEST.test(doc.partyId))throw Error("Solo identificativi TEST");
 if(doc.direction!=="ACQUISTO"&&doc.direction!=="VENDITA")throw Error("Direzione non valida");
 const kind=classify(doc),net=cents(doc.net),tax=cents(doc.tax),total=cents(doc.total);
 if(Math.abs(net+tax-total)>1)throw Error("Imponibile e IVA non riconciliati");
 if(doc.paid!==undefined&&cents(doc.paid)>total)throw Error("Pagamento superiore al totale");
 if(kind===STATES.CREDIT&&doc.paid!==undefined&&cents(doc.paid)!==0)throw Error("Nota di credito non e un debito da pagare");
 return Object.freeze({id:doc.id,partyId:doc.partyId,kind,direction:doc.direction,netCents:net,taxCents:tax,totalCents:total,paidCents:cents(doc.paid||0),appointmentId:doc.appointmentId||null});
}
function reconcile(documents,links){
 if(!Array.isArray(documents)||!Array.isArray(links))throw Error("Archivi non validi");
 const docs=new Map(),byAppointment=new Map();
 documents.forEach(d=>{const x=validate(d);if(docs.has(x.id))throw Error("Documento duplicato");docs.set(x.id,x);});
 const unique=new Set();
 links.forEach(l=>{
  if(!l||!TEST.test(l.appointmentId)||!TEST.test(l.documentId))throw Error("Collegamento TEST non valido");
  const d=docs.get(l.documentId);if(!d)throw Error("Documento inesistente");
  if(d.appointmentId&&d.appointmentId!==l.appointmentId)throw Error("Appuntamento incoerente");
  const key=l.appointmentId+"|"+l.documentId;if(unique.has(key))throw Error("Collegamento duplicato");unique.add(key);
  if(!byAppointment.has(l.appointmentId))byAppointment.set(l.appointmentId,[]);
  byAppointment.get(l.appointmentId).push(d);
 });
 const summaries=Array.from(byAppointment,([appointmentId,items])=>{
  let sales=0,purchases=0,credits=0,proformas=0,received=0;
  for(const d of items){
   if(d.kind===STATES.PROFORMA){proformas+=d.totalCents;continue;}
   if(d.kind===STATES.CREDIT){credits+=d.totalCents;continue;}
   if(d.direction==="VENDITA"){sales+=d.totalCents;received+=d.paidCents;}else purchases+=d.totalCents;
  }
  return {appointmentId,salesCents:sales,purchasesCents:purchases,creditCents:credits,proformaCents:proformas,receivedCents:received,balanceCents:sales-credits-received,alerts:[...(credits>sales?["CREDITI_SUPERIORI_ALLE_VENDITE"]:[]),...(received>sales-credits?["INCASSI_DA_VERIFICARE"]:[])]};
 });
 return {documents:documents.length,links:links.length,summaries};
}
return Object.freeze({STATES,cents,classify,validate,reconcile});
});