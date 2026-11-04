/* I.T.E. 4.0 — transazione locale importazione documenti contabili.
 * Non legge né trasmette PDF. Usare solo dati fittizi nella demo pubblica.
 */
(function(root){'use strict';
const Intake=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const Commerce=root.ITECommerce||(typeof require==='function'?require('./ite-commerce.js'):null);
const Bridge=root.ITEDocumentIntakeCommerceBridge||(typeof require==='function'?require('./ite-document-intake-commerce-bridge.js'):null);
const KEY_INTAKE='ite40_document_intake_v1', KEY_COMMERCE=Commerce.KEY;
const JOURNAL='ite40_intake_commerce_pending_v1';
const has=(s,k)=>s.getItem(k)!==null;
function read(storage,master){
 const rawI=storage.getItem(KEY_INTAKE),rawC=storage.getItem(KEY_COMMERCE);
 return {intake:rawI?Intake.importJSON(rawI):Intake.empty(),commerce:rawC?Commerce.validate(JSON.parse(rawC),master):Commerce.empty()};
}
function review(storage,master,requests){
 const old=read(storage,master),next=Bridge.importBatch(old.intake,old.commerce,master,requests);
 return {before:old,after:next,documents:requests.length,totals:next.commerce.invoices.length-old.commerce.invoices.length};
}
function restore(storage,journal){
 for(const [key,value] of Object.entries(journal.before)){
  if(value===null)storage.removeItem(key);else storage.setItem(key,value);
 }
}
function recover(storage){
 const raw=storage.getItem(JOURNAL);if(raw===null)return false;
 const j=JSON.parse(raw);
 if(!j||j.version!==1||!j.before||typeof j.before!=='object'||![KEY_INTAKE,KEY_COMMERCE].every(k=>Object.prototype.hasOwnProperty.call(j.before,k)))throw Error('GIORNALE_IMPORTAZIONE_NON_VALIDO');
 restore(storage,j);storage.removeItem(JOURNAL);return true;
}
function commit(storage,master,requests){
 if(has(storage,JOURNAL))recover(storage);
 const proposal=review(storage,master,requests);
 const before={[KEY_INTAKE]:storage.getItem(KEY_INTAKE),[KEY_COMMERCE]:storage.getItem(KEY_COMMERCE)};
 const journal={version:1,before};
 storage.setItem(JOURNAL,JSON.stringify(journal));
 try{
  storage.setItem(KEY_INTAKE,Intake.exportJSON(proposal.after.intake));
  storage.setItem(KEY_COMMERCE,JSON.stringify(proposal.after.commerce));
  storage.removeItem(JOURNAL);
  return {documents:proposal.documents,imported:proposal.totals};
 }catch(e){
  try{restore(storage,journal);storage.removeItem(JOURNAL)}catch(_){/* journal remains for recovery */}
  throw e;
 }
}
const api=Object.freeze({KEY_INTAKE,KEY_COMMERCE,JOURNAL,read,review,recover,commit});
root.ITEDocumentIntakeTransaction=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
