(function(root){'use strict';
const finance=root.ITE40FinanceIntake||(typeof module!=='undefined'?require('./ite-finance-intake-40.js'):null);
const KEY='ITE40_FINANCE_TEST_LEDGER_V1', VERSION=1;
const assertId=v=>{if(typeof v!=='string'||!/^TEST-[A-Za-z0-9_-]{1,70}$/.test(v))throw Error('SOLO_DATI_TEST');return v};
const plain=x=>JSON.parse(JSON.stringify(x));
function validate(raw){if(!raw||raw.version!==VERSION||!Array.isArray(raw.documents)||raw.documents.length>5000)throw Error('FORMATO_BACKUP_NON_VALIDO');
 let state={documents:[]};for(const doc of raw.documents){const {recoveredCents,status,...input}=doc;const {taxableCents,vatCents,totalCents,credit,proforma,...original}=input;
 state=finance.add(state,original);
 if(doc.credit){if(!Number.isSafeInteger(recoveredCents||0)||recoveredCents<0||recoveredCents>doc.totalCents)throw Error('RECUPERO_NON_VALIDO');if(recoveredCents){state=finance.settle(state,doc.id,recoveredCents/100)}}
 const stored=state.documents[state.documents.length-1];if(status!==stored.status)throw Error('STATO_NON_COERENTE');
 }
 return {version:VERSION,documents:state.documents};
}
function create(storage){if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('STORAGE_ASSENTE');
 let state={version:VERSION,documents:[]};
 function load(){const raw=storage.getItem(KEY);if(raw)state=validate(JSON.parse(raw));return plain(state)}
 function save(next){const checked=validate(next);storage.setItem(KEY,JSON.stringify(checked));state=checked;return plain(state)}
 function add(doc){const next=finance.add({documents:state.documents},doc);return save({version:VERSION,documents:next.documents})}
 function recover(id,amount){assertId(id);const next=finance.settle({documents:state.documents},id,amount);return save({version:VERSION,documents:next.documents})}
 function exportBackup(){return JSON.stringify({format:'ITE40_FINANCE_TEST_BACKUP',...state},null,2)}
 function restore(text){if(typeof text!=='string'||text.length>3000000)throw Error('BACKUP_TROPPO_GRANDE');const parsed=JSON.parse(text);if(parsed.format!=='ITE40_FINANCE_TEST_BACKUP')throw Error('FORMATO_BACKUP_NON_VALIDO');return save(parsed)}
 function get(){return plain(state)}
 function summary(){const totals=finance.summary(state);return {...totals,documenti:state.documents.length,creditiDaRecuperareCents:state.documents.filter(x=>x.credit).reduce((s,x)=>s+x.totalCents-(x.recoveredCents||0),0)}}
 return Object.freeze({load,add,recover,restore,exportBackup,get,summary,key:KEY});
}
const api=Object.freeze({create,validate,VERSION,KEY});root.ITE40FinanceLedger=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
