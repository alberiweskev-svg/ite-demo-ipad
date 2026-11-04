/* I.T.E. 4.0 — audit contabile di collaudo, pure functions, no uploads. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const money=x=>Number.isSafeInteger(x)&&x>=0;
function inspect(state){
 if(!state||!Array.isArray(state.documents)||!Array.isArray(state.movements))throw Error('ARCHIVIO_NON_VALIDO');
 const errors=[],warnings=[],byId=new Map(),movIds=new Set(),allocated=new Map();
 const add=(arr,code,id)=>arr.push({code,id:String(id||'')});
 for(const d of state.documents){
  if(!d||!d.id){add(errors,'DOCUMENTO_SENZA_ID','');continue}
  if(byId.has(d.id))add(errors,'DOCUMENTO_DUPLICATO',d.id);else byId.set(d.id,d);
  if(!money(d.totalCents)||!money(d.netCents)||!money(d.vatCents)||d.netCents+d.vatCents!==d.totalCents)add(errors,'TOTALI_NON_COHERENTI',d.id);
  if(!d.reviewed)add(warnings,'DA_VERIFICARE',d.id);
  if(d.kind==='NOTA_CREDITO'){
   if(!money(d.recoveredCents||0)||(d.recoveredCents||0)>d.totalCents)add(errors,'RECUPERO_NON_VALIDO',d.id);
   const expected=(d.recoveredCents||0)===d.totalCents?'RECUPERATA':(d.recoveredCents||0)>0?'PARZIALMENTE_RECUPERATA':'DA_RECUPERARE';
   if(d.paymentState!==expected)add(warnings,'STATO_CREDITO_DA_ALLINEARE',d.id);
  }
 }
 for(const m of state.movements){
  if(!m||!m.id){add(errors,'MOVIMENTO_SENZA_ID','');continue}
  if(movIds.has(m.id))add(errors,'MOVIMENTO_DUPLICATO',m.id);movIds.add(m.id);
  if(!money(m.amountCents)||m.amountCents===0)add(errors,'IMPORTO_MOVIMENTO_NON_VALIDO',m.id);
  if(!m.documentId){add(warnings,'MOVIMENTO_NON_COLLEGATO',m.id);continue}
  const d=byId.get(m.documentId);
  if(!d){add(errors,'DOCUMENTO_COLLEGATO_ASSENTE',m.id);continue}
  if(d.kind==='PROFORMA')add(errors,'PROFORMA_RICONCILIATA',m.id);
  if(!d.reviewed)add(errors,'DOCUMENTO_NON_VERIFICATO_RICONCILIATO',m.id);
  const expected=d.direction==='VENDITA'?'ENTRATA':'USCITA';
  if(m.direction!==expected)add(errors,'DIREZIONE_MOVIMENTO_ERRATA',m.id);
  allocated.set(d.id,(allocated.get(d.id)||0)+(money(m.amountCents)?m.amountCents:0));
 }
 const balances=[];
 for(const d of state.documents){
  if(!d||!d.id||!money(d.totalCents))continue;
  const paid=allocated.get(d.id)||0;
  if(paid>d.totalCents)add(errors,'PAGAMENTI_ECCESSIVI',d.id);
  balances.push({id:d.id,number:String(d.number||''),kind:d.kind,direction:d.direction,totalCents:d.totalCents,paidCents:paid,remainingCents:Math.max(0,d.totalCents-paid),reviewed:!!d.reviewed});
 }
 return {errors,warnings,balances,counts:{documents:state.documents.length,movements:state.movements.length,errors:errors.length,warnings:warnings.length},ready:errors.length===0};
}
function snapshot(state){
 const result=inspect(state);
 return {schema:'ITE40_FINANCE_AUDIT_TEST_V1',generatedAt:null,summary:result.counts,errors:clone(result.errors),warnings:clone(result.warnings),balances:clone(result.balances)};
}
const api=Object.freeze({inspect,snapshot});root.ITEFinanceAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
