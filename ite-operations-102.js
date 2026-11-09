/* I.T.E. 4.0.102 — TEST operations lifecycle, never official records. */
(function(root,factory){const api=factory(root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-workflow-100.js"));root.ITEOperations102=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
if(!base)throw Error("ITEWorkflow100 required");
const clone=x=>JSON.parse(JSON.stringify(x));
const kinds=["appointments","interventions","quotes","extras"];
const allowed={appointments:["PROGRAMMATO","CONFERMATO","ANNULLATO","CONCLUSO"],interventions:["APERTO","IN_CORSO","CHIUSO","REVISIONATO"],quotes:["DA_ACCETTARE","ACCETTATO","NON_ACCETTATO"],extras:["DA_APPROVARE","APPROVATO","PARZIALE","RIFIUTATO"]};
function statusOf(kind,row){return row.status||allowed[kind][0];}
function transition(s,kind,id,status,operator,expected,details={}){
base.validate(s);
if(!kinds.includes(kind)||!allowed[kind].includes(status))throw Error("Stato non ammesso");
if(s.revision!==expected)throw Error("Conflitto revisione");
if(typeof operator!=="string"||!operator.trim()||operator.length>80)throw Error("Operatore obbligatorio");
const next=clone(s),row=next.records[kind].find(x=>x.id===id);
if(!row)throw Error("Registrazione inesistente");
const prev=statusOf(kind,row);
const graph={appointments:{PROGRAMMATO:["CONFERMATO","ANNULLATO"],CONFERMATO:["CONCLUSO","ANNULLATO"],ANNULLATO:[],CONCLUSO:[]},interventions:{APERTO:["IN_CORSO"],IN_CORSO:["CHIUSO"],CHIUSO:["REVISIONATO"],REVISIONATO:["CHIUSO"]},quotes:{DA_ACCETTARE:["ACCETTATO","NON_ACCETTATO"],ACCETTATO:[],NON_ACCETTATO:[]},extras:{DA_APPROVARE:["APPROVATO","PARZIALE","RIFIUTATO"],APPROVATO:[],PARZIALE:["APPROVATO","RIFIUTATO"],RIFIUTATO:[]}};
if(!graph[kind][prev].includes(status))throw Error("Transizione non consentita");
if(kind==="interventions"&&status==="IN_CORSO"&&!row.arrivedAt)throw Error("Ora arrivo obbligatoria");
if(kind==="interventions"&&status==="CHIUSO"&&(!row.arrivedAt||!row.leftAt||Date.parse(row.leftAt)<Date.parse(row.arrivedAt)))throw Error("Orari intervento incompleti");
if(kind==="interventions"&&status==="REVISIONATO"&&(!details.reason||typeof details.reason!=="string"||details.reason.trim().length<5))throw Error("Motivazione revisione obbligatoria");
if(kind==="extras"&&status==="PARZIALE"&&(!Number.isInteger(details.approvedQuantity)||details.approvedQuantity<1||details.approvedQuantity>=row.quantity))throw Error("Quantità approvata parziale non valida");
if(kind==="extras"&&status==="APPROVATO")row.approvedQuantity=row.quantity;
if(kind==="extras"&&status==="PARZIALE")row.approvedQuantity=details.approvedQuantity;
if(kind==="extras"&&status==="RIFIUTATO")row.approvedQuantity=0;
row.status=status;
next.revision++;
next.audit.push({revision:next.revision,kind,id,operator:operator.trim(),action:"STATUS",from:prev,to:status,reason:details.reason||null});
return next;
}
function report(s,clientId){
base.validate(s);
if(clientId&&!s.records.clients.some(x=>x.id===clientId))throw Error("Cliente inesistente");
const filter=k=>s.records[k].filter(x=>!clientId||x.clientId===clientId);
const quoteTotal=filter("quotes").reduce((v,x)=>v+x.unitCents*x.quantity,0);
const extraTotal=filter("extras").reduce((v,x)=>v+x.unitCents*(x.status==="APPROVATO"?x.quantity:x.status==="PARZIALE"?x.approvedQuantity||0:0),0);
const invoiceTotal=filter("invoices").reduce((v,x)=>v+(x.type==="VENDITA"?x.totalCents:x.type==="TD04"?-x.totalCents:0),0);
return {clientId:clientId||null,appointments:filter("appointments").length,interventions:filter("interventions").length,quotesCents:quoteTotal,approvedExtrasCents:extraTotal,netSalesCents:invoiceTotal,unclosedInterventions:filter("interventions").filter(x=>!["CHIUSO","REVISIONATO"].includes(statusOf("interventions",x))).map(x=>x.id),officialReady:false};
}
function history(s,kind,id){base.validate(s);return clone(s.audit.filter(x=>x.kind===kind&&x.id===id));}
return Object.freeze({allowed,statusOf,transition,report,history});
});