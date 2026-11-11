/* I.T.E. 4.0.167 — local multi-XML FatturaPA intake; metadata only. */
(function(root){"use strict";
const P=typeof module!=="undefined"&&module.exports?require("./ite-fatturapa-166.js"):root.ITE_FatturaPA166;
const B=typeof module!=="undefined"&&module.exports?require("./ite-document-batch-165.js"):root.ITE_DocumentBatch165;
function extract(files){
 if(!Array.isArray(files)||files.length<1||files.length>50)throw Error("NUMERO_FILE_NON_VALIDO");
 const names=new Set(),keys=new Set();
 return files.map((f,i)=>{
  if(!f||typeof f.name!=="string"||!f.name.toLowerCase().endsWith(".xml")||typeof f.text!=="string")throw Error("FILE_NON_VALIDO_"+(i+1));
  if(f.text.length>2000000)throw Error("FILE_TROPPO_GRANDE_"+(i+1));
  const name=f.name.trim().toLowerCase();if(names.has(name))throw Error("NOME_FILE_DUPLICATO");names.add(name);
  const doc=P.parse(f.text),key=[doc.issuerVat,doc.number,doc.date,doc.type].join("|").toUpperCase();
  if(keys.has(key))throw Error("DOCUMENTO_DUPLICATO_NEL_LOTTO");keys.add(key);
  return {...doc,id:"XML-TEST-167-"+String(i+1).padStart(3,"0")+"-"+doc.date.replace(/-/g,"")+"-"+doc.number.replace(/[^a-z0-9]/gi,"").slice(0,25),fileName:f.name};
 });
}
function preview(state,extracted,companyVat){
 if(!Array.isArray(extracted)||!extracted.length||extracted.some(x=>x.confirmed!==true))throw Error("REVISIONE_UMANA_OBBLIGATORIA");
 return B.preview(state,extracted.map(({fileName,...row})=>row),companyVat);
}
function commit(state,plan,actor,companyVat){return B.commit(state,plan,actor,companyVat,plan.revision);}
const api=Object.freeze({extract,preview,commit});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_FatturaPABatch167=api;
})(typeof globalThis!=="undefined"?globalThis:this);
