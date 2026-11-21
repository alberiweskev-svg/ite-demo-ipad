/* I.T.E. 4.0.240 — Commercial reconciliation, read-only, synthetic demo. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITECommercial240=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const money=n=>(Number.isSafeInteger(n)?n:0);
function reconcile(s){
 const clients=new Map(s.clients.map(x=>[x.id,x])),quotes=new Map(s.quotes.map(x=>[x.id,x]));
 const issues=[],rows=[],totals={quoted:0,accepted:0,invoiced:0,credited:0,proforma:0,purchases:0};
 for(const q of s.quotes){const amount=(q.lines||[]).reduce((sum,l)=>sum+money(l.cents)*Number(l.qty||0),0);if(!Number.isSafeInteger(amount)||amount<0){issues.push({code:"IMPORTO_PREVENTIVO_NON_VALIDO",id:q.id});continue;}
 totals.quoted+=amount;if(q.status==="ACCETTATO")totals.accepted+=amount;
 const docs=s.invoices.filter(i=>i.quoteId===q.id||i.kind==="TD04"&&s.invoices.some(original=>original.id===i.originalInvoiceId&&original.kind==="VENDITA"&&original.quoteId===q.id)),sales=docs.filter(i=>i.kind==="VENDITA").reduce((v,i)=>v+money(i.cents),0),credits=docs.filter(i=>i.kind==="TD04").reduce((v,i)=>v+money(i.cents),0);
 rows.push({id:q.id,client:clients.get(q.clientId)?.name||q.clientId,status:q.status,quoted:amount,sales,credits,balance:amount-sales+credits,documents:docs.length});
 if(!clients.has(q.clientId))issues.push({code:"CLIENTE_PREVENTIVO_INESISTENTE",id:q.id});
 if(q.status==="ACCETTATO"&&sales-credits<amount)issues.push({code:"PREVENTIVO_ACCETTATO_DA_FATTURARE",id:q.id});
 if(sales-credits>amount)issues.push({code:"FATTURATO_SUPERIORE_AL_PREVENTIVO",id:q.id});
 }
 for(const i of s.invoices){if(!clients.has(i.clientId))issues.push({code:"CLIENTE_FATTURA_INESISTENTE",id:i.id});
 if(i.quoteId&&!quotes.has(i.quoteId))issues.push({code:"PREVENTIVO_FATTURA_INESISTENTE",id:i.id});
 if(i.quoteId&&quotes.has(i.quoteId)&&quotes.get(i.quoteId).clientId!==i.clientId)issues.push({code:"CLIENTE_FATTURA_PREVENTIVO_DIVERSO",id:i.id});
 if(i.kind==="VENDITA")totals.invoiced+=money(i.cents);
 if(i.kind==="TD04"){totals.credited+=money(i.cents);if(!i.originalInvoiceId)issues.push({code:"TD04_SENZA_RIFERIMENTO",id:i.id});else {const original=s.invoices.find(x=>x.id===i.originalInvoiceId&&x.kind==="VENDITA");if(!original||original.clientId!==i.clientId)issues.push({code:"TD04_ORIGINALE_NON_VALIDO",id:i.id});}}
 if(i.kind==="PROFORMA")totals.proforma+=money(i.cents);
 if(i.kind==="ACQUISTO")totals.purchases+=money(i.cents);
 }
 return {rows,issues,totals,netSales:totals.invoiced-totals.credited,unlinkedInvoices:s.invoices.filter(i=>!i.quoteId).length};
}
return Object.freeze({reconcile});
});