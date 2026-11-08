/* node test-pdf-handoff-98.js — only synthetic records */
const assert=require("node:assert/strict"),h=require("./ite-pdf-handoff-98.js");
const r={schema:"ITE-PDF-REVIEW-TEST-97",documentId:"TEST-DOC-001",type:"PROFORMA",fields:{number:"PR-01",date:"01/11/2026",amount:"120,00"},operator:"Operatore TEST",reason:"Verifica TEST",reviewed:true,source:"TEST_REVIEW_ONLY",officialReady:false,accounted:false};
const l=[{documentId:r.documentId,clientId:"TEST-CLI-001",siteId:"TEST-SED-001",plantId:"TEST-IMP-001"}];
const b=h.stage([r],l,"Tecnico TEST");assert.equal(h.preview(b).ready,1);assert.equal(b.items[0].destination,"PROFORMA");assert.equal(b.items[0].accounted,false);
assert.deepEqual(h.importJSON(h.exportJSON(b)),b);
assert.equal(h.preview(h.stage([r],[],"Tecnico TEST")).blocked,1);
assert.throws(()=>h.stage([r,r],l,"Tecnico TEST"),/duplicati/);
assert.throws(()=>h.stage([{...r,officialReady:true}],l,"Tecnico TEST"));
assert.throws(()=>h.stage([r],[{...l[0],siteId:"INVALID"}],"Tecnico TEST"));
assert.throws(()=>h.stage([r],l,""));
assert.throws(()=>h.importJSON(JSON.stringify({...b,accounted:true})));
assert.equal(r.accounted,false);console.log("PDF handoff 98: TEST PASS");
