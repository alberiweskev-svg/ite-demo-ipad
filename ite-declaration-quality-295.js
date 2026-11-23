/* I.T.E. 4.0.295 — TEST-only dossier quality gate; no legal issuance. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ITEDeclarationQuality295=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const fail=m=>{throw Error(m);};const hashOk=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
function evaluate(snapshot,documents){
 if(!snapshot||snapshot.schema!=='ITE_DECLARATION_REVIEW_294')fail('SNAPSHOT_NON_VALIDO');
 const docs=documents&&Array.isArray(documents.documents)?documents.documents:[];
 const byId=new Map(),duplicateIds=new Set();for(const d of docs){if(!d||typeof d.id!=='string')continue;if(byId.has(d.id))duplicateIds.add(d.id);else byId.set(d.id,d);}
 const primary=snapshot.packet&&snapshot.packet.primaryDocument;
 const selected=Array.isArray(snapshot.documentEvidence)?snapshot.documentEvidence:[];
 const issues=[],rows=[],seen=new Set();
 if(!primary||!primary.id)issues.push('DOCUMENTO_PRINCIPALE_ASSENTE');
 else if(!selected.some(x=>x.id===primary.id))issues.push('DOCUMENTO_PRINCIPALE_NON_INCLUSO');
 if(selected.length===0)issues.push('NESSUN_PDF_COLLEGATO');
 for(const e of selected){const local=[];if(!e||typeof e.id!=='string'||!e.id){issues.push('RIFERIMENTO_DOCUMENTO_INVALIDO');continue;}
 if(seen.has(e.id))local.push('RIFERIMENTO_DUPLICATO');seen.add(e.id);
 if(duplicateIds.has(e.id))local.push('ID_DOCUMENTO_AMBIGUO');
 const d=byId.get(e.id);if(!d)local.push('DOCUMENTO_NON_TROVATO');
 else {if(d.type!==e.type)local.push('TIPO_DOCUMENTO_MODIFICATO');if(d.status!==e.status)local.push('STATO_DOCUMENTO_MODIFICATO');if(d.status!=='archiviato')local.push('DOCUMENTO_NON_ARCHIVIATO');if(!d.pdf)local.push('PDF_ASSENTE');
 const current=String(d.pdf?.sha256||d.pdf?.hash||'').toLowerCase();if(!hashOk(current))local.push('HASH_ATTESO_ASSENTE');if(current!==String(e.hash||'').toLowerCase())local.push('HASH_MODIFICATO');}
 rows.push({id:e.id,primary:!!primary&&e.id===primary.id,issues:local});issues.push(...local);
 }
 const packetIssues=Array.isArray(snapshot.packet?.issues)?snapshot.packet.issues:[];issues.push(...packetIssues);
 const unique=[...new Set(issues)];return {schema:'ITE_DECLARATION_QUALITY_295',mode:'TEST_ONLY',declarationId:snapshot.packet?.declaration?.id||null,rows,issues:unique,readyForIntegrityCheck:unique.length===0,canSign:false,canIssue:false,canDeliverOfficial:false};
}
async function check(snapshot,documents,readPdf,sha256,review){
 if(!review||typeof review.verify!=='function')fail('MOTORE_REVISIONE_ASSENTE');
 const quality=evaluate(snapshot,documents);if(!quality.readyForIntegrityCheck)return {quality,verified:false,checks:[],readyForHumanReview:false,canSign:false,canIssue:false};
 const verified=await review.verify(snapshot,readPdf,sha256);const issues=[...quality.issues,...verified.checks.filter(x=>!x.ok).map(x=>x.issue)];
 return {quality:{...quality,issues:[...new Set(issues)]},verified:!!verified.verified,checks:verified.checks,readyForHumanReview:!!verified.readyForHumanReview,canSign:false,canIssue:false};
}
return Object.freeze({evaluate,check});});