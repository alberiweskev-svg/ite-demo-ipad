/* I.T.E. 4.0.65 — explicit TEST-only service/contract relationships. No network or fiscal emission. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-service-registry-40.js"):root.ITEServiceRegistry40,typeof module==="object"&&module.exports?require("./ite-service-workflow-40.js"):root.ITEServiceWorkflow40,typeof module==="object"&&module.exports?require("./ite-quotes-40.js"):root.ITEQuotes40);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEServiceContract40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(R,W,Q){
"use strict";
if(!R||!W||!Q)throw Error("Required service and quotation engines missing");
const clone=x=>JSON.parse(JSON.stringify(x));
const validId=x=>typeof x==="string"&&/^TEST-[A-Za-z0-9_-]{1,64}$/.test(x);
const fail=s=>{throw Error(s);};
const empty=()=>({schema:"ITE-SERVICE-CONTRACT-TEST-1",links:[]});
function check(db,services,quotes){
 R.check(services);Q.validate(quotes);
 if(!db||db.schema!=="ITE-SERVICE-CONTRACT-TEST-1"||!Array.isArray(db.links)||db.links.length>5000)fail("Invalid relationship archive");
 const seen=new Set();
 for(const l of db.links){
  if(!validId(l.id)||seen.has(l.id))fail("Duplicate/invalid relationship ID");seen.add(l.id);
  if(!["APPOINTMENT","EQUIPMENT","SITE"].includes(l.targetType))fail("Invalid target type");
  const table={APPOINTMENT:"appointments",EQUIPMENT:"equipment",SITE:"sites"}[l.targetType];
  if(!services[table].some(x=>x.id===l.targetId))fail("Missing service target");
  const quote=quotes.quotes.find(q=>q.id===l.quoteId);
  if(!quote)fail("Missing quotation");
  const client=clientFor(services,l.targetType,l.targetId);
  if(client.name.trim().toLocaleLowerCase("it")!==quote.customer.trim().toLocaleLowerCase("it"))fail("Customer mismatch: manual reconciliation required");
  if(typeof l.note!=="string"||l.note.length>500)fail("Invalid note");
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(l.createdAt)||!Number.isFinite(Date.parse(l.createdAt)))fail("Invalid timestamp");
  if(db.links.some(other=>other!==l&&other.targetType===l.targetType&&other.targetId===l.targetId&&other.quoteId===l.quoteId))fail("Duplicate contract association");
 }
 return true;
}
function clientFor(s,type,id){
 let site;
 if(type==="SITE")site=s.sites.find(x=>x.id===id);
 else {const equipment=type==="EQUIPMENT"?s.equipment.find(x=>x.id===id):s.equipment.find(x=>x.id===s.appointments.find(a=>a.id===id)?.equipmentId);const plant=s.plants.find(x=>x.id===equipment?.plantId);site=s.sites.find(x=>x.id===plant?.siteId);}
 const client=s.clients.find(x=>x.id===site?.clientId);
 if(!client)fail("Broken service hierarchy");return client;
}
function attach(db,s,q,input){
 check(db,s,q);
 if(!input||!validId(input.id)||!validId(input.targetId)||!validId(input.quoteId))fail("TEST identifiers required");
 const next=clone(db);next.links.push({id:input.id,targetType:input.targetType,targetId:input.targetId,quoteId:input.quoteId,note:String(input.note||"").slice(0,500),createdAt:input.createdAt});
 check(next,s,q);return next;
}
function detach(db,s,q,id){check(db,s,q);const next=clone(db),n=next.links.length;next.links=next.links.filter(l=>l.id!==id);if(next.links.length===n)fail("Association missing");check(next,s,q);return next;}
function summary(db,s,q,appointmentId){
 check(db,s,q);const ctx=W.context(s,appointmentId);
 const matching=db.links.filter(l=>l.targetType==="APPOINTMENT"&&l.targetId===appointmentId||l.targetType==="EQUIPMENT"&&l.targetId===ctx.equipment.id||l.targetType==="SITE"&&l.targetId===ctx.site.id);
 const unique=[...new Set(matching.map(l=>l.quoteId))];
 return {appointmentId,clientId:ctx.client.id,siteId:ctx.site.id,equipmentId:ctx.equipment.id,quotes:unique.map(id=>{const quote=q.quotes.find(x=>x.id===id);const totals=Q.summarize(q,id);return {id,status:quote.status,contractTotal:totals.contractTotal,approvedExtras:totals.approvedExtras.total,pendingExtras:totals.pendingExtras.total,links:matching.filter(l=>l.quoteId===id).map(l=>l.id)};}),unlinked:unique.length===0};
}
function exportJSON(db,s,q){check(db,s,q);return JSON.stringify(db,null,2);}
function importJSON(json,s,q){if(typeof json!=="string"||json.length>2000000)fail("Archive too large");const db=JSON.parse(json);check(db,s,q);return clone(db);}
return Object.freeze({empty,check,attach,detach,summary,clientFor,exportJSON,importJSON});
});
