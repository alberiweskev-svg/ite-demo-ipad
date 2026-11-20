const assert=require("node:assert/strict");const core=require("../ite-integrated-core-225.js");const s=core.createStore();
function add(t,x){return core.add(s,t,x)}
add("clients",{id:"c1",name:"Cliente Fittizio"});add("sites",{id:"s1",clientId:"c1",address:"Via Demo 1"});add("plants",{id:"p1",siteId:"s1",type:"Termico"});add("equipment",{id:"e1",plantId:"p1",type:"Caldaia"});
add("appointments",{id:"a1",siteId:"s1",operator:"Tecnico Demo",start:"2026-11-21T09:00:00+01:00",end:"2026-11-21T10:00:00+01:00"});
add("interventions",{id:"i1",siteId:"s1",equipmentId:"e1",appointmentId:"a1",operator:"Tecnico Demo",status:"APERTO"});
add("quotes",{id:"q1",clientId:"c1",status:"BOZZA",lines:[{id:"l1",kind:"FORNITURA",description:"Materiale demo",qty:1,cents:10000},{id:"l2",kind:"POSA",description:"Posa demo",qty:2,cents:5000},{id:"l3",kind:"EXTRA_POSA",description:"Extra demo",qty:1,cents:2500}]});
assert.equal(core.totals(s.snapshot().quotes[0]).cents,22500);
add("invoices",{id:"f1",clientId:"c1",quoteId:"q1",kind:"VENDITA",number:"TEST-1",cents:22500});
add("invoices",{id:"f2",clientId:"c1",kind:"TD04",number:"TEST-NC",cents:2500,originalInvoiceId:"f1"});
for(const kind of ["DICO","DIRI","POS","CAD","GAS"])add("documents",{id:kind,kind,filename:"synthetic.pdf",mime:"application/pdf",bytes:0,clientId:"c1"});
const before=s.snapshot();assert.equal(before.documents.length,5);
assert.throws(()=>add("plants",{id:"bad",siteId:"missing",type:"Termico"}),/RELAZIONE_NON_VALIDA/);
assert.deepEqual(s.snapshot(),before);
assert.throws(()=>s.transact(before.revision-1,()=>{}),/REVISIONE_CONFLITTO/);
assert.throws(()=>add("documents",{id:"unsafe",kind:"DICO",filename:"private.pdf",mime:"application/pdf",bytes:1,payload:"PDF"}),/CONTENUTO_PDF_NON_AMMESSO/);
assert.deepEqual(s.snapshot(),before);
const copy=core.createStore();copy.importMetadata(s.exportMetadata(),0);assert.equal(copy.snapshot().clients.length,1);
console.log("ITE integrated core 225: synthetic lifecycle, fiscal, document metadata and rollback PASS");
