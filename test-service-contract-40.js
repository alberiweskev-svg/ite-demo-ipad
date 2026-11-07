"use strict";
const assert=require("node:assert/strict"),test=require("node:test");
const R=require("./ite-service-registry-40.js"),Q=require("./ite-quotes-40.js"),B=require("./ite-service-contract-40.js");
function fixture(){
 let s=R.blank();s=R.add(s,"clients",{id:"TEST-C1",name:"Cliente TEST"});s=R.add(s,"sites",{id:"TEST-S1",clientId:"TEST-C1",name:"Sede"});s=R.add(s,"plants",{id:"TEST-P1",siteId:"TEST-S1",name:"Impianto"});s=R.add(s,"equipment",{id:"TEST-E1",plantId:"TEST-P1",name:"Caldaia"});s=R.add(s,"operators",{id:"TEST-O1",name:"Tecnico"});s=R.appointment(s,{id:"TEST-A1",equipmentId:"TEST-E1",operatorId:"TEST-O1",start:"2026-11-08T08:00",end:"2026-11-08T09:00"});
 let q=Q.create(Q.empty(),{id:"TEST-Q1",customer:"Cliente TEST",date:"2026-11-07"});
 q=Q.addLine(q,"TEST-Q1",{id:"TEST-L1",description:"Fornitura caldaia",kind:"SUPPLY",quantity:1,unitPrice:100,vat:10});
 q=Q.addLine(q,"TEST-Q1",{id:"TEST-L2",description:"Posa caldaia",kind:"INSTALLATION",quantity:1,unitPrice:50,vat:10});
 q=Q.setStatus(Q.setStatus(q,"TEST-Q1","SENT"),"TEST-Q1","ACCEPTED");
 return {s,q};
}
const link=(type,target,id="TEST-LINK1")=>({id,targetType:type,targetId:target,quoteId:"TEST-Q1",createdAt:"2026-11-07T12:55",note:"Associazione esplicita"});
test("appointment and site links deduplicate contract and preserve supply/install totals",()=>{const {s,q}=fixture();let b=B.attach(B.empty(),s,q,link("APPOINTMENT","TEST-A1"));b=B.attach(b,s,q,link("SITE","TEST-S1","TEST-LINK2"));const x=B.summary(b,s,q,"TEST-A1");assert.equal(x.quotes.length,1);assert.equal(x.quotes[0].contractTotal,165);assert.equal(x.quotes[0].links.length,2);assert.equal(B.importJSON(B.exportJSON(b,s,q),s,q).links.length,2);});
test("reject mismatched customer and do not mutate originals",()=>{const {s,q}=fixture();const before=JSON.stringify(B.empty());q.quotes[0].customer="Other TEST";assert.throws(()=>B.attach(B.empty(),s,q,link("SITE","TEST-S1")),/Customer mismatch/);assert.equal(JSON.stringify(B.empty()),before);});
test("reject duplicates and missing service target",()=>{const {s,q}=fixture();const b=B.attach(B.empty(),s,q,link("EQUIPMENT","TEST-E1"));assert.throws(()=>B.attach(b,s,q,link("EQUIPMENT","TEST-E1","TEST-LINK2")),/Duplicate contract/);assert.throws(()=>B.attach(b,s,q,link("SITE","TEST-NO","TEST-LINK3")),/Missing service/);assert.equal(B.detach(b,s,q,"TEST-LINK1").links.length,0);});
test("unlinked appointment and invalid archive",()=>{const {s,q}=fixture();assert.equal(B.summary(B.empty(),s,q,"TEST-A1").unlinked,true);assert.throws(()=>B.importJSON('{"links":[]}',s,q),/Invalid relationship/);});
