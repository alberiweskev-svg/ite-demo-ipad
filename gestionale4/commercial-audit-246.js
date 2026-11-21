/* I.T.E. 4.0.246 — read-only commercial reconciliation across quote, extras, invoices and TD04. Synthetic/local only. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITECommercialAudit246=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const integer=x=>Number.isSafeInteger(x)&&x>=0;
function inspect(state){
 const issues=[],rows=[],seen=new Set(),byId=new Map(state.invoices.map(x=>[x.id,x]));
 const add=(severity,code,id)=>issues.push({severity,code,id});
 for(const inv of state.invoices){
  const key=String(inv.kind)+"|"+String(inv.number||"").trim().toLocaleLowerCase("it");
  if(seen.has(key))add("BLOCCANTE","NUMERO_DUPLICATO_TIPO",inv.id);seen.add(key);
  if(!integer(inv.cents))add("BLOCCANTE","IMPORTO_NON_VALIDO",inv.id);
  if(inv.kind==="TD04"){
   const original=byId.get(inv.originalInvoiceId);
   if(!original||original.kind!=="VENDITA"||original.clientId!==inv.clientId)add("BLOCCANTE","TD04_ORIGINE_NON_VALIDA",inv.id);
  }
 }
 for(const q of state.quotes){
  let supply=0,labor=0,other=0;
  for(const line of q.lines){
   const amount=line.cents*line.qty;
   if(!integer(amount)){add("BLOCCANTE","RIGA_NON_VALIDA",q.id);continue}
   if(["FORNITURA","EXTRA_FORNITURA"].includes(line.kind))supply+=amount;
   else if(["POSA","EXTRA_POSA"].includes(line.kind))labor+=amount;
   else other+=amount;
  }
  const expected=new Map();
  for(const extra of q.extraRequests||[]){
   if(extra.status==="PROPOSTO")add("REVISIONE","EXTRA_IN_ATTESA",q.id);
   if(!Number.isSafeInteger(extra.approvedQty)||extra.approvedQty<0||extra.approvedQty>extra.qty){add("BLOCCANTE","QUANTITA_EXTRA_NON_VALIDA",q.id);continue}
   for(const [suffix,kind,cents] of [["-F","EXTRA_FORNITURA",extra.supplyCents],["-P","EXTRA_POSA",extra.laborCents]]){
    if(!cents||!extra.approvedQty)continue;
    expected.set(extra.id+suffix,{kind,cents,qty:extra.approvedQty});
   }
  }
  for(const [id,e] of expected){
   const l=q.lines.find(x=>x.id===id);
   if(!l||l.kind!==e.kind||l.cents!==e.cents||l.qty!==e.qty)add("BLOCCANTE","EXTRA_RIGA_INCOERENTE",q.id);
  }
  for(const l of q.lines.filter(x=>x.kind==="EXTRA_FORNITURA"||x.kind==="EXTRA_POSA")){
   if(!expected.has(l.id))add("BLOCCANTE","EXTRA_NON_APPROVATO_IN_PREVENTIVO",q.id);
  }
  const sales=state.invoices.filter(x=>x.kind==="VENDITA"&&x.quoteId===q.id);
  const salesIds=new Set(sales.map(x=>x.id));
  const credits=state.invoices.filter(x=>x.kind==="TD04"&&salesIds.has(x.originalInvoiceId));
  const invoiced=sales.reduce((n,x)=>n+x.cents,0),credited=credits.reduce((n,x)=>n+x.cents,0);
  const total=supply+labor+other,remaining=total-invoiced+credited;
  if(![total,invoiced,credited,remaining].every(integer))add("BLOCCANTE","SALDO_PREVENTIVO_INCOERENTE",q.id);
  if(q.status!=="ACCETTATO"&&sales.length)add("REVISIONE","FATTURE_SU_PREVENTIVO_NON_ACCETTATO",q.id);
  rows.push({quoteId:q.id,clientId:q.clientId,status:q.status,supplyCents:supply,laborCents:labor,otherCents:other,totalCents:total,invoicedCents:invoiced,creditedCents:credited,remainingCents:remaining});
 }
 for(const i of state.invoices.filter(x=>x.kind==="VENDITA"&&x.quoteId&&!state.quotes.some(q=>q.id===x.quoteId)))add("BLOCCANTE","PREVENTIVO_FATTURA_ASSENTE",i.id);
 for(const i of state.invoices.filter(x=>x.kind==="VENDITA")){
  const total=state.invoices.filter(x=>x.kind==="TD04"&&x.originalInvoiceId===i.id).reduce((n,x)=>n+x.cents,0);
  if(!integer(total)||total>i.cents)add("BLOCCANTE","TD04_SUPERA_FATTURA",i.id);
 }
 return {rows,issues,blocking:issues.filter(x=>x.severity==="BLOCCANTE").length,review:issues.filter(x=>x.severity==="REVISIONE").length,releaseAllowed:false};
}
return Object.freeze({inspect});
});
