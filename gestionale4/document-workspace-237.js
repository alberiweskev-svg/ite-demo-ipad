/* I.T.E. 4.0.237 — document workspace: metadata-only batch intake, linkage, audit.
   No PDF bytes, extracted personal data or real documents are persisted. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentWorkspace237=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const intake=typeof require==="function"?require("../gestionale4/document-intake-229.js"):globalThis.ITEDocumentIntake229;
function owner(state,siteId){const site=state.sites.find(s=>s.id===siteId);if(!site)throw Error("SEDE_INESISTENTE");return site.clientId;}
function verifyLink(state,doc){if(doc.clientId&&!state.clients.some(c=>c.id===doc.clientId))throw Error("CLIENTE_INESISTENTE");if(doc.siteId){const client=owner(state,doc.siteId);if(doc.clientId&&doc.clientId!==client)throw Error("CLIENTE_SEDE_INCOERENTI");}}
function signature(doc){return [doc.kind,doc.filename.trim().toLowerCase(),doc.bytes,doc.siteId||"",doc.clientId||""].join("|");}
function addBatch(store,items,idFactory){if(!Array.isArray(items)||!items.length||items.length>30)throw Error("LOTTO_NON_VALIDO");if(typeof idFactory!=="function")throw Error("ID_FACTORY_OBBLIGATORIA");
 const before=store.snapshot(),seen=new Set(before.documents.map(signature));const prepared=items.map(doc=>{const d={...doc};verifyLink(before,d);if(!intake.kinds.includes(d.kind)||typeof d.filename!=="string"||!d.filename.toLowerCase().endsWith(".pdf")||!Number.isSafeInteger(d.bytes)||d.bytes<8||d.bytes>intake.MAX||d.mime!=="application/pdf")throw Error("METADATI_NON_VALIDI");if(seen.has(signature(d)))throw Error("DOCUMENTO_DUPLICATO");seen.add(signature(d));d.id=idFactory();if(typeof d.id!=="string"||!d.id||d.id.length>64)throw Error("ID_NON_VALIDO");return d;});
 if(new Set(prepared.map(d=>d.id)).size!==prepared.length||prepared.some(d=>before.documents.some(x=>x.id===d.id)))throw Error("ID_DUPLICATO");
 return store.transact(before.revision,s=>{s.documents.push(...prepared)});
}
async function inspectBatch(files,kind,clientId,siteId){const arr=Array.from(files||[]);if(!arr.length||arr.length>30)throw Error("SELEZIONARE_DA_1_A_30_PDF");const out=[];for(const f of arr){out.push(await intake.inspectFile(f,kind==="AUTO"?intake.classify(f.name):kind,clientId,siteId));}return out;}
function audit(state){const issues=[];for(const d of state.documents){try{verifyLink(state,d)}catch(e){issues.push({id:d.id,code:e.message})}}
 const seen=new Set();for(const d of state.documents){const sig=signature(d);if(seen.has(sig))issues.push({id:d.id,code:"DOCUMENTO_DUPLICATO"});seen.add(sig)}
 return {total:state.documents.length,byKind:Object.fromEntries(intake.kinds.map(k=>[k,state.documents.filter(d=>d.kind===k).length])),issues};}
function dossier(state,siteId){const clientId=owner(state,siteId);return state.documents.filter(d=>d.siteId===siteId||(!d.siteId&&d.clientId===clientId));}
return Object.freeze({verifyLink,signature,addBatch,inspectBatch,audit,dossier});
});
