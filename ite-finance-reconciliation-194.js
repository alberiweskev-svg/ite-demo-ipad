/* I.T.E. 4.0.194 — consolidated TEST receivables/payables audit; no production persistence. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinanceReconciliation194=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const validDate=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
function audit(fiscal,simple,installments,asOf,engines){
 if(!validDate(asOf))throw Error("DATA_RIFERIMENTO_NON_VALIDA");
 const E=engines||{simple:root.ITE_SettlementTest190,installments:root.ITE_Installments192};
 if(!E.simple||!E.installments)throw Error("MOTORI_SCADENZIARIO_ASSENTI");
 const s=E.simple.inspect(fiscal,simple),i=E.installments.inspect(fiscal,installments);
 const issues=[...(s.issues||[]).map(x=>"SEMPLICE:"+x),...(i.errors||[]).map(x=>"RATE:"+x)];
 const docIds=new Set(),rows=[];
 function accept(r,source){
  if(!r||typeof r.documentId!=="string"||typeof r.dueDate!=="string"||!Number.isSafeInteger(r.amountCents)||!Number.isSafeInteger(r.paidCents)||!["VENDITA","ACQUISTO"].includes(r.type)){issues.push("RIGA_INVALIDA:"+source);return;}
  const id=r.documentId;
  if(source==="SEMPLICE"&&docIds.has(id)){issues.push("SCADENZA_DUPLICATA:"+id);return;}
  rows.push({source,documentId:id,installmentId:source==="RATE"?r.installmentId:null,type:r.type,dueDate:r.dueDate,amountCents:r.amountCents,paidCents:r.paidCents,outstandingCents:r.amountCents-r.paidCents,overdueCents:r.dueDate<asOf?Math.max(0,r.amountCents-r.paidCents):0});
 }
 for(const r of s.rows||[]){docIds.add(r.documentId);accept(r,"SEMPLICE");}
 for(const r of i.rows||[]){if(docIds.has(r.documentId)){issues.push("DOPPIA_CONTABILIZZAZIONE:"+r.documentId);continue;}accept(r,"RATE");}
 const totals={receivablesCents:0,payablesCents:0,receivedCents:0,paidCents:0,openReceivablesCents:0,openPayablesCents:0,overdueReceivablesCents:0,overduePayablesCents:0};
 for(const r of rows){const sale=r.type==="VENDITA";totals[sale?"receivablesCents":"payablesCents"]+=r.amountCents;totals[sale?"receivedCents":"paidCents"]+=r.paidCents;totals[sale?"openReceivablesCents":"openPayablesCents"]+=r.outstandingCents;totals[sale?"overdueReceivablesCents":"overduePayablesCents"]+=r.overdueCents;}
 for(const [key,value] of Object.entries(totals))if(!Number.isSafeInteger(value)||value<0)issues.push("TOTALE_NON_VALIDO:"+key);
 return clone({schema:"ITE_FINANCE_RECONCILIATION_TEST_194",asOf,valid:issues.length===0,issues:[...new Set(issues)],rows:rows.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.documentId.localeCompare(b.documentId)),totals,warning:"Solo dati TEST. Una fattura non può essere presente contemporaneamente nello scadenziario semplice e rateale. Nessuna compensazione TD04, liquidazione IVA o fatturazione elettronica."});
}
function csv(report){if(!report||report.schema!=="ITE_FINANCE_RECONCILIATION_TEST_194"||!report.valid)throw Error("REPORT_NON_VALIDO");const safe=v=>{let s=String(v??"");if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return [["Origine","Documento","Rata","Tipo","Scadenza","Importo cent","Pagato cent","Residuo cent","Scaduto cent"],...report.rows.map(r=>[r.source,r.documentId,r.installmentId||"",r.type,r.dueDate,r.amountCents,r.paidCents,r.outstandingCents,r.overdueCents])].map(row=>row.map(safe).join(";")).join("\r\n")+"\r\n";}
return Object.freeze({audit,csv});
});
