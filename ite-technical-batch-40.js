/* I.T.E. 4.0.69 — atomic synthetic technical PDF metadata intake.
   Never accepts PDF contents, customer records, URLs or real-world identifiers. */
(function(root,factory){
 const api=factory(typeof module==="object"&&module.exports?require("./ite-technical-dossier-40.js"):root.ITETechnicalDossier40,
 typeof module==="object"&&module.exports?require("./ite-service-technical-bridge-40.js"):root.ITEServiceTechnicalBridge40);
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITETechnicalBatch40=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(T,B){
"use strict";
if(!T||!B)throw Error("Technical dossier dependencies missing");
const clone=x=>JSON.parse(JSON.stringify(x));
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
const HASH=/^[a-f0-9]{64}$/;
const forbidden=/\b(?:data|content|base64|url|blob|pdfBytes|fileData|customerName|address|email|phone)\b/i;
function assert(v,m){if(!v)throw Error(m);}
function safeKeys(obj,allowed){
 assert(obj&&typeof obj==="object"&&!Array.isArray(obj),"Invalid TEST record");
 for(const k of Object.keys(obj))assert(allowed.includes(k)&&!forbidden.test(k),"Unexpected or sensitive field: "+k);
}
function validateBatch(items){
 assert(Array.isArray(items)&&items.length>0&&items.length<=50,"Batch must contain 1–50 TEST documents");
 const ids=new Set(),files=new Set();
 for(const item of items){
  safeKeys(item,["id","appointmentId","type","title","date","attachments"]);
  assert(ID.test(item.id)&&ID.test(item.appointmentId)&&!ids.has(item.id),"Duplicate or invalid TEST document ID");
  ids.add(item.id);
  assert(T.TYPES.includes(item.type),"Unsupported document type");
  assert(typeof item.title==="string"&&item.title.length>=3&&item.title.length<=180,"Invalid title");
  assert(Array.isArray(item.attachments)&&item.attachments.length>0&&item.attachments.length<=20,"PDF metadata required");
  for(const a of item.attachments){
   safeKeys(a,["id","name","mime","bytes","sha256"]);
   assert(ID.test(a.id)&&typeof a.name==="string"&&a.name.toLowerCase().endsWith(".pdf")&&
    a.name.length<=180&&!/[\\/]/.test(a.name),"Invalid PDF filename");
   assert(a.mime==="application/pdf"&&Number.isSafeInteger(a.bytes)&&a.bytes>0&&a.bytes<=25000000,"Invalid PDF metadata");
   assert(HASH.test(a.sha256)&&!files.has(a.sha256),"Duplicate or invalid SHA-256");
   files.add(a.sha256);
  }
 }
 return true;
}
function apply(service,db,items,operatorId){
 assert(ID.test(operatorId),"Synthetic operator ID required");
 validateBatch(items);
 const h=B.hierarchy(service);
 T.validate(db,h);
 assert(!db.documents.some(d=>items.some(i=>i.id===d.id)),"Document already exists");
 const existing=new Set(db.documents.flatMap(d=>d.attachments.map(a=>a.sha256)));
 for(const item of items)for(const a of item.attachments)assert(!existing.has(a.sha256),"PDF fingerprint already registered");
 let next=clone(db);
 // Transaction is immutable: any exception leaves the caller's archive untouched.
 for(const item of items){
  const link=B.context(service,item.appointmentId);
  next=T.create(next,h,{id:item.id,type:item.type,title:item.title,date:item.date,link},operatorId);
  for(const a of item.attachments)next=T.attach(next,h,item.id,a,operatorId,item.date);
 }
 T.validate(next,h);
 return {archive:next,added:items.length,attachments:items.reduce((n,i)=>n+i.attachments.length,0),
  warnings:["Solo metadati TEST; nessun PDF acquisito o archiviato","La verifica del PDF originale e la firma restano manuali"]};
}
function preview(service,db,items,operatorId){
 try{const result=apply(service,db,items,operatorId);return {ok:true,added:result.added,attachments:result.attachments,warnings:result.warnings};}
 catch(e){return {ok:false,error:String(e.message)};}
}
return Object.freeze({validateBatch,apply,preview});
});
