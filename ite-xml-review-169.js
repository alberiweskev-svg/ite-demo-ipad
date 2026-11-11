/* I.T.E. 4.0.170 — atomic XML review: immutable private snapshot and binding to company VAT. TEST only. */
(function(root){"use strict";
const X=typeof module!=="undefined"&&module.exports?require("./ite-fatturapa-batch-167.js"):root.ITE_FatturaPABatch167;
const R=typeof module!=="undefined"&&module.exports?require("./ite-xml-reconcile-168.js"):root.ITE_XmlReconcile168;
const privatePlans=new WeakMap();
const str=x=>String(x??"").trim();
const normalizeVat=x=>str(x).replace(/\s/g,"").toUpperCase();
const clone=x=>JSON.parse(JSON.stringify(x));
function review(state,files,companyVat){
 if(!normalizeVat(companyVat))throw Error("PARTITA_IVA_OBBLIGATORIA");
 const extracted=X.extract(files),reconciliation=R.reconcile(state,extracted,companyVat);
 const eligible=reconciliation.results.filter(x=>x.status==="NUOVO").map(x=>x.index-1);
 const blocked=reconciliation.results.filter(x=>x.status!=="NUOVO");
 const result={revision:state.revision,extracted:clone(extracted),reconciliation:clone(reconciliation),eligible:[...eligible],blocked:clone(blocked)};
 privatePlans.set(result,{revision:state.revision,extracted:clone(extracted),results:clone(reconciliation.results),eligible:[...eligible],companyVat:normalizeVat(companyVat)});
 return result;
}
function register(state,reviewed,confirmed,actor,companyVat){
 const original=reviewed&&privatePlans.get(reviewed);
 if(!original)throw Error("ANTEPRIMA_NON_AUTENTICA");
 if(!state||state.revision!==original.revision)throw Error("REVISIONE_SCADUTA");
 if(!str(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(normalizeVat(companyVat)!==original.companyVat)throw Error("PARTITA_IVA_CAMBIATA");
 if(!original.eligible.length)throw Error("NESSUN_DOCUMENTO_NUOVO");
 if(!Array.isArray(confirmed)||confirmed.length!==original.eligible.length||!confirmed.every(x=>x===true))throw Error("CONFERME_OBBLIGATORIE");
 const fresh=R.reconcile(state,original.extracted,companyVat);
 if(JSON.stringify(fresh.results)!==JSON.stringify(original.results))throw Error("RICONCILIAZIONE_CAMBIATA");
 const rows=original.eligible.map(i=>({...clone(original.extracted[i]),confirmed:true}));
 const plan=X.preview(state,rows,companyVat);
 return X.commit(state,plan,actor,companyVat);
}
const api=Object.freeze({review,register});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_XmlReview169=api;
})(typeof globalThis!=="undefined"?globalThis:this);
