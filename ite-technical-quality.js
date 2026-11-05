/* I.T.E. 4.0 - quality gate documenti tecnici. Solo dati sintetici TEST. */
(function(root){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const requirements=Object.freeze({
 DICO_ELETTRICA:['SCHEMA','MATERIALI','PROVE'],
 DICO_IDRICA:['SCHEMA','MATERIALI','PROVE'],
 DIRI:['SCHEMA','PROVE'],
 ALLEGATI_GAS:['SCHEMA','MATERIALI','PROVE'],
 POS:['ALLEGATO_OBBLIGATORIO'],
 CAD:['SCHEMA']
});
const clean=s=>typeof s==='string'&&s.trim().length>0&&s.length<=180;
const test=s=>clean(s)&&/TEST[- _]/i.test(s);
function inspect(doc,hierarchy,api){
 const issues=[];
 if(!doc||typeof doc!=='object')return {ready:false,issues:['DOCUMENTO_ASSENTE']};
 if(!/^TEST-[A-Z0-9-]+$/.test(doc.id||''))issues.push('ID_NON_TEST');
 if(!Object.prototype.hasOwnProperty.call(requirements,doc.kind))issues.push('TIPO_NON_VALIDO');
 if(!clean(doc.number))issues.push('NUMERO_MANCANTE');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(doc.date||'')||Number.isNaN(Date.parse(doc.date)))issues.push('DATA_NON_VALIDA');
 try{api.checkHierarchy(hierarchy,doc.link)}catch(e){issues.push(e.message)}
 if(doc.source==='TESTO_ESTRATTO_SIMULATO'){
  if(!doc.extracted||!['number','date','committente','address'].every(k=>clean(doc.extracted[k])))issues.push('ESTRAZIONE_INCOMPLETA');
  else {
   if(doc.number!==doc.extracted.number||doc.date!==doc.extracted.date)issues.push('ESTRAZIONE_NON_ALLINEATA');
   if(!test(doc.extracted.committente)||!test(doc.extracted.address))issues.push('DATI_NON_FITTIZI');
  }
 }
 const attachments=Array.isArray(doc.attachments)?doc.attachments:[];
 const present=new Set(attachments.map(x=>x.kind));
 for(const kind of requirements[doc.kind]||[])if(!present.has(kind))issues.push('ALLEGATO_MANCANTE_'+kind);
 if(attachments.some(x=>!/^TEST-[A-Z0-9-]+$/.test(x.id||'')||!clean(x.label)))issues.push('ALLEGATO_NON_TEST');
 if(new Set(attachments.map(x=>x.id)).size!==attachments.length)issues.push('ALLEGATO_DUPLICATO');
 return {id:doc.id,kind:doc.kind,ready:issues.length===0,issues};
}
function inspectRegister(state,hierarchy,api){
 if(!state||!Array.isArray(state.records))throw Error('REGISTRO_NON_VALIDO');
 return state.records.map(d=>inspect(d,hierarchy,api));
}
function confirmBatch(state,ids,hierarchy,api,operator,at){
 if(!state||!Array.isArray(state.records)||!Array.isArray(ids)||!ids.length||ids.length>100||new Set(ids).size!==ids.length)throw Error('LOTTO_NON_VALIDO');
 if(!test(operator)||!/^\d{4}-\d{2}-\d{2}T/.test(at||'')||!Number.isFinite(Date.parse(at)))throw Error('OPERATORE_O_DATA_NON_VALIDI');
 let next=copy(state);
 for(const id of ids){
  const doc=next.records.find(x=>x.id===id);
  if(!doc)throw Error('DOCUMENTO_ASSENTE');
  const check=inspect(doc,hierarchy,api);
  if(!check.ready)throw Error('DOCUMENTO_INCOMPLETO:'+id+':'+check.issues.join(','));
  next=api.transition(next,id,'CONFERMA',operator,at,'Verifica documentale TEST completata');
 }
 return next;
}
function dashboard(state,hierarchy,api){
 const rows=inspectRegister(state,hierarchy,api);
 return {total:rows.length,ready:rows.filter(x=>x.ready).length,blocked:rows.filter(x=>!x.ready).length,rows};
}
const api=Object.freeze({requirements,inspect,inspectRegister,confirmBatch,dashboard});
root.ITETechnicalQuality=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
