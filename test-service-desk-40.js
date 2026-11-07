/* Run with: node test-service-desk-40.js */
"use strict";
const assert=require("node:assert/strict"),R=require("./ite-service-registry-40.js"),W=require("./ite-service-workflow-40.js");
let d=R.blank();d=R.add(d,"clients",{id:"TEST-C",name:"Cliente"});d=R.add(d,"sites",{id:"TEST-S",clientId:"TEST-C",name:"Sede"});d=R.add(d,"plants",{id:"TEST-P",siteId:"TEST-S",name:"Impianto"});d=R.add(d,"equipment",{id:"TEST-E",plantId:"TEST-P",name:"Caldaia"});d=R.add(d,"operators",{id:"TEST-O",name:"Tecnico"});d=R.appointment(d,{id:"TEST-A",equipmentId:"TEST-E",operatorId:"TEST-O",start:"2026-11-09T09:00",end:"2026-11-09T10:00"});
assert.equal(W.schedule(d,"2026-11-09T00:00","2026-11-10T00:00").length,1);
assert.throws(()=>R.appointment(d,{id:"TEST-B",equipmentId:"TEST-E",operatorId:"TEST-O",start:"2026-11-09T09:30",end:"2026-11-09T11:00"}),/conflict/);
d=W.work(d,"TEST-A","arrive","TEST-O","2026-11-09T09:01","");
d=W.extraWork(d,"TEST-A","TEST-O","2026-11-09T09:10","Controllo TEST");
d=W.work(d,"TEST-A","close","TEST-O","2026-11-09T09:31","");
assert.equal(W.report(d,"TEST-A").minutes,30);
assert.equal(W.report(d,"TEST-A").extraWork.length,1);
d=W.work(d,"TEST-A","revise","TEST-O","2026-11-09T09:35","Correzione");
d=W.correctTimes(d,"TEST-A","TEST-O","2026-11-09T09:00","2026-11-09T09:30","Orario corretto","2026-11-09T09:36");
d=W.finishRevision(d,"TEST-A","TEST-O","2026-11-09T09:40","");
assert.equal(W.report(d,"TEST-A").intervention.status,"closed");
assert.equal(R.importJSON(R.exportJSON(d)).interventions.length,1);
console.log("Service desk 4.0.63: 8 assertions passed");
