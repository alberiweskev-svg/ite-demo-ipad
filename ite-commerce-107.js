/* I.T.E. 4.0.107 — commercial handoff TEST; no real invoicing or official documents. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=api;root.ITECommerce107=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const find=(s,k,id)=>s.records[k].find(x=>x.id===id);
const check=(s,actor,expected)=>{base.validate(s);if(s.revision!==expected)throw Error("Conflitto revisione");if(typeof actor!=="string"||!actor.trim())throw Error("Operatore obbligatorio");};
const cents=(v)=>{if(!Number.isSafeInteger(v)||v<0||v>100000000)throw Error("Importo centesimi non valido");return v;};
const categories=["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","ALTRO"];
function line(s,kind,row,actor,expected){
check(s,actor,expected);if(!categories.includes(row.category))throw Error("Categoria non valida");
if(!Number.isSafeInteger(row.quantity)||row.quantity<1||row.quantity>10000)cents(-1);
cents(row.unitCents);
if(kind==="extras"){const q=find(s,"quotes",row.quoteId);if(!q||q.clientId!==row.clientId)throw Error("Extra e preventivo non coerenti");}
const r={...clone(row),status:kind==="extras"?"DA_APPROVARE":"DA_ACCETTARE"};
return base.transact(s,kind,r,actor,expected);
}
function transition(s,kind,id,status,actor,reason,expected,approvedQuantity){
check(s,actor,expected);if(!["quotes","extras"].includes(kind))throw Error("Tipo non ammesso");
if(typeof reason!=="string"||reason.trim().length<5)throw Error("Motivazione obbligatoria");
const row=find(s,kind,id);if(!row)throw Error("Voce inesistente");
const allowed=kind==="quotes"?{DA_ACCETTARE:["ACCETTATO","NON_ACCETTATO"],ACCETTATO:["DA_ACCETTARE"],NON_ACCETTATO:["DA_ACCETTARE"]}:{DA_APPROVARE:["APPROVATO","PARZIALE","RIFIUTATO"],APPROVATO:["DA_APPROVARE"],PARZIALE:["DA_APPROVARE"],RIFIUTATO:["DA_APPROVARE"]};
if(!(allowed[row.status]||[]).includes(status))throw Error("Transizione non consentita");
if(kind==="extras"&&status==="PARZIALE"&&(!Number.isInteger(approvedQuantity)||approvedQuantity<1||approvedQuantity>=row.quantity))throw Error("Quantità parziale non valida");
const next=clone(s),target=find(next,kind,id),before=clone(target);target.status=status;
if(kind==="extras"){if(status==="PARZIALE")target.approvedQuantity=approvedQuantity;else if(status==="APPROVATO")target.approvedQuantity=row.quantity;else delete target.approvedQuantity;}
next.revision++;next.audit.push({revision:next.revision,kind,id,operator:actor.trim(),action:"STATUS",reason:reason.trim(),before,after:clone(target)});
return next;
}
function draftInvoice(s,clientId,invoiceId,actor,expected,opts={}){
check(s,actor,expected);if(!find(s,"clients",clientId))throw Error("Cliente inesistente");
if(!["VENDITA","PROFORMA"].includes(opts.type||"PROFORMA"))throw Error("Tipo bozza non valido");
const ids=opts.quoteIds||[],extraIds=opts.extraIds||[];
if(!Array.isArray(ids)||!Array.isArray(extraIds)||new Set(ids).size!==ids.length||new Set(extraIds).size!==extraIds.length)throw Error("Selezione duplicata");
const q=ids.map(id=>find(s,"quotes",id)),e=extraIds.map(id=>find(s,"extras",id));
if(q.some(x=>!x||x.clientId!==clientId||x.status!=="ACCETTATO"))throw Error("Preventivo non accettato o cliente errato");
if(e.some(x=>!x||x.clientId!==clientId||!["APPROVATO","PARZIALE"].includes(x.status)||!ids.includes(x.quoteId)))throw Error("Extra non approvato o non collegato");
const rows=[...q.map(x=>({source:"quotes",id:x.id,category:x.category,quantity:x.quantity,unitCents:x.unitCents})),...e.map(x=>({source:"extras",id:x.id,category:x.category,quantity:x.approvedQuantity,unitCents:x.unitCents}))];
if(!rows.length)throw Error("Nessuna voce approvata");
const total=rows.reduce((n,x)=>n+x.quantity*x.unitCents,0);cents(total);
const next=base.transact(s,"invoices",{id:invoiceId,clientId,type:opts.type||"PROFORMA",totalCents:total,sourceRows:rows,status:"BOZZA_TEST",officialReady:false,accounted:false},actor,expected);
return next;
}
function creditNote(s,clientId,id,originalId,valueCents,actor,expected){
check(s,actor,expected);const invoice=find(s,"invoices",originalId);
if(!invoice||invoice.clientId!==clientId||invoice.type!=="VENDITA")throw Error("Fattura vendita originale non valida");
cents(valueCents);if(!valueCents)throw Error("Importo nullo");
const used=s.records.invoices.filter(x=>x.type==="TD04"&&x.originalInvoiceId===originalId).reduce((n,x)=>n+x.totalCents,0);
if(used+valueCents>invoice.totalCents)throw Error("Credito superiore alla vendita");
return base.transact(s,"invoices",{id,clientId,type:"TD04",originalInvoiceId:originalId,totalCents:valueCents,status:"DA_RECUPERARE",officialReady:false,accounted:false},actor,expected);
}
function summary(s,clientId){base.validate(s);if(!find(s,"clients",clientId))throw Error("Cliente inesistente");
const q=s.records.quotes.filter(x=>x.clientId===clientId),e=s.records.extras.filter(x=>x.clientId===clientId);
const sum=(rows,quantity)=>rows.reduce((n,x)=>n+x.unitCents*quantity(x),0);
const invoices=s.records.invoices.filter(x=>x.clientId===clientId);
return {quotedCents:sum(q,x=>x.quantity),acceptedCents:sum(q.filter(x=>x.status==="ACCETTATO"),x=>x.quantity),approvedExtraCents:sum(e.filter(x=>["APPROVATO","PARZIALE"].includes(x.status)),x=>x.approvedQuantity),salesCents:invoices.filter(x=>x.type==="VENDITA").reduce((n,x)=>n+x.totalCents,0),creditCents:invoices.filter(x=>x.type==="TD04").reduce((n,x)=>n+x.totalCents,0),officialReady:false};
}
return Object.freeze({line,transition,draftInvoice,creditNote,summary});
});