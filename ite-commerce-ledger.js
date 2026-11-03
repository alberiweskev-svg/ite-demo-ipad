/* I.T.E. 4.0 — Registro incassi/pagamenti, scadenze e collegamenti preventivi. Importi in centesimi. */
(function(root){'use strict';
const C=root.ITECommerce||(typeof require==='function'?require('./ite-commerce.js'):null);
const copy=x=>JSON.parse(JSON.stringify(x));
const integer=x=>Number.isSafeInteger(x)&&x>=0&&x<=1e11;
const validId=x=>typeof x==='string'&&x.trim().length>0&&x.length<=100;
const iso=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
const STATES=['DA_PAGARE','PARZIALE','PAGATA','DA_RECUPERARE','PARZIALMENTE_RECUPERATA','RECUPERATA'];
function empty(){return {version:1,entries:[],links:[]}}
function validate(ledger,commerce){
 C.validate(commerce);
 if(!ledger||ledger.version!==1||!Array.isArray(ledger.entries)||!Array.isArray(ledger.links)||ledger.entries.length>50000||ledger.links.length>10000)throw Error('REGISTRO_NON_VALIDO');
 const seen=new Set(),inv=new Map(commerce.invoices.map(x=>[x.id,x])),quotes=new Map(commerce.quotes.map(x=>[x.id,x]));
 for(const e of ledger.entries){
  if(!validId(e.id)||seen.has(e.id)||!inv.has(e.invoiceId)||!integer(e.amountCents)||e.amountCents===0||!iso(e.date)||!['BONIFICO','CONTANTI','POS','ALTRO'].includes(e.method)||typeof e.note!=='string'||e.note.length>500)throw Error('MOVIMENTO_NON_VALIDO');
  seen.add(e.id);
 }
 const linked=new Set();
 for(const l of ledger.links){
  if(!validId(l.invoiceId)||!validId(l.quoteId)||!inv.has(l.invoiceId)||!quotes.has(l.quoteId)||linked.has(l.invoiceId))throw Error('COLLEGAMENTO_NON_VALIDO');
  linked.add(l.invoiceId);
  const f=inv.get(l.invoiceId),q=quotes.get(l.quoteId);
  if(f.direction!=='VENDITA'||q.status!=='ACCETTATO')throw Error('PREVENTIVO_NON_ACCETTATO');
 }
 for(const f of commerce.invoices){if(paid(ledger,f.id)>f.totalCents)throw Error('IMPORTO_SUPERIORE_AL_DOCUMENTO')}
 return copy(ledger);
}
function paid(ledger,invoiceId){return ledger.entries.filter(e=>e.invoiceId===invoiceId).reduce((sum,e)=>sum+e.amountCents,0)}
function status(f,amount){
 if(amount>f.totalCents)throw Error('IMPORTO_SUPERIORE_AL_DOCUMENTO');
 const credit=f.kind==='TD04';
 return amount===0?(credit?'DA_RECUPERARE':'DA_PAGARE'):amount===f.totalCents?(credit?'RECUPERATA':'PAGATA'):(credit?'PARZIALMENTE_RECUPERATA':'PARZIALE');
}
function record(ledger,commerce,item){
 const s=validate(ledger,commerce),f=commerce.invoices.find(x=>x.id===item?.invoiceId);
 if(!f||!validId(item.id)||!integer(item.amountCents)||item.amountCents===0||!iso(item.date)||!['BONIFICO','CONTANTI','POS','ALTRO'].includes(item.method)||s.entries.some(e=>e.id===item.id))throw Error('MOVIMENTO_NON_VALIDO');
 s.entries.push({id:item.id,invoiceId:f.id,amountCents:item.amountCents,date:item.date,method:item.method,note:String(item.note||'').slice(0,500)});
 validate(s,commerce);return {ledger:s,status:status(f,paid(s,f.id)),remainingCents:f.totalCents-paid(s,f.id)};
}
function link(ledger,commerce,invoiceId,quoteId){
 const s=validate(ledger,commerce);
 if(s.links.some(l=>l.invoiceId===invoiceId))throw Error('DOCUMENTO_GIA_COLLEGATO');
 s.links.push({invoiceId,quoteId});return validate(s,commerce);
}
function summary(ledger,commerce,{asOf}={}){
 validate(ledger,commerce);
 if(asOf!==undefined&&!iso(asOf))throw Error('DATA_NON_VALIDA');
 return commerce.invoices.map(f=>{
  const amount=ledger.entries.filter(e=>e.invoiceId===f.id&&(!asOf||e.date<=asOf)).reduce((n,e)=>n+e.amountCents,0);
  return {invoiceId:f.id,kind:f.kind,direction:f.direction,totalCents:f.totalCents,settledCents:amount,remainingCents:f.totalCents-amount,status:status(f,amount),quoteId:ledger.links.find(l=>l.invoiceId===f.id)?.quoteId||null};
 });
}
const KEY='ite40_commerce_ledger_v1';
function load(storage,commerce){const raw=storage.getItem(KEY);return raw?validate(JSON.parse(raw),commerce):empty()}
function save(storage,ledger,commerce){const s=validate(ledger,commerce),old=storage.getItem(KEY);storage.setItem(KEY+'_previous',old??JSON.stringify(empty()));storage.setItem(KEY,JSON.stringify(s));return s}
const api=Object.freeze({KEY,empty,validate,record,link,summary,load,save});
root.ITECommerceLedger=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
