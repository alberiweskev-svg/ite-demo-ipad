/* I.T.E. 4.0.263 - salvataggio verificato e rollback anche in caso di eccezioni parziali. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ITERecovery262=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function validateRaw(raw,validate){
 if(typeof raw!=='string')throw Error('ARCHIVIO_NON_TESTUALE');
 let data;try{data=JSON.parse(raw);validate(data)}catch(e){throw Error('ARCHIVIO_NON_VALIDO: '+e.message)}
 return data;
}
function verify(storage,key,expected,validate){
 const raw=storage.getItem(key);
 if(raw!==expected)throw Error('SCRITTURA_NON_VERIFICATA');
 validateRaw(raw,validate);return true;
}
function persistVerified(storage,key,raw,validate,recovery){
 // Rifiutare un archivio invalido prima di modificare la memoria persistente.
 validateRaw(raw,validate);
 const previous=storage.getItem(key);
 if(previous!==null)validateRaw(previous,validate);
 let result;
 try{
  result=recovery.persist(storage,key,raw,validate);
  verify(storage,key,raw,validate);
 }catch(error){
  // recovery.persist puo' aver scritto una parte dei dati prima di lanciare.
  let restored=false;
  try{
   if(previous===null)storage.removeItem(key);else storage.setItem(key,previous);
   restored=storage.getItem(key)===previous;
  }catch(restoreError){error.restoreError=String(restoreError.message||restoreError)}
  if(!restored){error.restoreFailed=true;error.message+='; RIPRISTINO_NON_VERIFICATO'}
  throw error;
 }
 return result;
}
function diagnose(storage,key,validate,recovery){
 let info,current;
 try{info=recovery.inspect(storage,key,validate);current=storage.getItem(key)}
 catch(e){return {currentValid:false,pending:null,historyCount:0,problem:String(e.message||e),hasCurrent:null}}
 return {currentValid:!!info.valid,pending:!!info.interrupted,historyCount:Array.isArray(info.history)?info.history.length:0,problem:info.problem||null,hasCurrent:current!==null};
}
return Object.freeze({verify,persistVerified,diagnose});
});
