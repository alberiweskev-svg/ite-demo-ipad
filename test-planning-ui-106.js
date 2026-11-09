/* Static integration checks; full browser/Safari E2E remains pending. */
const assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),ui=fs.readFileSync("ite-planning-ui-106.js","utf8");
assert(html.includes('ite-planning-105.js?v=4.0.106'));
assert(html.includes('ite-planning-ui-106.js?v=4.0.106'));
assert(html.indexOf('ite-workflow-100.js')<html.indexOf('ite-planning-105.js?v=4.0.106'));
assert(html.indexOf('ite-planning-105.js?v=4.0.106')<html.indexOf('ite-planning-ui-106.js?v=4.0.106'));
for(const symbol of ["createAppointment","reviseAppointment","startJob","closeJob","dossier"])assert(ui.includes("PLAN."+symbol),symbol);
assert(ui.includes("ITE-WORKFLOW-TEST-101"));
assert(ui.includes("API.importJSON"));
assert(ui.includes("API.exportJSON"));
assert(!ui.includes("fetch("));
assert(!ui.includes("XMLHttpRequest"));
console.log("Planning UI 106 static integration: OK");
