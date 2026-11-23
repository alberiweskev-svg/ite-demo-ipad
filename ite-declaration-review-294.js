/* I.T.E. 4.0.294 — immutable TEST review snapshots, never official declarations. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDeclarationReview294=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const fail=x=>{throw Error(x);},copy=x=>JSON.parse(JSON.stringify(x));
function canonical(x){if(Array.isArray(x))return "["+x.map(canonical).join(",")+"]";if(x&&typeof x==="object")return "{"+Object.keys(x).sort().map(k=>JSON.stringify(k)+":"+canonical(x[k])).join(",")+"}";return JSON.stringify(x);}
function snapshot(state,id,docs,graph,declarations,handover){
 if(!handover||!declarations)fail("MOTORE_ASSENTE");
 const packet=handover.prepare(state,id,docs,graph,declarations);
 const d=declarations.validate(state).records.find(x=>x.id===id);
 const selected=[packet.primaryDocument,...packet.relatedDocuments].filter(Boolean);
 const byId=new Map((docs?.documents||[]).map(x=>[x.id,x]));
 const evidence=selected.map(x=>{const v=byId.get(x.id);return {id:x.id,type:x.type,status:x.status,hash:String(v?.pdf?.sha256||v?.pdf?.hash||"").toLowerCase(),pdfPresent:!!v?.pdf};});
 return {schema:"ITE_DECLARATION_REVIEW_294",mode:"TEST_ONLY",packet,documentEvidence:evidence,revision:declarations.validate(state).revision,signature:canonical({declaration:d,packet,documentEvidence:evidence}),issued:false,legalValidity:false};
}
function compare(old,current){if(!old||old.schema!=="ITE_DECLARATION_REVIEW_294"||!current||current.schema!==old.schema)fail("SNAPSHOT_NON_VALIDO");const changed=old.signature!==current.signature;return {changed,issues:changed?["DATI_MODIFICATI_DALLA_VERIFICA"]:[],sameRevision:old.revision===current.revision};}
async function verify(s,readPdf,sha256){if(!s||s.schema!=="ITE_DECLARATION_REVIEW_294")fail("SNAPSHOT_NON_VALIDO");if(typeof readPdf!=="function"||typeof sha256!=="function")fail("VERIFICA_NON_DISPONIBILE");const result=copy(s);result.verified=false;result.checks=[];for(const d of result.documentEvidence){let issue=null;if(!d.pdfPresent)issue="PDF_ASSENTE";else if(!/^[a-f0-9]{64}$/.test(d.hash))issue="HASH_ATTESO_ASSENTE";else{try{const bytes=await readPdf(d.id);if(!bytes)issue="PDF_NON_LEGGIBILE";else if(String(await sha256(bytes)).toLowerCase()!==d.hash)issue="HASH_DIVERSO";}catch(_){issue="LETTURA_FALLITA";}}result.checks.push({id:d.id,ok:!issue,issue});}
 result.verified=result.documentEvidence.length>0&&result.checks.every(x=>x.ok)&&result.packet.issues.length===0;
 result.readyForHumanReview=result.verified;result.canSign=false;result.canIssue=false;result.canDeliverOfficial=false;
 return result;}
function exportManifest(verified,latest){if(!verified||!latest||verified.schema!=="ITE_DECLARATION_REVIEW_294")fail("SNAPSHOT_NON_VALIDO");const diff=compare(verified,latest);const out=copy(verified);out.verified=!!verified.verified&&!diff.changed;out.readyForHumanReview=out.verified;out.issues=[...new Set([...out.packet.issues,...diff.issues,...out.checks.filter(x=>!x.ok).map(x=>x.issue)])];out.canSign=false;out.canIssue=false;out.canDeliverOfficial=false;delete out.signature;return out;}
return Object.freeze({canonical,snapshot,compare,verify,exportManifest});});