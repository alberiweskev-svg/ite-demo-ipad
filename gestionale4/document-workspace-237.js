/* I.T.E. 4.0.238 — document metadata workspace, privacy and referential integrity.
   Files are inspected locally; PDF bytes, extracted text and customer data never leave the device. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentWorkspace237=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const intake=typeof require==="function"?require("./document-intake-229.js"):globalThis.ITEDocumentIntake229;
const allowed=new Set(["id","kind","filename","mime","bytes","clientId","siteId"]);
function owner(state,siteId){const site=state.sites.find(s=>s.id===siteId);if(!site)throw Error("SEDE_INESISTENTE");return site.clientId;}
function verifyLink(state,doc){if(doc.clientId&&!state.clients.some(c=>c.id===doc.clientId))throw Error("CLIENTE_INESISTENTE");if(doc.siteId){const client=owner(state,doc.siteId);if(doc.clientId&&doc.clientId!==client)throw Error("CLIENTE_SEDE_INCOERENTI");}}
function signature(doc){return [doc.kind,String(doc.filename||"").trim().toLowerCase(),doc.bytes,doc.siteId||"",doc.clientId||""].join("|");}
function normalize(state,input){if(!input||typeof input!=="object"||Array.isArray(input))throw Error("METADATI_NON_VALIDI");
 for(const k of Object.keys(input))if(!allowed.has(k))throw Error("CAMPO_DOCUMENTO_NON_AMMESSO:"+k);
 const d={...input};if("id" in d)throw Error("ID_ASSEGNATO_DAL_SISTEMA");
 if(!intake.kinds.includes(d.kind)||typeof d.filename!=="string"||!d.filename.trim()||d.filename.length>255||!d.filename.toLowerCase().endsWith(".pdf")||!Number.isSafeInteger(d.bytes)||d.bytes<8||d.bytes>intake.MAX||d.mime!=="application/pdf")throw Error("METADATI_NON_VALIDI");
 if(d.clientId!==undefined&&(typeof d.clientId!=="string"||!d.clientId.trim()))throw Error("CLIENTE_NON_VALIDO");
 if(d.siteId!==undefined&&(typeof d.siteId!=="string"||!d.siteId.trim()))throw Error("SEDE_NON_VALIDA");
 verifyLink(state,d);if(d.siteId&&!d.clientId)d.clientId=owner(state,d.siteId);
 return d;
}
function prepare(state,items){if(!Array.isArray(items)||!items.length||items.length>30)throw Error("LOTTO_NON_VALIDO");
 const seen=new Set(state.documents.map(signature));return items.map(item=>{const d=normalize(state,item);const sig=signature(d);if(seen.has(sig))throw Error("DOCUMENTO_DUPLICATO");seen.add(sig);return d;});}
function previewBatch(store,items){const state=store.snapshot();const prepared=prepare(state,items);return {count:prepared.length,byKind:Object.fromEntries(intake.kinds.map(k=>[k,prepared.filter(d=>d.kind===k).length])),revision:state.revision};}
function addBatch(store,items,idFactory){if(typeof idFactory!=="function")throw Error("ID_FACTORY_OBBLIGATORIA");
 const before=store.snapshot(),prepared=prepare(before,items).map(d=>({...d,id:idFactory()}));
 if(prepared.some(d=>typeof d.id!=="string"||!d.id.trim()||d.id.length>64)||new Set(prepared.map(d=>d.id)).size!==prepared.length||prepared.some(d=>before.documents.some(x=>x.id===d.id)))throw Error("ID_DUPLICATO");
 return store.transact(before.revision,s=>{s.documents.push(...prepared)});
}
async function inspectBatch(files,kind,clientId,siteId){const arr=Array.from(files||[]);if(!arr.length||arr.length>30)throw Error("SELEZIONARE_DA_1_A_30_PDF");
 if(kind!=="AUTO"&&!intake.kinds.includes(kind))throw Error("TIPO_DOCUMENTO_NON_VALIDO");
 const out=[];for(const f of arr)out.push(await intake.inspectFile(f,kind==="AUTO"?intake.classify(f.name):kind,clientId,siteId));return out;}
function audit(state){const issues=[],seen=new Set();for(const d of state.documents){try{verifyLink(state,d)}catch(e){issues.push({id:d.id,code:e.message})}
 const sig=signature(d);if(seen.has(sig))issues.push({id:d.id,code:"DOCUMENTO_DUPLICATO"});seen.add(sig);
 for(const k of Object.keys(d))if(!allowed.has(k))issues.push({id:d.id,code:"CAMPO_DOCUMENTO_NON_AMMESSO:"+k});}
 return {total:state.documents.length,byKind:Object.fromEntries(intake.kinds.map(k=>[k,state.documents.filter(d=>d.kind===k).length])),issues};}
function dossier(state,siteId){const clientId=owner(state,siteId);return state.documents.filter(d=>d.siteId===siteId||(!d.siteId&&d.clientId===clientId));}
return Object.freeze({verifyLink,signature,previewBatch,addBatch,inspectBatch,audit,dossier});
});
