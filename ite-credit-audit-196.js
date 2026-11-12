/* I.T.E. 4.0.196 — TD04 fiscal linkage audit, TEST only. No automatic payment compensation. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITECreditAudit196=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
function audit(store){
 const issues=[],rows=[],byId=new Map(),byReference=new Map();
 if(!store||store.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(store.documents))throw Error("ARCHIVIO_INVALIDO");
 const docs=store.documents;
 for(const d of docs){if(!d||typeof d.id!=="string"){issues.push("DOCUMENTO_INVALIDO");continue;}if(byId.has(d.id))issues.push("ID_DUPLICATO:"+d.id);byId.set(d.id,d);if(d.type==="VENDITA"&&d.status==="REGISTRATO"){const key=d.number+"|"+d.date;const arr=byReference.get(key)||[];arr.push(d);byReference.set(key,arr);}}
 const allocations=new Map();
 for(const credit of docs.filter(d=>d&&d.type==="TD04"&&d.status!=="ANNULLATO")){
  if(!credit.reference||!credit.reference.number||!credit.reference.date){issues.push("RIFERIMENTO_ASSENTE:"+credit.id);continue;}
  const matches=byReference.get(credit.reference.number+"|"+credit.reference.date)||[];
  const origin=credit.originSaleId?byId.get(credit.originSaleId):null;
  if(credit.originSaleId&&(!origin||!matches.includes(origin))){issues.push("ORIGINE_NON_COINCIDENTE:"+credit.id);continue;}
  if(matches.length!==1&&!origin){issues.push("RIFERIMENTO_NON_UNIVOCO:"+credit.id);continue;}
  const sale=origin||matches[0];
  if(!sale){issues.push("VENDITA_NON_TROVATA:"+credit.id);continue;}
  if(sale.counterparty!==credit.counterparty){issues.push("CONTROPARTE_DIVERSA:"+credit.id);continue;}
  if(credit.date<sale.date){issues.push("DATA_TD04_PRECEDENTE:"+credit.id);continue;}
  const amount=credit.totals&&credit.totals.totalCents,base=sale.totals&&sale.totals.totalCents;
  if(!Number.isSafeInteger(amount)||amount<0||!Number.isSafeInteger(base)||base<0){issues.push("IMPORTI_INVALIDI:"+credit.id);continue;}
  const next=(allocations.get(sale.id)||0)+amount;
  if(!Number.isSafeInteger(next)||next>base){issues.push("TD04_SUPERA_VENDITA:"+credit.id);continue;}
  allocations.set(sale.id,next);
  rows.push({creditId:credit.id,saleId:sale.id,amountCents:amount,status:credit.status});
 }
 let saleCents=0,creditCents=0;
 for(const sale of docs.filter(d=>d&&d.type==="VENDITA"&&d.status==="REGISTRATO")){
  const base=sale.totals&&sale.totals.totalCents;
  if(!Number.isSafeInteger(base)||base<0){issues.push("VENDITA_IMPORTO_INVALIDO:"+sale.id);continue;}
  saleCents+=base;creditCents+=rows.filter(r=>r.saleId===sale.id&&r.status==="REGISTRATO").reduce((sum,r)=>sum+r.amountCents,0);
 }
 if(!Number.isSafeInteger(saleCents)||!Number.isSafeInteger(creditCents))issues.push("TOTALE_FUORI_LIMITE");
 return {schema:"ITE_TD04_AUDIT_TEST_196",valid:issues.length===0,issues:[...new Set(issues)],saleCents,creditCents,netCents:saleCents-creditCents,rows,warning:"TD04 contabilizzate solo come rettifica documentale TEST: nessuna compensazione automatica di rate, scadenze o pagamenti."};
}
return Object.freeze({audit});
});
