/* I.T.E. 4.0.168 — read-only reconciliation of XML intake and commercial archive.
 * No storage, uploads, personal data, or automatic changes to accounting records. */
(function(root){"use strict";
const str=x=>String(x??"").trim();
const vat=x=>str(x).replace(/\s/g,"").toUpperCase();
const cents=x=>{if(typeof x!=="number"||!Number.isFinite(x)||x<0||x>1e9||Math.abs(x*100-Math.round(x*100))>1e-6)throw Error("IMPORTO_NON_VALIDO");return Math.round(x*100)};
const identity=x=>[vat(x.issuerVat),str(x.number).toUpperCase(),str(x.date||x.documentDate)].join("|");
function reconcile(state,extracted,ownVat){
 if(!state||!Array.isArray(state.commercial?.invoices)||!Number.isSafeInteger(state.revision))throw Error("STATO_NON_VALIDO");
 if(!Array.isArray(extracted)||extracted.length>50)throw Error("LOTTO_NON_VALIDO");
 const archive=state.commercial.invoices,seen=new Set(),results=[];
 for(const [index,d] of extracted.entries()){
  if(!d||!str(d.number)||!str(d.date)||!vat(d.issuerVat))throw Error("DOCUMENTO_INCOMPLETO_"+(index+1));
  const key=identity(d);if(seen.has(key))throw Error("DUPLICATO_NEL_LOTTO");seen.add(key);
  const matches=archive.filter(x=>identity(x)===key);
  const kind=d.type==="TD04"?"TD04":d.type==="PROFORMA"?"PROFORMA":"FATTURA";
  const exact=matches.filter(x=>x.documentType===kind);
  const other=matches.filter(x=>x.documentType!==kind);
  const amounts=exact.filter(x=>cents(x.net)===cents(d.net)&&cents(x.vat)===cents(d.vat)&&cents(x.gross)===cents(d.total));
  const status=other.length||exact.length>1?"CONFLITTO_TIPO_O_DUPLICATO":exact.length===1?(amounts.length===1?"GIA_PRESENTE":"IMPORTI_DIFFERENTI"):"NUOVO";
  const direction=vat(d.issuerVat)===vat(ownVat)?"VENDITA":vat(ownVat)?"ACQUISTO":"DA_VERIFICARE";
  results.push(Object.freeze({index:index+1,number:str(d.number),date:str(d.date),type:kind,direction,status,matchedIds:matches.map(x=>x.id)}));
 }
 return Object.freeze({revision:state.revision,results,counts:Object.freeze({new:results.filter(x=>x.status==="NUOVO").length,present:results.filter(x=>x.status==="GIA_PRESENTE").length,conflicts:results.filter(x=>!["NUOVO","GIA_PRESENTE"].includes(x.status)).length}),requiresReview:true});
}
const api=Object.freeze({reconcile});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_XmlReconcile168=api;
})(typeof globalThis!=="undefined"?globalThis:this);
