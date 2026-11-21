/* I.T.E. 4.0.230 — invoice and quote reconciliation. No production accounting or fiscal transmission. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinance230=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const kinds=["ACQUISTO","VENDITA","PROFORMA","TD04"];
const money=n=>Number.isSafeInteger(n)&&n>=0;
function audit(s){
 const errors=[],warning=[],byId=new Map(s.invoices.map(i=>[i.id,i]));
 const note=(arr,code,id)=>arr.push({code,id});
 const invoiceKeys=new Set();
 for(const i of s.invoices){
  if(!kinds.includes(i.kind)||!money(i.cents))note(errors,"FATTURA_NON_VALIDA",i.id);
  const key=i.kind+"|"+String(i.number||"").trim().toLocaleLowerCase("it");
  if(invoiceKeys.has(key))note(errors,"NUMERO_DUPLICATO_TIPO",i.id);invoiceKeys.add(key);
  if(i.quoteId){const q=s.quotes.find(q=>q.id===i.quoteId);if(!q||q.clientId!==i.clientId)note(errors,"PREVENTIVO_CLIENTE_INCOERENTE",i.id);else if(i.kind==="VENDITA"&&q.status!=="ACCETTATO")note(warning,"PREVENTIVO_NON_ACCETTATO",i.id);}
  if(i.kind==="TD04"){
   const src=byId.get(i.originalInvoiceId);
   if(!src||src.kind!=="VENDITA"||src.clientId!==i.clientId||src.id===i.id)note(errors,"TD04_ORIGINE_NON_VALIDA",i.id);
  }else if(i.originalInvoiceId)note(errors,"ORIGINE_SU_DOCUMENTO_NON_TD04",i.id);
 }
 for(const src of s.invoices.filter(i=>i.kind==="VENDITA")){
  const credits=s.invoices.filter(i=>i.kind==="TD04"&&i.originalInvoiceId===src.id).reduce((n,i)=>n+i.cents,0);
  if(!Number.isSafeInteger(credits)||credits>src.cents)note(errors,"CREDITO_ECCESSIVO",src.id);
 }
 return {errors,warning,ok:errors.length===0};
}
function ledger(s){
 const credits=new Map();
 for(const i of s.invoices.filter(i=>i.kind==="TD04"))credits.set(i.originalInvoiceId,(credits.get(i.originalInvoiceId)||0)+i.cents);
 return s.invoices.map(i=>({id:i.id,number:i.number,kind:i.kind,clientId:i.clientId,grossCents:i.cents,creditCents:i.kind==="VENDITA"?(credits.get(i.id)||0):0,netCents:i.kind==="VENDITA"?i.cents-(credits.get(i.id)||0):i.cents,quoteId:i.quoteId||null,originalInvoiceId:i.originalInvoiceId||null}));
}
function summary(s){
 const rows=ledger(s),sum=(kind,key)=>rows.filter(i=>i.kind===kind).reduce((n,i)=>n+i[key],0);
 return {salesGrossCents:sum("VENDITA","grossCents"),salesNetCents:sum("VENDITA","netCents"),purchaseCents:sum("ACQUISTO","grossCents"),proformaCents:sum("PROFORMA","grossCents"),creditCents:sum("TD04","grossCents"),audit:audit(s)};
}
function addInvoice(store,invoice){
 if(!invoice||!kinds.includes(invoice.kind)||!money(invoice.cents)||!invoice.number||!invoice.number.trim()||invoice.kind==="TD04")throw Error("FATTURA_INPUT_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  if(s.invoices.some(i=>i.id===invoice.id))throw Error("ID_DUPLICATO");
  if(!s.clients.some(c=>c.id===invoice.clientId))throw Error("CLIENTE_ASSENTE");
  if(invoice.quoteId){const q=s.quotes.find(q=>q.id===invoice.quoteId);if(!q||q.clientId!==invoice.clientId)throw Error("PREVENTIVO_CLIENTE_DIVERSO");}
  s.invoices.push({id:invoice.id,clientId:invoice.clientId,kind:invoice.kind,number:invoice.number.trim(),cents:invoice.cents,...(invoice.quoteId?{quoteId:invoice.quoteId}:{})});
  const result=audit(s);if(!result.ok)throw Error(result.errors[0].code);
 });
}
function addCredit(store,sourceId,id,number,cents){
 if(!money(cents)||cents===0||!number||!number.trim())throw Error("TD04_INPUT_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const src=s.invoices.find(i=>i.id===sourceId);
  if(!src||src.kind!=="VENDITA")throw Error("TD04_ORIGINE_NON_VALIDA");
  if(s.invoices.some(i=>i.id===id))throw Error("ID_DUPLICATO");
  s.invoices.push({id,clientId:src.clientId,kind:"TD04",number:number.trim(),cents,originalInvoiceId:sourceId});
  const result=audit(s);if(!result.ok)throw Error(result.errors[0].code);
 });
}
return Object.freeze({audit,ledger,summary,addInvoice,addCredit});
});
