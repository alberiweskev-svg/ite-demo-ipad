/* I.T.E. 4.0 - importazione contabile controllata di METADATI, mai file PDF. */
(function(root){'use strict';
const F=root.ITEFinanceWorkflow||(typeof require==='function'?require('./ite-finance-workflow.js'):null);
if(!F)throw Error('FINANCE_WORKFLOW_MANCANTE');
const copy=x=>JSON.parse(JSON.stringify(x));
const vat=x=>String(x||'').replace(/\D/g,'');
const isoDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))&&!Number.isNaN(Date.parse(x))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const cents=x=>{if(typeof x==='number'&&Number.isSafeInteger(x)&&x>=0)return x;throw Error('IMPORTO_CENTESIMI_NON_VALIDO')};
const safeText=(x,max=160)=>{const s=String(x??'').trim();if(s.length>max)throw Error('TESTO_TROPPO_LUNGO');return s};
function prepare(raw,source){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('RIGA_NON_VALIDA');
 if(!['MANUALE','XML_ESTRATTO','PDF_VERIFICATO'].includes(source))throw Error('ORIGINE_NON_VALIDA');
 const doc={id:safeText(raw.id,80),type:safeText(raw.type,40),number:safeText(raw.number,80),date:safeText(raw.date,10),
 issuerVat:vat(raw.issuerVat),companyVat:'03857941201',
 netCents:cents(raw.netCents),vatCents:cents(raw.vatCents),totalCents:cents(raw.totalCents)};
 if(!isoDate(doc.date))throw Error('DATA_NON_VALIDA');
 if(!doc.issuerVat||doc.issuerVat.length!==11)throw Error('EMITTENTE_DA_VERIFICARE');
 if(!doc.id||!doc.number)throw Error('IDENTIFICATIVI_MANCANTI');
 const result=F.normalize(doc);
 return {...result,source,reviewed:false,reviewedBy:null,reviewedAt:null};
}
function preview(state,rows,source){
 if(!state||!Array.isArray(state.documents)||!Array.isArray(rows)||rows.length===0||rows.length>200)throw Error('LOTTO_NON_VALIDO');
 let draft=copy(state);const accepted=[],rejected=[];
 rows.forEach((row,index)=>{try{const doc=prepare(row,source);draft=F.add(draft,doc);accepted.push({index,id:doc.id,kind:doc.kind,direction:doc.direction,totalCents:doc.totalCents})}
 catch(e){rejected.push({index,code:e.message})}});
 return {accepted,rejected,ready:rejected.length===0,count:rows.length};
}
function importBatch(state,rows,source){
 const check=preview(state,rows,source);
 if(!check.ready)throw Error('LOTTO_RESPINTO:'+check.rejected.map(x=>x.index+':'+x.code).join(','));
 let draft=copy(state);
 for(const row of rows)draft=F.add(draft,prepare(row,source));
 return draft;
}
function review(state,id,operator,at,decision,reason){
 if(!['CONFERMA','DA_VERIFICARE'].includes(decision)||!safeText(operator,80)||!isoTime(at))throw Error('REVISIONE_NON_VALIDA');
 const draft=copy(state),doc=(draft.documents||[]).find(d=>d.id===id);
 if(!doc)throw Error('DOCUMENTO_INESISTENTE');
 if(decision==='DA_VERIFICARE'&&!safeText(reason,500))throw Error('MOTIVO_OBBLIGATORIO');
 doc.reviewed=decision==='CONFERMA';doc.reviewedBy=safeText(operator,80);doc.reviewedAt=at;
 doc.reviewStatus=decision;doc.reviewReason=decision==='DA_VERIFICARE'?safeText(reason,500):'';
 doc.reviewHistory=Array.isArray(doc.reviewHistory)?doc.reviewHistory:[];
 doc.reviewHistory.push({decision,operator:doc.reviewedBy,at,reason:doc.reviewReason});
 return draft;
}
function isoTime(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(x)&&Number.isFinite(Date.parse(x))}
function summary(state){
 const docs=state.documents||[],out={total:docs.length,toReview:0,confirmed:0,acquistiCents:0,venditeCents:0,proformaCents:0,noteCreditoCents:0};
 for(const d of docs){if(d.reviewed)out.confirmed++;else out.toReview++;
 if(d.kind==='PROFORMA')out.proformaCents+=d.totalCents;
 else if(d.kind==='NOTA_CREDITO')out.noteCreditoCents+=d.totalCents;
 else if(d.direction==='ACQUISTO')out.acquistiCents+=d.totalCents;
 else if(d.direction==='VENDITA')out.venditeCents+=d.totalCents}
 return out;
}
const api=Object.freeze({prepare,preview,importBatch,review,summary});
root.ITEFinanceImport=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
