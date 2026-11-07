/* node test-service-technical-bridge-40.js — synthetic TEST data only */
"use strict";
const assert=require("node:assert/strict");
const R=require("./ite-service-registry-40.js");
const T=require("./ite-technical-dossier-40.js");
const B=require("./ite-service-technical-bridge-40.js");
let s=R.blank();
for(const [kind,row] of [
 ["clients",{id:"TEST-C1",name:"Cliente Fittizio"}],
 ["sites",{id:"TEST-S1",clientId:"TEST-C1",name:"Sede Fittizia"}],
 ["plants",{id:"TEST-P1",siteId:"TEST-S1",name:"Impianto TEST"}],
 ["equipment",{id:"TEST-E1",plantId:"TEST-P1",name:"Caldaia TEST"}],
 ["operators",{id:"TEST-O1",name:"Operatore TEST"}]
])s=R.add(s,kind,row);
s=R.appointment(s,{id:"TEST-A1",equipmentId:"TEST-E1",operatorId:"TEST-O1",start:"2026-11-07T09:00:00",end:"2026-11-07T10:00:00"});
assert.deepEqual(B.context(s,"TEST-A1"),{clientId:"TEST-C1",siteId:"TEST-S1",plantId:"TEST-P1",equipmentId:"TEST-E1",appointmentId:"TEST-A1"});
assert.equal(s.appointments[0].clientId,undefined,"Source must remain immutable");
let d=T.empty();
d=T.create(d,B.hierarchy(s),{id:"TEST-D1",type:"DICO_IDRICO",title:"Dico di prova",date:"2026-11-07",link:B.context(s,"TEST-A1")},"TEST-O1");
assert.equal(B.reconcile(s,d,"TEST-A1").documents.length,1);
assert.equal(B.audit(s,d).assignedDocuments,1);
assert.equal(B.reconcile(s,d,"TEST-A1").warnings.length,1);
d=T.attach(d,B.hierarchy(s),"TEST-D1",{id:"TEST-F1",name:"fittizio.pdf",mime:"application/pdf",bytes:1234,sha256:"a".repeat(64)},"TEST-O1","2026-11-07");
d=T.transition(d,B.hierarchy(s),"TEST-D1","REVIEW","TEST-O1","2026-11-07");
d=T.transition(d,B.hierarchy(s),"TEST-D1","APPROVED","TEST-O1","2026-11-07");
d=T.transition(d,B.hierarchy(s),"TEST-D1","ARCHIVED","TEST-O1","2026-11-07");
assert.equal(B.reconcile(s,d,"TEST-A1").warnings.length,0);
assert.throws(()=>B.context(s,"TEST-NOT-FOUND"),/not found/);
const corrupted=JSON.parse(JSON.stringify(s));corrupted.appointments[0].siteId="TEST-OTHER";
assert.throws(()=>B.hierarchy(corrupted),/mismatch/);
assert.equal(B.audit(s,T.empty()).totalDocuments,0);
console.log("PASS 4.0.68 technical-service bridge: 9 assertions");
