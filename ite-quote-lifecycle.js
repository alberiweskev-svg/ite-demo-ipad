/* I.T.E. 4.0 — quote/extra lifecycle, pure demo engine. No network or persistent writes. */
(function(root){'use strict';
const linkage=typeof module!=='undefined'&&module.exports?require('./ite-commercial-linkage.js'):root.ITECommercialLinkage;
const copy=x=>JSON.parse(JSON.stringify(x));
const states=['BOZZA','INVIATO','ACCETTATO','RIFIUTATO'];
const stamp=(value)=>{if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value)||!Number.isFinite(Date.parse(value)))throw Error('DATA_NON_VALIDA');return value;};
const requireText=(v,k)=>{if(typeof v!=='string'||!v.trim())throw Error(k+'_OBBLIGATORIO');return v.trim();};
function createQuote(data,ref,rows,opts={}){
 const estimate=linkage.buildEstimate(data,ref,rows,[]);
 const validity=Number(opts.validityDays||30);if(![15,30].includes(validity))throw Error('VALIDITA_NON_AMMESSA');
 const id=requireText(opts.id,'ID');const createdAt=stamp(opts.createdAt);
 return {id,createdAt,validityDays:validity,status:'BOZZA',context:estimate.context,baseLines:copy(estimate.lines),extras:[],history:[],revision:1};
}
function addExtra(quote,extra){
 if(quote.status==='RIFIUTATO')throw Error('PREVENTIVO_RIFIUTATO');
 if(!extra||quote.extras.some(x=>x.id===extra.id))throw Error('EXTRA_DUPLICATO');
 const e={id:requireText(extra.id,'ID_EXTRA'),status:'BOZZA',clientId:quote.context.clientId,siteId:quote.context.siteId,systemId:quote.context.systemId,appointmentId:quote.context.appointmentId,lines:(extra.lines||[]).map(linkage.line),history:[]};
 if(!e.lines.length)throw Error('EXTRA_SENZA_RIGHE');
 const next=copy(quote);next.extras.push(e);next.revision++;return next;
}
function transition(quote,kind,id,to,actor,at){
 requireText(actor,'OPERATORE');stamp(at);if(!states.includes(to))throw Error('STATO_NON_VALIDO');
 const next=copy(quote);const obj=kind==='QUOTE'?next:kind==='EXTRA'?next.extras.find(x=>x.id===id):null;
 if(!obj)throw Error('ELEMENTO_NON_TROVATO');
 const allowed={BOZZA:['INVIATO'],INVIATO:['ACCETTATO','RIFIUTATO'],ACCETTATO:[],RIFIUTATO:[]};
 if(!allowed[obj.status].includes(to))throw Error('TRANSIZIONE_NON_AMMESSA');
 if(kind==='EXTRA'&&next.status==='RIFIUTATO')throw Error('PREVENTIVO_RIFIUTATO');
 obj.history.push({from:obj.status,to,actor:actor.trim(),at});obj.status=to;next.revision++;return next;
}
function preview(data,quote){
 const ref=quote.context;const e=linkage.buildEstimate(data,ref,quote.baseLines,quote.extras);
 return {...e,quoteId:quote.id,quoteStatus:quote.status,revision:quote.revision,excludedExtras:quote.extras.filter(x=>x.status!=='ACCETTATO').map(x=>x.id)};
}
function validateCommit(data,quote,expectedRevision,expectedFingerprint){
 if(quote.revision!==expectedRevision)throw Error('REVISIONE_CAMBIATA');
 const result=preview(data,quote);
 return linkage.commitPreview(data,result,expectedFingerprint);
}
const api=Object.freeze({createQuote,addExtra,transition,preview,validateCommit});
root.ITEQuoteLifecycle=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
