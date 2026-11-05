/* I.T.E. 4.0 - revisione campi tecnici, solo dati TEST. Nessun PDF reale. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const fields=['number','date','committente','address','plant'];
const safe=s=>typeof s==='string'&&s.length<=160&&s.trim()&&(/TEST[- _]/i.test(s));
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
function revise(state,id,changes,operator,at,reason){
 if(!state||!Array.isArray(state.records))throw Error('REGISTRO_NON_VALIDO');
 if(!/^TEST-[A-Z0-9-]+$/.test(id)||!safe(operator)||!validDate(at.slice(0,10))||!Number.isFinite(Date.parse(at))||!safe(reason))throw Error('REVISIONE_NON_VALIDA');
 const next=clone(state),doc=next.records.find(r=>r.id===id);
 if(!doc)throw Error('DOCUMENTO_ASSENTE');
 if(doc.status==='VERIFICATO')throw Error('RIAPRIRE_PRIMA_DI_MODIFICARE');
 if(doc.source!=='TESTO_ESTRATTO_SIMULATO'||!doc.extracted)throw Error('SOLO_DOCUMENTI_ESTRATTI');
 if(!changes||typeof changes!=='object'||Array.isArray(changes)||!Object.keys(changes).length||Object.keys(changes).some(k=>!fields.includes(k)))throw Error('CAMPI_NON_VALIDI');
 const before=clone(doc.extracted);
 for(const [k,v] of Object.entries(changes)){
  if(k==='date'){if(!validDate(v))throw Error('DATA_NON_VALIDA')}
  else if(!safe(v))throw Error('SOLO_DATI_FITTIZI');
  doc.extracted[k]=v.trim();
 }
 if(!['number','date','committente','address'].every(k=>doc.extracted[k]))throw Error('CAMPI_OBBLIGATORI');
 doc.number=doc.extracted.number;doc.date=doc.extracted.date;
 doc.revision=(doc.revision||0)+1;
 doc.history.push({action:'CORREGGI_CAMPI',operator,at,reason,before,after:clone(doc.extracted),from:doc.status,to:doc.status});
 return next;
}
function reviseBatch(state,operations){if(!Array.isArray(operations)||!operations.length||operations.length>100)throw Error('LOTTO_NON_VALIDO');return operations.reduce((s,o)=>revise(s,o.id,o.changes,o.operator,o.at,o.reason),state)}
function audit(state){if(!state||!Array.isArray(state.records))throw Error('REGISTRO_NON_VALIDO');return state.records.map(d=>({id:d.id,status:d.status,source:d.source,revision:d.revision,corrections:(d.history||[]).filter(h=>h.action==='CORREGGI_CAMPI').length,requiresReview:d.status!=='VERIFICATO'}))}
const api=Object.freeze({revise,reviseBatch,audit});root.ITETechnicalReview=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
