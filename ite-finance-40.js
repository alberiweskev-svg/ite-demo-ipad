/* I.T.E. 4.0 — contabilità documentale dimostrativa. Nessun dato operativo. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const id=x=>{if(typeof x!=='string'||!/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x))throw Error('SOLO_IDENTIFICATIVI_TEST');return x};
const text=(x,max=180)=>{if(typeof x!=='string'||!x.trim()||x.length>max)throw Error('TESTO_NON_VALIDO');return x.trim()};
const amount=x=>{if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>10000000)throw Error('IMPORTO_NON_VALIDO');return Math.round(x*100)/100};
const date=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x)||(Number.isFinite(Date.parse(x+'T12:00:00Z'))?new Date(x+'T12:00:00Z').toISOString().slice(0,10):'')!==x)throw Error('DATA_NON_VALIDA');return x};
const empty=()=>({schema:1,documents:[],audit:[]});
function validate(s){if(!s||s.schema!==1||!Array.isArray(s.documents)||!Array.isArray(s.audit))throw Error('ARCHIVIO_NON_VALIDO');const ids=new Set();
for(const d of s.documents){id(d.id);if(ids.has(d.id))throw Error('DOCUMENTO_DUPLICATO');ids.add(d.id);if(!['ACQUISTO','VENDITA'].includes(d.direction)||!['FATTURA','PROFORMA','NOTA_CREDITO'].includes(d.type))throw Error('TIPO_NON_VALIDO');if(d.type==='NOTA_CREDITO'&&d.code!=='TD04')throw Error('TD04_OBBLIGATORIO');if(d.type==='PROFORMA'&&d.code==='TD04')throw Error('TIPO_INCOERENTE');if(!['DA_VERIFICARE','DA_PAGARE','PARZIALE','PAGATA','DA_RECUPERARE','PARZIALMENTE_RECUPERATA','RECUPERATA'].includes(d.status))throw Error('STATO_NON_VALIDO');if(d.paid<0||d.paid>d.total)throw Error('SALDO_NON_VALIDO');}
return s}
function classify(raw){const code=String(raw.code||'').trim().toUpperCase(),reference=String(raw.reference||'').toUpperCase();const type=code==='TD04'?'NOTA_CREDITO':(/\bPR(?:OFORMA)?[-\s#:]?\d|PROFORMA/.test(reference)?'PROFORMA':'FATTURA');
const direction=raw.issuer==='ITE'?'VENDITA':raw.issuer==='ESTERNO'?'ACQUISTO':null;
return {type,direction,needsReview:!direction||!!raw.ambiguous};}
function add(state,raw,operator,at){const s=clone(validate(state)),key=id(raw.id);if(s.documents.some(d=>d.id===key))throw Error('DOCUMENTO_DUPLICATO');const detected=classify(raw);const type=detected.type,direction=detected.direction||'ACQUISTO';const net=amount(raw.net),vat=amount(raw.vat),total=amount(raw.total);
if(Math.abs(net+vat-total)>0.02)throw Error('TOTALE_NON_COERENTE');
const d={id:key,number:text(raw.number),date:date(raw.date),party:text(raw.party),direction,type,code:type==='NOTA_CREDITO'?'TD04':String(raw.code||''),net,vat,total,paid:0,status:detected.needsReview?'DA_VERIFICARE':type==='NOTA_CREDITO'?'DA_RECUPERARE':'DA_PAGARE',source:'TEST',notes:[],createdAt:text(at,40)};
s.documents.push(d);s.audit.push({action:'IMPORTAZIONE',id:key,operator:text(operator),at:text(at,40)});return s}
function confirm(state,key,direction,operator,at){const s=clone(validate(state)),d=s.documents.find(x=>x.id===key);if(!d||d.status!=='DA_VERIFICARE'||!['ACQUISTO','VENDITA'].includes(direction))throw Error('REVISIONE_NON_VALIDA');d.direction=direction;d.status=d.type==='NOTA_CREDITO'?'DA_RECUPERARE':'DA_PAGARE';s.audit.push({action:'CLASSIFICAZIONE',id:key,operator:text(operator),at:text(at,40)});return s}
function settle(state,key,value,operator,at){const s=clone(validate(state)),d=s.documents.find(x=>x.id===key);if(!d||d.status==='DA_VERIFICARE'||d.type==='PROFORMA')throw Error('PAGAMENTO_NON_CONSENTITO');const next=Math.round((d.paid+amount(value))*100)/100;if(next>d.total)throw Error('IMPORTO_SUPERIORE_AL_RESIDUO');d.paid=next;const done=next===d.total;d.status=d.type==='NOTA_CREDITO'?(done?'RECUPERATA':'PARZIALMENTE_RECUPERATA'):(done?'PAGATA':'PARZIALE');s.audit.push({action:d.type==='NOTA_CREDITO'?'RECUPERO':'PAGAMENTO',id:key,value,operator:text(operator),at:text(at,40)});return s}
function report(s){validate(s);return s.documents.reduce((a,d)=>{if(d.status==='DA_VERIFICARE'){a.toReview++;return a}if(d.type==='PROFORMA'){a.proformas++;return a}const due=Math.round((d.total-d.paid)*100)/100;if(d.type==='NOTA_CREDITO')a.creditsToRecover+=due;else if(d.direction==='ACQUISTO')a.purchasesDue+=due;else a.salesToCollect+=due;return a},{toReview:0,proformas:0,creditsToRecover:0,purchasesDue:0,salesToCollect:0})}
const api=Object.freeze({empty,validate,classify,add,confirm,settle,report});root.ITEFinance40=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
