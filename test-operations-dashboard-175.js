/* Synthetic TEST fixtures only. Run: node test-operations-dashboard-175.js */
const assert=require("node:assert/strict");const D=require("./ite-operations-dashboard-175.js");
const f={clients:[{id:"C1"}],sites:[{id:"S1",clientId:"C1"}],systems:[{id:"I1",siteId:"S1"}],equipment:[{id:"E1",systemId:"I1"}],operators:[{id:"O1",name:"Tecnico TEST"}],appointments:[{id:"A1",clientId:"C1",siteId:"S1",equipmentId:"E1",operatorId:"O1",start:"2026-11-12T09:00:00Z",end:"2026-11-12T10:00:00Z",status:"PROGRAMMATO"},{id:"A2",clientId:"C1",siteId:"S1",equipmentId:"E1",operatorId:"O1",start:"2026-11-12T09:30:00Z",end:"2026-11-12T10:30:00Z",status:"PROGRAMMATO"}],interventions:[{id:"V1",appointmentId:"A1",operatorId:"O1",status:"CHIUSO",durationMinutes:45}]};
const e={extras:[{id:"X1",interventionId:"V1"}],quotes:[{id:"Q1",interventionId:"V1",status:"ACCETTATO",totalCents:15000}]};
const original=JSON.stringify({f,e});const r=D.report(f,e,"2026-11-12T00:00:00Z","2026-11-13T00:00:00Z");
assert.equal(r.counts.appointments,2);assert.equal(r.counts.interventions,1);assert.equal(r.counts.extras,1);assert.equal(r.workload[0].scheduledMinutes,120);assert.equal(r.workload[0].workedMinutes,45);assert.equal(r.workload[0].overlaps,1);assert.equal(r.quotes.acceptedCents,15000);assert.equal(r.anomalies.length,0);assert.equal(JSON.stringify({f,e}),original);
assert.equal(D.report(f,e,"2026-11-13","2026-11-14").counts.appointments,0);
assert.throws(()=>D.report(f,e,"2026-11-13","2026-11-12"),/INTERVALLO/);
const bad=JSON.parse(JSON.stringify(f));bad.appointments[0].siteId="WRONG";assert.equal(D.report(bad,e,"2026-11-12","2026-11-13").anomalies.length,1);
console.log("4.0.175 dashboard TEST OK");
