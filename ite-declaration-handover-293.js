/* I.T.E. 4.0.293 — TEST-only technical declaration dossier handover. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDeclarationHandover293=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const fail=m=>{throw Error(m);}, clone=x=>JSON.parse(JSON.stringify(x));
function prepare(state,id,docs,graph,api){
 if(!api||typeof api.validate!=="function")fail("MOTORE_DICHIARAZIONI_ASSENTE");
 const s=api.validate(state),d=s.records.find(x=>x.id===id);if(!d)fail("PRATICA_ASSENTE");
 if(!graph||!(graph.clients||[]).some(x=>x.id===d.clientId)||!(graph.sites||[]).some(x=>x.id===d.siteId&&x.clientId===d.clientId))fail("ANAGRAFICA_INCOERENTE");
 if(d.systemId&&!(graph.systems||[]).some(x=>x.id===d.systemId&&x.siteId===d.siteId))fail("IMPIANTO_INCOERENTE");
 const inspection=api.inspect(d,docs),doc=(docs?.documents||[]).find(x=>x.id===d.documentId);
 const issues=[...inspection.missing];
 if(d.status!=="pronta_per_revisione")issues.push("REVISIONE_UMANA_NON_PREPARATA");
 if(!doc||doc.type!==d.kind||doc.clientId!==d.clientId||doc.siteId!==d.siteId||doc.status!=="archiviato"||!doc.pdf)issues.push("PDF_NON_VALIDATO");
 const linked=(docs?.documents||[]).filter(x=>x.clientId===d.clientId&&x.siteId===d.siteId&&x.id!==d.documentId).map(x=>({id:x.id,type:x.type,status:x.status,pdfPresent:!!x.pdf}));
 const unique=[...new Set(issues)];
 return {schema:"ITE_DECLARATION_HANDOVER_293",mode:"TEST_ONLY_NO_LEGAL_VALIDITY",declaration:{id:d.id,kind:d.kind,title:d.title,clientId:d.clientId,siteId:d.siteId,systemId:d.systemId||null,status:d.status,revision:s.revision,fields:clone(d.fields),evidence:clone(d.evidence)},primaryDocument:doc?{id:doc.id,type:doc.type,status:doc.status,pdfPresent:!!doc.pdf}:null,relatedDocuments:linked,issues:unique,readyForTechnicalReview:unique.length===0,integrityVerified:false,legalValidity:false,notice:"Manifest interno TEST: non attesta integrità PDF, firma, conformità normativa o emissione; preservare moduli 2.7.5."};
}
async function verifyPdf(packet,readPdf,sha256){
 if(!packet||packet.schema!=="ITE_DECLARATION_HANDOVER_293")fail("PACCHETTO_NON_VALIDO");
 if(typeof readPdf!=="function"||typeof sha256!=="function")fail("VERIFICA_NON_DISPONIBILE");
 const p=clone(packet);p.integrityVerified=false;
 if(!p.primaryDocument||!p.primaryDocument.pdfPresent){p.issues=[...new Set([...p.issues,"PDF_ASSENTE"])];return p;}
 const result=await readPdf(p.primaryDocument.id);if(!result||!result.bytes||!result.expectedHash){p.issues=[...new Set([...p.issues,"PDF_NON_LEGGIBILE_O_HASH_ASSENTE"])];return p;}
 const actual=String(await sha256(result.bytes)).toLowerCase(),expected=String(result.expectedHash).toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(expected)||actual!==expected){p.issues=[...new Set([...p.issues,"PDF_HASH_NON_COINCIDENTE"])];return p;}
 p.integrityVerified=true;p.pdfSha256=actual;return p;
}
function manifest(packet){if(!packet||packet.schema!=="ITE_DECLARATION_HANDOVER_293")fail("PACCHETTO_NON_VALIDO");const p=clone(packet);p.canIssue=false;p.canSign=false;p.canDeliverOfficial=false;return p;}
return Object.freeze({prepare,verifyPdf,manifest});
});