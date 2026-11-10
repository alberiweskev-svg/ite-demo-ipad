/* I.T.E. 4.0.136 — atomic multi-operation TEST staging, no persistence or network. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const ALLOWED=new Set(["ADD_CLIENT","ADD_SITE","ADD_SYSTEM","ADD_EQUIPMENT","ADD_OPERATOR","SCHEDULE","ESTIMATE","ACCEPT_ESTIMATE","EXTRA","APPROVE_EXTRA","INVOICE"]);
function parse(raw){
 const data=typeof raw==="string"?JSON.parse(raw):copy(raw);
 if(!data||data.format!=="ITE_136_TEST_BATCH"||!Array.isArray(data.commands)||!data.commands.length||data.commands.length>100)throw Error("LOTTO_TEST_NON_VALIDO");
 for(const [i,c] of data.commands.entries()){
  if(!c||!ALLOWED.has(c.type))throw Error("OPERAZIONE_NON_AMMESSA:"+i);
  if(["ACCEPT_ESTIMATE","APPROVE_EXTRA"].includes(c.type)?!String(c.id||"").trim():!c.record||typeof c.record!=="object"||Array.isArray(c.record))throw Error("DATI_OPERAZIONE_NON_VALIDI:"+i);
 }
 return data;
}
function preview(state,raw,actor,deps){
 const O=deps?.operations,A=deps?.audit;
 if(!O||!A||!String(actor||"").trim())throw Error("DIPENDENZE_O_OPERATORE_ASSENTI");
 const batch=parse(raw),initial=copy(state);
 if(batch.expectedRevision!==undefined&&batch.expectedRevision!==initial.revision)throw Error("REVISIONE_CAMBIATA");
 let next=initial;const applied=[];
 for(let i=0;i<batch.commands.length;i++){
  const c=batch.commands[i];
  try{next=O.apply(next,c,actor);applied.push({index:i+1,type:c.type,revision:next.revision});}
  catch(e){throw Error("LOTTO_ANNULLATO_OPERAZIONE_"+(i+1)+":"+e.message);}
 }
 const audit=A.audit(next);
 if(!audit.ok)throw Error("LOTTO_ANNULLATO_AUDIT:"+JSON.stringify(audit.errors||[]));
 return {baseRevision:initial.revision,nextRevision:next.revision,operations:applied,state:copy(next),notice:"ANTEPRIMA TEST: nessuna modifica applicata"};
}
function commit(session,raw,actor,deps){
 if(!session||typeof session.get!=="function"||typeof session.restore!=="function")throw Error("SESSIONE_NON_VALIDA");
 const before=session.get(),result=preview(before,raw,actor,deps);
 if(session.get().revision!==result.baseRevision)throw Error("REVISIONE_CAMBIATA");
 session.restore(result.state,actor);
 return {baseRevision:result.baseRevision,revision:session.get().revision,operations:result.operations,notice:"Lotto applicato alla sola sessione TEST; esportare backup per conservarlo"};
}
const api=Object.freeze({parse,preview,commit});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_Batch136=api;
})(typeof globalThis!=="undefined"?globalThis:this);
