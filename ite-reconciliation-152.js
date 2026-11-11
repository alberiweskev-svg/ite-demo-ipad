/* I.T.E. 4.0.152 — TEST-only commercial reconciliation. No fiscal issuance, no real documents. */
(function(root){"use strict";
const cp=x=>JSON.parse(JSON.stringify(x)),s=x=>String(x??"").trim();
const cent=x=>{if(typeof x!=="number"||!Number.isFinite(x)||x<0||x>1e9)throw Error("IMPORTO_NON_VALIDO");return Math.round(x*100)};
const euro=x=>x/100;
function registry(state){
 if(state?.schema!=="ITE_OPERATIONS_123"||!Number.isSafeInteger(state.revision)||!Array.isArray(state.events)||!state.commercial||!Array.isArray(state.commercial.estimates)||!Array.isArray(state.commercial.extras)||!Array.isArray(state.commercial.invoices))throw Error("ARCHIVIO_NON_VALIDO");
 return state.commercial;
}
function checkLink(state,invoiceId,estimateId){
 const c=registry(state),invoice=c.invoices.find(x=>x.id===invoiceId),estimate=c.estimates.find(x=>x.id===estimateId);
 if(!invoice||!estimate)throw Error("DOCUMENTO_NON_TROVATO");
 if(invoice.kind==="PROFORMA")throw Error("PROFORMA_NON_CONTABILIZZABILE");
 if(invoice.direction!=="VENDITA")throw Error("FATTURA_NON_DI_VENDITA");
 if(estimate.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");
 if(!invoice.clientId||invoice.clientId!==estimate.clientId||invoice.siteId!==estimate.siteId)throw Error("COLLEGAMENTO_NON_COHERENTE");
 if(invoice.appointmentId&&estimate.appointmentId&&invoice.appointmentId!==estimate.appointmentId)throw Error("APPUNTAMENTO_NON_COHERENTE");
 return {invoice,estimate};
}
function allocations(state){return registry(state).allocations||[];}
function allocate(state,input,actor,revision){
 if(revision!==state?.revision)throw Error("REVISIONE_OBSOLETA");
 if(!s(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(!s(input?.id)||!s(input?.invoiceId)||!s(input?.estimateId))throw Error("DATI_OBBLIGATORI");
 const {invoice,estimate}=checkLink(state,input.invoiceId,input.estimateId);
 const amount=cent(input.amount);if(amount===0)throw Error("IMPORTO_NON_VALIDO");
 const arr=allocations(state);
 if(arr.some(x=>x.id===input.id))throw Error("ALLOCAZIONE_DUPLICATA");
 const invUsed=arr.filter(x=>x.invoiceId===invoice.id).reduce((n,x)=>n+cent(x.amount),0);
 const quoteUsed=arr.filter(x=>x.estimateId===estimate.id).reduce((n,x)=>n+cent(x.amount)*(x.kind==="NOTA_CREDITO"?-1:1),0);
 const sign=invoice.kind==="NOTA_CREDITO"?-1:1;
 if(invUsed+amount>cent(invoice.gross))throw Error("FATTURA_SUPERATA");
 if(sign===1&&quoteUsed+amount>cent(estimate.totals.gross))throw Error("PREVENTIVO_SUPERATO");
 if(sign===-1&&quoteUsed-amount<0)throw Error("CREDITO_SUPERA_FATTURATO");
 const next=cp(state);if(!Array.isArray(next.commercial.allocations))next.commercial.allocations=[];
 next.commercial.allocations.push({id:s(input.id),invoiceId:invoice.id,estimateId:estimate.id,kind:invoice.kind,amount:euro(amount),createdAt:new Date().toISOString(),actor:s(actor)});
 next.revision++;next.events.push({revision:next.revision,type:"ALLOCATE_INVOICE_ESTIMATE",actor:s(actor),allocationId:s(input.id),at:new Date().toISOString()});return next;
}
function reconcile(state){
 const c=registry(state),arr=allocations(state),errors=[],ids=new Set(),byInvoice=new Map(),byEstimate=new Map();
 for(const a of arr){
  if(ids.has(a.id))errors.push({id:a.id,code:"ALLOCAZIONE_DUPLICATA"});ids.add(a.id);
  try{
   const {invoice,estimate}=checkLink(state,a.invoiceId,a.estimateId);
   if(a.kind!==invoice.kind)throw Error("TIPO_INCOERENTE");
   const n=cent(a.amount);
   if(!n)throw Error("IMPORTO_NON_VALIDO");
   byInvoice.set(invoice.id,(byInvoice.get(invoice.id)||0)+n);
   byEstimate.set(estimate.id,(byEstimate.get(estimate.id)||0)+n*(invoice.kind==="NOTA_CREDITO"?-1:1));
  }catch(e){errors.push({id:a.id,code:e.message});}
 }
 for(const d of c.invoices)if((byInvoice.get(d.id)||0)>cent(d.gross))errors.push({id:d.id,code:"FATTURA_SUPERATA"});
 for(const e of c.estimates){const used=byEstimate.get(e.id)||0;if(used<0||used>cent(e.totals.gross))errors.push({id:e.id,code:"PREVENTIVO_SUPERATO"});}
 return {schema:"ITE_COMMERCIAL_RECONCILIATION_152",revision:state.revision,allocationCount:arr.length,errors,estimates:c.estimates.map(e=>({id:e.id,status:e.status,total:e.totals.gross,netInvoiced:euro(byEstimate.get(e.id)||0),remaining:euro(cent(e.totals.gross)-(byEstimate.get(e.id)||0))})),invoices:c.invoices.map(d=>({id:d.id,kind:d.kind,direction:d.direction,total:d.gross,allocated:euro(byInvoice.get(d.id)||0),unallocated:euro(cent(d.gross)-(byInvoice.get(d.id)||0))}))};
}
function extraCoverage(state){
 const c=registry(state),errors=[],rows=[];
 for(const e of c.extras){
  const approved=e.approvedLineIds||[];
  const mapped=c.estimates.flatMap(q=>(q.lines||[]).filter(l=>l.id.startsWith(e.id+":")).map(l=>({estimateId:q.id,lineId:l.id.slice(e.id.length+1)})));
  const counts=new Map();mapped.forEach(m=>counts.set(m.lineId,(counts.get(m.lineId)||0)+1));
  for(const m of mapped)if(!approved.includes(m.lineId))errors.push({id:e.id,code:"RIGA_NON_APPROVATA_NEL_PREVENTIVO",lineId:m.lineId});
  for(const [id,n] of counts)if(n>1)errors.push({id:e.id,code:"RIGA_DUPLICATA_NEI_PREVENTIVI",lineId:id});
  rows.push({id:e.id,approved:approved.length,quoted:approved.filter(id=>counts.has(id)).length,unquoted:approved.filter(id=>!counts.has(id))});
 }
 return {rows,errors};
}
const api=Object.freeze({allocate,reconcile,extraCoverage,checkLink});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Reconciliation152=api;
})(typeof globalThis!=="undefined"?globalThis:this);
