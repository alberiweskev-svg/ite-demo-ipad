/* I.T.E. 4.0.244 — extras workflow, synthetic/local only. No production or fiscal transmission. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEExtras244=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const validText=x=>typeof x==="string"&&x.trim().length>0&&x.length<=1000;
const validMoney=x=>Number.isSafeInteger(x)&&x>=0;
function propose(store,{quoteId,id,description,supplyCents,laborCents,qty=1}){
 if(!validText(id)||id.length>64||!validText(description)||!validMoney(supplyCents)||!validMoney(laborCents)||!Number.isSafeInteger(qty)||qty<1||qty>10000||supplyCents+laborCents===0)throw Error("EXTRA_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const q=s.quotes.find(x=>x.id===quoteId);
  if(!q||!["BOZZA","INVIATO","ACCETTATO"].includes(q.status))throw Error("PREVENTIVO_NON_MODIFICABILE");
  if((q.extraRequests||[]).some(x=>x.id===id)||q.lines.some(x=>x.id===id+"-F"||x.id===id+"-P"))throw Error("EXTRA_DUPLICATO");
  q.extraRequests=q.extraRequests||[];
  q.extraRequests.push({id,description:description.trim(),supplyCents,laborCents,qty,status:"PROPOSTO",approvedQty:0});
 });
}
function decide(store,quoteId,id,approvedQty){
 if(!Number.isSafeInteger(approvedQty)||approvedQty<0)throw Error("QUANTITA_NON_VALIDA");
 return store.transact(store.snapshot().revision,s=>{
  const q=s.quotes.find(x=>x.id===quoteId),extra=q&&(q.extraRequests||[]).find(x=>x.id===id);
  if(!extra||extra.status!=="PROPOSTO")throw Error("EXTRA_NON_IN_ATTESA");
  if(approvedQty>extra.qty)throw Error("QUANTITA_SUPERIORE_AL_PROPOSTO");
  if(q.status==="RIFIUTATO")throw Error("PREVENTIVO_NON_MODIFICABILE");
  if(approvedQty){
   if(extra.supplyCents)q.lines.push({id:id+"-F",kind:"EXTRA_FORNITURA",description:extra.description+" — fornitura",cents:extra.supplyCents,qty:approvedQty});
   if(extra.laborCents)q.lines.push({id:id+"-P",kind:"EXTRA_POSA",description:extra.description+" — posa",cents:extra.laborCents,qty:approvedQty});
  }
  extra.approvedQty=approvedQty;
  extra.status=approvedQty===0?"RIFIUTATO":approvedQty===extra.qty?"APPROVATO":"PARZIALE";
 });
}
function summary(s,quoteId){
 const q=s.quotes.find(x=>x.id===quoteId);if(!q)throw Error("PREVENTIVO_ASSENTE");
 const extras=clone(q.extraRequests||[]);
 const sum=key=>extras.reduce((n,e)=>n+e[key]*e.approvedQty,0);
 return {extras,approvedSupplyCents:sum("supplyCents"),approvedLaborCents:sum("laborCents"),pending:extras.filter(e=>e.status==="PROPOSTO").length,quoteTotalCents:q.lines.reduce((n,l)=>n+l.cents*l.qty,0)};
}
return Object.freeze({propose,decide,summary});
});