/* Node regression for I.T.E. 4.0.140. Run: node test-calendar-140.js */
const assert=require("node:assert/strict");
const F=require("./ite-field-workspace-121.js"),O=require("./ite-operations-123.js"),C=require("./ite-commercial-122.js");
global.ITE_FieldWorkspace121=F;global.ITE_Commercial122=C;global.ITE_Operations123=O;
const K=require("./ite-calendar-140.js");let s=O.empty();
for(const [type,record] of [["ADD_CLIENT",{id:"C1",name:"Cliente Fittizio"}],["ADD_SITE",{id:"S1",clientId:"C1",address:"Via TEST 1"}],["ADD_SYSTEM",{id:"I1",siteId:"S1",description:"Impianto TEST"}],["ADD_OPERATOR",{id:"T1",name:"Tecnico TEST",color:"#336699"}],["SCHEDULE",{id:"A1",clientId:"C1",siteId:"S1",systemId:"I1",operatorId:"T1",startAt:"2026-11-10T09:00:00",endAt:"2026-11-10T10:00:00"}]])s=O.apply(s,{type,record},"TEST");
assert.equal(K.monday("2026-11-10"),"2026-11-09");assert.deepEqual(K.range("2026-11-10","settimana"),["2026-11-09","2026-11-16"]);assert.deepEqual(K.range("2026-02-15","mese"),["2026-02-01","2026-03-01"]);
const v=K.view(s,"2026-11-10","giorno");assert.equal(v.rows.length,1);assert.equal(v.rows[0].client,"Cliente Fittizio");assert.equal(v.load["T1|2026-11-10"],60);assert.equal(v.conflicts.length,0);
assert.equal(K.view(s,"2026-11-11","giorno").rows.length,0);assert.equal(K.view(s,"2026-11-10","giorno","NON_ESISTE").rows.length,0);
s=O.apply(s,{type:"ARRIVE",id:"A1",at:"2026-11-10T09:03:00"},"TEST");assert.equal(K.view(s,"2026-11-10","giorno").rows[0].intervention.status,"APERTO");
assert.throws(()=>K.range("2026-02-30","giorno"),/DATA_NON_VALIDA/);assert.throws(()=>K.range("2026-11-10","anno"),/VISTA_NON_VALIDA/);
console.log("Calendar 4.0.140: OK");
