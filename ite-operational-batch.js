/* I.T.E. 4.0 — atomic preview of a multi-stage operational workflow.
   NO persistence, fiscal issuance, or document certification. */
(function(root){'use strict';
const transitions=typeof module!=='undefined'&&module.exports?require('./ite-operational-transitions.js'):root.ITEOperationalTransitions;
const clone=x=>JSON.parse(JSON.stringify(x));
const arr=x=>Array.isArray(x)?x:[];
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const types=Object.freeze({appointment:'appointment',arrival:'arrival',closure:'closure',quote:'quote',extra:'extra',invoice:'invoiceDraft'});
function plan(core,commerce,steps){
 if(!transitions)throw Error('Modulo transizioni non disponibile');
 if(!core||!commerce||!Array.isArray(steps)||!steps.length||steps.length>100)throw Error('Sequenza non valida (1-100 operazioni)');
 const draftCore=clone(core),draftCommerce=clone(commerce);
 const staged=[],audit=[],identities=new Set();
 for(let index=0;index<steps.length;index++){
  const step=steps[index];
  if(!step||!own(types,step.type)||!step.input||typeof step.input!=='object'||Array.isArray(step.input))throw Error('Operazione '+(index+1)+' non valida');
  const input=clone(step.input),kind=step.type;
  let result;
  try{result=transitions[types[kind]](draftCore,draftCommerce,input)}
  catch(e){throw Error('Operazione '+(index+1)+' ('+kind+'): '+e.message)}
  if(!result||!result.action||!result.collection)throw Error('Proposta incompleta');
  const collection=result.collection;
  if(!['appuntamenti','interventi','quotes','extras','documents'].includes(collection))throw Error('Archivio non consentito');
  if(!Array.isArray(draftCore[collection])&&!Array.isArray(draftCommerce[collection])){
   if(['appuntamenti','interventi'].includes(collection))draftCore[collection]=[];
   else draftCommerce[collection]=[];
  }
  const target=['appuntamenti','interventi'].includes(collection)?draftCore:draftCommerce;
  const list=target[collection];
  if(result.record){
   const id=String(result.record.id);
   if(identities.has(id)||list.some(x=>String(x.id)===id))throw Error('ID duplicato nel lotto: '+id);
   identities.add(id);
   list.push(clone(result.record));
  }else if(result.patch){
   const i=list.findIndex(x=>String(x.id)===String(result.recordId));
   if(i<0)throw Error('Intervento da aggiornare non trovato');
   list[i]={...list[i],...clone(result.patch)};
  }else throw Error('Proposta senza record o modifica');
  staged.push(clone(result));
  audit.push({index:index+1,action:result.action,collection,recordId:String(result.record?.id||result.recordId),review:!!result.requiresReview});
 }
 return {staged,audit,preview:{core:draftCore,commerce:draftCommerce},requiresReview:staged.some(x=>x.requiresReview),
  committed:false,releaseAllowed:false,warning:'Simulazione interna: nessuna modifica salvata, nessuna fattura emessa.'};
}
const api=Object.freeze({plan});
root.ITEOperationalBatch=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
