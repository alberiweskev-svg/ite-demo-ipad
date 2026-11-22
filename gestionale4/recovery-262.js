/* I.T.E. 4.0.262 - verifica integrità persistenza e recupero locale, senza trasmissione dati */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ITERecovery262=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function verify(storage,key,expected,validate){
 const raw=storage.getItem(key);
 if(raw!==expected)throw Error('SCRITTURA_NON_VERIFICATA');
 let data;try{data=JSON.parse(raw);validate(data);}catch(e){throw Error('ARCHIVIO_SALVATO_NON_VALIDO: '+e.message)}
 return true;
}
function persistVerified(storage,key,raw,validate,recovery){
 const previous=storage.getItem(key);
 const result=recovery.persist(storage,key,raw,validate);
 try{verify(storage,key,raw,validate)}catch(error){
  try{if(previous===null)storage.removeItem(key);else storage.setItem(key,previous);}catch(restoreError){error.restoreError=String(restoreError.message||restoreError)}
  throw error;
 }
 return result;
}
function diagnose(storage,key,validate,recovery){
 const info=recovery.inspect(storage,key,validate),current=storage.getItem(key);
 return {currentValid:info.valid,pending:info.interrupted,historyCount:info.history.length,problem:info.problem||null,hasCurrent:current!==null};
}
return Object.freeze({verify,persistVerified,diagnose});
});