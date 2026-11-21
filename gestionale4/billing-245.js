/* I.T.E. 4.0.245 — local TEST commercial billing: quote -> approved extras -> sale -> TD04.
   Amounts are gross demo cents, not tax computations or fiscal documents. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEBilling245=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const safe=x=>Number.isSafeInteger(x)&&x>=0;
function plan(state,quoteId){
 const quote=state.quotes.find(q=>q.id===quoteId);
 if(!quote)throw Error("PREVENTIVO_ASSENTE");
 const lines=quote.lines||[];
 let total=0,supply=0,labor=0;
 for(const l of lines){
  const amount=l.cents*l.qty;
  if(!safe(amount))throw Error("IMPORTO_PREVENTIVO_NON_VALIDO");
  total+=amount;
  if(["FORNITURA","EXTRA_FORNITURA"].includes(l.kind))supply+=amount;
  if(["POSA","EXTRA_POSA"].includes(l.kind))labor+=amount;
 }
 if(!safe(total))throw Error("IMPORTO_PREVENTIVO_NON_VALIDO");
 const sales=state.invoices.filter(i=>i.kind==="VENDITA"&&i.quoteId===quoteId);
 const ids=new Set(sales.map(i=>i.id));
 const credits=state.invoices.filter(i=>i.kind==="TD04"&&ids.has(i.originalInvoiceId));
 const invoiced=sales.reduce((n,i)=>n+i.cents,0),credited=credits.reduce((n,i)=>n+i.cents,0);
 if(!safe(invoiced)||!safe(credited)||credited>invoiced)throw Error("SALDO_DOCUMENTI_NON_VALIDO");
 const remaining=total-invoiced+credited;
 return {quoteId,clientId:quote.clientId,status:quote.status,totalCents:total,supplyCents:supply,laborCents:labor,invoicedCents:invoiced,creditedCents:credited,remainingCents:remaining,unapprovedExtras:(quote.extraRequests||[]).filter(e=>e.status==="PROPOSTO").length,lines:clone(lines),salesCount:sales.length};
}
function issue(store,{quoteId,id,number,cents}){
 if(typeof id!=="string"||!id.trim()||id.length>64||typeof number!=="string"||!number.trim()||number.length>180||!safe(cents)||cents===0)throw Error("FATTURA_INPUT_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const p=plan(s,quoteId);
  if(p.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");
  if(p.unapprovedExtras)throw Error("EXTRA_IN_ATTESA");
  if(p.remainingCents<=0||cents>p.remainingCents)throw Error("FATTURA_SUPERA_RESIDUO");
  if(s.invoices.some(i=>i.id===id))throw Error("ID_DUPLICATO");
  if(s.invoices.some(i=>i.kind==="VENDITA"&&i.number.trim().toLowerCase()===number.trim().toLowerCase()))throw Error("NUMERO_DUPLICATO_TIPO");
  s.invoices.push({id,kind:"VENDITA",clientId:p.clientId,quoteId,number:number.trim(),cents});
 });
}
function credit(store,{invoiceId,id,number,cents}){
 if(typeof id!=="string"||!id.trim()||id.length>64||typeof number!=="string"||!number.trim()||number.length>180||!safe(cents)||cents===0)throw Error("TD04_INPUT_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const original=s.invoices.find(i=>i.id===invoiceId&&i.kind==="VENDITA");
  if(!original)throw Error("FATTURA_ORIGINE_ASSENTE");
  const credited=s.invoices.filter(i=>i.kind==="TD04"&&i.originalInvoiceId===invoiceId).reduce((n,i)=>n+i.cents,0);
  if(!safe(credited)||cents>original.cents-credited)throw Error("CREDITO_ECCESSIVO");
  if(s.invoices.some(i=>i.id===id))throw Error("ID_DUPLICATO");
  if(s.invoices.some(i=>i.kind==="TD04"&&i.number.trim().toLowerCase()===number.trim().toLowerCase()))throw Error("NUMERO_DUPLICATO_TIPO");
  s.invoices.push({id,kind:"TD04",clientId:original.clientId,number:number.trim(),cents,originalInvoiceId:invoiceId});
 });
}
function overview(s){return s.quotes.map(q=>plan(s,q.id));}
return Object.freeze({plan,issue,credit,overview});
});
