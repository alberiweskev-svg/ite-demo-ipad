/* I.T.E. 4.0.120 — explicit TEST field workspace -> document registry adapter. No storage or network. */
(function(root){"use strict";
const clean=v=>String(v==null?"":v).trim();
const copy=v=>JSON.parse(JSON.stringify(v));
function convert(input){
 if(!input||typeof input!=="object")throw Error("WORKSPACE_NON_VALIDO");
 if(input.schema&&input.schema!=="ITE_FIELD_WORKSPACE_V1")throw Error("SCHEMA_NON_SUPPORTATO");
 const catalog=input.catalog||input;
 if(!catalog||!Array.isArray(catalog.clients)||!Array.isArray(catalog.sites)||!Array.isArray(catalog.systems)||!Array.isArray(catalog.equipment))throw Error("CATALOGO_INCOMPLETO");
 const mapped={
  clients:catalog.clients.map(x=>({id:clean(x.id)})),
  sites:catalog.sites.map(x=>({id:clean(x.id),clientId:clean(x.clientId)})),
  plants:catalog.systems.map(x=>({id:clean(x.id),siteId:clean(x.siteId)})),
  equipment:catalog.equipment.map(x=>({id:clean(x.id),plantId:clean(x.systemId)})),
  invoices:[]
 };
 const all=(rows,key)=>new Map(rows.map(x=>[x.id,x[key]]));
 const c=new Set(mapped.clients.map(x=>x.id)),s=all(mapped.sites,"clientId"),p=all(mapped.plants,"siteId"),e=all(mapped.equipment,"plantId");
 for(const key of Object.keys(mapped)){
  const rows=mapped[key];if(rows.some(x=>!x.id)||new Set(rows.map(x=>x.id)).size!==rows.length)throw Error("ID_DUPLICATI_O_VUOTI:"+key);
 }
 if([...s.values()].some(x=>!c.has(x)))throw Error("SEDE_CLIENTE_NON_VALIDO");
 if([...p.values()].some(x=>!s.has(x)))throw Error("IMPIANTO_SEDE_NON_VALIDO");
 if([...e.values()].some(x=>!p.has(x)))throw Error("APPARECCHIATURA_IMPIANTO_NON_VALIDO");
 return copy(mapped);
}
function addInvoices(registry,invoices){
 const r=copy(registry);
 if(!Array.isArray(invoices)||invoices.length>10000)throw Error("FATTURE_NON_VALIDE");
 const clients=new Set(r.clients.map(x=>x.id));
 r.invoices=invoices.map(x=>({id:clean(x.id),clientId:clean(x.clientId)}));
 if(r.invoices.some(x=>!x.id||!clients.has(x.clientId))||new Set(r.invoices.map(x=>x.id)).size!==r.invoices.length)throw Error("FATTURE_NON_COERENTI");
 return r;
}
function audit(state,registry){
 const integrity=root.ITE_DocumentIntegrity116||(typeof require==="function"?require("./ite-document-integrity-116.js"):null);
 if(!state||!state.batch||!Array.isArray(state.batch.documents))throw Error("REVISIONE_NON_VALIDA");
 const docs=state.batch.documents.map(d=>{
  const check=integrity.evaluate(d.metadata,d.links,registry);
  return {key:d.key,status:d.status,valid:check.ok,issues:check.issues,staleConfirmation:d.status==="CONFERMATO_TEST"&&!check.ok};
 });
 return {total:docs.length,invalid:docs.filter(x=>!x.valid).length,staleConfirmations:docs.filter(x=>x.staleConfirmation).length,documents:docs,pdfStored:false,readOnly:true};
}
const api=Object.freeze({convert,addInvoices,audit});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_DocumentRegistryBridge120=api;
})(typeof globalThis!=="undefined"?globalThis:this);
