/* I.T.E. 4.0.189 — fascicolo economico TEST, senza dati reali o emissione fiscale. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const cents=n=>Math.round(n*100);
function build(input){
 const F=root.ITE_FiscalTest183,L=root.ITE_DocumentLifecycle188;
 if(!F||!L)throw Error("MOTORI_NON_DISPONIBILI");
 const store=input&&input.fiscal;
 if(!store||store.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(store.documents))throw Error("ARCHIVIO_NON_VALIDO");
 const fiscal=F.summary(store),issues=fiscal.issues.map(code=>({scope:"FISCALE",code}));
 if(!fiscal.issues.length){const r=L.reconcile(store);for(const issue of r.issues)issues.push({scope:"CICLO",...issue});}
 const docs=store.documents.map(d=>({id:d.id,type:d.type,number:d.number,date:d.date,status:d.status,counterparty:d.counterparty,
  netCents:d.totals&&d.totals.netCents,vatCents:d.totals&&d.totals.vatCents,totalCents:d.totals&&d.totals.totalCents,
  originProformaId:d.originProformaId||null,originSaleId:d.originSaleId||null}));
 const byStatus={},byType={},links=[];
 for(const d of docs){
  const s=byStatus[d.status]||(byStatus[d.status]={count:0,totalCents:0});
  s.count++;s.totalCents+=d.totalCents||0;
  const t=byType[d.type]||(byType[d.type]={count:0,totalCents:0,registeredCents:0});
  t.count++;t.totalCents+=d.totalCents||0;if(d.status==="REGISTRATO")t.registeredCents+=d.totalCents||0;
  if(d.originProformaId)links.push({from:d.originProformaId,to:d.id,kind:"PROFORMA_VENDITA"});
  if(d.originSaleId)links.push({from:d.originSaleId,to:d.id,kind:"VENDITA_TD04"});
 }
 const ids=new Set(docs.map(d=>d.id));
 for(const l of links)if(!ids.has(l.from))issues.push({scope:"COLLEGAMENTI",id:l.to,code:"ORIGINE_ASSENTE"});
 const balance={salesCents:0,creditsCents:0,purchasesCents:0,proformasCents:0};
 for(const d of docs)if(d.status==="REGISTRATO"){
  if(d.type==="VENDITA")balance.salesCents+=d.totalCents;
  if(d.type==="TD04")balance.creditsCents+=d.totalCents;
  if(d.type==="ACQUISTO")balance.purchasesCents+=d.totalCents;
  if(d.type==="PROFORMA")balance.proformasCents+=d.totalCents;
 }
 balance.netSalesCents=balance.salesCents-balance.creditsCents;
 return clone({schema:"ITE_OPERATIONS_DOSSIER_189",valid:issues.length===0,issues,documents:docs,links,byStatus,byType,balance,
  warning:"Solo dati fittizi. Totali lordi dimostrativi, non contabilita o liquidazione IVA."});
}
function csv(report){
 if(!report||report.schema!=="ITE_OPERATIONS_DOSSIER_189"||!report.valid)throw Error("DOSSIER_NON_VALIDO");
 const safe=v=>{let s=String(v??"");if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return "\uFEFF"+[["Tipo","Numero","Data","Stato","Controparte","Imponibile cent","IVA cent","Totale cent","Proforma origine","Vendita origine"],
 ...report.documents.map(d=>[d.type,d.number,d.date,d.status,d.counterparty,d.netCents,d.vatCents,d.totalCents,d.originProformaId,d.originSaleId])]
 .map(r=>r.map(safe).join(";")).join("\r\n")+"\r\n";
}
const api=Object.freeze({build,csv});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_OperationsDossier189=api;
})(typeof globalThis!=="undefined"?globalThis:this);
