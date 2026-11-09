/* I.T.E. 4.0.108 — integrated service/commercial dossier, TEST only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100,typeof module==="object"&&module.exports?require("./ite-commerce-107.js"):root.ITECommerce107);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEServiceCommerce108=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base,commerce){
"use strict";
if(!base||!commerce)throw Error("Dipendenze 100/107 mancanti");
const clone=x=>JSON.parse(JSON.stringify(x));
const find=(s,k,id)=>s.records[k].find(x=>x.id===id);
const reason=x=>{if(typeof x!=="string"||x.trim().length<5||x.length>500)throw Error("Motivazione obbligatoria (5-500 caratteri)");return x.trim();};
const actor=x=>{if(typeof x!=="string"||!x.trim()||x.length>80)throw Error("Operatore obbligatorio");return x.trim();};
function guard(s,operator,expected){base.validate(s);actor(operator);if(s.revision!==expected)throw Error("Conflitto revisione");}
function job(s,id){const j=find(s,"interventions",id);if(!j)throw Error("Intervento inesistente");return j;}
function validateLink(s,j,q){if(!q||q.clientId!==j.clientId)throw Error("Preventivo cliente non coerente");if(q.interventionId&&q.interventionId!==j.id)throw Error("Preventivo già collegato a un altro intervento");}
function attachQuote(s,interventionId,quoteId,operator,why,expected){
guard(s,operator,expected);const j=job(s,interventionId),q=find(s,"quotes",quoteId);validateLink(s,j,q);reason(why);
const n=clone(s),target=find(n,"quotes",quoteId),before=clone(target);
target.interventionId=interventionId;n.revision++;
n.audit.push({revision:n.revision,kind:"quotes",id:quoteId,operator:actor(operator),action:"LINK_INTERVENTION",reason:reason(why),before,after:clone(target)});
return n;
}
function addQuoteLine(s,interventionId,row,operator,expected){
guard(s,operator,expected);const j=job(s,interventionId);
if(row.clientId!==j.clientId||row.interventionId&&row.interventionId!==interventionId)throw Error("Cliente o intervento incoerente");
return commerce.line(s,"quotes",{...clone(row),interventionId},operator,expected);
}
function addExtra(s,interventionId,row,operator,expected){
guard(s,operator,expected);const j=job(s,interventionId),q=find(s,"quotes",row.quoteId);validateLink(s,j,q);
if(row.clientId!==j.clientId)throw Error("Cliente Extra incoerente");
return commerce.line(s,"extras",{...clone(row),interventionId},operator,expected);
}
function prepareInvoice(s,interventionId,id,operator,expected,type="PROFORMA"){
guard(s,operator,expected);const j=job(s,interventionId);
const quotes=s.records.quotes.filter(q=>q.interventionId===interventionId&&q.clientId===j.clientId&&q.status==="ACCETTATO");
const ids=quotes.map(q=>q.id);
const extras=s.records.extras.filter(e=>e.interventionId===interventionId&&e.clientId===j.clientId&&ids.includes(e.quoteId)&&["APPROVATO","PARZIALE"].includes(e.status));
return commerce.draftInvoice(s,j.clientId,id,operator,expected,{type,quoteIds:ids,extraIds:extras.map(e=>e.id)});
}
function dossier(s,interventionId){
base.validate(s);const j=job(s,interventionId),a=find(s,"appointments",j.appointmentId);
const q=s.records.quotes.filter(x=>x.interventionId===interventionId&&x.clientId===j.clientId);
const e=s.records.extras.filter(x=>x.interventionId===interventionId&&x.clientId===j.clientId&&q.some(y=>y.id===x.quoteId));
const ids=new Set([...q.map(x=>x.id),...e.map(x=>x.id)]);
const invoices=s.records.invoices.filter(x=>x.clientId===j.clientId&&Array.isArray(x.sourceRows)&&x.sourceRows.some(y=>ids.has(y.id)));
const docs=s.records.documents.filter(x=>x.clientId===j.clientId&&(x.interventionId===interventionId||x.appointmentId===j.appointmentId));
return clone({intervention:j,appointment:a||null,client:find(s,"clients",j.clientId),site:find(s,"sites",j.siteId),plant:find(s,"plants",j.plantId),device:find(s,"devices",j.deviceId),quotes:q,extras:e,invoices,documents:docs,totals:{acceptedCents:q.filter(x=>x.status==="ACCETTATO").reduce((n,x)=>n+x.quantity*x.unitCents,0),approvedExtrasCents:e.filter(x=>["APPROVATO","PARZIALE"].includes(x.status)).reduce((n,x)=>n+x.approvedQuantity*x.unitCents,0)},officialReady:false,accounted:false});
}
return Object.freeze({attachQuote,addQuoteLine,addExtra,prepareInvoice,dossier});
});