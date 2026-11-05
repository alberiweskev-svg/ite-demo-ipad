/* I.T.E. 4.0 — batch finance TEST, no network or real documents. */
(function(root){'use strict';
const finance=root.ITEFinance40||(typeof require==='function'?require('./ite-finance-40.js'):null);
if(!finance)return;
const clone=x=>JSON.parse(JSON.stringify(x));
const safe=x=>typeof x==='string'&&/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x);
function signature(d){return [d.direction,d.type,d.number.trim().toUpperCase(),d.date,d.party.trim().toUpperCase()].join('|')}
function normalize(row){
 if(!row||typeof row!=='object'||Array.isArray(row))throw Error('RIGA_NON_VALIDA');
 if(!safe(row.id)||!/^TEST[-\s]/i.test(String(row.number||''))||!/^TEST[-\s]/i.test(String(row.party||'')))throw Error('SOLO_DATI_TEST');
 if(!['ITE','ESTERNO','INCERTO'].includes(row.issuer))throw Error('EMITTENTE_NON_VALIDO');
 const kind=String(row.kind||'FATTURA').toUpperCase();
 if(!['FATTURA','PROFORMA','TD04'].includes(kind))throw Error('TIPO_NON_VALIDO');
 return {id:row.id,number:row.number,date:row.date,party:row.party,issuer:row.issuer,
 reference:kind==='PROFORMA'?'PROFORMA PR-TEST':kind==='TD04'?'NOTA DI CREDITO TEST':'FATTURA TEST',
 code:kind==='TD04'?'TD04':'',net:row.net,vat:row.vat,total:row.total,ambiguous:row.issuer==='INCERTO'};
}
function preview(state,rows){
 finance.validate(state);
 if(!Array.isArray(rows)||rows.length===0||rows.length>100)throw Error('LOTTO_NON_VALIDO');
 const seenIds=new Set(state.documents.map(x=>x.id)),seenSig=new Set(state.documents.map(signature));
 return rows.map((raw,i)=>{
 try{
 const r=normalize(raw),classified=finance.classify(r);
 const candidate={direction:classified.direction||'ACQUISTO',type:classified.type,number:r.number,date:r.date,party:r.party};
 if(seenIds.has(r.id))throw Error('ID_DUPLICATO');
 if(seenSig.has(signature(candidate)))throw Error('DOCUMENTO_GIA_PRESENTE');
 const draft=finance.add(finance.empty(),r,'DEMO','2026-11-05T00:00:00Z');
 seenIds.add(r.id);seenSig.add(signature(draft.documents[0]));
 return {index:i,id:r.id,valid:true,type:classified.type,direction:classified.direction||'DA_VERIFICARE',total:draft.documents[0].total};
 }catch(e){return {index:i,id:String(raw&&raw.id||''),valid:false,error:e.message}}
 });
}
function importBatch(state,rows,operator,at){
 const checks=preview(state,rows),bad=checks.filter(x=>!x.valid);
 if(bad.length)throw Error('LOTTO_BLOCCATO: '+bad.map(x=>(x.index+1)+':'+x.error).join(', '));
 let next=clone(state);
 for(const row of rows)next=finance.add(next,normalize(row),operator,at);
 return {state:next,checks,imported:checks.length};
}
function reconcile(state){finance.validate(state);const r=finance.report(state);return {...r,documents:state.documents.length,settled:state.documents.filter(d=>['PAGATA','RECUPERATA'].includes(d.status)).length,unverified:state.documents.filter(d=>d.status==='DA_VERIFICARE').map(d=>d.id)}}
const api=Object.freeze({normalize,preview,importBatch,reconcile});
root.ITEFinanceBatch40=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
