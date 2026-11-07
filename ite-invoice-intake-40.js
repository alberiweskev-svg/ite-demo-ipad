/* I.T.E. 4.0.53 — local TEST invoice intake, review and reconciliation. */
(function(root,factory){const api=factory(root.ITEInvoiceLedger40||(typeof require==="function"?require("./ite-invoice-ledger-40.js"):null));if(typeof module==="object"&&module.exports)module.exports=api;root.ITEInvoiceIntake40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(ledger){
"use strict";
if(!ledger)throw Error("Invoice ledger missing");
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
const clean=(v,max=180)=>typeof v==="string"?v.trim().slice(0,max):"";
function inspect(db,records){
 ledger.validate(db);
 if(!Array.isArray(records)||records.length>200)throw Error("Lotto non valido (massimo 200)");
 const known=new Set(db.documents.map(d=>d.id));
 const seen=new Set();
 return records.map((r,index)=>{
  const issues=[];
  if(!r||typeof r!=="object"||Array.isArray(r))return {index,status:"REJECTED",issues:["Formato documento non valido"]};
  const id=clean(r.id,70),number=clean(r.number,80),party=clean(r.party),date=clean(r.date,20);
  if(!ID.test(id))issues.push("ID TEST obbligatorio");
  if(known.has(id)||seen.has(id))issues.push("ID duplicato");
  seen.add(id);
  const classified=ledger.classify({documentCode:r.documentCode,number,label:r.label,issuer:r.issuer,company:r.company});
  let type=classified.type;
  if(r.type&&r.type!==type)issues.push("Classificazione dichiarata discordante");
  if(type==="UNRESOLVED")issues.push("Emittente da verificare");
  if(!number||!party)issues.push("Numero e controparte obbligatori");
  let amounts=null;
  try{amounts=ledger.totals(r.lines);}catch(e){issues.push(e.message);}
  if(amounts&&r.expectedTotal!==undefined&&(!Number.isFinite(r.expectedTotal)||Math.abs(amounts.total-r.expectedTotal)>0.01))issues.push("Totale dichiarato discordante");
  try{if(amounts)ledger.add(ledger.empty(),{id,type,number,party,date,lines:r.lines});}catch(e){issues.push(e.message);}
  return {index,id,number,party,date,type,reason:classified.reason,amounts,status:issues.length?"REVIEW":"READY",issues};
 });
}
function apply(db,records,approvedIndices){
 ledger.validate(db);
 if(!Array.isArray(approvedIndices)||new Set(approvedIndices).size!==approvedIndices.length)throw Error("Approvazioni duplicate");
 if(approvedIndices.length===0)throw Error("Nessun documento selezionato");
 const review=inspect(db,records),ready=new Map(review.filter(r=>r.status==="READY").map(r=>[r.index,r]));
 let next=db;
 for(const index of approvedIndices){
  if(!Number.isInteger(index)||!ready.has(index))throw Error("Documento non approvabile: "+index);
  const r=ready.get(index),original=records[index];
  next=ledger.add(next,{id:r.id,type:r.type,number:r.number,party:r.party,date:r.date,lines:original.lines});
 }
 return next;
}
function plan(db,records,selectedIndices){
 const rows=inspect(db,records);
 if(!Array.isArray(selectedIndices)||new Set(selectedIndices).size!==selectedIndices.length)throw Error("Selezione duplicata");
 const allowed=new Set(rows.filter(r=>r.status==="READY").map(r=>r.index));
 for(const i of selectedIndices)if(!Number.isInteger(i)||!allowed.has(i))throw Error("Documento non selezionabile: "+i);
 const selected=rows.filter(r=>selectedIndices.includes(r.index));
 const totals=selected.reduce((a,r)=>{a.count++;a.taxable=Math.round((a.taxable+r.amounts.taxable)*100)/100;a.vat=Math.round((a.vat+r.amounts.vat)*100)/100;a.total=Math.round((a.total+r.amounts.total)*100)/100;return a;},{count:0,taxable:0,vat:0,total:0});
 return {rows,selected,totals,reviewCount:rows.filter(r=>r.status!=="READY").length};
}
function reconcile(db){
 ledger.validate(db);
 const summary=ledger.summary(db);
 const byType={};
 for(const type of ledger.TYPES){
  const rows=summary.rows.filter(r=>r.type===type);
  byType[type]={count:rows.length,total:Math.round(rows.reduce((s,r)=>s+r.total,0)*100)/100,remaining:Math.round(rows.reduce((s,r)=>s+r.remaining,0)*100)/100};
 }
 const due=summary.rows.filter(r=>r.remaining>0).sort((a,b)=>b.remaining-a.remaining);
 return {byType,due,unsettledCount:due.length,openSales:summary.openSales,openPurchases:summary.openPurchases,creditsToRecover:summary.creditsToRecover,proformas:summary.proformas};
}
return {inspect,apply,plan,reconcile};
});
