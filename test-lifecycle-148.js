/* I.T.E. 4.0.148 regression — fictional records only. Run: node test-lifecycle-148.js */
"use strict";
const assert=require("node:assert/strict");
const audit=require("./ite-lifecycle-146.js");
const state={
 schema:"ITE_OPERATIONS_123",revision:1,
 field:{catalog:{
  clients:[{id:"C1",name:"Cliente Test"}],
  sites:[{id:"S1",clientId:"C1"}],
  systems:[{id:"P1",siteId:"S1"},{id:"P2",siteId:"S1"}],
  equipment:[{id:"E1",systemId:"P1"}],
  operators:[{id:"O1",name:"Tecnico Test"}],
  appointments:[
   {id:"A1",clientId:"C1",siteId:"S1",systemId:"P2",equipmentId:"E1",operatorId:"O1",startAt:"2026-11-11T09:00:00",endAt:"2026-11-11T10:00:00",status:"APERTO"},
   {id:"A2",clientId:"C1",siteId:"S1",systemId:"P1",equipmentId:"",operatorId:"O1",startAt:"2026-11-11T09:30:00",endAt:"2026-11-11T10:30:00",status:"APERTO"}
  ],
  interventions:[]
 }},
 commercial:{extras:[],estimates:[],invoices:[]},technicalReports:[]
};
const snapshot=JSON.stringify(state);
let report=audit.build(state,"C1");
assert(report.rows[0].errors.includes("APPARECCHIATURA_SCOLLEGATA"));
assert(report.rows[0].errors.includes("SOVRAPPOSIZIONE_OPERATORE"));
assert(report.rows[1].errors.includes("SOVRAPPOSIZIONE_OPERATORE"));
state.field.catalog.appointments[1].startAt="2026-11-11T10:00:00";
state.field.catalog.appointments[1].endAt="2026-11-11T11:00:00";
report=audit.build(state,"C1");
assert(!report.rows.some(r=>r.errors.includes("SOVRAPPOSIZIONE_OPERATORE")));
state.field.catalog.appointments[0].endAt="2026-11-11T08:00:00";
report=audit.build(state,"C1");
assert(report.rows[0].errors.includes("FASCIA_ORARIA_NON_VALIDA"));
assert.equal(audit.all(state).length,1);
assert.equal(JSON.parse(audit.verifyExport(report)).clientId,"C1");
assert.notEqual(JSON.stringify(state),snapshot,"fixture modified only by test");
console.log("Lifecycle 4.0.148: 8 checks passed");
