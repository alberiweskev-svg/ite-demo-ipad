"use strict";
const assert=require("node:assert/strict");
const R=require("./ite-service-registry-40.js");
const T=require("./ite-technical-dossier-40.js");
const B=require("./ite-service-technical-bridge-40.js");
const M=require("./ite-technical-batch-40.js");
let s=R.blank();
for(const [kind,row] of [
 ["clients",{id:"TEST-C1",name:"Cliente Fittizio"}],
 ["sites",{id:"TEST-S1",clientId:"TEST-C1",name:"Sede Fittizia"}],
 ["plants",{id:"TEST-P1",siteId:"TEST-S1",name:"Impianto TEST"}],
 ["equipment",{id:"TEST-E1",plantId:"TEST-P1",name:"Caldaia TEST"}],
 ["operators",{id:"TEST-O1",name:"Operatore TEST"}]
])s=R.add(s,kind,row);
s=R.appointment(s,{id:"TEST-A1",equipmentId:"TEST-E1",operatorId:"TEST-O1",start:"2026-11-07T09:00:00",end:"2026-11-07T10:00:00"});
const doc=(id,hash)=>({id,appointmentId:"TEST-A1",type:"DICO_IDRICO",title:"Dichiarazione TEST",date:"2026-11-07",
 attachments:[{id:"TEST-F"+id.slice(-1),name:"fittizio.pdf",mime:"application/pdf",bytes:1200,sha256:hash.repeat(64)}]});
const empty=T.empty(),batch=[doc("TEST-D1","a"),doc("TEST-D2","b")];
const result=M.apply(s,empty,batch,"TEST-O1");
assert.equal(result.added,2);assert.equal(result.attachments,2);
assert.equal(result.archive.documents.length,2);
assert.equal(result.archive.audit.length,4);
assert.equal(empty.documents.length,0,"Original archive must not mutate");
assert.equal(B.audit(s,result.archive).assignedDocuments,2);
assert.equal(M.preview(s,empty,batch,"TEST-O1").ok,true);
assert.equal(M.preview(s,result.archive,batch,"TEST-O1").ok,false);
assert.throws(()=>M.apply(s,empty,[doc("TEST-D1","a"),doc("TEST-D2","a")],"TEST-O1"),/Duplicate/);
assert.throws(()=>M.apply(s,empty,[{...doc("TEST-D1","a"),appointmentId:"TEST-INVALID"}],"TEST-O1"),/not found/);
assert.throws(()=>M.apply(s,empty,[{...doc("TEST-D1","a"),content:"private"}],"TEST-O1"),/Unexpected/);
assert.throws(()=>M.apply(s,empty,[{...doc("TEST-D1","a"),attachments:[{...doc("TEST-D1","a").attachments[0],url:"https:\/\/example.com"}]}],"TEST-O1"),/Unexpected/);
assert.throws(()=>M.apply(s,empty,[{...doc("TEST-D1","a"),attachments:[{...doc("TEST-D1","a").attachments[0],bytes:26000000}]}],"TEST-O1"),/Invalid PDF/);
assert.equal(empty.audit.length,0);
console.log("PASS I.T.E. 4.0.69 atomic technical metadata batch");
