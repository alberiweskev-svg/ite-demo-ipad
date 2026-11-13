/* I.T.E. 4.0.208 — integration smoke and synthetic dossier tests. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),ui=fs.readFileSync("ite-workflow-cockpit-ui-203.js","utf8");
const engine=require("../ite-integrated-workspace-207.js");
assert.ok(html.includes("ite-integrated-workspace-207.js?v=4.0.208"));
assert.ok(html.indexOf("ite-integrated-workspace-207.js")<html.indexOf("ite-workflow-cockpit-ui-203.js"));
for(const fragment of ["W.snapshot(state.field,state.commercial)","W.agendaByOperator(report)","W.commercialByIntervention(report)","W.csvAgenda(report)","W.exportSynthetic(report)","integrated.replaceChildren()"])assert.ok(ui.includes(fragment),fragment);
assert.equal(typeof engine.snapshot,"function");
assert.equal(typeof engine.csvAgenda,"function");
assert.throws(()=>engine.csvAgenda({}),/REPORT_TEST_NON_VALIDO/);
assert.throws(()=>engine.snapshot({clients:[]},{extras:[]}),Error);
console.log("4.0.208 integration smoke: OK");
