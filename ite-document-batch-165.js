/* I.T.E. 4.0.165 — reviewed TEST document batch -> unified commercial archive.
 * Metadata only: never reads/uploads PDF or persists to network/localStorage.
 * Entire batch is validated before returning a new state. */
(function(root){"use strict";
const R=typeof module!=="undefined"&&module.exports?require("./ite-document-register-164.js"):root.ITE_DocumentRegister164;
const I=typeof module!=="undefined"&&module.exports?require("./ite-invoices-151.js"):root.ITE_Invoices151;
const str=x=>String(x??"").trim();
function prepare(rows,companyVat){
 if(!Array.isArray(rows)||!rows.length||rows.length>100)throw Error("LOTTO_NON_VALIDO");
 const ids=new Set(),keys=new Set();
 return rows.map((r,index)=>{
  if(!r||r.confirmed!==true)throw Error("REVISIONE_UMANA_OBBLIGATORIA_RIGA_"+(index+1));
  const v=R.validate(r,companyVat);
  if(v.direction==="DA_VERIFICARE")throw Error("EMITTENTE_DA_VERIFICARE_RIGA_"+(index+1));
  const id=str(r.id)||"DOC-TEST-165-"+String(index+1).padStart(3,"0");
  const key=[v.issuerVat.toUpperCase(),v.number.toUpperCase(),v.date,v.kind].join("|");
  if(ids.has(id)||keys.has(key))throw Error("DUPLICATO_NEL_LOTTO");
  ids.add(id);keys.add(key);
  return {id,number:v.number,documentDate:v.date,issuerVat:v.issuerVat,
   documentType:v.credit?"TD04":v.proforma?"PROFORMA":"FATTURA",
   isProforma:v.proforma,net:v.net,vat:v.vat,gross:v.total,
   clientId:str(r.clientId),siteId:str(r.siteId),appointmentId:str(r.appointmentId),
   note:"Metadati TEST revisionati manualmente"};
 });
}
function preview(state,rows,companyVat){
 if(!state||!Number.isSafeInteger(state.revision))throw Error("STATO_NON_VALIDO");
 const documents=prepare(rows,companyVat), existing=state.commercial?.invoices||[];
 for(const d of documents){
  if(existing.some(x=>x.id===d.id||(
    x.number.toUpperCase()===d.number.toUpperCase()&&
    x.issuerVat.toUpperCase()===d.issuerVat.toUpperCase()&&
    x.documentDate===d.documentDate)))throw Error("DOCUMENTO_GIA_PRESENTE");
 }
 return {revision:state.revision,documents,counts:{total:documents.length,credit:documents.filter(x=>x.documentType==="TD04").length,proforma:documents.filter(x=>x.isProforma).length}};
}
function commit(state,plan,actor,companyVat,expectedRevision){
 if(!str(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(!plan||plan.revision!==expectedRevision||state?.revision!==expectedRevision)throw Error("ANTEPRIMA_SCADUTA");
 if(!Array.isArray(plan.documents)||!plan.documents.length)throw Error("LOTTO_NON_VALIDO");
 // Revalidate the plan against current archive and against the 164 classifier.
 const rows=plan.documents.map(d=>({id:d.id,number:d.number,date:d.documentDate,
  issuerVat:d.issuerVat,type:d.documentType,net:d.net,vat:d.vat,total:d.gross,
  clientId:d.clientId,siteId:d.siteId,appointmentId:d.appointmentId,confirmed:true}));
 const checked=preview(state,rows,companyVat);
 if(JSON.stringify(checked.documents)!==JSON.stringify(plan.documents))throw Error("ANTEPRIMA_MANOMESSA");
 let next=state;
 for(const d of checked.documents)next=I.saveDocument(next,d,actor,next.revision,companyVat);
 return {state:next,imported:checked.documents.length,revision:next.revision};
}
const api=Object.freeze({prepare,preview,commit});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_DocumentBatch165=api;
})(typeof globalThis!=="undefined"?globalThis:this);
