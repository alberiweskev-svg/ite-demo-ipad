/* I.T.E. 4.0.147 regression: lifecycle console data contract, fake-only. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const L=require("./ite-lifecycle-146.js");
const state={schema:"ITE_OPERATIONS_123",revision:2,field:{catalog:{clients:[{id:"C",name:"Cliente Fittizio"}],sites:[{id:"S",clientId:"C"}],systems:[{id:"P",siteId:"S"}],equipment:[{id:"E",systemId:"P"}],operators:[{id:"O"}],appointments:[{id:"A",clientId:"C",siteId:"S",systemId:"P",equipmentId:"E",operatorId:"O",startAt:"2026-11-10T08:00",endAt:"2026-11-10T09:00",status:"APERTO"}],interventions:[]}},commercial:{extras:[],estimates:[],invoices:[]},technicalReports:[]};
const result=L.all(state);assert.equal(result.length,1);assert.equal(result[0].rows[0].operatorId,"O");
const bad=structuredClone(state);bad.field.catalog.appointments[0].operatorId="MISSING";assert(result[0].counts.issues===0);assert(L.build(bad,"C").issues.some(x=>x.code==="OPERATORE_ASSENTE"));
const html=fs.readFileSync("index.html","utf8");assert(html.includes('ite-lifecycle-146.js'));assert(html.includes('ite-lifecycle-ui-147.js'));
const ui=fs.readFileSync("ite-lifecycle-ui-147.js","utf8");assert(ui.includes("ITE_UnifiedSession129"));assert(ui.includes("ITE_Lifecycle146"));assert(ui.includes("textContent"));assert(!ui.includes("innerHTML"));assert(!ui.includes("localStorage"));
console.log("ITE 4.0.147 lifecycle UI contract: OK");
