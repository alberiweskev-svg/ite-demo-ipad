/* I.T.E. 4.0.38 — riconciliazione TEST, anagrafiche locali e revisione senza mutare le fatture. */
(function(root){'use strict';
const reconciliation=root.ITE40FinanceReconciliation||(typeof module!=='undefined'?require('./ite-finance-reconciliation-40.js'):null);
const KEY='ITE40_FINANCE_TEST_SUBJECTS_V1';
const ID=/^TEST-[A-Za-z0-9_-]{1,70}$/;
function validateSubjects(input){
 if(!Array.isArray(input)||input.length>10000)throw Error('ANAGRAFICHE_NON_VALIDE');
 const seen=new Set();
 return input.map(s=>{
  if(!s||!ID.test(s.id)||seen.has(s.id)||!['CLIENTE','FORNITORE'].includes(s.role)||typeof s.name!=='string'||!s.name.trim()||s.name.length>160)throw Error('ANAGRAFICA_NON_VALIDA_O_DUPLICATA');
  seen.add(s.id);return {id:s.id,role:s.role,name:s.name.trim()};
 });
}
function create(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('STORAGE_ASSENTE');
 let subjects=[];
 function load(){const raw=storage.getItem(KEY);subjects=raw?validateSubjects(JSON.parse(raw)):[];return get()}
 function get(){return subjects.map(s=>({...s}))}
 function save(input){const next=validateSubjects(input);storage.setItem(KEY,JSON.stringify(next));subjects=next;return get()}
 function upsert(s){return save([...subjects.filter(x=>x.id!==s.id),s])}
 function remove(id){if(!ID.test(id))throw Error('ID_NON_TEST');return save(subjects.filter(s=>s.id!==id))}
 function audit(documents){return reconciliation.reconcile(documents,get())}
 function exportBackup(){return JSON.stringify({format:'ITE40_FINANCE_SUBJECTS_TEST',version:1,subjects:get()},null,2)}
 function restore(text){if(typeof text!=='string'||text.length>2000000)throw Error('BACKUP_TROPPO_GRANDE');const data=JSON.parse(text);if(!data||data.format!=='ITE40_FINANCE_SUBJECTS_TEST'||data.version!==1)throw Error('FORMATO_BACKUP_NON_VALIDO');return save(data.subjects)}
 return Object.freeze({load,get,save,upsert,remove,audit,exportBackup,restore,key:KEY});
}
const api=Object.freeze({create,validateSubjects,KEY});root.ITE40FinanceReview=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
