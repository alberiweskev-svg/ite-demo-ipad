/* I.T.E. 4.0 — fascicolo tecnico: transazioni e registro persistente locale.
 * Solo metadati; non contiene PDF, non modifica moduli 2.7.5.
 */
(function(root){'use strict';
const D=root.ITETechnicalDossier||(typeof require==='function'?require('./ite-technical-dossier.js'):null);
const L=root.ITETechnicalDossierLifecycle||(typeof require==='function'?require('./ite-technical-dossier-lifecycle.js'):null);
const KEY='ite40_dossier_audit_v1', JOURNAL='ite40_dossier_audit_journal_v1';
const copy=x=>JSON.parse(JSON.stringify(x));
const nonempty=x=>typeof x==='string'&&x.trim().length>0&&x.length<=120;
function auditValidate(raw){
 const log=raw===null?{version:1,events:[]}:typeof raw==='string'?JSON.parse(raw):raw;
 if(!log||log.version!==1||!Array.isArray(log.events)||log.events.length>20000)throw Error('REGISTRO_NON_VALIDO');
 let previous='';
 for(const e of log.events){
  if(!e||!nonempty(e.id)||!nonempty(e.operator)||!['COLLEGAMENTO','DISTACCO'].includes(e.action)||
   !nonempty(e.documentId)||!/^\d{4}-\d{2}-\d{2}T/.test(e.at)||typeof e.reason!=='string'||
   (e.action==='DISTACCO'&&e.reason.trim().length<8)||e.previousId!==previous)throw Error('REGISTRO_INCOERENTE');
  previous=e.id;
 }
 return copy(log);
}
function plan(state,queue,master,actions,operator,at){
 if(!nonempty(operator)||!Array.isArray(actions)||!actions.length||actions.length>500||
    typeof at!=='string'||Number.isNaN(Date.parse(at))||!/^\d{4}-\d{2}-\d{2}T/.test(at))throw Error('OPERAZIONE_NON_VALIDA');
 let next=D.validate(state,queue,master);
 const changes=[];
 for(const a of actions){
  if(a&&a.action==='COLLEGAMENTO'){
   next=L.attachBatch(next,queue,master,[a.ref]);
   changes.push({action:'COLLEGAMENTO',documentId:a.ref.documentId,reason:''});
  }else if(a&&a.action==='DISTACCO'){
   const result=L.detach(next,queue,master,a.documentId,a.reason,operator);
   next=result.state;
   changes.push({action:'DISTACCO',documentId:a.documentId,reason:result.audit.reason});
  }else throw Error('AZIONE_SCONOSCIUTA');
 }
 return {state:next,changes};
}
function prepare(state,queue,master,log,actions,operator,at){
 const old=auditValidate(log),result=plan(state,queue,master,actions,operator,at);
 let previous=old.events.length?old.events[old.events.length-1].id:'';
 const events=result.changes.map((x,i)=>{
  const id=at+'-'+String(old.events.length+i+1).padStart(6,'0');
  const e={id,previousId:previous,operator:operator.trim(),at,action:x.action,documentId:x.documentId,reason:x.reason};
  previous=id;return e;
 });
 return {state:result.state,audit:auditValidate({version:1,events:[...old.events,...events]}),events};
}
function recover(storage){
 const raw=storage.getItem(JOURNAL);
 if(raw===null)return false;
 const j=JSON.parse(raw);
 if(!j||j.version!==1||typeof j.beforeDossier!=='string'||typeof j.beforeAudit!=='string')throw Error('JOURNAL_NON_VALIDO');
 // A prepared journal always restores the exact pre-transaction snapshots.
 storage.setItem(D.KEY,j.beforeDossier);
 storage.setItem(KEY,j.beforeAudit);
 storage.removeItem(JOURNAL);
 return true;
}
function transact(storage,queue,master,actions,operator,at){
 if(storage.getItem(JOURNAL)!==null)throw Error('RECUPERO_PRECEDENTE_NECESSARIO');
 const beforeDossier=storage.getItem(D.KEY),beforeAudit=storage.getItem(KEY);
 const base=beforeDossier===null?JSON.stringify(D.empty()):beforeDossier;
 const log=beforeAudit===null?JSON.stringify({version:1,events:[]}):beforeAudit;
 const prepared=prepare(JSON.parse(base),queue,master,JSON.parse(log),actions,operator,at);
 // Preflight and validation finish before the first write.
 storage.setItem(JOURNAL,JSON.stringify({version:1,beforeDossier:base,beforeAudit:log}));
 try{
  storage.setItem(D.KEY+'_previous',base);
  storage.setItem(KEY+'_previous',log);
  storage.setItem(D.KEY,JSON.stringify(prepared.state));
  storage.setItem(KEY,JSON.stringify(prepared.audit));
  storage.removeItem(JOURNAL);
 }catch(err){
  try{recover(storage)}catch(rollbackError){
   throw Error('RIPRISTINO_RICHIESTO: '+rollbackError.message);
  }
  throw err;
 }
 return prepared;
}
function inspect(storage,queue,master){
 if(storage.getItem(JOURNAL)!==null)throw Error('RECUPERO_PRECEDENTE_NECESSARIO');
 const state=D.load(storage,queue,master);
 const audit=auditValidate(storage.getItem(KEY));
 return {state,audit,coverage:L.preflight(state,queue,master)};
}
const api=Object.freeze({KEY,JOURNAL,auditValidate,plan,prepare,recover,transact,inspect});
root.ITETechnicalDossierAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
