/* Node regression: run after test-unified-129.js and test-guided-130.js. */
const assert=require("node:assert/strict");
require("./ite-field-workspace-121.js");require("./ite-commercial-122.js");require("./ite-operations-123.js");require("./ite-audit-124.js");
const D=require("./ite-dashboard-131.js"),O=globalThis.ITE_Operations123;
const empty=O.empty();const a=D.view(empty);
assert.equal(a.revision,0);assert.equal(a.clients.length,0);assert.equal(a.appointments.length,0);
assert.equal(a.invoices.length,0);assert.equal(a.dossier,null);
assert.throws(()=>D.view(empty,{clientId:"MISSING"}),/CLIENTE_INESISTENTE/);
assert.throws(()=>D.view({...empty,revision:1}),/AUDIT_NON_SUPERATO/);
const one=O.apply(empty,{type:"ADD_CLIENT",record:{id:"C-TEST",name:"Cliente inventato"}},"Tecnico TEST");
const v=D.view(one,{clientId:"C-TEST"});
assert.equal(v.clients.length,1);assert.equal(v.dossier.client.id,"C-TEST");
v.clients[0].name="ALTERATO";assert.equal(one.field.catalog.clients[0].name,"Cliente inventato");
console.log("PASS dashboard 4.0.131");
