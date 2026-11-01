/* I.T.E. 4.0 — synthetic commercial workflow: extra approvals and document ledger.
   Pure functions; no network, storage or personal information. */
(function(root){'use strict';
const core=root.ITECommercial||(typeof require==='function'?require('./ite-commercial-domain.js'):null);
const statuses=Object.freeze(['BOZZA','INVIATO','ACCETTATO','RIFIUTATO']);
const transitions=Object.freeze({BOZZA:['INVIATO'],INVIATO:['ACCETTATO','RIFIUTATO'],ACCETTATO:[],RIFIUTATO:[]});
function validId(x){return typeof x==='string'&&x.trim().length>0}
function extra(input){
 if(!input||!validId(input.id)||!validId(input.quoteId)||!validId(input.description))throw Error('EXTRA_IDENTIFICATIVI_OBBLIGATORI');
 if(!Array.isArray(input.lines)||!input.lines.length)throw Error('EXTRA_VOCI_OBBLIGATORIE');
 const lines=input.lines.map(core.line);
 if(new Set(lines.map(x=>x.id)).size!==lines.length)throw Error('EXTRA_VOCI_DUPLICATE');
 return {id:input.id.trim(),quoteId:input.quoteId.trim(),description:input.description.trim(),status:'BOZZA',lines,history:[]};
}
function changeExtra(item,status,{at,operator}={}){
 if(!item||!statuses.includes(item.status)||!transitions[item.status].includes(status))throw Error('TRANSIZIONE_EXTRA_NON_CONSENTITA');
 if(!validId(operator)||typeof at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(at)||!Number.isFinite(Date.parse(at)))throw Error('TRACCIABILITA_OBBLIGATORIA');
 return {...item,status,history:(item.history||[]).concat([{from:item.status,to:status,at,operator:operator.trim()}])};
}
function quoteWithExtras(quote,extras=[]){
 if(!quote||!Array.isArray(quote.lines)||!Array.isArray(extras))throw Error('PREVENTIVO_EXTRA_NON_VALIDI');
 const accepted=extras.filter(x=>x.status==='ACCETTATO'&&x.quoteId===quote.id);
 if(new Set(accepted.map(x=>x.id)).size!==accepted.length)throw Error('EXTRA_DUPLICATO');
 const ids=new Set(quote.lines.map(x=>x.id)),added=[];
 for(const x of accepted)for(const item of x.lines){
  const l=core.line(item),id='EX-'+x.id+'-'+l.id;
  if(ids.has(id))throw Error('ID_VOCE_DUPLICATO');ids.add(id);added.push({...l,id});
 }
 return core.build({id:quote.id,clientId:quote.clientId,siteId:quote.siteId,issuedAt:quote.issuedAt,validDays:quote.validDays,notes:quote.notes,lines:quote.lines.concat(added)});
}
function classifyLedger(rows){
 if(!Array.isArray(rows))throw Error('DOCUMENTI_NON_VALIDI');
 const ids=new Set();
 return rows.map(row=>{
  if(!row||!validId(row.id)||ids.has(row.id))throw Error('DOCUMENTO_ID_DUPLICATO_O_ASSENTE');
  ids.add(row.id);
  const result=core.classifyDocument(row);
  const amount=Number(row.amount);
  if(!Number.isFinite(amount)||amount<0)throw Error('IMPORTO_DOCUMENTO_NON_VALIDO');
  const recovered=Number(row.recovered||0);
  if(!Number.isFinite(recovered)||recovered<0||recovered>amount)throw Error('RECUPERO_NON_VALIDO');
  const credit=result.category.startsWith('NOTA_CREDITO');
  return {...result,id:row.id,amount:Math.round(amount*100)/100,recovered:credit?Math.round(recovered*100)/100:0,
   recoveryStatus:credit?(recovered===0?'DA_RECUPERARE':recovered>=amount?'RECUPERATA':'PARZIALMENTE_RECUPERATA'):undefined,
   balance:credit?Math.round((amount-recovered)*100)/100:undefined};
 });
}
const api=Object.freeze({extra,changeExtra,quoteWithExtras,classifyLedger});
root.ITECommercialWorkflow=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
