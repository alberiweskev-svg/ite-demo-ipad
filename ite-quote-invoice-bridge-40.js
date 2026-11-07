/* I.T.E. 4.0.56 — Bridge TEST preventivi accettati -> bozze fattura.
 * Non emette fatture, non invia documenti e non comunica con server.
 */
(function(root,factory){const api=factory(
 typeof module==="object"&&module.exports?require("./ite-quotes-40.js"):root.ITEQuotes40,
 typeof module==="object"&&module.exports?require("./ite-invoice-ledger-40.js"):root.ITEInvoiceLedger40
);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEQuoteInvoiceBridge40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(quotes,invoices){
"use strict";
if(!quotes||!invoices)throw Error("Motori preventivi e fatture mancanti");
const ok=(condition,message)=>{if(!condition)throw Error(message);};
const copy=x=>JSON.parse(JSON.stringify(x));
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function prepare(quoteDb,invoiceDb,quoteId,invoiceId,number,issueDate,options={}){
 quotes.validate(quoteDb);invoices.validate(invoiceDb);
 ok(typeof quoteId==="string"&&typeof invoiceId==="string","Identificativi mancanti");
 const quote=quoteDb.quotes.find(q=>q.id===quoteId);
 ok(quote&&quote.status==="ACCEPTED","Solo preventivi accettati");
 ok(!invoiceDb.documents.some(d=>d.id===invoiceId),"ID fattura già presente");
 ok(options&&typeof options==="object"&&!Array.isArray(options),"Opzioni non valide");
 const includeExtras=options.includeExtras!==false;
 const rows=quote.lines.concat(includeExtras?quote.extras.filter(e=>e.approval==="APPROVED"):[]);
 ok(rows.length>0,"Nessuna voce fatturabile");
 const rejected=quote.extras.filter(e=>e.approval!=="APPROVED").length;
 const lines=rows.map(r=>({
  quantity:r.quantity,
  unitPrice:round(r.unitPrice*(1-r.discount/100)),
  vat:r.vat
 }));
 // Non trasferire gli sconti con arrotondamento occulto: bloccare differenze economiche.
 const target=rows.reduce((a,r)=>round(a+r.total),0);
 const calculated=invoices.totals(lines);
 ok(Math.abs(calculated.total-target)<0.011,"Arrotondamento sconti non riconciliato: revisione manuale");
 const doc={id:invoiceId,type:"SALE",number,party:quote.customer,date:issueDate,lines};
 const next=invoices.add(invoiceDb,doc);
 return {ledger:next,preview:{quoteId,invoiceId,customer:quote.customer,rows:rows.map(r=>({id:r.id,kind:r.kind,category:r.category,description:r.description,approval:r.approval||null})),excludedExtras:rejected,totals:calculated,warning:"BOZZA TEST: verificare IVA, beni significativi, acconti e dati fiscali prima dell'emissione."}};
}
function reconcile(quoteDb,invoiceDb,quoteId,invoiceId){
 quotes.validate(quoteDb);invoices.validate(invoiceDb);
 const quote=quoteDb.quotes.find(q=>q.id===quoteId),doc=invoiceDb.documents.find(d=>d.id===invoiceId);
 ok(quote&&doc,"Riferimento non trovato");
 ok(doc.type==="SALE"&&doc.party===quote.customer,"Cliente o tipo documento incoerente");
 const s=quotes.summarize(quoteDb,quoteId);
 return {quoteId,invoiceId,contractTotal:s.contractTotal,invoicedTotal:doc.total,difference:round(s.contractTotal-doc.total),matches:Math.abs(s.contractTotal-doc.total)<0.01};
}
return {prepare,reconcile};
});
