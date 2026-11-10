/* 4.0.146 deterministic fake-data regression. */
const assert=require("node:assert/strict"),api=require("./ite-lifecycle-146.js");
const state={schema:"ITE_OPERATIONS_123",revision:7,field:{catalog:{clients:[{id:"C1"}],sites:[{id:"S1",clientId:"C1"}],systems:[{id:"P1",siteId:"S1"}],equipment:[{id:"E1",systemId:"P1"}],operators:[{id:"O1"}],appointments:[{id:"A1",clientId:"C1",siteId:"S1",systemId:"P1",equipmentId:"E1",operatorId:"O1",startAt:"2026-11-10T08:00:00",endAt:"2026-11-10T09:00:00",status:"CHIUSO"}],interventions:[{id:"I1",appointmentId:"A1",status:"CHIUSO",arrivedAt:"2026-11-10T08:00:00",departedAt:"2026-11-10T09:00:00"}]}},commercial:{extras:[],estimates:[],invoices:[]},technicalReports:[{id:"R1",appointmentId:"A1",clientId:"C1",siteId:"S1",systemId:"P1",equipmentId:"E1",operatorId:"O1",status:"COMPLETATO",checks:[{done:true}]}]};
assert.equal(api.build(state,"C1").counts.issues,0);
assert.equal(api.all(state).length,1);
assert.equal(JSON.parse(api.verifyExport(api.build(state,"C1"))).revision,7);
assert.throws(()=>api.build(state,"C2"),/CLIENTE_INESISTENTE/);
const broken=JSON.parse(JSON.stringify(state));broken.technicalReports[0].operatorId="O2";broken.field.catalog.interventions[0].departedAt="2026-11-10T07:00:00";
assert.deepEqual(broken.field.catalog.appointments[0].status,"CHIUSO");
assert.deepEqual(api.build(broken,"C1").issues.map(x=>x.code).sort(),["ORARI_INVERTITI","RAPPORTO_SCOLLEGATO"]);
assert.equal(state.technicalReports[0].operatorId,"O1");
console.log("ITE 4.0.146 lifecycle audit: OK");
