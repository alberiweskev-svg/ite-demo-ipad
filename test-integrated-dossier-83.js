"use strict";
const assert=require("node:assert/strict");
const L=require("./ite-service-ledger-40.js"),F=require("./ite-finance-workspace-40.js"),D=require("./ite-integrated-dossier-83.js");
let s=L.empty();const id=x=>"TEST-"+x;
s=L.add(s,"clients",{id:id("C1")});s=L.add(s,"sites",{id:id("S1"),clientId:id("C1")});
s=L.add(s,"plants",{id:id("P1"),siteId:id("S1")});s=L.add(s,"equipment",{id:id("E1"),plantId:id("P1")});
s=L.add(s,"operators",{id:id("O1")});
s=L.add(s,"appointments",{id:id("A1"),clientId:id("C1"),siteId:id("S1"),plantId:id("P1"),equipmentId:id("E1"),operatorId:id("O1"),scheduledAt:"2026-11-08T09:00:00"});
const finance=F.empty();let estimates=[];
assert.equal(D.report(s,estimates,finance).rows.length,1);
const estimate={id:id("Q1"),appointmentId:id("A1"),lines:[
{id:id("L1"),type:"FORNITURA",category:"IDRICO",description:"Fornitura TEST",quantity:1,unitPrice:100,status:"PROPOSTA",extra:false},
{id:id("L2"),type:"POSA",category:"IDRICO",description:"Posa TEST",quantity:1,unitPrice:50,status:"PROPOSTA",extra:false},
{id:id("L3"),type:"SMONTAGGIO",category:"IDRICO",description:"Extra TEST",quantity:1,unitPrice:20,status:"PROPOSTA",extra:true}]};
estimates=D.addEstimate(s,estimates,finance,estimate);
assert.equal(D.report(s,estimates,finance).rows[0].approvedCents,0);
estimates=D.decide(s,estimates,finance,id("Q1"),[{lineId:id("L1"),status:"ACCETTATA"},{lineId:id("L2"),status:"ACCETTATA"},{lineId:id("L3"),status:"ACCETTATA"}]);
let r=D.report(s,estimates,finance);
assert.equal(r.rows[0].approvedCents,17000);assert.equal(r.rows[0].extraApprovedCents,2000);
assert.equal(r.rows[0].unbilledCents,17000);
assert.ok(r.warnings.includes("APPROVATO_NON_FATTURATO:TEST-A1"));
assert.deepEqual(D.importEstimates(D.exportEstimates(s,estimates,finance),s,finance),estimates);
assert.throws(()=>D.addEstimate(s,estimates,finance,{...estimate,id:id("Q2"),appointmentId:id("MISSING")}));
assert.throws(()=>D.importEstimates(JSON.stringify({schema:"ITE-INTEGRATED-ESTIMATES-TEST-1",estimates:[{...estimate,appointmentId:id("MISSING")}]}),s,finance));
assert.throws(()=>D.importEstimates('{"schema":"wrong","estimates":[]}',s,finance));
s=L.event(s,id("A1"),"arrived",id("O1"),"2026-11-08T09:00:00");
s=L.event(s,id("A1"),"closed",id("O1"),"2026-11-08T10:30:00");
r=D.report(s,estimates,finance);assert.equal(r.rows[0].workedMinutes,90);assert.equal(r.rows[0].status,"closed");
assert.equal(estimates[0].lines[0].status,"ACCETTATA");
console.log("Integrated dossier 4.0.83: 12 assertions passed");
