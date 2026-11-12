/* I.T.E. 4.0.197 — derived TD04 allocation, TEST only. Never mutates ledgers. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITECreditAllocation197=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function audit(fiscal,finance,creditAudit){
 if(!finance||finance.schema!=="ITE_FINANCE_RECONCILIATION_TEST_194"||!Array.isArray(finance.rows))throw Error("FINANZA_INVALIDA");
 if(!creditAudit||creditAudit.schema!=="ITE_TD04_AUDIT_TEST_196")throw Error("TD04_INVALIDO");
 if(!fiscal||fiscal.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(fiscal.documents))throw Error("FISCALE_INVALIDO");
 const issues=[...(finance.issues||[]).map(x=>"FINANZA:"+x),...(creditAudit.issues||[]).map(x=>"TD04:"+x)];
 const docs=new Map(fiscal.documents.map(d=>[d.id,d])),creditBySale=new Map(),rows=[];
 for(const c of creditAudit.rows||[]){
  if(c.status!=="REGISTRATO")continue;
  if(!integer(c.amountCents)){issues.push("CREDITO_INVALIDO:"+c.creditId);continue;}
  creditBySale.set(c.saleId,(creditBySale.get(c.saleId)||0)+c.amountCents);
 }
 const groups=new Map();
 for(const r of finance.rows){
  if(!r||typeof r.documentId!=="string"||!integer(r.amountCents)||!integer(r.paidCents)||r.paidCents>r.amountCents){issues.push("RIGA_INVALIDA");continue;}
  const arr=groups.get(r.documentId)||[];arr.push(r);groups.set(r.documentId,arr);
 }
 let creditedCents=0,unallocatedCents=0,adjustedOpenReceivablesCents=0,excessReceivedCents=0;
 for(const [saleId,amount] of creditBySale){
  if(!docs.has(saleId)){issues.push("VENDITA_ORFANA:"+saleId);continue;}
  const sale=docs.get(saleId),list=groups.get(saleId)||[];
  if(!list.length){unallocatedCents+=amount;issues.push("SCADENZA_MANCANTE:"+saleId);continue;}
  if(list.some(r=>r.type!=="VENDITA")){issues.push("TIPO_ERRATO:"+saleId);continue;}
  const sum=list.reduce((a,r)=>a+r.amountCents,0);
  if(!integer(sum)||sum!==sale.totals.totalCents){issues.push("SCADENZE_NON_COINCIDENTI:"+saleId);continue;}
 }
 for(const [docId,list] of groups){
  const doc=docs.get(docId),isSale=doc&&doc.type==="VENDITA";
  let left=isSale?(creditBySale.get(docId)||0):0;
  const ordered=[...list].sort((a,b)=>b.dueDate.localeCompare(a.dueDate)||String(b.installmentId||"").localeCompare(String(a.installmentId||"")));
  for(const r of ordered){
   const offset=Math.min(left,r.amountCents);left-=offset;
   const adjusted=r.amountCents-offset;
   const outstanding=Math.max(0,adjusted-r.paidCents),excess=Math.max(0,r.paidCents-adjusted);
   if(isSale){creditedCents+=offset;adjustedOpenReceivablesCents+=outstanding;excessReceivedCents+=excess;}
   rows.push({documentId:docId,installmentId:r.installmentId||null,dueDate:r.dueDate,type:r.type,originalCents:r.amountCents,paidCents:r.paidCents,creditAllocatedCents:offset,adjustedDueCents:adjusted,adjustedOpenCents:outstanding,excessReceivedCents:excess});
  }
  if(left){unallocatedCents+=left;issues.push("CREDITO_NON_ALLOCATO:"+docId);}
 }
 if(excessReceivedCents)issues.push("INCASSI_SUPERIORI_AL_NETTO_TD04");
 if(!finance.valid||!creditAudit.valid)issues.push("VERIFICA_ORIGINE_NON_VALIDA");
 const values=[creditedCents,unallocatedCents,adjustedOpenReceivablesCents,excessReceivedCents];
 if(values.some(v=>!integer(v)))issues.push("TOTALE_NON_VALIDO");
 return {schema:"ITE_TD04_ALLOCATION_TEST_197",valid:issues.length===0,issues:[...new Set(issues)],rows:rows.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.documentId.localeCompare(b.documentId)),totals:{creditedCents,unallocatedCents,adjustedOpenReceivablesCents,excessReceivedCents},warning:"Simulazione TEST: nessuna modifica automatica alle scadenze, nessun rimborso o compensazione contabile. Crediti applicati alle rate dalla scadenza più lontana."};
}
function csv(report){if(!report||report.schema!=="ITE_TD04_ALLOCATION_TEST_197"||!report.valid)throw Error("REPORT_NON_VALIDO");const safe=v=>{let s=String(v??"");if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return "\uFEFF"+[["Documento","Rata","Scadenza","Tipo","Originario cent","Incassato cent","TD04 allocata cent","Netto cent","Residuo netto cent","Eccedenza incassi cent"],...report.rows.map(r=>[r.documentId,r.installmentId||"",r.dueDate,r.type,r.originalCents,r.paidCents,r.creditAllocatedCents,r.adjustedDueCents,r.adjustedOpenCents,r.excessReceivedCents])].map(row=>row.map(safe).join(";")).join("\r\n")+"\r\n";}
return Object.freeze({audit,csv});
});