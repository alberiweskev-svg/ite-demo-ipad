"use strict";
const assert=require("node:assert/strict");
const L=require("./ite-service-ledger-40.js"),C=require("./ite-calendar-84.js");
let s=L.empty();
for(const [key,obj] of [
 ["clients",{id:"TEST-C-01"}],["sites",{id:"TEST-S-01",clientId:"TEST-C-01"}],
 ["plants",{id:"TEST-P-01",siteId:"TEST-S-01"}],["equipment",{id:"TEST-E-01",plantId:"TEST-P-01"}],
 ["operators",{id:"TEST-O-01"}],["operators",{id:"TEST-O-02"}]
])s=L.add(s,key,obj);
function appointment(id,operatorId,scheduledAt,durationMinutes=60){return {id,operatorId,scheduledAt,durationMinutes,clientId:"TEST-C-01",siteId:"TEST-S-01",plantId:"TEST-P-01",equipmentId:"TEST-E-01"};}
s=L.add(s,"appointments",appointment("TEST-A-01","TEST-O-01","2026-11-12T09:00:00"));
s=L.add(s,"appointments",appointment("TEST-A-02","TEST-O-01","2026-11-12T09:30:00"));
s=L.add(s,"appointments",appointment("TEST-A-03","TEST-O-02","2026-11-12T09:30:00"));
s=L.add(s,"appointments",appointment("TEST-A-04","TEST-O-01","2026-11-12T10:00:00"));
let p=C.plan(s);assert.equal(p.rows.length,4);assert.equal(p.conflictPairs,1);
assert.deepEqual(p.rows.find(x=>x.id==="TEST-A-01").conflicts,["TEST-A-02"]);
assert.deepEqual(p.rows.find(x=>x.id==="TEST-A-04").conflicts,[]);
assert.equal(C.plan(s,{operatorId:"TEST-O-02"}).rows.length,1);
assert.equal(C.plan(s,{status:"closed"}).rows.length,0);
assert.equal(C.plan(s,{from:"2026-11-12T11:00:00"}).rows.length,0);
assert.throws(()=>C.plan(s,{operatorId:"TEST-UNKNOWN"}),/Operatore/);
assert.throws(()=>C.plan(s,{defaultMinutes:0}),/Durata/);
assert.throws(()=>C.plan(s,{from:"2026-11-13T09:00:00",to:"2026-11-12T09:00:00"}),/Intervallo/);
const output=C.csv(s);assert(output.startsWith("\uFEFF"));assert(output.includes("TEST-A-01"));assert(output.includes("TEST-A-02"));
assert.equal(C.plan(s).rows.length,4,"Calendar must not mutate service state");
console.log("ITE 4.0.84 calendar regression OK");
