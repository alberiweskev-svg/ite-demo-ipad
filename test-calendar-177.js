/* I.T.E. 4.0.177 — deterministic calendar tests, fictitious data only. */
const assert=require("node:assert/strict"),C=require("./ite-calendar-177.js"),F=require("./ite-field-operations-171.js");
let s=F.empty();function add(kind,item){s=F.add(s,s.revision,"TEST",kind,item).state}
add("clients",{id:"C1",name:"Cliente Fittizio"});add("sites",{id:"S1",name:"Sede TEST",clientId:"C1"});add("systems",{id:"I1",name:"Impianto TEST",siteId:"S1"});add("equipment",{id:"E1",name:"Generatore TEST",systemId:"I1"});add("operators",{id:"O1",name:"Tecnico TEST"});
add("appointments",{id:"A1",clientId:"C1",siteId:"S1",equipmentId:"E1",operatorId:"O1",start:"2026-11-12T09:00:00Z",end:"2026-11-12T10:30:00Z"});
assert.deepEqual(C.range("2026-11-12","settimana"),{first:"2026-11-09",last:"2026-11-15"});
assert.deepEqual(C.range("2026-02-12","mese"),{first:"2026-02-01",last:"2026-02-28"});
assert.equal(C.project(s,"2026-11-12","giorno").totals.plannedMinutes,90);
assert.equal(C.project(s,"2026-11-13","giorno").rows.length,0);
assert.equal(C.project(s,"2026-11-12","mese","O1").rows[0].client,"Cliente Fittizio");
assert.throws(()=>C.project(s,"2026-11-12","giorno","MISSING"),/TECNICO_NON_TROVATO/);
assert.throws(()=>C.range("2026-02-30","mese"),/PERIODO_NON_VALIDO/);
const old=JSON.stringify(s);C.project(s,"2026-11-12","settimana");assert.equal(JSON.stringify(s),old);
s=F.arrive(s,s.revision,"O1","A1","2026-11-12T09:05:00Z").state;s=F.close(s,s.revision,"O1","INT-A1","2026-11-12T10:05:00Z").state;
assert.equal(C.project(s,"2026-11-12","giorno").totals.workedMinutes,60);
console.log("PASS: calendar 177");
