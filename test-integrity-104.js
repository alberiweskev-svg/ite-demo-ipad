const assert=require("node:assert/strict"),base=require("./ite-workflow-100.js"),engine=require("./ite-integrity-104.js");
let s=base.fresh();assert.equal(engine.audit(s).issues.length,0);
function add(k,r){s=base.transact(s,k,r,"Operatore TEST",s.revision);}
add("clients",{id:"TEST-CLIENT-001",name:"Cliente fittizio"});
add("sites",{id:"TEST-SITE-001",name:"Sede fittizia",clientId:"TEST-CLIENT-001"});
add("plants",{id:"TEST-PLANT-001",name:"Impianto fittizio",clientId:"TEST-CLIENT-001",siteId:"TEST-SITE-001"});
add("devices",{id:"TEST-DEVICE-001",name:"Caldaia fittizia",clientId:"TEST-CLIENT-001",plantId:"TEST-PLANT-001"});
add("operators",{id:"TEST-OPERATOR-001",name:"Tecnico fittizio"});
const a={clientId:"TEST-CLIENT-001",siteId:"TEST-SITE-001",plantId:"TEST-PLANT-001",deviceId:"TEST-DEVICE-001",operatorId:"TEST-OPERATOR-001"};
add("appointments",{...a,id:"TEST-APPT-001",startsAt:"2026-11-10T09:00:00Z",endsAt:"2026-11-10T10:00:00Z"});
add("appointments",{...a,id:"TEST-APPT-002",startsAt:"2026-11-10T09:30:00Z",endsAt:"2026-11-10T11:00:00Z"});
add("documents",{id:"TEST-DOC-001",clientId:"TEST-CLIENT-001",officialReady:false,accounted:false});
const before=JSON.stringify(s),report=engine.audit(s);assert(report.issues.some(x=>x.code==="OVERLAP"));assert.equal(report.collisions.length,1);assert.equal(JSON.stringify(s),before);
const damaged=JSON.parse(JSON.stringify(s));damaged.records.documents[0].plantId="TEST-PLANT-MISSING";assert(engine.audit(damaged).issues.some(x=>x.code==="PLANT"));assert.equal(report.readyForOfficialUse,false);
console.log("Integrity 104: OK");
