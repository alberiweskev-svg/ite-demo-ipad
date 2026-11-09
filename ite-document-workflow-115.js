/* I.T.E. 4.0.115 — review queue for fictional metadata only. No PDF bytes, network or persistence. */
(function(root){"use strict";
const intake=root.ITE_DocumentIntake114||(typeof require==="function"?require("./ite-document-intake-114.js"):null);
const TYPES=["DICO","DIRI","GAS","POS","FATTURA","PROFORMA","TD04","LISTINO","DA_VERIFICARE"];
const clean=v=>String(v==null?"":v).trim();
const id=v=>clean(v).slice(0,120);
const clone=v=>JSON.parse(JSON.stringify(v));
function classifyBatch(entries){
 if(!Array.isArray(entries)||entries.length>200)throw Error("Lotto non valido (massimo 200)");
 return entries.map((entry,i)=>{
  if(!entry||typeof entry!=="object")throw Error("Documento non valido");
  const filename=clean(entry.filename).slice(0,180);
  const text=clean(entry.text).slice(0,100000);
  const meta=intake.extract(text,filename);
  return {key:"TEST-"+String(i+1).padStart(4,"0"),metadata:meta,links:{},status:"DA_VERIFICARE",reviewedBy:null,reviewedAt:null,source:"TEST_LOCAL_ONLY",pdfStored:false};
 });
}
function checkRelations(item,registry){
 const m=item.metadata||{}, l=item.links||{}, errors=[];
 const clients=registry.clients||[],sites=registry.sites||[],plants=registry.plants||[],equipment=registry.equipment||[],invoices=registry.invoices||[];
 const has=(arr,key)=>arr.some(x=>id(x.id)===id(key));
 if(l.clientId&&!has(clients,l.clientId))errors.push("Cliente inesistente");
 if(l.siteId){const site=sites.find(x=>id(x.id)===id(l.siteId));if(!site)errors.push("Sede inesistente");else if(l.clientId&&id(site.clientId)!==id(l.clientId))errors.push("Sede di altro cliente")}
 if(l.plantId){const plant=plants.find(x=>id(x.id)===id(l.plantId));if(!plant)errors.push("Impianto inesistente");else if(l.siteId&&id(plant.siteId)!==id(l.siteId))errors.push("Impianto di altra sede")}
 if(l.equipmentId){const eq=equipment.find(x=>id(x.id)===id(l.equipmentId));if(!eq)errors.push("Apparecchiatura inesistente");else if(l.plantId&&id(eq.plantId)!==id(l.plantId))errors.push("Apparecchiatura di altro impianto")}
 if(m.type==="TD04"&&l.originalInvoiceId){const inv=invoices.find(x=>id(x.id)===id(l.originalInvoiceId));if(!inv)errors.push("Fattura originaria inesistente");else if(l.clientId&&id(inv.clientId)!==id(l.clientId))errors.push("TD04 riferita a un altro cliente")}
 return errors;
}
function review(item,changes,registry){
 if(!item||!item.metadata)throw Error("Bozza mancante");
 const next=clone(item), c=changes||{};
 if(c.type!==undefined){if(!TYPES.includes(c.type))throw Error("Tipo documento non valido");next.metadata.type=c.type}
 if(c.links!==undefined){const allowed=["clientId","siteId","plantId","equipmentId","originalInvoiceId"];next.links={};for(const k of allowed)if(c.links[k])next.links[k]=id(c.links[k])}
 if(c.number!==undefined)next.metadata.number=clean(c.number).slice(0,60);
 if(c.date!==undefined)next.metadata.date=clean(c.date).slice(0,30);
 if(c.total!==undefined){const n=Number(c.total);if(!Number.isFinite(n)||n<0)throw Error("Totale non valido");next.metadata.total=Math.round(n*100)/100}
 const base=intake.validate(next.metadata,next.links),relation=checkRelations(next,registry||{});
 const issues=base.issues.concat(relation);
 next.validation={ok:issues.length===0,issues};
 next.status=issues.length?"DA_VERIFICARE":"PRONTO_PER_CONFERMA";
 next.reviewedBy=clean(c.operator).slice(0,80)||null;
 next.reviewedAt=null;
 next.pdfStored=false;
 return next;
}
function approve(item,operator){
 if(!item||item.status!=="PRONTO_PER_CONFERMA"||!item.validation||!item.validation.ok)throw Error("Bozza non validata");
 if(!clean(operator))throw Error("Operatore obbligatorio");
 const next=clone(item);next.status="CONFERMATO_TEST";next.reviewedBy=clean(operator).slice(0,80);next.pdfStored=false;return next;
}
function dossier(items,clientId){
 const list=(items||[]).filter(x=>x.status==="CONFERMATO_TEST"&&(!clientId||id(x.links.clientId)===id(clientId)));
 return {clientId:id(clientId),documents:list.map(x=>({key:x.key,type:x.metadata.type,number:x.metadata.number,date:x.metadata.date,links:clone(x.links),status:x.status})),count:list.length,pdfStored:false};
}
const api=Object.freeze({classifyBatch,checkRelations,review,approve,dossier});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_DocumentWorkflow115=api;
})(typeof globalThis!=="undefined"?globalThis:this);
