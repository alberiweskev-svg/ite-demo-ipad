/* I.T.E. 4.0.116 — isolated fictional metadata dossier, no PDF upload/storage. */
(function(root){"use strict";
const intake=root.ITE_DocumentIntake114||(typeof require==="function"?require("./ite-document-intake-114.js"):null);
const types=["DICO","DIRI","GAS","POS","FATTURA","PROFORMA","TD04","LISTINO"];
const id=x=>String(x==null?"":x).trim();
const copy=x=>JSON.parse(JSON.stringify(x));
const registryKeys=["clients","sites","plants","equipment","invoices"];
function normalizeRegistry(raw){
 const r={};for(const k of registryKeys){const a=raw&&raw[k];if(!Array.isArray(a)||a.length>10000)throw Error("Archivio "+k+" non valido");r[k]=a.map(x=>({id:id(x.id),clientId:id(x.clientId),siteId:id(x.siteId),plantId:id(x.plantId)}));if(r[k].some(x=>!x.id)||new Set(r[k].map(x=>x.id)).size!==r[k].length)throw Error("ID mancanti o duplicati: "+k);}
 return r;
}
function evaluate(meta,links,registry){
 const r=normalizeRegistry(registry),l=links||{},issues=[];
 const get=(k,key)=>r[k].find(x=>x.id===id(key));
 if(!types.includes(meta&&meta.type))issues.push("Tipo da verificare");
 if(!id(l.clientId))issues.push("Cliente obbligatorio");
 const c=get("clients",l.clientId);if(id(l.clientId)&&!c)issues.push("Cliente inesistente");
 const s=get("sites",l.siteId),p=get("plants",l.plantId),e=get("equipment",l.equipmentId);
 if(id(l.siteId)&&!s)issues.push("Sede inesistente");
 if(s&&(!c||s.clientId!==c.id))issues.push("Sede non appartenente al cliente");
 if(id(l.plantId)&&!p)issues.push("Impianto inesistente");
 if(p&&(!s||p.siteId!==s.id))issues.push("Impianto non appartenente alla sede");
 if(id(l.equipmentId)&&!e)issues.push("Apparecchiatura inesistente");
 if(e&&(!p||e.plantId!==p.id))issues.push("Apparecchiatura non appartenente all'impianto");
 if(["DICO","DIRI","GAS"].includes(meta.type)&&(!s||!p))issues.push("Sede e impianto obbligatori");
 if(meta.type==="TD04"){const inv=get("invoices",l.originalInvoiceId);if(!inv)issues.push("Fattura originaria obbligatoria e presente");else if(!c||inv.clientId!==c.id)issues.push("Fattura originaria di altro cliente");}
 if(["FATTURA","PROFORMA","TD04"].includes(meta.type)&&(!Number.isFinite(meta.total)||meta.total<0))issues.push("Totale fiscale non valido");
 return {ok:issues.length===0,issues};
}
function prepare(entry,links,registry){
 if(!entry||typeof entry!=="object")throw Error("Bozza non valida");
 const meta=intake.extract(String(entry.text||"").slice(0,100000),String(entry.filename||"").slice(0,180));
 const l={};for(const k of ["clientId","siteId","plantId","equipmentId","originalInvoiceId"])if(id(links&&links[k]))l[k]=id(links[k]);
 const validation=evaluate(meta,l,registry);
 return {metadata:meta,links:l,validation,status:validation.ok?"PRONTO_PER_CONFERMA":"DA_VERIFICARE",source:"TEST_LOCAL_ONLY",pdfStored:false};
}
function confirm(draft,operator,registry){
 if(!id(operator))throw Error("Operatore obbligatorio");
 if(!draft||draft.status!=="PRONTO_PER_CONFERMA")throw Error("Bozza non pronta");
 const v=evaluate(draft.metadata,draft.links,registry);if(!v.ok)throw Error("Archivio modificato: "+v.issues.join("; "));
 const d=copy(draft);d.status="CONFERMATO_TEST";d.operator=id(operator).slice(0,80);d.validation=v;return d;
}
function dossier(items,clientId){const a=(items||[]).filter(x=>x.status==="CONFERMATO_TEST"&&x.links&&x.links.clientId===id(clientId));return {clientId:id(clientId),count:a.length,documents:a.map(x=>({type:x.metadata.type,number:x.metadata.number,date:x.metadata.date,links:copy(x.links)})),pdfStored:false};}
const api=Object.freeze({normalizeRegistry,evaluate,prepare,confirm,dossier});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_DocumentIntegrity116=api;
})(typeof globalThis!=="undefined"?globalThis:this);
