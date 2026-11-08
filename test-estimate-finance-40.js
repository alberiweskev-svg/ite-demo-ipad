"use strict";
const assert=require("node:assert/strict"),T=require("./ite-estimate-finance-40.js"),W=require("./ite-finance-workspace-40.js");
const sample=[{id:"TEST-EST-01",appointmentId:"TEST-APP-01",lines:[
{id:"TEST-LINE-01",type:"FORNITURA",category:"IDRICO",description:"Lavabo",quantity:1,unitPrice:120,status:"PROPOSTA",extra:false},
{id:"TEST-LINE-02",type:"POSA",category:"IDRICO",description:"Installazione",quantity:2,unitPrice:50,status:"PROPOSTA",extra:true},
{id:"TEST-LINE-03",type:"SMALTIMENTO",category:"IDRICO",description:"Smaltimento",quantity:1,unitPrice:20,status:"RIFIUTATA",extra:true}]}];
assert.equal(T.summarize(sample)[0].proposedCents,24000);
const approved=T.approve(sample,"TEST-EST-01",[{lineId:"TEST-LINE-01",status:"ACCETTATA"},{lineId:"TEST-LINE-02",status:"ACCETTATA"}]);
assert.equal(sample[0].lines[0].status,"PROPOSTA");
assert.equal(T.summarize(approved)[0].approvedCents,22000);
assert.equal(T.summarize(approved)[0].extraApprovedCents,10000);
const empty=T.reconcile(approved,W.empty());
assert.deepEqual(empty.warnings,["APPROVATO_NON_FATTURATO:TEST-APP-01"]);
const archive={documents:[{id:"TEST-DOC-01",partyId:"TEST-PARTY-01",direction:"VENDITA",number:"12",td:"TD01",net:200,tax:20,total:220,paid:50,appointmentId:"TEST-APP-01"}],links:[{appointmentId:"TEST-APP-01",documentId:"TEST-DOC-01"}],recoveries:[]};
const reconciled=T.reconcile(approved,archive);assert.equal(reconciled.appointments[0].unbilledCents,0);assert.equal(reconciled.appointments[0].receivedCents,5000);
assert.throws(()=>T.approve(sample,"TEST-EST-01",[{lineId:"TEST-UNKNOWN",status:"ACCETTATA"}]));
assert.throws(()=>T.approve(sample,"TEST-EST-01",[{lineId:"TEST-LINE-01",status:"ACCETTATA"},{lineId:"TEST-LINE-01",status:"RIFIUTATA"}]));
assert.throws(()=>T.validate([{...sample[0],lines:[{...sample[0].lines[0],type:"FORNITURA",unitPrice:-1}]}]));
assert.throws(()=>T.validate([{...sample[0],lines:[sample[0].lines[0],sample[0].lines[0]]}]));
console.log("Estimate finance TEST: 10 assertions passed");
