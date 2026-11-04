/* I.T.E. 4.0 - riconciliazione contabile manuale, solo metadati sintetici. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const money=x=>Number.isSafeInteger(x)&&x>=0;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const str=(x,max=160)=>{const s=String(x??'').trim();if(!s||s.length>max)throw Error('TESTO_NON_VALIDO');return s};
function check(state){
 if(!state||!Array.isArray(state.documents)||!Array.isArray(state.movements))throw Error('ARCHIVIO_NON_VALIDO');
 const ids=new Set(),movements=new Set();
 for(const d of state.documents){if(!d||!d.id||ids.has(d.id)||!money(d.totalCents))throw Error('DOCUMENTO_NON_VALIDO');ids.add(d.id)}
 for(const m of state.movements){if(!m||!m.id||movements.has(m.id)||!money(m.amountCents)||!m.amountCents||!date(m.date))throw Error('MOVIMENTO_NON_VALIDO');movements.add(m.id)}
 return true;
}
function due(d){
 if(d.kind==='PROFORMA'||d.direction==='DA_VERIFICARE')return 0;
 const total=d.totalCents;
 const recovered=d.kind==='NOTA_CREDITO'?(d.recoveredCents||0):0;
 if(!money(recovered)||recovered>total)throw Error('RECUPERO_INCOERENTE');
 return total-recovered;
}
function allocations(state){
 const out=new Map();
 for(const m of state.movements)if(m.documentId){if(!state.documents.some(d=>d.id===m.documentId))throw Error('DOCUMENTO_COLLEGATO_MANCANTE');out.set(m.documentId,(out.get(m.documentId)||0)+m.amountCents)}
 return out;
}
function overview(state){
 check(state);const assigned=allocations(state);
 return state.documents.map(d=>{const expected=due(d),paid=assigned.get(d.id)||0;
 if(paid>expected)throw Error('IMPORTO_RICONCILIATO_ECCESSIVO');
 return {id:d.id,kind:d.kind,direction:d.direction,expectedCents:expected,matchedCents:paid,remainingCents:expected-paid,status:expected===0?'NON_RICONCILIABILE':paid===0?'APERTO':paid===expected?'SALDATO':'PARZIALE'}});
}
function register(state,raw){
 check(state);const id=str(raw.id,80),amountCents=raw.amountCents;
 if(!money(amountCents)||!amountCents||state.movements.some(m=>m.id===id))throw Error('MOVIMENTO_DUPLICATO_O_IMPORTO');
 const movement={id,date:str(raw.date,10),amountCents,reference:str(raw.reference,100),direction:str(raw.direction,20),documentId:null,operator:null,matchedAt:null};
 if(!date(movement.date)||!['ENTRATA','USCITA'].includes(movement.direction))throw Error('MOVIMENTO_NON_VALIDO');
 const next=clone(state);next.movements.push(movement);return next;
}
function match(state,movementId,documentId,operator,at){
 check(state);const next=clone(state),m=next.movements.find(x=>x.id===movementId),d=next.documents.find(x=>x.id===documentId);
 if(!m||!d||m.documentId)throw Error('COLLEGAMENTO_NON_VALIDO');
 if(d.reviewed!==true)throw Error('DOCUMENTO_NON_VERIFICATO');
 if(d.kind==='PROFORMA'||d.direction==='DA_VERIFICARE'||due(d)===0)throw Error('DOCUMENTO_NON_RICONCILIABILE');
 const expectedDirection=d.kind==='NOTA_CREDITO'?(d.direction==='VENDITA'?'USCITA':'ENTRATA'):(d.direction==='VENDITA'?'ENTRATA':'USCITA');
 if(m.direction!==expectedDirection)throw Error('DIREZIONE_NON_COHERENTE');
 const before=overview(next).find(x=>x.id===documentId);
 if(m.amountCents>before.remainingCents)throw Error('IMPORTO_ECCESSIVO');
 m.documentId=documentId;m.operator=str(operator,80);m.matchedAt=str(at,24);
 if(!Number.isFinite(Date.parse(at)))throw Error('DATA_OPERAZIONE_NON_VALIDA');
 next.reconciliationHistory=next.reconciliationHistory||[];
 next.reconciliationHistory.push({event:'COLLEGAMENTO',movementId,documentId,operator:m.operator,at:m.matchedAt});
 overview(next);return next;
}
function unmatch(state,movementId,operator,at,reason){
 check(state);const next=clone(state),m=next.movements.find(x=>x.id===movementId);
 if(!m||!m.documentId)throw Error('MOVIMENTO_NON_COLLEGATO');
 const old=m.documentId;m.documentId=null;m.operator=null;m.matchedAt=null;
 const entry={event:'DISTACCO',movementId,documentId:old,operator:str(operator,80),at:str(at,24),reason:str(reason,500)};
 if(!Number.isFinite(Date.parse(at)))throw Error('DATA_OPERAZIONE_NON_VALIDA');
 next.reconciliationHistory=next.reconciliationHistory||[];next.reconciliationHistory.push(entry);return next;
}
function batch(state,operations){
 if(!Array.isArray(operations)||!operations.length||operations.length>100)throw Error('LOTTO_NON_VALIDO');
 return operations.reduce((s,o)=>{if(o.action==='REGISTER')return register(s,o.movement);if(o.action==='MATCH')return match(s,o.movementId,o.documentId,o.operator,o.at);if(o.action==='UNMATCH')return unmatch(s,o.movementId,o.operator,o.at,o.reason);throw Error('AZIONE_NON_VALIDA')},clone(state));
}
const api=Object.freeze({check,due,overview,register,match,unmatch,batch});
root.ITEFinanceReconciliation=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
