/* I.T.E. 4.0.246 — read-only commercial reconciliation across quote, extras, invoices and TD04. Synthetic/local only. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITECommercialAudit246=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const validLine=x=>x&&integer(x.cents)&&Number.isSafeInteger(x.qty)&&x.qty>0&&integer(x.cents*x.qty);
function inspect(state){
 const issues=[],rows=[],seen=new Set(),invoiceIds=new Set(),quoteIds=new Set(),byId=new Map(state.invoices.map(x=>[x.id,x]));
 for(const q of state.quotes){if(quoteIds.has(q.id))issues.push({severity:"BLOCCANTE",code:"PREVENTIVO_ID_DUPLICATO",id:q.id});quoteIds.add(q.id);}
 const add=(severity,code,id)=>issues.push({severity,code,id});
 for(const inv of state.invoices){
  if(invoiceIds.has(inv.id))add("BLOCCANTE","DOCUMENTO_ID_DUPLICATO",inv.id);invoiceIds.add(inv.id);
  if(!String(inv.number||"").trim())add("BLOCCANTE","NUMERO_DOCUMENTO_ASSENTE",inv.id);
  if(!state.clients.some(c=>c.id===inv.clientId))add("BLOCCANTE","CLIENTE_DOCUMENTO_ASSENTE",inv.id);
  if(inv.kind==="VENDITA"&&inv.quoteId){const q=state.quotes.find(q=>q.id===inv.quoteId);if(q&&q.clientId!==inv.clientId)add("BLOCCANTE","FATTURA_ALTRO_CLIENTE",inv.id);}
  const key=String(inv.kind)+"|"+String(inv.number||"").trim().toLocaleLowerCase("it");
  if(seen.has(key))add("BLOCCANTE","NUMERO_DUPLICATO_TIPO",inv.id);seen.add(key);
  if(!integer(inv.cents))add("BLOCCANTE","IMPORTO_NON_VALIDO",inv.id);
  if(inv.kind==="VENDITA"&&!inv.quoteId)add("REVISIONE","FATTURA_SENZA_PREVENTIVO",inv.id);
  if(inv.kind==="PROFORMA"&&inv.originalInvoiceId)add("REVISIONE","PROFORMA_CON_ORIGINE_FISCALE",inv.id);
  if(inv.kind==="TD04"){
   const original=byId.get(inv.originalInvoiceId);
   if(!original||original.kind!=="VENDITA"||original.clientId!==inv.clientId)add("BLOCCANTE","TD04_ORIGINE_NON_VALIDA",inv.id);
   if(inv.quoteId&&original&&inv.quoteId!==original.quoteId)add("BLOCCANTE","TD04_PREVENTIVO_DIVERSO",inv.id);
  }
 }
 for(const q of state.quotes){
  if(!state.clients.some(c=>c.id===q.clientId))add("BLOCCANTE","CLIENTE_PREVENTIVO_ASSENTE",q.id);
  let supply=0,labor=0,other=0;
  const lineIds=new Set();
  for(const line of q.lines){
   if(lineIds.has(line.id))add("BLOCCANTE","RIGA_ID_DUPLICATO",q.id);
   lineIds.add(line.id);
   if(!validLine(line)){add("BLOCCANTE","RIGA_NON_VALIDA",q.id);continue}
   const amount=line.cents*line.qty;
   if(!integer(amount)){add("BLOCCANTE","RIGA_NON_VALIDA",q.id);continue}
   if(["FORNITURA","EXTRA_FORNITURA"].includes(line.kind))supply+=amount;
   else if(["POSA","EXTRA_POSA"].includes(line.kind))labor+=amount;
   else other+=amount;
  }
  const expected=new Map();
  const extraIds=new Set();
  for(const extra of q.extraRequests||[]){
   if(extraIds.has(extra.id))add("BLOCCANTE","EXTRA_ID_DUPLICATO",q.id);
   extraIds.add(extra.id);
   if(!integer(extra.supplyCents)||!integer(extra.laborCents)||!Number.isSafeInteger(extra.qty)||extra.qty<1){add("BLOCCANTE","EXTRA_IMPORTO_QUANTITA_NON_VALIDI",q.id);continue}
   if(!["PROPOSTO","APPROVATO","PARZIALE","RIFIUTATO"].includes(extra.status)||extra.status==="PROPOSTO"&&extra.approvedQty!==0||extra.status==="RIFIUTATO"&&extra.approvedQty!==0||extra.status==="APPROVATO"&&extra.approvedQty!==extra.qty||extra.status==="PARZIALE"&&!(extra.approvedQty>0&&extra.approvedQty<extra.qty))add("BLOCCANTE","EXTRA_STATO_QUANTITA_INCOERENTE",q.id);
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
  if(![total,invoiced,credited,remaining].every(integer)||remaining<0)add("BLOCCANTE","SALDO_PREVENTIVO_INCOERENTE",q.id);
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
function exportCsv(report){
 if(!report||!Array.isArray(report.issues)||!Array.isArray(report.rows))throw Error("REPORT_NON_VALIDO");
 const cell=x=>{let s=String(x??"").replace(/[\r\n\t]/g," ");if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const records=[["TIPO","GRAVITA","CODICE","ID","CLIENTE","STATO","FORNITURA_CENT","POSA_CENT","TOTALE_CENT","FATTURATO_CENT","TD04_CENT","RESIDUO_CENT"]];
 for(const x of report.issues)records.push(["ANOMALIA",x.severity,x.code,x.id,"","","","","","","",""]);
 for(const x of report.rows)records.push(["PREVENTIVO","","",x.quoteId,x.clientId,x.status,x.supplyCents,x.laborCents,x.totalCents,x.invoicedCents,x.creditedCents,x.remainingCents]);
 return "\uFEFF"+records.map(r=>r.map(cell).join(";")).join("\r\n")+"\r\n";
}
return Object.freeze({inspect,exportCsv});
});
