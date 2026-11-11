/* I.T.E. 4.0.169 — guarded XML review and reconciliation; TEST metadata only. */
(function(root){"use strict";
const X=typeof module!=="undefined"&&module.exports?require("./ite-fatturapa-batch-167.js"):root.ITE_FatturaPABatch167;
const R=typeof module!=="undefined"&&module.exports?require("./ite-xml-reconcile-168.js"):root.ITE_XmlReconcile168;
const str=x=>String(x??"").trim();
function review(state,files,companyVat){
 const extracted=X.extract(files);
 const reconciliation=R.reconcile(state,extracted,companyVat);
 return {revision:state.revision,extracted,reconciliation,eligible:reconciliation.results.filter(x=>x.status==="NUOVO").map(x=>x.index-1),blocked:reconciliation.results.filter(x=>x.status!=="NUOVO")};
}
function register(state,reviewed,confirmed,actor,companyVat){
 if(!reviewed||state.revision!==reviewed.revision)throw Error("REVISIONE_SCADUTA");
 if(!str(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(!Array.isArray(confirmed)||confirmed.length!==reviewed.eligible.length||!confirmed.every(x=>x===true))throw Error("CONFERME_OBBLIGATORIE");
 const fresh=R.reconcile(state,reviewed.extracted,companyVat);
 if(JSON.stringify(fresh.results)!==JSON.stringify(reviewed.reconciliation.results))throw Error("RICONCILIAZIONE_CAMBIATA");
 if(!reviewed.eligible.length)throw Error("NESSUN_DOCUMENTO_NUOVO");
 const rows=reviewed.eligible.map(i=>({...reviewed.extracted[i],confirmed:true}));
 const plan=X.preview(state,rows,companyVat);
 return X.commit(state,plan,actor,companyVat);
}
const api=Object.freeze({review,register});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_XmlReview169=api;
})(typeof globalThis!=="undefined"?globalThis:this);
