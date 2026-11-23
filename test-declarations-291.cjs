/* Synthetic-only regression tests for 4.0.291. */
const test=require("node:test"),assert=require("node:assert/strict"),api=require("./ite-declarations-291.js");
const graph={clients:[{id:"TEST-C1"}],sites:[{id:"TEST-S1",clientId:"TEST-C1"}],systems:[]};
const docs={documents:[{id:"TEST-PDF",type:"DICO",clientId:"TEST-C1",siteId:"TEST-S1",status:"archiviato",pdf:{sha256:"a".repeat(64),key:"test",size:12}}]};
function fresh(){return api.add(api.empty(),0,{id:"TEST-D1",kind:"DICO",title:"DICO test",clientId:"TEST-C1",siteId:"TEST-S1"},graph);}
test("create and validate synthetic declaration",()=>{const s=fresh();assert.equal(s.records[0].evidence.length,9);assert.equal(api.validate(s).revision,1);});
test("reject mismatched site",()=>assert.throws(()=>api.add(api.empty(),0,{id:"TEST-D1",kind:"DIRI",title:"Test",clientId:"TEST-C1",siteId:"TEST-NO"},graph),/CLIENTE_SEDE/));
test("optimistic revision prevents overwrites",()=>assert.throws(()=>api.edit(fresh(),0,"TEST-D1",{committente:"TEST"},graph),/CONFLITTO/));
test("separate DICO and DIRI checklists",()=>{const s=api.add(api.empty(),0,{id:"TEST-D2",kind:"DIRI",title:"Test",clientId:"TEST-C1",siteId:"TEST-S1"},graph);assert.ok(s.records[0].evidence.some(e=>e.key==="professionista_abilitato"));});
test("missing evidence and PDF prevent review",()=>assert.throws(()=>api.review(fresh(),1,"TEST-D1",docs,graph),/PRATICA_INCOMPLETA/));
test("wrong PDF type or client is refused",()=>assert.throws(()=>api.linkDocument(fresh(),1,"TEST-D1","TEST-BAD",{documents:[{...docs.documents[0],id:"TEST-BAD",type:"DIRI"}]},graph),/NON_COHERENTE/));
test("complete evidence and archived PDF allow human review only",()=>{let s=fresh();for(const key of api.CHECKS.DICO){s=api.edit(s,s.revision,"TEST-D1",{[key]:"TEST valore"},graph);s=api.evidence(s,s.revision,"TEST-D1",key,true,"TEST",graph);}s=api.linkDocument(s,s.revision,"TEST-D1","TEST-PDF",docs,graph);s=api.review(s,s.revision,"TEST-D1",docs,graph);assert.equal(s.records[0].status,"pronta_per_revisione");assert.equal(api.exportDraft(s,"TEST-D1",docs).inspection.legalValidity,false);assert.throws(()=>api.edit(s,s.revision,"TEST-D1",{committente:"X"},graph),/RIAPRIRE/);s=api.reopen(s,s.revision,"TEST-D1",graph);assert.equal(s.records[0].status,"in_verifica");});
