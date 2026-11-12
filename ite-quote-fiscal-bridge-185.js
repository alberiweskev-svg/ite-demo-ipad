/* I.T.E. 4.0.185 — collegamento preventivo accettato -> bozza fiscale TEST; nessuna emissione. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
function prepare(field,commerce,quoteId,options={}){
 const D=root.ITE_CommercialDossier182,F=root.ITE_FiscalTest183;
 if(!D||!F)throw Error("MOTORI_NON_DISPONIBILI");
 const report=D.build(field,commerce);
 if(!report.valid)throw Error("DOSSIER_INCOERENTE:"+report.issues.map(x=>x.code).join(","));
 const quote=commerce.quotes.find(q=>q.id===quoteId);
 if(!quote||quote.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");
 const intervention=field.interventions.find(i=>i.id===quote.interventionId);
 if(!intervention)throw Error("INTERVENTO_NON_TROVATO");
 const client=field.clients.find(c=>c.id===intervention.clientId);
 if(!client)throw Error("CLIENTE_NON_TROVATO");
 const extras=new Map(commerce.extras.map(x=>[x.id,x]));
 const lines=quote.extraIds.map(id=>{const x=extras.get(id);if(!x||x.status!=="ACCETTATO")throw Error("EXTRA_NON_VALIDO");if(!Number.isSafeInteger(x.quantity)||x.quantity<1)throw Error("QUANTITA_NON_INTERA_PER_FISCALE");return {description:x.kind+" — "+x.description,quantity:x.quantity,unitPrice:x.unitPrice,vatRate:options.vatRate===undefined?10:options.vatRate};});
 const document={id:options.id||"TEST_"+quote.id.replace(/[^A-Za-z0-9_-]/g,"_"),type:"PROFORMA",number:options.number||"TEST-"+quote.id,date:options.date||"2026-11-12",counterparty:client.name,lines,status:"BOZZA"};
 const errors=F.validate(document);if(errors.length)throw Error(errors.join(","));
 return copy({quoteId,interventionId:intervention.id,document,totals:F.totals(document),warning:"BOZZA TEST: IVA indicativa da verificare; non emettere fiscalmente."});
}
function insert(store,prepared){
 if(!prepared||!prepared.document||prepared.document.type!=="PROFORMA"||prepared.document.status!=="BOZZA")throw Error("BOZZA_NON_VALIDA");
 const F=root.ITE_FiscalTest183;
 if(store.documents.some(d=>d.sourceQuoteId===prepared.quoteId||d.id===prepared.document.id))throw Error("PREVENTIVO_GIA_COLLEGATO");
 const candidate=copy(prepared.document);candidate.sourceQuoteId=prepared.quoteId;return F.add(store,candidate);
}
const api=Object.freeze({prepare,insert});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_QuoteFiscalBridge185=api;
})(typeof globalThis!=="undefined"?globalThis:this);
