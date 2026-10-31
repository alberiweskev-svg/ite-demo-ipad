/* I.T.E. 4.0 — read-only cross-module reconciliation of existing vault snapshots. */
(function(root){'use strict';
const bridge=typeof module!=='undefined'&&module.exports?require('./ite-core-operations-bridge.js'):root.ITECoreOperationsBridge;
const integrity=typeof module!=='undefined'&&module.exports?require('./ite-operations-integrity.js'):root.ITEOperationsIntegrity;
const list=x=>Array.isArray(x)?x:[],str=x=>String(x??'').trim();
function inspect(core,commerce={}){
 if(!core||!commerce||typeof commerce!=='object')throw Error('Archivi non validi');
 const mapped=bridge.bridge(core),checked=integrity.check(mapped.state),issues=[...mapped.issues.map(x=>({...x,domain:'hierarchy'})),...checked.issues.map(x=>({...x,domain:'operations'}))];
 const clients=new Set(mapped.state.clients.map(x=>x.id)),sites=new Map(mapped.state.sites.map(x=>[x.id,x.clientId]));
 const appointments=list(core.appuntamenti),visits=list(core.interventi),documents=list(commerce.documents),quotes=list(commerce.quotes||commerce.preventivi),extras=list(commerce.extras);
 const checkOwner=(item,domain)=>{
  const clientId=str(item.clientId||item.client_id||item.subjectId),siteId=str(item.siteId||item.immobile_id||item.propertyId);
  if(clientId&&!clients.has(clientId))issues.push({domain,id:str(item.id),code:'CLIENTE_ASSENTE'});
  if(siteId&&!sites.has(siteId))issues.push({domain,id:str(item.id),code:'SEDE_ASSENTE'});
  if(siteId&&clientId&&sites.has(siteId)&&sites.get(siteId)!==clientId)issues.push({domain,id:str(item.id),code:'CLIENTE_SEDE_DIVERSI'});
 };
 for(const x of appointments)checkOwner(x,'appointments');
 for(const x of visits)checkOwner(x,'interventions');
 for(const x of documents){
  checkOwner(x,'documents');
  if(x.type==='Proforma'&&x.status==='Pagato')issues.push({domain:'documents',id:str(x.id),code:'PROFORMA_PAGATA_DA_VERIFICARE'});
  if((x.type==='Nota di credito'||x.fiscal?.tipoDocumento==='TD04')&&x.status==='Da pagare')issues.push({domain:'documents',id:str(x.id),code:'TD04_NON_DA_PAGARE'});
 }
 for(const x of quotes)checkOwner(x,'quotes');
 for(const x of extras){
  checkOwner(x,'extras');
  for(const [i,line] of list(x.lines).entries())if(!['Fornitura','Posa'].includes(line.line_type)||!Number.isFinite(Number(line.qty))||Number(line.qty)<=0||!Number.isFinite(Number(line.price))||Number(line.price)<0)issues.push({domain:'extras',id:str(x.id),line:i,code:'RIGA_EXTRA_NON_VALIDA'});
 }
 // Audit supplier quote -> purchase invoice only on an explicit supplier reference.
 // Never infer a match from a similar product description alone.
 const supplierQuotes=list(commerce.supplierQuotes||commerce.supplier_quotes);
 const purchaseInvoices=list(commerce.purchaseInvoices||commerce.purchase_invoices);
 const supplierAudit=[];
 const quoteById=new Map();
 for(const q of supplierQuotes){
  const key=str(q.id);if(!key||quoteById.has(key)){issues.push({domain:'procurement',id:key,code:'PREVENTIVO_FORNITORE_ID_DUPLICATO_O_ASSENTE'});continue}quoteById.set(key,q);
 }
 for(const invoice of purchaseInvoices){
  const invoiceId=str(invoice.id),quoteId=str(invoice.supplierQuoteId||invoice.supplier_quote_id);
  if(!quoteId){supplierAudit.push({invoiceId,status:'NON_ASSOCIATA',differences:[]});continue}
  const quote=quoteById.get(quoteId);
  if(!quote){issues.push({domain:'procurement',id:invoiceId,code:'PREVENTIVO_FORNITORE_ASSENTE'});supplierAudit.push({invoiceId,quoteId,status:'PREVENTIVO_ASSENTE',differences:[]});continue}
  if(str(invoice.supplierId||invoice.supplier_id)!==str(quote.supplierId||quote.supplier_id)){
   issues.push({domain:'procurement',id:invoiceId,code:'FORNITORE_DIVERSO'});supplierAudit.push({invoiceId,quoteId,status:'FORNITORE_DIVERSO',differences:[]});continue
  }
  const qLines=list(quote.lines),iLines=list(invoice.lines),qByCode=new Map(),differences=[];
  for(const line of qLines){const code=str(line.code||line.sku);if(!code||qByCode.has(code)){issues.push({domain:'procurement',id:quoteId,code:'CODICE_PREVENTIVO_MANCANTE_O_DUPLICATO'});continue}qByCode.set(code,line)}
  const used=new Set();
  for(const line of iLines){
   const code=str(line.code||line.sku);
   if(!code||used.has(code)){issues.push({domain:'procurement',id:invoiceId,code:'CODICE_FATTURA_MANCANTE_O_DUPLICATO'});continue}used.add(code);
   const original=qByCode.get(code);
   if(!original){differences.push({code,kind:'NUOVO_ARTICOLO'});continue}
   const oldPrice=Number(original.unitPrice),newPrice=Number(line.unitPrice);
   if(!Number.isFinite(oldPrice)||!Number.isFinite(newPrice)||oldPrice<0||newPrice<0){
    issues.push({domain:'procurement',id:invoiceId,code:'PREZZO_NON_VALIDO'});continue
   }
   const oldCents=Math.round(oldPrice*100),newCents=Math.round(newPrice*100);
   if(oldCents!==newCents)differences.push({code,kind:newCents>oldCents?'AUMENTO':'RIDUZIONE',oldPrice:oldCents/100,newPrice:newCents/100,delta:(newCents-oldCents)/100,percent:oldCents?Math.round((newCents-oldCents)/oldCents*10000)/100:null});
  }
  for(const code of qByCode.keys())if(!used.has(code))differences.push({code,kind:'NON_FATTURATO'});
  if(differences.length)issues.push({domain:'procurement',id:invoiceId,code:'DIFFERENZE_PREVENTIVO_FATTURA',count:differences.length});
  supplierAudit.push({invoiceId,quoteId,status:differences.length?'DIFFERENZE':'CONFORME',differences});
 }
 return {summary:{clients:mapped.state.clients.length,sites:mapped.state.sites.length,systems:mapped.state.systems.length,devices:mapped.state.devices.length,appointments:appointments.length,interventions:visits.length,documents:documents.length,quotes:quotes.length,extras:extras.length,supplierQuotes:supplierQuotes.length,purchaseInvoices:purchaseInvoices.length},issues,supplierAudit,readOnly:true,persisted:false,releaseAllowed:false,importedAppointments:false,importedInterventions:false};
}
const api=Object.freeze({inspect});root.ITECoreReconciliation=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
