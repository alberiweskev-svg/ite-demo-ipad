/* I.T.E. 4.0.149 — commercial domain engine. TEST-only, pure functions. */
(function(root){"use strict";
const cp=x=>JSON.parse(JSON.stringify(x)),str=x=>String(x??"").trim();
const cents=x=>{if(typeof x!=="number"||!Number.isFinite(x)||x<0)throw Error("IMPORTO_NON_VALIDO");return Math.round((x+Number.EPSILON)*100)};
const money=x=>Math.round(x)/100;
const allowed=["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","ALTRO"];
function normalizeLines(lines){
 if(!Array.isArray(lines)||!lines.length||lines.length>200)throw Error("RIGHE_OBBLIGATORIE");
 const ids=new Set();
 return lines.map((x,i)=>{
  const id=str(x.id||"L"+(i+1)),kind=str(x.kind).toUpperCase(),description=str(x.description);
  if(ids.has(id)||!allowed.includes(kind)||!description||description.length>500)throw Error("RIGA_NON_VALIDA");ids.add(id);
  if(typeof x.quantity!=="number"||!Number.isFinite(x.quantity)||x.quantity<=0||x.quantity>100000)throw Error("QUANTITA_NON_VALIDA");
  if(![0,4,5,10,22].includes(x.vatRate))throw Error("IVA_NON_VALIDA");
  const unitCents=cents(x.unitPrice),netCents=Math.round(unitCents*x.quantity);
  if(!Number.isSafeInteger(netCents))throw Error("IMPORTO_NON_VALIDO");
  const vatCents=Math.round(netCents*x.vatRate/100);
  return {id,kind,description,quantity:x.quantity,unitPrice:money(unitCents),vatRate:x.vatRate,net:money(netCents),vat:money(vatCents),gross:money(netCents+vatCents)};
 });
}
function totals(lines){const rows=normalizeLines(lines);const net=Math.round(rows.reduce((n,r)=>n+Math.round(r.net*100),0)),vat=Math.round(rows.reduce((n,r)=>n+Math.round(r.vat*100),0));return {rows,net:money(net),vat:money(vat),gross:money(net+vat),byKind:Object.fromEntries(allowed.map(k=>[k,money(rows.filter(r=>r.kind===k).reduce((n,r)=>n+Math.round(r.net*100),0))]))};}
function classifyInvoice(x){
 const type=str(x.documentType).toUpperCase(),number=str(x.number).toUpperCase(),issuer=str(x.issuerVat).replace(/\s/g,""),own=str(x.companyVat).replace(/\s/g,"");
 if(!own||!issuer)throw Error("PARTITA_IVA_OBBLIGATORIA");
 const credit=type==="TD04",proforma=x.isProforma===true||/^PR(?:[-\/ ]|\d)/.test(number)||type==="PROFORMA";
 const direction=issuer===own?"VENDITA":"ACQUISTO";
 return {direction,kind:credit?"NOTA_CREDITO":proforma?"PROFORMA":"FATTURA",paymentStatus:credit?"DA_RECUPERARE":proforma?"NON_FISCALE":"DA_VERIFICARE",signedAccountingMultiplier:credit?-1:1};
}
function validateLinks(state,clientId,siteId,appointmentId){
 const c=state?.field?.catalog;if(state?.schema!=="ITE_OPERATIONS_123"||!c)throw Error("STATO_NON_VALIDO");
 if(!c.clients?.some(x=>x.id===clientId))throw Error("CLIENTE_INESISTENTE");
 if(!c.sites?.some(x=>x.id===siteId&&x.clientId===clientId))throw Error("SEDE_NON_COHERENTE");
 if(appointmentId){const a=c.appointments?.find(x=>x.id===appointmentId);if(!a||a.clientId!==clientId||a.siteId!==siteId)throw Error("APPUNTAMENTO_NON_COHERENTE");}
}
function saveEstimate(state,estimate,actor,expectedRevision){
 if(expectedRevision!==state.revision)throw Error("REVISIONE_OBSOLETA");if(!str(actor))throw Error("OPERATORE_OBBLIGATORIO");
 validateLinks(state,estimate.clientId,estimate.siteId,estimate.appointmentId);
 const t=totals(estimate.lines),status=str(estimate.status||"DA_ACCETTARE");
 if(!["DA_ACCETTARE","ACCETTATO","NON_ACCETTATO"].includes(status))throw Error("STATO_NON_VALIDO");
 const next=cp(state),arr=next.commercial?.estimates;if(!Array.isArray(arr))throw Error("ARCHIVIO_NON_VALIDO");
 const id=str(estimate.id);if(!id)throw Error("ID_OBBLIGATORIO");
 const old=arr.find(x=>x.id===id);
 const row={id,clientId:estimate.clientId,siteId:estimate.siteId,appointmentId:estimate.appointmentId||"",status,lines:t.rows.map(({id,kind,description,quantity,unitPrice,vatRate})=>({id,kind,description,quantity,unitPrice,vatRate})),totals:{net:t.net,vat:t.vat,gross:t.gross},updatedAt:new Date().toISOString()};
 if(old)arr.splice(arr.indexOf(old),1,row);else arr.push(row);
 next.revision++;next.events.push({revision:next.revision,type:old?"UPDATE_ESTIMATE":"CREATE_ESTIMATE",actor:str(actor),at:row.updatedAt});return next;
}
function audit(state){
 if(state?.schema!=="ITE_OPERATIONS_123"||!state.commercial)throw Error("STATO_NON_VALIDO");
 const errors=[],seen=new Set();
 for(const e of state.commercial.estimates||[]){
  if(seen.has(e.id))errors.push({id:e.id,code:"PREVENTIVO_DUPLICATO"});seen.add(e.id);
  try{validateLinks(state,e.clientId,e.siteId,e.appointmentId);const t=totals(e.lines);if(e.totals&&Math.abs(e.totals.gross-t.gross)>0.009)errors.push({id:e.id,code:"TOTALE_INCOERENTE"});}
  catch(err){errors.push({id:e.id,code:err.message});}
 }
 for(const e of state.commercial.extras||[])try{validateLinks(state,e.clientId,e.siteId,e.appointmentId);}catch(err){errors.push({id:e.id,code:err.message});}
 return {schema:"ITE_COMMERCIAL_AUDIT_149",revision:state.revision,estimates:(state.commercial.estimates||[]).length,extras:(state.commercial.extras||[]).length,errors};
}
const api=Object.freeze({normalizeLines,totals,classifyInvoice,validateLinks,saveEstimate,audit});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Commercial149=api;
})(typeof globalThis!=="undefined"?globalThis:this);
