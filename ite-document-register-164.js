/* I.T.E. 4.0.164 — TEST-only document register: deterministic classification and reconciliation.
 * No PDFs, personal data, browser storage or network calls. Extracted fields must be reviewed. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const val=x=>String(x??"").trim();
const money=x=>{if(typeof x!=="number"||!Number.isFinite(x)||Math.abs(x)>1e9||Math.abs(x*100-Math.round(x*100))>1e-6)throw Error("IMPORTO_NON_VALIDO");return Math.round(x*100)};
const iso=x=>/^\d{4}-\d{2}-\d{2}$/.test(val(x))&&!Number.isNaN(Date.parse(x+"T00:00:00Z"));
function classify(input,issuerVat){
 const td=val(input.type).toUpperCase(),number=val(input.number).toUpperCase(),text=val(input.description).toUpperCase();
 const proforma=td==="PROFORMA"||/^PR(?:[\s/-]|\d)/.test(number)||/PRO\s?FORMA/.test(text);
 const credit=td==="TD04"||td==="NOTA_CREDITO";
 const seller=val(input.issuerVat).replace(/\s/g,"").toUpperCase();
 const own=val(issuerVat).replace(/\s/g,"").toUpperCase();
 const direction=!seller||!own?"DA_VERIFICARE":seller===own?"VENDITA":"ACQUISTO";
 return {kind:credit?"NOTA_CREDITO":proforma?"PROFORMA":"FATTURA",direction,credit,proforma};
}
function validate(doc,ownVat){
 if(!doc||typeof doc!=="object")throw Error("DOCUMENTO_NON_VALIDO");
 const number=val(doc.number),issuerVat=val(doc.issuerVat),date=val(doc.date);
 if(!number||number.length>100||!iso(date))throw Error("ESTREMI_NON_VALIDI");
 const net=money(doc.net),vat=money(doc.vat),total=money(doc.total);
 if(net<0||vat<0||total<0||Math.abs(net+vat-total)>1)throw Error("TOTALI_NON_COERENTI");
 const cls=classify(doc,ownVat);
 return {number,date,issuerVat,recipientVat:val(doc.recipientVat),net:Math.abs(net)/100,vat:Math.abs(vat)/100,total:Math.abs(total)/100,...cls};
}
function init(){return {schema:"ITE_DOCUMENT_REGISTER_164",revision:0,documents:[],events:[]}}
function check(s){if(s?.schema!=="ITE_DOCUMENT_REGISTER_164"||!Number.isSafeInteger(s.revision)||!Array.isArray(s.documents)||!Array.isArray(s.events))throw Error("REGISTRO_NON_VALIDO")}
function add(s,doc,ownVat,actor,expectedRevision){
 check(s);if(s.revision!==expectedRevision)throw Error("REVISIONE_OBSOLETA");
 if(!val(actor))throw Error("OPERATORE_OBBLIGATORIO");
 const d=validate(doc,ownVat),identity=[d.issuerVat.toUpperCase(),d.number.toUpperCase(),d.date,d.kind].join("|");
 if(s.documents.some(x=>x.identity===identity))throw Error("DOCUMENTO_DUPLICATO");
 const next=clone(s);next.revision++;
 const record={...d,id:"DOC-"+String(next.revision).padStart(6,"0"),identity,reviewStatus:"DA_VERIFICARE",paymentStatus:d.credit?"DA_RECUPERARE":"DA_VERIFICARE",recovered:0,source:"METADATI_TEST",actor:val(actor)};
 next.documents.push(record);next.events.push({revision:next.revision,type:"DOCUMENTO_REGISTRATO",id:record.id,actor:val(actor)});
 return {state:next,record};
}
function review(s,id,decision,actor,expectedRevision){
 check(s);if(s.revision!==expectedRevision)throw Error("REVISIONE_OBSOLETA");
 if(!["CONFERMATO","DA_VERIFICARE"].includes(decision)||!val(actor))throw Error("REVISIONE_NON_VALIDA");
 const next=clone(s),d=next.documents.find(x=>x.id===id);if(!d)throw Error("DOCUMENTO_ASSENTE");
 d.reviewStatus=decision;next.revision++;next.events.push({revision:next.revision,type:"REVISIONE_DOCUMENTO",id,actor:val(actor),decision});
 return next;
}
function recover(s,id,amount,actor,expectedRevision){
 check(s);if(s.revision!==expectedRevision)throw Error("REVISIONE_OBSOLETA");
 const next=clone(s),d=next.documents.find(x=>x.id===id);
 if(!d||!d.credit)throw Error("NOTA_CREDITO_ASSENTE");
 if(!val(actor))throw Error("OPERATORE_OBBLIGATORIO");
 const cents=money(amount),old=money(d.recovered),total=money(d.total);
 if(cents<=0||old+cents>total)throw Error("RECUPERO_NON_VALIDO");
 d.recovered=(old+cents)/100;d.paymentStatus=old+cents===total?"RECUPERATA":"PARZIALMENTE_RECUPERATA";
 next.revision++;next.events.push({revision:next.revision,type:"RECUPERO_TD04",id,amount:cents/100,actor:val(actor)});
 return next;
}
const api=Object.freeze({init,classify,validate,add,review,recover});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_DocumentRegister164=api;
})(typeof globalThis!=="undefined"?globalThis:this);
