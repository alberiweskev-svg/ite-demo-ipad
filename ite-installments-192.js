/* I.T.E. 4.0.192 — rate e riconciliazione TEST, nessun dato reale. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const validId=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,64}$/.test(x);
const date=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
const positive=x=>Number.isSafeInteger(x)&&x>0;
function create(){return {schema:"ITE_INSTALLMENTS_TEST_192",plans:[],movements:[]};}
function inspect(fiscal,store){
 const errors=[],rows=[],totals={receivableCents:0,payableCents:0,receivedCents:0,paidCents:0,openReceivableCents:0,openPayableCents:0};
 if(!fiscal||fiscal.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(fiscal.documents))throw Error("FISCALE_INVALIDO");
 if(!store||store.schema!=="ITE_INSTALLMENTS_TEST_192"||!Array.isArray(store.plans)||!Array.isArray(store.movements))throw Error("RATE_INVALIDe");
 const F=root.ITE_FiscalTest183;if(!F)throw Error("MOTORE_FISCALE_ASSENTE");
 const audit=F.summary(fiscal);errors.push(...audit.issues.map(x=>"FISCALE:"+x));
 const docs=new Map(fiscal.documents.map(d=>[d.id,d])),planIds=new Set(),docIds=new Set(),installmentIds=new Set(),movementIds=new Set();
 for(const plan of store.plans){
  if(!plan||!validId(plan.id)||planIds.has(plan.id)){errors.push("PIANO_ID");continue;}planIds.add(plan.id);
  if(!validId(plan.documentId)||docIds.has(plan.documentId)){errors.push("DOCUMENTO_DUPLICATO:"+plan.id);continue;}docIds.add(plan.documentId);
  const doc=docs.get(plan.documentId);
  if(!doc||!["VENDITA","ACQUISTO"].includes(doc.type)||doc.status!=="REGISTRATO"){errors.push("DOCUMENTO_NON_VALIDO:"+plan.id);continue;}
  if(!Array.isArray(plan.installments)||!plan.installments.length||plan.installments.length>120){errors.push("RATE_NON_VALIDE:"+plan.id);continue;}
  let sum=0;const local=[];
  for(const rate of plan.installments){
   if(!rate||!validId(rate.id)||installmentIds.has(rate.id)||!date(rate.dueDate)||!positive(rate.amountCents)){errors.push("RATA_NON_VALIDA:"+plan.id);continue;}
   installmentIds.add(rate.id);sum+=rate.amountCents;
   local.push({planId:plan.id,installmentId:rate.id,documentId:doc.id,documentNumber:doc.number,type:doc.type,dueDate:rate.dueDate,amountCents:rate.amountCents,paidCents:0,outstandingCents:rate.amountCents});
  }
  if(!Number.isSafeInteger(sum)||sum!==doc.totals.totalCents||local.length!==plan.installments.length){errors.push("TOTALE_RATE:"+plan.id);continue;}
  rows.push(...local);
 }
 const byId=new Map(rows.map(x=>[x.installmentId,x]));
 for(const m of store.movements){
  if(!m||!validId(m.id)||movementIds.has(m.id)){errors.push("MOVIMENTO_ID");continue;}movementIds.add(m.id);
  if(!validId(m.installmentId)||!date(m.date)||!positive(m.amountCents)||!["BONIFICO","CONTANTI","POS","ALTRO"].includes(m.method)){errors.push("MOVIMENTO_NON_VALIDO:"+m.id);continue;}
  const row=byId.get(m.installmentId);if(!row){errors.push("MOVIMENTO_ORFANO:"+m.id);continue;}
  row.paidCents+=m.amountCents;
 }
 for(const r of rows){
  r.outstandingCents=r.amountCents-r.paidCents;
  if(r.outstandingCents<0)errors.push("SOVRAPAGAMENTO:"+r.installmentId);
  if(r.type==="VENDITA"){totals.receivableCents+=r.amountCents;totals.receivedCents+=r.paidCents;totals.openReceivableCents+=r.outstandingCents;}
  else{totals.payableCents+=r.amountCents;totals.paidCents+=r.paidCents;totals.openPayableCents+=r.outstandingCents;}
 }
 if(Object.values(totals).some(x=>!Number.isSafeInteger(x)))errors.push("TOTALE_FUORI_LIMITE");
 return clone({schema:"ITE_INSTALLMENTS_REPORT_192",valid:errors.length===0,issues:errors,rows,totals});
}
function addPlan(fiscal,store,plan){const next=clone(store);next.plans.push(clone(plan));const r=inspect(fiscal,next);if(!r.valid)throw Error(r.issues.join("|"));return next;}
function addMovement(fiscal,store,movement){const next=clone(store);next.movements.push(clone(movement));const r=inspect(fiscal,next);if(!r.valid)throw Error(r.issues.join("|"));return next;}
function split(fiscal,store,documentId,dates,planId){
 const doc=fiscal.documents.find(d=>d.id===documentId);if(!doc||!doc.totals||!positive(doc.totals.totalCents))throw Error("DOCUMENTO_NON_VALIDO");
 if(!Array.isArray(dates)||!dates.length||dates.length>120||!dates.every(date)||!validId(planId))throw Error("DATE_NON_VALIDE");
 const total=doc.totals.totalCents,base=Math.floor(total/dates.length),remainder=total%dates.length;
 if(base<1)throw Error("IMPORTO_TROPPO_PICCOLO");
 return addPlan(fiscal,store,{id:planId,documentId,installments:dates.map((dueDate,i)=>({id:planId+"_"+(i+1),dueDate,amountCents:base+(i<remainder?1:0)}))});
}
function importTest(fiscal,text){
 if(typeof text!=="string"||text.length>2000000)throw Error("DIMENSIONE_NON_VALIDA");
 const data=JSON.parse(text);
 if(!data||!Array.isArray(data.plans)||!Array.isArray(data.movements)||data.plans.length>5000||data.movements.length>20000)throw Error("FORMATO_NON_VALIDO");
 const report=inspect(fiscal,data);if(!report.valid)throw Error(report.issues.join("|"));return clone(data);
}
function exportTest(fiscal,store){const r=inspect(fiscal,store);if(!r.valid)throw Error(r.issues.join("|"));return JSON.stringify(store,null,2);}
function csv(report){
 if(!report||report.schema!=="ITE_INSTALLMENTS_REPORT_192"||!report.valid)throw Error("REPORT_NON_VALIDO");
 const safe=v=>{let s=String(v??"");if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return "\uFEFF"+[["Documento","Tipo","Rata","Scadenza","Importo cent","Pagato cent","Residuo cent"],...report.rows.map(r=>[r.documentNumber,r.type,r.installmentId,r.dueDate,r.amountCents,r.paidCents,r.outstandingCents])].map(r=>r.map(safe).join(";")).join("\r\n")+"\r\n";
}
const api=Object.freeze({create,inspect,addPlan,addMovement,split,importTest,exportTest,csv});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Installments192=api;
})(typeof globalThis!=="undefined"?globalThis:this);
