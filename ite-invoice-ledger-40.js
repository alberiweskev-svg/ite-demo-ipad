/* I.T.E. 4.0.51 — Pure TEST invoice ledger; no uploads, network or real invoices. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEInvoiceLedger40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
const TYPES=["PURCHASE","SALE","PROFORMA","CREDIT_NOTE"];
const STATES=["OPEN","PARTIAL","PAID","TO_RECOVER","PARTIALLY_RECOVERED","RECOVERED"];
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function ok(condition,message){if(!condition)throw Error(message);}
function money(n){ok(typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100000000,"Importo non valido");return round(n);}
function text(s,max=180){ok(typeof s==="string"&&s.trim().length>0&&s.length<=max,"Testo non valido");return s.trim();}
function iso(s){ok(typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T12:00:00Z"))&&new Date(s+"T12:00:00Z").toISOString().slice(0,10)===s,"Data non valida");return s;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function classify(meta){
 ok(meta&&typeof meta==="object","Metadati mancanti");
 const code=String(meta.documentCode||"").toUpperCase().trim();
 const number=String(meta.number||"").trim().toUpperCase();
 const label=String(meta.label||"").toUpperCase();
 const issuer=String(meta.issuer||"").trim().toUpperCase();
 const company=String(meta.company||"I.T.E. DI MERKAJ ALBAN").trim().toUpperCase();
 if(code==="TD04")return {type:"CREDIT_NOTE",reason:"TD04"};
 if(/^PR(?:[-/ ]|\d)/.test(number)||/PRO\s*FORMA|PROFORMA/.test(label))return {type:"PROFORMA",reason:"PROFORMA"};
 if(!issuer||!company)return {type:"UNRESOLVED",reason:"EMITTENTE_DA_VERIFICARE"};
 return issuer===company?{type:"SALE",reason:"EMESSA_ITE"}:{type:"PURCHASE",reason:"EMITTENTE_TERZO"};
}
function totals(lines){
 ok(Array.isArray(lines)&&lines.length>0&&lines.length<=250,"Righe non valide");
 let net=0,tax=0;
 for(const l of lines){ok(l&&typeof l==="object","Riga non valida");const qty=l.quantity;ok(typeof qty==="number"&&Number.isFinite(qty)&&qty>0&&qty<=100000,"Quantità non valida");const unit=money(l.unitPrice);ok([0,4,5,10,22].includes(l.vat),"Aliquota IVA non valida");net+=round(qty*unit);tax+=round(round(qty*unit)*l.vat/100);}
 return {taxable:round(net),vat:round(tax),total:round(net+tax)};
}
function empty(){return {schema:"ITE-INVOICES-TEST-1",documents:[],payments:[]};}
function validate(db){
 ok(db&&db.schema==="ITE-INVOICES-TEST-1"&&Array.isArray(db.documents)&&Array.isArray(db.payments),"Archivio incompatibile");
 const ids=new Set();
 for(const d of db.documents){
  ok(d&&ID.test(d.id)&&!ids.has(d.id),"ID documento TEST duplicato o non valido");ids.add(d.id);
  ok(TYPES.includes(d.type),"Tipo documento non valido");
  text(d.number,80);text(d.party);iso(d.date);
  ok(Array.isArray(d.lines),"Righe mancanti");const calculated=totals(d.lines);
  ok(d.taxable===calculated.taxable&&d.vat===calculated.vat&&d.total===calculated.total,"Totali alterati");
  ok(d.type!=="CREDIT_NOTE"||d.total>=0,"Nota di credito non valida");
 }
 const paid=new Map();
 for(const p of db.payments){ok(p&&ID.test(p.documentId)&&ids.has(p.documentId),"Pagamento senza documento");iso(p.date);const amount=money(p.amount);ok(amount>0,"Pagamento nullo");paid.set(p.documentId,round((paid.get(p.documentId)||0)+amount));}
 for(const d of db.documents)ok((paid.get(d.id)||0)<=d.total,"Importi registrati superiori al totale");
 return true;
}
function add(db,doc){
 validate(db);ok(doc&&ID.test(doc.id)&&!db.documents.some(d=>d.id===doc.id),"ID TEST duplicato");
 ok(TYPES.includes(doc.type),"Classificazione non risolta");
 const t=totals(doc.lines),next=clone(db);
 next.documents.push({id:doc.id,type:doc.type,number:text(doc.number,80),party:text(doc.party),date:iso(doc.date),lines:clone(doc.lines),...t});
 validate(next);return next;
}
function payment(db,documentId,amount,date){
 validate(db);ok(ID.test(documentId)&&db.documents.some(d=>d.id===documentId),"Documento non trovato");const next=clone(db);
 next.payments.push({documentId,amount:money(amount),date:iso(date)});validate(next);return next;
}
function summary(db,filter={}){
 validate(db);const rows=db.documents.filter(d=>!filter.type||d.type===filter.type).map(d=>{
 const settled=round(db.payments.filter(p=>p.documentId===d.id).reduce((a,p)=>a+p.amount,0));
 const remaining=round(d.total-settled),credit=d.type==="CREDIT_NOTE";
 const status=credit?(remaining===0?"RECOVERED":settled>0?"PARTIALLY_RECOVERED":"TO_RECOVER"):(remaining===0?"PAID":settled>0?"PARTIAL":"OPEN");
 return {id:d.id,number:d.number,type:d.type,party:d.party,total:d.total,settled,remaining,status};
 });
 return {rows,openSales:round(rows.filter(r=>r.type==="SALE").reduce((s,r)=>s+r.remaining,0)),openPurchases:round(rows.filter(r=>r.type==="PURCHASE").reduce((s,r)=>s+r.remaining,0)),creditsToRecover:round(rows.filter(r=>r.type==="CREDIT_NOTE").reduce((s,r)=>s+r.remaining,0)),proformas:round(rows.filter(r=>r.type==="PROFORMA").reduce((s,r)=>s+r.remaining,0))};
}
function importJson(json){ok(typeof json==="string"&&json.length<=2000000,"Archivio troppo grande");const db=JSON.parse(json);validate(db);return clone(db);}
function exportJson(db){validate(db);return JSON.stringify(db,null,2);}
return {TYPES,STATES,classify,totals,empty,validate,add,payment,summary,importJson,exportJson};
});