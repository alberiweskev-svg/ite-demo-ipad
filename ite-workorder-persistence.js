/* I.T.E. 4.0 — browser-local demo ledger persistence, never syncs customer data. */
(function(root){'use strict';
const ledger=root.ITEWorkorderLedger||(typeof require==='function'?require('./ite-workorder-ledger.js'):null);
const KEY='ite4.demo.workorders.v1',BACKUP=KEY+'.backup';
function store(storage){if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('ARCHIVIO_NON_DISPONIBILE');return storage}
function decode(raw){if(raw===null)return null;const x=JSON.parse(raw);if(!x||x.format!==1||typeof x.savedAt!=='string'||typeof x.payload!=='string')throw Error('BACKUP_NON_VALIDO');return ledger.importState(x.payload)}
function load(storage){const s=store(storage);try{const current=decode(s.getItem(KEY));return {state:current||ledger.initial(),recovered:false,empty:!current}}catch(e){const backup=decode(s.getItem(BACKUP));if(!backup)throw Error('ARCHIVIO_CORROTTO_SENZA_BACKUP');return {state:backup,recovered:true,empty:false,error:String(e.message)}}}
function save(storage,state,expectedRevision,at){const s=store(storage);ledger.validate(state);if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('REVISIONE_ATTESA_NON_VALIDA');const old=load(s);if(old.recovered)throw Error('RIPRISTINO_BACKUP_RICHIESTO');if(old.state.revision!==expectedRevision)throw Error('CONFLITTO_REVISIONE');if(state.revision!==expectedRevision+1)throw Error('REVISIONE_NUOVA_NON_VALIDA');if(typeof at!=='string'||!Number.isFinite(Date.parse(at)))throw Error('DATA_NON_VALIDA');
const previous=s.getItem(KEY),encoded=JSON.stringify({format:1,savedAt:at,payload:ledger.exportState(state)});
if(previous!==null)s.setItem(BACKUP,previous);
s.setItem(KEY,encoded);
if(s.getItem(KEY)!==encoded)throw Error('SCRITTURA_NON_CONFERMATA');
return {revision:state.revision,backedUp:previous!==null}}
function restore(storage){const s=store(storage),backup=decode(s.getItem(BACKUP));if(!backup)throw Error('NESSUN_BACKUP_VALIDO');const previous=s.getItem(KEY);if(previous!==null)s.setItem(KEY+'.corrupt',previous);s.setItem(KEY,s.getItem(BACKUP));return backup}
function exportBackup(storage){const s=store(storage);return ledger.exportState(load(s).state)}
function importBackup(storage,json,expectedRevision,at){const s=store(storage),state=ledger.importState(json),current=load(s);if(current.recovered)throw Error('RIPRISTINO_BACKUP_RICHIESTO');if(current.state.revision!==expectedRevision)throw Error('CONFLITTO_REVISIONE');const old=s.getItem(KEY);if(old!==null)s.setItem(BACKUP,old);s.setItem(KEY,JSON.stringify({format:1,savedAt:at,payload:ledger.exportState(state)}));return state}
const api=Object.freeze({KEY,BACKUP,load,save,restore,exportBackup,importBackup});root.ITEWorkorderPersistence=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
