const assert=require("node:assert/strict");
const {test}=require("node:test");
const api=require("../ite-workflows-integrated-40.js");
const id=s=>"TEST-"+s;
const base=()=>({clients:[{id:id("C1")}],sites:[{id:id("S1"),clientId:id("C1")}],plants:[{id:id("P1"),siteId:id("S1")}],equipment:[{id:id("E1"),plantId:id("P1")}],operators:[{id:id("O1")}],appointments:[],interventions:[],estimates:[{id:id("Q1"),clientId:id("C1"),lines:[]}]});
const appointment=(key,start,end)=>({id:id(key),clientId:id("C1"),siteId:id("S1"),equipmentId:id("E1"),operatorId:id("O1"),start,end});
test("flusso completo calendario, arrivo, chiusura, revisione e audit",()=>{
 const b=base(),a=appointment("A1","2026-11-07T08:00","2026-11-07T09:00");
 let d=api.schedule(b,a);assert.equal(b.appointments.length,0);
 d=api.transition(d,a.id,"ARRIVE","2026-11-07T08:05",id("O1"));
 d=api.transition(d,a.id,"CLOSE","2026-11-07T09:10",id("O1"));
 d=api.transition(d,a.id,"REVISE","2026-11-07T09:20",id("O1"),"Correzione rapporto");
 d=api.transition(d,a.id,"CLOSE","2026-11-07T09:30",id("O1"));
 assert.equal(d.interventions[0].history.length,4);assert.equal(d.interventions[0].status,"CLOSED");
});
test("blocca sovrapposizioni, riferimenti incoerenti e operatore errato",()=>{
 let d=api.schedule(base(),appointment("A1","2026-11-07T08:00","2026-11-07T09:00"));
 assert.throws(()=>api.schedule(d,appointment("A2","2026-11-07T08:30","2026-11-07T09:30")),/impegnato/);
 assert.throws(()=>api.transition(d,id("A1"),"ARRIVE","2026-11-07T08:10",id("O2")),/Operatore/);
 assert.throws(()=>api.schedule(d,{...appointment("A3","2026-11-07T10:00","2026-11-07T11:00"),siteId:id("S2")}),/coerente/);
});
test("extra approvati parzialmente e voci economiche distinte",()=>{
 let d=base();d=api.addExtra(d,id("Q1"),{id:id("X1"),amount:150});
 d=api.addExtra(d,id("Q1"),{id:id("X2"),amount:80});
 d=api.approveExtra(d,id("Q1"),id("X1"),true);
 d=api.approveExtra(d,id("Q1"),id("X2"),false);
 assert.equal(api.totals(d,id("Q1")).EXTRA,150);
 assert.throws(()=>api.approveExtra(d,id("Q1"),id("X1"),true),/deciso/);
});
