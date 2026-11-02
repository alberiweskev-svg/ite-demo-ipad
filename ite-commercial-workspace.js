/* I.T.E. 4.0 — Preventivi, Extra, prenotazione magazzino (solo dati locali).
 * Fornitura e posa separate. Nessun dato cliente trasmesso in rete.
 */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const KEY='ite40_commercial_workspace_v1';
const validId=v=>typeof v==='string'&&v.trim().length>0&&v.length<=100;
const money=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&Math.round(v*100)===v*100;
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&Math.round(v*1000)===v*1000;
const clean=s=>String(s??'').trim();
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
function masters(state){if(!H)throw Error('ANAGRAFICHE_NON_DISPONIBILI');return H.validate(state)}
function validate(input,hierarchy){
 if(!input||typeof input!=='object')throw Error('ARCHIVIO_COMMERCIALE_NON_VALIDO');
 const h=masters(hierarchy),quotes=input.quotes||[],stock=input.stock||[],reservations=input.reservations||[];
 if(![quotes,stock,reservations].every(a=>Array.isArray(a)&&a.length<=10000))throw Error('LISTE_NON_VALIDE');
 const uniq=(arr,label)=>{const seen=new Set();for(const a of arr){if(!a||!validId(a.id)||seen.has(a.id))throw Error('ID_DUPLICATO_'+label);seen.add(a.id)}};
 uniq(quotes,'PREVENTIVI');uniq(stock,'MAGAZZINO');uniq(reservations,'PRENOTAZIONI');
 for(const p of stock)if(!clean(p.description)||!money(p.unitCost)||!Number.isInteger(p.onHand)||p.onHand<0)throw Error('ARTICOLO_NON_VALIDO');
 for(const q of quotes){
  if(!h.clients.some(x=>x.id===q.clientId)||!h.sites.some(x=>x.id===q.siteId&&x.clientId===q.clientId))throw Error('PREVENTIVO_ANAGRAFICA_INCOERENTE');
  if(!['BOZZA','INVIATO','ACCETTATO','RIFIUTATO'].includes(q.status)||!Array.isArray(q.lines)||q.lines.length>1000)throw Error('PREVENTIVO_NON_VALIDO');
  const lineIds=new Set(),groups=new Map();
  for(const l of q.lines){
   if(!validId(l.id)||lineIds.has(l.id)||!validId(l.groupId)||!['FORNITURA','POSA','SMONTAGGIO','SMALTIMENTO','EXTRA'].includes(l.kind)||!clean(l.description)||!positive(l.quantity)||!money(l.unitPrice))throw Error('VOCE_NON_VALIDA');
   lineIds.add(l.id);
   if(l.stockId&&(!stock.some(s=>s.id===l.stockId)||l.kind!=='FORNITURA'||!Number.isInteger(l.quantity)))throw Error('ARTICOLO_VOCE_NON_VALIDO');
   const kinds=groups.get(l.groupId)||new Set();if(kinds.has(l.kind)&&l.kind!=='EXTRA')throw Error('VOCE_TIPO_DUPLICATA');kinds.add(l.kind);groups.set(l.groupId,kinds);
  }
 }
 for(const r of reservations){
  const q=quotes.find(q=>q.id===r.quoteId),l=q?.lines.find(l=>l.id===r.lineId),s=stock.find(s=>s.id===r.stockId);
  if(!q||q.status!=='ACCETTATO'||!l||l.kind!=='FORNITURA'||l.stockId!==r.stockId||!s||!Number.isInteger(r.quantity)||r.quantity<=0||r.quantity>l.quantity||!['RISERVATO','SCARICATO'].includes(r.status))throw Error('PRENOTAZIONE_NON_VALIDA');
 }
 const perLine=new Map(),perStock=new Map();
 for(const r of reservations){const k=r.quoteId+'/'+r.lineId;perLine.set(k,(perLine.get(k)||0)+r.quantity);if(perLine.get(k)>quotes.find(q=>q.id===r.quoteId).lines.find(l=>l.id===r.lineId).quantity)throw Error('PRENOTAZIONE_ECCESSIVA');if(r.status==='RISERVATO')perStock.set(r.stockId,(perStock.get(r.stockId)||0)+r.quantity)}
 for(const s of stock)if((perStock.get(s.id)||0)>s.onHand)throw Error('GIACENZA_INSUFFICIENTE');
 return {version:1,quotes:quotes.map(q=>({...q,lines:q.lines.map(l=>({...l}))})),stock:stock.map(s=>({...s})),reservations:reservations.map(r=>({...r}))};
}
const empty=h=>validate({},h);
function addQuote(state,h,quote){const s=validate(state,h);return validate({...s,quotes:[...s.quotes,quote]},h)}
function addLine(state,h,quoteId,line){const s=validate(state,h),q=s.quotes.find(x=>x.id===quoteId);if(!q)throw Error('PREVENTIVO_NON_TROVATO');if(q.status==='ACCETTATO'||q.status==='RIFIUTATO')throw Error('PREVENTIVO_BLOCCATO');return validate({...s,quotes:s.quotes.map(x=>x.id===quoteId?{...x,lines:[...x.lines,line]}:x)},h)}
function totals(state,h,quoteId){const s=validate(state,h),q=s.quotes.find(x=>x.id===quoteId);if(!q)throw Error('PREVENTIVO_NON_TROVATO');const byKind={};for(const l of q.lines)byKind[l.kind]=round((byKind[l.kind]||0)+round(l.quantity*l.unitPrice));return {byKind,subtotal:round(Object.values(byKind).reduce((a,b)=>a+b,0))}}
function accept(state,h,quoteId){const s=validate(state,h),q=s.quotes.find(x=>x.id===quoteId);if(!q||!['BOZZA','INVIATO'].includes(q.status)||!q.lines.length)throw Error('ACCETTAZIONE_NON_VALIDA');return validate({...s,quotes:s.quotes.map(x=>x.id===quoteId?{...x,status:'ACCETTATO'}:x)},h)}
function reserve(state,h,quoteId){const s=validate(state,h),q=s.quotes.find(x=>x.id===quoteId);if(!q||q.status!=='ACCETTATO')throw Error('PREVENTIVO_NON_ACCETTATO');if(s.reservations.some(r=>r.quoteId===quoteId))throw Error('PRENOTAZIONE_GIA_PRESENTE');const additions=q.lines.filter(l=>l.kind==='FORNITURA'&&l.stockId).map(l=>({id:'RES-'+quoteId+'-'+l.id,quoteId,lineId:l.id,stockId:l.stockId,quantity:l.quantity,status:'RISERVATO'}));return validate({...s,reservations:[...s.reservations,...additions]},h)}
function discharge(state,h,quoteId){const s=validate(state,h),rs=s.reservations.filter(r=>r.quoteId===quoteId&&r.status==='RISERVATO');if(!rs.length)throw Error('NESSUNA_PRENOTAZIONE');const counts=new Map();for(const r of rs)counts.set(r.stockId,(counts.get(r.stockId)||0)+r.quantity);return validate({...s,stock:s.stock.map(x=>({...x,onHand:x.onHand-(counts.get(x.id)||0)})),reservations:s.reservations.map(r=>r.quoteId===quoteId&&r.status==='RISERVATO'?{...r,status:'SCARICATO'}:r)},h)}
function availability(state,h){const s=validate(state,h);return s.stock.map(x=>({...x,reserved:s.reservations.filter(r=>r.stockId===x.id&&r.status==='RISERVATO').reduce((n,r)=>n+r.quantity,0)})).map(x=>({...x,available:x.onHand-x.reserved}))}
function exportJSON(state,h){return JSON.stringify(validate(state,h),null,2)}
function parse(raw,h){let data;try{data=JSON.parse(raw)}catch(_){throw Error('BACKUP_JSON_NON_VALIDO')}if(data.version!==1)throw Error('VERSIONE_NON_SUPPORTATA');return validate(data,h)}
function save(storage,state,h){const s=validate(state,h),old=storage.getItem(KEY);storage.setItem(KEY+'_previous',old===null?JSON.stringify(empty(h)):old);storage.setItem(KEY,JSON.stringify(s));return s}
function load(storage,h){const raw=storage.getItem(KEY);return raw?parse(raw,h):empty(h)}
const api=Object.freeze({KEY,empty,validate,addQuote,addLine,totals,accept,reserve,discharge,availability,exportJSON,parse,save,load});
root.ITECommercialWorkspace=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
