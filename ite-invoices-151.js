/* I.T.E. 4.0.151 — TEST invoice/proforma/TD04 register; no fiscal issuance or real PDFs. */
(function(root){"use strict";
const C=typeof require==="function"?require("./ite-commercial-149.js"):root.ITE_Commercial149;
const cp=x=>JSON.parse(JSON.stringify(x)),s=x=>String(x??"").trim();
const cents=x=>{if(typeof x!=="number"||!Number.isFinite(x)||x<0||x>1e9)throw Error("IMPORTO_NON_VALIDO");return Math.round(x*100)};
const euro=x=>x/100;
function normalizeDocument(d,companyVat){
 if(!d||!s(d.id)||!s(d.number)||!s(d.issuerVat)||!s(d.documentDate))throw Error("DOCUMENTO_OBBLIGATORIO");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.documentDate)||!Number.isFinite(Date.parse(d.documentDate+"T00:00:00Z"))||new Date(d.documentDate+"T00:00:00Z").toISOString().slice(0,10)!==d.documentDate)throw Error("DATA_NON_VALIDA");
 const classification=C.classifyInvoice({...d,companyVat});
 const net=cents(d.net),vat=cents(d.vat),gross=cents(d.gross);
 if(Math.abs(net+vat-gross)>1)throw Error("TOTALI_INCOERENTI");
 if(classification.kind==="PROFORMA"&&s(d.documentType).toUpperCase()==="TD04")throw Error("TIPO_INCOERENTE");
 const status=s(d.recoveryStatus||"DA_RECUPERARE");
 if(classification.kind==="NOTA_CREDITO"&&!["DA_RECUPERARE","PARZIALMENTE_RECUPERATA","RECUPERATA"].includes(status))throw Error("STATO_RECUPERO_NON_VALIDO");
 if(d.clientId&&!s(d.siteId))throw Error("SEDE_OBBLIGATORIA");
 return {id:s(d.id),number:s(d.number),documentDate:d.documentDate,issuerVat:s(d.issuerVat).replace(/\s/g,""),clientId:s(d.clientId),siteId:s(d.siteId),appointmentId:s(d.appointmentId),documentType:s(d.documentType),isProforma:d.isProforma===true,net:euro(net),vat:euro(vat),gross:euro(gross),...classification,recoveryStatus:classification.kind==="NOTA_CREDITO"?status:null,receivedAt:s(d.receivedAt),note:s(d.note).slice(0,500)};
}
function saveDocument(state,doc,actor,revision,companyVat){
 if(!state||revision!==state.revision)throw Error("REVISIONE_OBSOLETA");
 if(!s(actor))throw Error("OPERATORE_OBBLIGATORIO");
 const d=normalizeDocument(doc,companyVat);
 if(d.clientId)C.validateLinks(state,d.clientId,d.siteId,d.appointmentId);
 if(!state.commercial||!Array.isArray(state.events))throw Error("ARCHIVIO_FATTURE_ASSENTE");
 const next=cp(state);if(!Array.isArray(next.commercial.invoices))next.commercial.invoices=[];const arr=next.commercial.invoices,idx=arr.findIndex(x=>x.id===d.id);
 if(arr.some(x=>x.id!==d.id&&x.number===d.number&&x.issuerVat===d.issuerVat&&x.documentDate===d.documentDate&&x.kind===d.kind))throw Error("DOCUMENTO_DUPLICATO");
 const previous=idx<0?null:arr[idx];
 if(previous&&(previous.kind!==d.kind||previous.direction!==d.direction))throw Error("CLASSIFICAZIONE_IMMUTABILE");
 if(previous?.kind==="NOTA_CREDITO"&&previous.recoveryStatus==="RECUPERATA"&&d.recoveryStatus!=="RECUPERATA")throw Error("RECUPERO_FINALIZZATO");
 if(previous?.kind==="NOTA_CREDITO"){d.recoveredAmount=previous.recoveredAmount||0;if(d.recoveredAmount>0&&d.recoveryStatus==="DA_RECUPERARE")throw Error("RECUPERO_INCOERENTE");}if(idx<0)arr.push(d);else arr[idx]=d;
 next.revision++;next.events.push({revision:next.revision,type:previous?"UPDATE_INVOICE":"CREATE_INVOICE",actor:s(actor),documentId:d.id,at:new Date().toISOString()});
 return next;
}
function registerRecovery(state,id,amount,actor,revision){
 if(!state||revision!==state.revision)throw Error("REVISIONE_OBSOLETA");
 if(!s(actor))throw Error("OPERATORE_OBBLIGATORIO");
 const next=cp(state),d=next.commercial?.invoices?.find(x=>x.id===id);
 if(!d||d.kind!=="NOTA_CREDITO")throw Error("NOTA_CREDITO_INESISTENTE");
 const value=cents(amount),total=cents(d.gross),old=cents(d.recoveredAmount||0);
 if(!value||old+value>total)throw Error("RECUPERO_NON_VALIDO");
 d.recoveredAmount=euro(old+value);d.recoveryStatus=old+value===total?"RECUPERATA":"PARZIALMENTE_RECUPERATA";
 next.revision++;next.events.push({revision:next.revision,type:"RECOVERY_CREDIT",actor:s(actor),documentId:id,amount:euro(value),at:new Date().toISOString()});
 return next;
}
function overview(state){
 const docs=state.commercial?.invoices||[];
 const groups={ACQUISTO:{count:0,net:0,vat:0,gross:0},VENDITA:{count:0,net:0,vat:0,gross:0},PROFORMA:{count:0,net:0,vat:0,gross:0},NOTA_CREDITO:{count:0,net:0,vat:0,gross:0}};
 for(const d of docs){const k=d.kind==="PROFORMA"?"PROFORMA":d.kind==="NOTA_CREDITO"?"NOTA_CREDITO":d.direction;const g=groups[k];g.count++;for(const f of ["net","vat","gross"])g[f]=euro(cents(g[f])+cents(d[f]));}
 return {schema:"ITE_INVOICES_151",revision:state.revision,groups};
}
const api=Object.freeze({normalizeDocument,saveDocument,registerRecovery,overview});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Invoices151=api;
})(typeof globalThis!=="undefined"?globalThis:this);
