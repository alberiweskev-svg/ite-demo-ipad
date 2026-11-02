/* I.T.E. 4.0 — Document intake + durable administrative ledger.
 * No PDF bytes or real customer records are bundled or uploaded.
 * A PDF extraction adapter must be supplied by the host; this module never guesses extracted fields.
 */
(function(root){'use strict';
const Registry=(typeof module!=='undefined'&&module.exports)?require('./ite-administrative-register.js'):root.ITEAdministrativeRegister;
if(!Registry)throw Error('REGISTRO_NON_CARICATO');
const KEY='ite4-admin-ledger-v1', PREV=KEY+'-previous';
const copy=x=>JSON.parse(JSON.stringify(x));
const has=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
function safeParse(raw){if(typeof raw!=='string'||raw.length>5000000)throw Error('ARCHIVIO_NON_VALIDO');return Registry.importJSON(raw)}
function open(storage){if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('STORAGE_NON_DISPONIBILE');
 const raw=storage.getItem(KEY);if(raw===null)return {state:Registry.empty(),recovered:false};
 try{return {state:safeParse(raw),recovered:false}}catch(err){const previous=storage.getItem(PREV);if(previous!==null){try{return {state:safeParse(previous),recovered:true,warning:'ARCHIVIO_PRINCIPALE_DANNEGGIATO'}}catch(_){}}
 throw Error('ARCHIVIO_DANNEGGIATO_BACKUP_NON_DISPONIBILE')}
}
function save(storage,next,expectedRevision){Registry.validate(next);const current=open(storage);if(current.recovered)throw Error('RIPRISTINO_ESPLICITO_RICHIESTO');
 if(current.state.revision!==expectedRevision)throw Error('REVISIONE_NON_CORRENTE');
 if(next.revision!==expectedRevision+1)throw Error('REVISIONE_NON_SEQUENZIALE');
 const old=storage.getItem(KEY);if(old!==null)storage.setItem(PREV,old);
 storage.setItem(KEY,Registry.exportJSON(next));
 if(safeParse(storage.getItem(KEY)).revision!==next.revision)throw Error('SALVATAGGIO_NON_VERIFICATO');
 return copy(next)}
function restorePrevious(storage,actor){if(!String(actor||'').trim())throw Error('OPERATORE_OBBLIGATORIO');const raw=storage.getItem(PREV);if(raw===null)throw Error('BACKUP_ASSENTE');
 const prior=safeParse(raw),current=storage.getItem(KEY);if(current!==null)storage.setItem(KEY+'-damaged',current);
 storage.setItem(KEY,Registry.exportJSON(prior));return copy(prior)}
function classifyCandidate(meta){const c=Registry.classify(meta);return {classification:c,requiresReview:true,filename:String(meta&&meta.filename||'').slice(0,180),fields:null}}
function stage(fields,meta){if(!fields||typeof fields!=='object'||Array.isArray(fields))throw Error('CAMPI_MANCANTI');
 const proposed=copy(fields);proposed.source='PDF';proposed.verified=false;
 const hint=classifyCandidate(meta);
 return {candidate:proposed,classification:hint.classification,requiresReview:true,filename:hint.filename}}
function approve(state,revision,staged,actor,reviewed){if(reviewed!==true)throw Error('REVISIONE_UMANA_OBBLIGATORIA');
 if(!staged||!staged.candidate)throw Error('CANDIDATO_MANCANTE');
 const doc=Registry.normalize({...staged.candidate,verified:false});
 return Registry.add(state,revision,doc,actor)}
function reconcile(state){Registry.validate(state);const invoiceIds=new Set(state.documents.filter(x=>x.type==='VENDITA'||x.type==='ACQUISTO').map(x=>x.id));
 const missing=[],unverified=[],proformas=[],credits=[];for(const d of state.documents){
 if(!d.verified)unverified.push(d.id);
 if(d.type==='PROFORMA')proformas.push(d.id);
 if(d.type==='TD04'){if(d.originalId&&!invoiceIds.has(d.originalId))missing.push({creditId:d.id,originalId:d.originalId});credits.push({id:d.id,status:Registry.creditStatus(d),outstanding:Math.round((d.total-d.recovered)*100)/100})}}
 return {missingOriginals:missing,unverified,proformas,credits,summary:Registry.summary(state)}}
function exportBackup(state){return Registry.exportJSON(state)}
function previewImport(json,current){const incoming=safeParse(json);Registry.validate(current);
 const ids=new Set(current.documents.map(x=>x.id));const duplicates=incoming.documents.filter(x=>ids.has(x.id)).map(x=>x.id);
 return {incoming,duplicates,requiresReview:true}}
function importReviewed(storage,json,expectedRevision,actor,approved){if(approved!==true)throw Error('IMPORT_DA_CONFERMARE');
 if(!String(actor||'').trim())throw Error('OPERATORE_OBBLIGATORIO');
 const current=open(storage);if(current.recovered)throw Error('RIPRISTINO_ESPLICITO_RICHIESTO');
 if(current.state.revision!==expectedRevision)throw Error('REVISIONE_NON_CORRENTE');
 const check=previewImport(json,current.state);if(check.duplicates.length)throw Error('ID_DUPLICATI_IMPORT');
 let next=copy(current.state);
 for(const d of check.incoming.documents){next=Registry.add(next,next.revision,{...d,verified:false},actor)}
 if(!check.incoming.documents.length)throw Error('IMPORT_VUOTO');
 // Persist only once after all additions validate successfully.
 next.revision=expectedRevision+1;
 return save(storage,next,expectedRevision)}
const api=Object.freeze({KEY,PREV,open,save,restorePrevious,classifyCandidate,stage,approve,reconcile,exportBackup,previewImport,importReviewed});
root.ITEAdministrativeIntake=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
