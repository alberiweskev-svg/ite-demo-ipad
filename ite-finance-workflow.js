/* I.T.E. 4.0 - classificazione contabile documenti, solo metadati; nessun PDF o dato reale. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const validMoney=x=>Number.isSafeInteger(x)&&x>=0;
function classify(doc){
 if(!doc||typeof doc!=='object')throw Error('DOCUMENTO_NON_VALIDO');
 const type=String(doc.type||'').trim().toUpperCase(),number=String(doc.number||'').trim().toUpperCase();
 const issuer=String(doc.issuerVat||'').replace(/\s/g,''),ite=String(doc.companyVat||'03857941201').replace(/\s/g,'');
 if(!type&&!number)throw Error('TIPO_O_NUMERO_OBBLIGATORIO');
 const credit=type==='TD04'||/NOTA\s+DI\s+CREDITO/.test(type);
 const proforma=type==='PR'||/^(PR)[-\/\s\d]/.test(number)||/PROFORMA/.test(type);
 if(credit)return {kind:'NOTA_CREDITO',direction:issuer===ite?'VENDITA':'ACQUISTO',paymentState:'DA_RECUPERARE'};
 if(proforma)return {kind:'PROFORMA',direction:issuer===ite?'VENDITA':'ACQUISTO',paymentState:'NON_FISCALE'};
 if(!issuer) return {kind:'FATTURA',direction:'DA_VERIFICARE',paymentState:'DA_VERIFICARE'};
 return {kind:'FATTURA',direction:issuer===ite?'VENDITA':'ACQUISTO',paymentState:'DA_PAGARE'};
}
function normalize(doc){
 const c=classify(doc),id=String(doc.id||'').trim(),number=String(doc.number||'').trim(),date=String(doc.date||'');
 if(!id||!number||!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('IDENTIFICATIVI_NON_VALIDI');
 const net=doc.netCents,vat=doc.vatCents,total=doc.totalCents;
 if(![net,vat,total].every(validMoney)||net+vat!==total||!Number.isSafeInteger(net+vat))throw Error('TOTALI_NON_COHERENTI');
 return {...clone(doc),id,number,date,netCents:net,vatCents:vat,totalCents:total,...c,recoveredCents:0,history:[]};
}
function add(state,doc){
 if(!state||!Array.isArray(state.documents))throw Error('ARCHIVIO_NON_VALIDO');
 const n=normalize(doc);
 if(state.documents.some(d=>d.id===n.id))throw Error('ID_DUPLICATO');
 if(state.documents.some(d=>d.direction===n.direction&&d.kind===n.kind&&d.number===n.number&&d.date===n.date&&String(d.issuerVat||'')===String(n.issuerVat||'')))throw Error('DOCUMENTO_DUPLICATO');
 return {...clone(state),documents:[...clone(state.documents),n]};
}
function recover(state,id,amountCents,operator,at){
 if(!validMoney(amountCents)||amountCents===0||!String(operator||'').trim()||!Number.isFinite(Date.parse(at)))throw Error('RECUPERO_NON_VALIDO');
 const next=clone(state),d=(next.documents||[]).find(x=>x.id===id);
 if(!d||d.kind!=='NOTA_CREDITO')throw Error('NOTA_CREDITO_INESISTENTE');
 if(d.recoveredCents+amountCents>d.totalCents)throw Error('RECUPERO_ECCESSIVO');
 d.recoveredCents+=amountCents;
 d.paymentState=d.recoveredCents===d.totalCents?'RECUPERATA':'PARZIALMENTE_RECUPERATA';
 d.history.push({event:'RECUPERO',amountCents,operator:String(operator),at});
 return next;
}
function totals(state){
 const out={ACQUISTO:0,VENDITA:0,DA_VERIFICARE:0,PROFORMA:0,NOTA_CREDITO:0,creditRemainingCents:0};
 for(const d of state.documents||[]){if(!validMoney(d.totalCents))throw Error('TOTALE_NON_VALIDO');out[d.kind==='PROFORMA'?'PROFORMA':d.kind==='NOTA_CREDITO'?'NOTA_CREDITO':d.direction]+=d.totalCents;if(d.kind==='NOTA_CREDITO')out.creditRemainingCents+=d.totalCents-(d.recoveredCents||0)}
 return out;
}
const api=Object.freeze({classify,normalize,add,recover,totals});
root.ITEFinanceWorkflow=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
