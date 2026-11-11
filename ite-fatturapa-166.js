/* I.T.E. 4.0.166 — local FatturaPA XML intake, metadata only; no upload or persistence.
 * Conservative parser: rejects DTD, malformed/multiple invoice bodies and ambiguous totals. */
(function(root){"use strict";
const s=x=>String(x??"").trim();
function parse(xml){
 if(typeof xml!=="string"||xml.length>2000000||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error("XML_NON_AMMESSO");
 if(typeof DOMParser==="undefined")throw Error("PARSER_XML_NON_DISPONIBILE");
 const doc=new DOMParser().parseFromString(xml,"application/xml");
 if(doc.getElementsByTagName("parsererror").length)throw Error("XML_MALFORMATO");
 const nodes=(parent,name)=>Array.from(parent.getElementsByTagName("*")).filter(n=>n.localName===name);
 const one=(parent,name)=>{const a=nodes(parent,name);if(a.length!==1)throw Error("CAMPO_AMBIGUO_"+name);return a[0]};
 const txt=(parent,name)=>s(one(parent,name).textContent);
 const optional=(parent,name)=>{const a=nodes(parent,name);return a.length===1?s(a[0].textContent):""};
 const bodies=nodes(doc,"FatturaElettronicaBody");
 if(bodies.length!==1)throw Error("NUMERO_CORPI_NON_SUPPORTATO");
 const header=one(doc,"FatturaElettronicaHeader"),body=bodies[0];
 const seller=one(header,"CedentePrestatore"),buyer=one(header,"CessionarioCommittente");
 const vat=p=>{const v=one(p,"IdFiscaleIVA");return txt(v,"IdPaese")+txt(v,"IdCodice")};
 const general=one(body,"DatiGeneraliDocumento"),type=txt(general,"TipoDocumento").toUpperCase();
 if(!["TD01","TD02","TD04","TD24","TD25"].includes(type))throw Error("TIPO_DOCUMENTO_NON_SUPPORTATO");
 const money=x=>{if(!/^-?\d+(?:\.\d{1,2})?$/.test(x))throw Error("IMPORTO_NON_VALIDO");const n=Number(x);if(!Number.isSafeInteger(Math.round(n*100)))throw Error("IMPORTO_NON_VALIDO");return Math.abs(Math.round(n*100))/100};
 const summaries=nodes(body,"DatiRiepilogo");
 if(!summaries.length)throw Error("RIEPILOGO_ASSENTE");
 const sum=k=>Math.round(summaries.reduce((a,n)=>a+Math.round(money(txt(n,k))*100),0))/100;
 const net=sum("ImponibileImporto"),tax=sum("Imposta"),calculated=Math.round((net+tax)*100)/100;
 const declared=optional(general,"ImportoTotaleDocumento");
 if(declared&&Math.abs(money(declared)-calculated)>0.01)throw Error("TOTALI_NON_COERENTI");
 const number=txt(general,"Numero"),date=txt(general,"Data");
 if(!number||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)throw Error("ESTREMI_NON_VALIDI");
 return Object.freeze({number,date,issuerVat:vat(seller),recipientVat:vat(buyer),type:type==="TD04"?"TD04":"FATTURA",sourceType:type,net,vat:tax,total:calculated,confirmed:false,source:"XML_FATTURAPA_LOCALE",reviewRequired:true});
}
const api=Object.freeze({parse});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_FatturaPA166=api;
})(typeof globalThis!=="undefined"?globalThis:this);
