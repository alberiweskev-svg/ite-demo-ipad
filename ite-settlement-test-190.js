/* I.T.E. 4.0.190 — scadenziario e incassi/pagamenti TEST; nessun dato reale. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const date=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
const id=s=>typeof s==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(s);
const cents=n=>Number.isSafeInteger(n)&&n>0&&n<=Number.MAX_SAFE_INTEGER;
function create(){return {schema:"ITE_SETTLEMENT_TEST_190",entries:[],payments:[]};}
function inspect(fiscal,ledger){
 const issues=[],rows=[];
 if(!fiscal||fiscal.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(fiscal.documents))throw Error("FISCALE_INVALIDO");
 if(!ledger||ledger.schema!=="ITE_SETTLEMENT_TEST_190"||!Array.isArray(ledger.entries)||!Array.isArray(ledger.payments))throw Error("SCADENZIARIO_INVALIDO");
 const F=root.ITE_FiscalTest183;if(!F)throw Error("MOTORE_FISCALE_ASSENTE");
 const summary=F.summary(fiscal);issues.push(...summary.issues.map(code=>"FISCALE:"+code));
 const docs=new Map(fiscal.documents.map(d=>[d.id,d]));const entryIds=new Set(),paymentIds=new Set(),docIds=new Set();
 for(const e of ledger.entries){
  if(!e||!id(e.id)||entryIds.has(e.id)){issues.push("SCADENZA_ID");continue;}entryIds.add(e.id);
  if(!id(e.documentId)||docIds.has(e.documentId)){issues.push("SCADENZA_DOCUMENTO_DUPLICATO:"+e.id);continue;}docIds.add(e.documentId);
  const d=docs.get(e.documentId);
  if(!d||!["VENDITA","ACQUISTO"].includes(d.type)||d.status!=="REGISTRATO"){issues.push("DOCUMENTO_NON_AMMESSO:"+e.id);continue;}
  if(!date(e.dueDate)||!cents(e.amountCents)||!d.totals||e.amountCents!==d.totals.totalCents){issues.push("SCADENZA_IMPORTO_DATA:"+e.id);continue;}
  rows.push({id:e.id,documentId:d.id,type:d.type,number:d.number,dueDate:e.dueDate,amountCents:e.amountCents,paidCents:0,outstandingCents:e.amountCents});
 }
 const byEntry=new Map(rows.map(r=>[r.id,r]));
 for(const p of ledger.payments){
  if(!p||!id(p.id)||paymentIds.has(p.id)){issues.push("MOVIMENTO_ID");continue;}paymentIds.add(p.id);
  if(!date(p.date)||!cents(p.amountCents)||!["BONIFICO","CONTANTI","POS","ALTRO"].includes(p.method)||!id(p.entryId)){issues.push("MOVIMENTO_NON_VALIDO:"+p.id);continue;}
  const row=byEntry.get(p.entryId);if(!row){issues.push("MOVIMENTO_ORFANO:"+p.id);continue;}
  row.paidCents+=p.amountCents;
 }
 const totals={receivablesCents:0,payablesCents:0,receivedCents:0,paidCents:0,openReceivablesCents:0,openPayablesCents:0};
 for(const r of rows){
  if(r.paidCents>r.amountCents)issues.push("SOVRAPAGAMENTO:"+r.id);
  r.outstandingCents=r.amountCents-r.paidCents;
  if(r.type==="VENDITA"){totals.receivablesCents+=r.amountCents;totals.receivedCents+=r.paidCents;totals.openReceivablesCents+=r.outstandingCents;}
  else {totals.payablesCents+=r.amountCents;totals.paidCents+=r.paidCents;totals.openPayablesCents+=r.outstandingCents;}
 }
 return copy({schema:"ITE_SETTLEMENT_REPORT_190",valid:issues.length===0,issues,rows,totals,warning:"Dati fittizi; non è contabilità, non gestisce compensazioni TD04 o scadenze rateali."});
}
function addEntry(fiscal,ledger,entry){
 const next=copy(ledger);next.entries.push(copy(entry));const report=inspect(fiscal,next);if(!report.valid)throw Error(report.issues.join("|"));return next;
}
function addPayment(fiscal,ledger,payment){
 const next=copy(ledger);next.payments.push(copy(payment));const report=inspect(fiscal,next);if(!report.valid)throw Error(report.issues.join("|"));return next;
}
function importTest(fiscal,source){
 if(typeof source!=="string"||source.length>1000000)throw Error("DIMENSIONE_NON_VALIDA");
 const obj=JSON.parse(source);if(!obj||!Array.isArray(obj.entries)||!Array.isArray(obj.payments)||obj.entries.length>5000||obj.payments.length>20000)throw Error("FORMATO_NON_VALIDO");
 const report=inspect(fiscal,obj);if(!report.valid)throw Error(report.issues.join("|"));return copy(obj);
}
function exportTest(fiscal,ledger){const r=inspect(fiscal,ledger);if(!r.valid)throw Error(r.issues.join("|"));return JSON.stringify(ledger,null,2);}
function csv(report){
 if(!report||report.schema!=="ITE_SETTLEMENT_REPORT_190"||!report.valid)throw Error("REPORT_NON_VALIDO");
 const safe=x=>{let s=String(x??"");if(/^\\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return "\uFEFF"+[["Documento","Tipo","Scadenza","Importo cent","Pagato cent","Residuo cent"],...report.rows.map(r=>[r.number,r.type,r.dueDate,r.amountCents,r.paidCents,r.outstandingCents])].map(row=>row.map(safe).join(";")).join("\r\n")+"\r\n";
}
const api=Object.freeze({create,inspect,addEntry,addPayment,importTest,exportTest,csv});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Settlement190=api;
})(typeof globalThis!=="undefined"?globalThis:this);
