/* I.T.E. 4.0.188 — ciclo documentale TEST: proforma -> vendita -> TD04, senza emissione fiscale. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
function requireStore(store){if(!store||store.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(store.documents))throw Error("ARCHIVIO_INVALIDO");const F=root.ITE_FiscalTest183;if(!F)throw Error("MOTORE_ASSENTE");if(F.summary(store).issues.length)throw Error("ARCHIVIO_INCOERENTE");return F}
function nextId(store,prefix){let i=1;while(store.documents.some(d=>d.id===prefix+"_"+i))i++;return prefix+"_"+i}
function createSale(store,proformaId,number,date){
 const F=requireStore(store),p=store.documents.find(d=>d.id===proformaId);
 if(!p||p.type!=="PROFORMA"||p.status!=="REGISTRATO")throw Error("PROFORMA_NON_REGISTRATA");
 if(store.documents.some(d=>d.originProformaId===p.id&&d.status!=="ANNULLATO"))throw Error("PROFORMA_GIA_CONVERTITA");
 const sale={id:nextId(store,"SALE_TEST"),type:"VENDITA",number,date,counterparty:p.counterparty,lines:clone(p.lines),status:"BOZZA",originProformaId:p.id};
 if(F.validate(sale).length)throw Error("DATI_VENDITA_INVALIDI");
 return F.add(store,sale);
}
function createCredit(store,saleId,number,date,lines){
 const F=requireStore(store),s=store.documents.find(d=>d.id===saleId);
 if(!s||s.type!=="VENDITA"||s.status!=="REGISTRATO")throw Error("VENDITA_NON_REGISTRATA");
 if(date<s.date)throw Error("DATA_TD04_PRECEDENTE");
 const candidate={id:nextId(store,"CREDIT_TEST"),type:"TD04",number,date,counterparty:s.counterparty,lines:clone(lines||s.lines),reference:{number:s.number,date:s.date},originSaleId:s.id,status:"BOZZA"};
 const value=F.totals(candidate).totalCents,base=F.totals(s).totalCents;
 let used=0;
 for(const d of store.documents.filter(d=>d.type==="TD04"&&d.originSaleId===s.id&&d.status!=="ANNULLATO"))used+=F.totals(d).totalCents;
 if(used+value>base)throw Error("TD04_SUPERA_VENDITA");
 return F.add(store,candidate);
}
function reconcile(store){
 const F=requireStore(store),issues=[],sales=new Map(),credits=new Map();
 for(const d of store.documents){
  if(d.type==="VENDITA"&&d.originProformaId){
   const p=store.documents.find(x=>x.id===d.originProformaId);
   if(!p||p.type!=="PROFORMA")issues.push({id:d.id,code:"PROFORMA_ORIGINE_ASSENTE"});
   if(d.status!=="ANNULLATO"){if(sales.has(d.originProformaId))issues.push({id:d.id,code:"PROFORMA_CONVERSIONE_DUPLICATA"});sales.set(d.originProformaId,d.id)}
  }
  if(d.type==="TD04"&&d.originSaleId&&d.status!=="ANNULLATO"){
   const s=store.documents.find(x=>x.id===d.originSaleId);
   if(!s||s.type!=="VENDITA"||s.status!=="REGISTRATO"||s.number!==d.reference.number||s.date!==d.reference.date)issues.push({id:d.id,code:"VENDITA_ORIGINE_NON_VALIDA"});
   else {const total=(credits.get(s.id)||0)+F.totals(d).totalCents;credits.set(s.id,total);if(total>F.totals(s).totalCents)issues.push({id:d.id,code:"TD04_SUPERA_VENDITA"})}
  }
 }
 return {valid:issues.length===0,issues,convertedProformas:sales.size,creditedSales:credits.size};
}
const api=Object.freeze({createSale,createCredit,reconcile});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_DocumentLifecycle188=api;
})(typeof globalThis!=="undefined"?globalThis:this);
