"use strict";
const assert=require("node:assert/strict");
const L=require("./ite-service-ledger-40.js");
const E=require("./ite-estimate-finance-40.js");
const F=require("./ite-finance-workspace-40.js");
const D=require("./ite-integrated-dossier-83.js");
const A=require("./ite-shared-audit-88.js");
let s=L.empty();
for(const [key,row] of [
 ["clients",{id:"TEST-C01",name:"Cliente fittizio"}],
 ["sites",{id:"TEST-S01",clientId:"TEST-C01",name:"Sede fittizia"}],
 ["plants",{id:"TEST-P01",siteId:"TEST-S01",name:"Impianto TEST"}],
 ["equipment",{id:"TEST-E01",plantId:"TEST-P01",name:"Generatore TEST"}],
 ["operators",{id:"TEST-O01",name:"Tecnico TEST"}],
 ["appointments",{id:"TEST-A01",clientId:"TEST-C01",siteId:"TEST-S01",plantId:"TEST-P01",equipmentId:"TEST-E01",operatorId:"TEST-O01",scheduledAt:"2026-11-12T09:00:00"}]
])s=L.add(s,key,row);
const f=F.empty(),est=[];
const data=new Map([[A.KEYS.service,L.exportJSON(s)],[A.KEYS.finance,F.exportJSON(f)],[A.KEYS.estimates,D.exportEstimates(s,est,f)]]);
let reads=0,writes=0;
const storage={getItem(k){reads++;return data.has(k)?data.get(k):null;},setItem(){writes++;throw Error("Unexpected write");}};
const result=A.auditStorage(storage);
assert.equal(result.appointmentCount,1);assert.equal(result.estimateCount,0);
assert.equal(result.counts.errors,0);assert.equal(writes,0);assert.equal(reads,3);
assert.equal(A.auditStorage(storage).schema,"ITE-SHARED-AUDIT-TEST-1");
data.delete(A.KEYS.finance);data.delete(A.KEYS.estimates);
const absent=A.auditStorage(storage);
assert(absent.issues.some(x=>x.code==="FINANCE_ARCHIVE_ABSENT"));
assert(absent.issues.some(x=>x.code==="ESTIMATES_ARCHIVE_ABSENT"));
data.delete(A.KEYS.service);
assert.throws(()=>A.auditStorage(storage),/Fascicolo TEST assente/);
data.set(A.KEYS.service,"x".repeat(1000001));
assert.throws(()=>A.auditStorage(storage),/oltre 1 MB/);
assert.equal(writes,0);
console.log("Shared audit 4.0.88: PASS (read-only, missing archives, size limits, shared IDs)");
