/* I.T.E. 4.0 — preventivi, extra e documenti contabili: dati locali, importi in centesimi. */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const TYPES=['FORNITURA','POSA','SMONTAGGIO','SMALTIMENTO'],CATS=['idrico','riscaldamento','elettrico','condizionamento','opere murarie','altro'];
const MONEY=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e11;
const id=x=>typeof x==='string'&&x.trim().length>0&&x.length<=100;
const round=(a,b)=>Math.round(a*b/100);
const clone=x=>JSON.parse(JSON.stringify(x));
function empty(){return {version:1,quotes:[],invoices:[]}}
function validate(input,master){
 if(!input||input.version!==1||!Array.isArray(input.quotes)||!Array.isArray(input.invoices))throw Error('ARCHIVIO_COMMERCIALE_NON_VALIDO');
 if(input.quotes.length>10000||input.invoices.length>10000)throw Error('LIMITE_ARCHIVIO');
 const s=master&&H.validate(master),seen=new Set();
 for(const q of input.quotes){
  if(!id(q.id)||seen.has('q:'+q.id)||!id(q.clientId)||!['DA_ACCETTARE','ACCETTATO','NON_ACCETTATO'].includes(q.status)||!Array.isArray(q.lines))throw Error('PREVENTIVO_NON_VALIDO');
  seen.add('q:'+q.id);
  if(s&&!s.clients.some(c=>c.id===q.clientId))throw Error('CLIENTE_NON_TROVATO');
  if(q.siteId&&s&&!s.sites.some(t=>t.id===q.siteId&&t.clientId===q.clientId))throw Error('SEDE_INCOERENTE');
  for(const l of q.lines)line(l);
 }
 for(const f of input.invoices){
  if(!id(f.id)||seen.has('f:'+f.id)||!['ACQUISTO','VENDITA'].includes(f.direction)||!['FATTURA','PROFORMA','TD04'].includes(f.kind)||!['DA_PAGARE','PAGATA','PARZIALE','DA_RECUPERARE','PARZIALMENTE_RECUPERATA','RECUPERATA'].includes(f.status)||!MONEY(f.netCents)||!MONEY(f.vatCents)||!MONEY(f.totalCents)||f.totalCents!==f.netCents+f.vatCents)throw Error('DOCUMENTO_CONTABILE_NON_VALIDO');
  if(f.kind==='TD04'&&!['DA_RECUPERARE','PARZIALMENTE_RECUPERATA','RECUPERATA'].includes(f.status))throw Error('STATO_NOTA_CREDITO_NON_VALIDO');
  if(f.kind!=='TD04'&&['DA_RECUPERARE','PARZIALMENTE_RECUPERATA','RECUPERATA'].includes(f.status))throw Error('STATO_FATTURA_NON_VALIDO');
  seen.add('f:'+f.id);
 }
 return clone(input);
}
function line(l){
 if(!l||!id(l.id)||!TYPES.includes(l.type)||!CATS.includes(l.category)||!String(l.description||'').trim()||!Number.isInteger(l.quantityMilli)||l.quantityMilli<=0||!MONEY(l.unitCents)||![10,22,0,4,5].includes(l.vatRate)||!['BASE','EXTRA'].includes(l.origin)||!['PROPOSTO','APPROVATO','RIFIUTATO'].includes(l.approval))throw Error('RIGA_NON_VALIDA');
}
function totals(q,{approvedOnly=false}={}){
 let netCents=0,vatCents=0;
 for(const l of q.lines){line(l);if(approvedOnly&&l.approval!=='APPROVATO')continue;
  const net=Math.round(l.quantityMilli*l.unitCents/1000);netCents+=net;vatCents+=round(net,l.vatRate)}
 return {netCents,vatCents,totalCents:netCents+vatCents};
}
function createQuote(data,master,record){
 const s=validate(data,master);
 if(!id(record?.id)||!id(record.clientId)||s.quotes.some(x=>x.id===record.id))throw Error('PREVENTIVO_NON_VALIDO');
 const q={id:record.id,clientId:record.clientId,siteId:record.siteId||'',status:'DA_ACCETTARE',lines:[],paymentTerms:String(record.paymentTerms||''),history:[]};
 return validate({...s,quotes:[...s.quotes,q]},master);
}
function addLine(data,master,quoteId,record){
 const s=validate(data,master),q=s.quotes.find(x=>x.id===quoteId);
 if(!q||q.status!=='DA_ACCETTARE'||q.lines.some(l=>l.id===record?.id))throw Error('RIGA_NON_AGGIUNGIBILE');
 const l={id:record.id,type:record.type,category:record.category,description:String(record.description||'').trim(),quantityMilli:record.quantityMilli,unitCents:record.unitCents,vatRate:record.vatRate,origin:record.origin,approval:record.origin==='BASE'?'APPROVATO':'PROPOSTO'};
 line(l);q.lines.push(l);return validate(s,master);
}
function approveExtra(data,master,quoteId,lineIds,approval){
 const s=validate(data,master),q=s.quotes.find(x=>x.id===quoteId);
 if(!q||q.status!=='DA_ACCETTARE'||!['APPROVATO','RIFIUTATO'].includes(approval)||!Array.isArray(lineIds)||!lineIds.length)throw Error('APPROVAZIONE_NON_VALIDA');
 for(const id of lineIds){const l=q.lines.find(x=>x.id===id&&x.origin==='EXTRA');if(!l)throw Error('EXTRA_NON_TROVATO');l.approval=approval}
 return validate(s,master);
}
function setQuoteStatus(data,master,quoteId,status){
 const s=validate(data,master),q=s.quotes.find(x=>x.id===quoteId);
 if(!q||q.status!=='DA_ACCETTARE'||!['ACCETTATO','NON_ACCETTATO'].includes(status))throw Error('STATO_PREVENTIVO_NON_VALIDO');
 if(status==='ACCETTATO'&&q.lines.some(x=>x.origin==='EXTRA'&&x.approval==='PROPOSTO'))throw Error('EXTRA_DA_DECIDERE');
 q.status=status;return validate(s,master);
}
function addInvoice(data,master,record){
 const s=validate(data,master);
 if(!record||!id(record.id)||s.invoices.some(x=>x.id===record.id))throw Error('DOCUMENTO_DUPLICATO');
 const f={id:record.id,direction:record.direction,kind:record.kind,number:String(record.number||''),date:String(record.date||''),counterparty:String(record.counterparty||''),netCents:record.netCents,vatCents:record.vatCents,totalCents:record.totalCents,status:record.kind==='TD04'?'DA_RECUPERARE':'DA_PAGARE',source:'MANUALE'};
 return validate({...s,invoices:[...s.invoices,f]},master);
}
function setInvoiceStatus(data,master,invoiceId,status){
 const s=validate(data,master),f=s.invoices.find(x=>x.id===invoiceId);
 if(!f)throw Error('DOCUMENTO_NON_TROVATO');f.status=status;return validate(s,master);
}
function classify(meta){
 const type=String(meta?.type||'').toUpperCase(),text=String(meta?.label||'').toLowerCase();
 const kind=type==='TD04'?'TD04':type==='PR'||/proforma|pro forma/.test(text)?'PROFORMA':'FATTURA';
 const direction=meta?.issuedByITE===true?'VENDITA':meta?.issuedByITE===false?'ACQUISTO':'DA_VERIFICARE';
 return {kind,direction,requiresReview:direction==='DA_VERIFICARE'};
}
const KEY='ite40_commerce_v1';
function load(storage,master){const raw=storage.getItem(KEY);return raw?validate(JSON.parse(raw),master):empty()}
function save(storage,data,master){const s=validate(data,master),old=storage.getItem(KEY);storage.setItem(KEY+'_previous',old??JSON.stringify(empty()));storage.setItem(KEY,JSON.stringify(s));return s}
const api=Object.freeze({KEY,empty,validate,totals,createQuote,addLine,approveExtra,setQuoteStatus,addInvoice,setInvoiceStatus,classify,load,save});
root.ITECommerce=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
