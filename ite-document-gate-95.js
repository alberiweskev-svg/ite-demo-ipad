/* I.T.E. 4.0.95 — gate di completezza documentale TEST, senza alterare archivi. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentGate95=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){
"use strict";
const VALID=new Set(["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","CAD","FATTURA_VENDITA","FATTURA_ACQUISTO","PROFORMA","NOTA_CREDITO_TD04","LISTINO"]);
function evaluate(manifest,links,ledger,reviews){
 const I=root.ITEDocumentIntake90,L=root.ITEDocumentLinks93,S=root.ITEServiceLedger40,R=root.ITEDocumentReview92;
 if(!I||!L||!S||!R)throw Error("Dipendenze documentali mancanti");
 I.validateManifest(manifest);L.validate(links);S.validate(ledger);if(reviews)R.validate(reviews);
 const audit=L.audit(links,manifest,ledger,reviews);
 const rows=manifest.records.map(doc=>{
  const finding=audit.find(x=>x.documentId===doc.id),issues=[...finding.issues];
  const rev=reviews?R.status(reviews,doc.id):null;
  const reviewed=!!(rev&&rev.action==="REVIEWED");
  const type=finding.type;
  if(!VALID.has(type)&&!issues.includes("REVISIONE_RICHIESTA"))issues.push("TIPO_NON_CONFERMATO");
  if(["PROFORMA","NOTA_CREDITO_TD04"].includes(type)&&!reviewed)issues.push("CONTROLLO_AMMINISTRATIVO_RICHIESTO");
  if(["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","CAD"].includes(type)){issues.push("VERIFICA_TECNICA_PDF_NON_ESEGUITA");if(!reviewed)issues.push("REVISIONE_TECNICA_RICHIESTA");}
  if(!issues.includes("CONTENUTO_PDF_NON_VERIFICATO"))issues.push("CONTENUTO_PDF_NON_VERIFICATO");
  return {id:doc.id,name:doc.name,type,clientId:finding.clientId,appointmentId:finding.appointmentId,reviewed,issues,readyForMetadataArchive:!issues.some(x=>["SENZA_COLLEGAMENTO","COLLEGAMENTO_NON_VALIDO","CLIENTE_MANIFEST_DIFFERENTE","APPUNTAMENTO_MANIFEST_DIFFERENTE","REVISIONE_RICHIESTA","TIPO_NON_CONFERMATO","CONTROLLO_AMMINISTRATIVO_RICHIESTO","REVISIONE_TECNICA_RICHIESTA"].includes(x)),readyForOfficialIssue:false};
 });
 const orphans=audit.filter(x=>x.issues.includes("DOCUMENTO_MANCANTE"));
 return {schema:"ITE-DOCUMENT-GATE-TEST-95",rows,orphans,summary:{total:rows.length,metadataReady:rows.filter(x=>x.readyForMetadataArchive).length,officialReady:0,blocked:rows.filter(x=>!x.readyForMetadataArchive).length,orphanLinks:orphans.length},limitations:["Nessun contenuto PDF verificato","Nessuna validazione normativa o firma digitale","Nessuna emissione ufficiale consentita"]};
}
function filter(report,options){const o=options||{};return report.rows.filter(r=>(!o.clientId||r.clientId===o.clientId)&&(!o.type||r.type===o.type)&&(!o.onlyBlocked||!r.readyForMetadataArchive));}
function exportReport(report){if(!report||report.schema!=="ITE-DOCUMENT-GATE-TEST-95")throw Error("Rapporto non valido");return JSON.stringify(report,null,2);}
return Object.freeze({evaluate,filter,exportReport});
});
