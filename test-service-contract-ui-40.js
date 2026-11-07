"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const R=require("./ite-service-registry-40.js"),Q=require("./ite-quotes-40.js"),B=require("./ite-service-contract-40.js");
test("4.0.66 single demo mounts both relationship engine and integrated UI in dependency order",()=>{
 const html=fs.readFileSync("index.html","utf8");
 const engine=html.indexOf('src="./ite-service-contract-40.js?v=4.0.66"');
 const ui=html.indexOf('src="./ite-service-contract-ui-40.js?v=4.0.66"');
 assert.ok(engine>0&&ui>engine);
 assert.ok(html.indexOf('src="./ite-service-registry-40.js')<engine);
 assert.ok(html.indexOf('src="ite-quotes-40.js"')<engine);
 assert.ok(html.indexOf('src="./ite-service-desk-ui-40.js')<ui);
});
test("4.0.66 UI synchronizes TEST archives without remote calls or unsafe HTML",()=>{
 const ui=fs.readFileSync("ite-service-contract-ui-40.js","utf8");
 const desk=fs.readFileSync("ite-service-desk-ui-40.js","utf8");
 assert.match(ui,/ite:quotes-updated/);
 assert.match(ui,/ite:service-registry-updated/);
 assert.match(desk,/dispatchEvent\(new CustomEvent\("ite:service-registry-updated"\)\)/);
 assert.match(ui,/B\.attach\(/);
 assert.match(ui,/B\.detach\(/);
 assert.match(ui,/B\.importJSON\(/);
 assert.doesNotMatch(ui,/innerHTML|fetch\(|XMLHttpRequest|eval\(/);
});
test("4.0.66 associations remain immutable, validate customer and deduplicate",()=>{
 let s=R.blank();s=R.add(s,"clients",{id:"TEST-C1",name:"Cliente fittizio"});s=R.add(s,"sites",{id:"TEST-S1",clientId:"TEST-C1",name:"Sede fittizia"});s=R.add(s,"plants",{id:"TEST-P1",siteId:"TEST-S1",name:"Termico"});s=R.add(s,"equipment",{id:"TEST-E1",plantId:"TEST-P1",name:"Caldaia"});s=R.add(s,"operators",{id:"TEST-O1",name:"Tecnico"});s=R.appointment(s,{id:"TEST-A1",equipmentId:"TEST-E1",operatorId:"TEST-O1",start:"2026-11-08T08:00",end:"2026-11-08T09:00"});
 let q=Q.create(Q.empty(),{id:"TEST-Q1",customer:"Cliente fittizio",date:"2026-11-07"});q=Q.addLine(q,"TEST-Q1",{id:"TEST-L1",description:"Fornitura",kind:"SUPPLY",quantity:1,unitPrice:100,vat:10});q=Q.addLine(q,"TEST-Q1",{id:"TEST-L2",description:"Posa",kind:"INSTALLATION",quantity:1,unitPrice:50,vat:10});
 const before=B.empty(),l={id:"TEST-LINK1",targetType:"APPOINTMENT",targetId:"TEST-A1",quoteId:"TEST-Q1",createdAt:"2026-11-07T13:54:00Z",note:"TEST"};
 const next=B.attach(before,s,q,l);assert.equal(before.links.length,0);assert.equal(B.summary(next,s,q,"TEST-A1").quotes[0].contractTotal,165);
 assert.throws(()=>B.attach(next,s,q,{...l,id:"TEST-LINK2"}),/Duplicate/);
 assert.equal(B.detach(next,s,q,"TEST-LINK1").links.length,0);
});
