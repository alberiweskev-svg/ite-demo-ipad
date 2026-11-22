/* I.T.E. 4.0.255 — atomic technical-document registry; metadata only, no PDF bytes. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentRegistry255=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const TYPES=new Set(["DICO","DIRI","POS","CAD","GAS","ALLEGATO"]);
const str=(x,n)=>typeof x==="string"&&x.trim().length>0&&x.length<=n;
const safeName=x=>str(x,255)&&/\.pdf$/i.test(x)&&!/[\\/\x00-\x1f]/.test(x);
const copy=x=>JSON.parse(JSON.stringify(x));
function normalize(s,input){
 if(!input||typeof input!=="object"||!str(input.id,64)||!TYPES.has(input.kind)||!safeName(input.filename)||input.mime!=="application/pdf"||!Number.isSafeInteger(input.bytes)||input.bytes<0||input.bytes>20000000)throw Error("DOCUMENTO_NON_VALIDO");
 if(Object.keys(input).some(k=>["payload","base64","url","data","content","blob","file"].includes(k)))throw Error("CONTENUTO_PDF_NON_AMMESSO");
 if(!str(input.siteId,64))throw Error("SEDE_OBBLIGATORIA");
 const site=s.sites.find(x=>x.id===input.siteId);if(!site)throw Error("SEDE_ASSENTE");
 if(input.clientId&&input.clientId!==site.clientId)throw Error("CLIENTE_SEDE_DIVERSI");
 if(input.interventionId){const i=s.interventions.find(x=>x.id===input.interventionId);if(!i||i.siteId!==site.id)throw Error("INTERVENTO_SEDE_DIVERSI");}
 if(input.equipmentId){const e=s.equipment.find(x=>x.id===input.equipmentId),p=e&&s.plants.find(x=>x.id===e.plantId);if(!p||p.siteId!==site.id)throw Error("APPARECCHIATURA_SEDE_DIVERSA");}
 if(input.version!==undefined&&(!Number.isSafeInteger(input.version)||input.version<1))throw Error("VERSIONE_NON_VALIDA");
 const item={id:input.id.trim(),kind:input.kind,filename:input.filename.trim(),mime:"application/pdf",bytes:input.bytes,siteId:site.id,clientId:site.clientId};
 for(const key of ["interventionId","equipmentId"])if(input[key])item[key]=input[key];
 if(input.version!==undefined)item.version=input.version;
 if(input.replacesId){
  const prev=s.documents.find(x=>x.id===input.replacesId);
  if(!prev||prev.siteId!==site.id||prev.kind!==input.kind||prev.id===item.id)throw Error("REVISIONE_ORIGINE_NON_VALIDA");
  if(s.documents.some(x=>x.replacesId===prev.id))throw Error("REVISIONE_GIA_PRESENTE");
  if(item.version!==undefined&&item.version!==(prev.version||1)+1)throw Error("VERSIONE_NON_SEQUENZIALE");
  item.replacesId=prev.id;item.version=item.version||((prev.version||1)+1);
 }
 return item;
}
function registerBatch(store,inputs){
 if(!Array.isArray(inputs)||!inputs.length||inputs.length>100)throw Error("LOTTO_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const ids=new Set(s.documents.map(x=>x.id));
  for(const raw of inputs){const item=normalize(s,raw);if(ids.has(item.id))throw Error("ID_DOCUMENTO_DUPLICATO");ids.add(item.id);s.documents.push(item);}
 });
}
function dossier(s,siteId){
 const site=s.sites.find(x=>x.id===siteId);if(!site)throw Error("SEDE_ASSENTE");
 const records=s.documents.filter(x=>x.siteId===siteId).map(copy);
 const superseded=new Set(records.map(x=>x.replacesId).filter(Boolean));
 const current=records.filter(x=>!superseded.has(x.id));
 const counts={};for(const kind of TYPES)counts[kind]=current.filter(x=>x.kind===kind).length;
 return {siteId,clientId:site.clientId,total:records.length,current:current.length,counts,records:records.map(x=>({...x,isCurrent:!superseded.has(x.id)}))};
}
function audit(s){
 const issues=[],ids=new Set();
 for(const d of s.documents){
  if(ids.has(d.id))issues.push({id:d.id,code:"ID_DUPLICATO"});ids.add(d.id);
  try{normalize(s,d);}catch(e){issues.push({id:d.id,code:e.message});}
 }
 return issues;
}
function csv(s,siteId){
 const fields=["id","kind","filename","bytes","siteId","clientId","interventionId","equipmentId","version","replacesId","isCurrent"];
 const safe=v=>{let t=String(v??"");if(/^\s*[=+@\-]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};
 return [fields,...dossier(s,siteId).records.map(d=>fields.map(k=>d[k]??""))].map(r=>r.map(safe).join(",")).join("\r\n")+"\r\n";
}
return Object.freeze({registerBatch,dossier,audit,csv});
});
