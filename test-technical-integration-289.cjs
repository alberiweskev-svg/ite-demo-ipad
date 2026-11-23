/* 4.0.289 integration regression tests — Node 22, synthetic data only. */
const assert=require("node:assert/strict");
const test=require("node:test");
const crypto=require("node:crypto").webcrypto;
const dossier=require("./ite-dossier-269.js");
const docs=require("./ite-doc-286.js");
const audit=require("./ite-technical-audit-288.js");
const ui=require("./ite-technical-audit-ui-288.js");
function fixture(){const graph=dossier.empty();graph.clients=[{id:"TEST-C1",name:"Cliente TEST"}];graph.sites=[{id:"TEST-S1",clientId:"TEST-C1",address:"Via Fittizia"}];graph.systems=[{id:"TEST-P1",siteId:"TEST-S1",kind:"CALDAIA"}];graph.devices=[{id:"TEST-D1",systemId:"TEST-P1",kind:"CALDAIA"}];graph.interventions=[{id:"TEST-I1",siteId:"TEST-S1",deviceId:"TEST-D1",operator:"Tecnico TEST",start:"2026-11-23T08:00:00Z",end:"2026-11-23T09:00:00Z",status:"CHIUSO"}];return graph;}
function storage(value){return {getItem:key=>key===dossier.KEY?JSON.stringify(value):null};}
test("loads validated local dossier and empty document register",()=>{const state=ui.loadSources(storage(fixture()),dossier,docs);assert.equal(state.graph.sites[0].id,"TEST-S1");assert.deepEqual(state.documents.documents,[]);});
test("rejects corrupted local dossier instead of silently skipping",()=>{assert.throws(()=>ui.loadSources({getItem:()=>"{broken"},dossier,docs));});
test("valid document references are not falsely marked orphan",()=>{const graph=fixture();let s=docs.empty();s=docs.add(s,s.revision,{id:"TEST-DOC-1",type:"DICO",title:"DiCo TEST",clientId:"TEST-C1",siteId:"TEST-S1",systemId:"TEST-P1",equipmentId:"TEST-D1",interventionId:"TEST-I1"},graph);const report=audit.inspect(s,graph);assert.equal(report.summary.blocked,1);assert.deepEqual(report.rows[0].errors,["PDF_ASSENTE","DA_ARCHIVIARE"]);});
test("detects orphaned site even when PDF metadata exists",()=>{const graph=fixture();let s=docs.add(docs.empty(),0,{id:"TEST-DOC-2",type:"DIRI",title:"DiRi TEST",clientId:"TEST-C1",siteId:"TEST-S1"},graph);graph.sites=[];assert.ok(audit.inspect(s,graph).rows[0].errors.includes("CLIENTE_SEDE_NON_VALIDI"));});
test("verifies real PDF bytes via adapter and SHA256",async()=>{const graph=fixture();let s=docs.add(docs.empty(),0,{id:"TEST-DOC-3",type:"POS",title:"POS TEST",clientId:"TEST-C1",siteId:"TEST-S1"},graph);const bytes=new TextEncoder().encode("%PDF-1.4\nTEST PDF");const map=new Map();const adapter={put:async(k,v)=>map.set(k,v),get:async k=>map.get(k)};s=await docs.importPdf(s,s.revision,"TEST-DOC-3",bytes,adapter,crypto,graph);s=docs.archive(s,s.revision,"TEST-DOC-3",graph);const good=await audit.verify(s,graph,adapter,crypto);assert.equal(good.summary.ready,1);const manifest=audit.handover(good,"TEST-S1");assert.equal(manifest.ready,true);map.set(s.documents[0].pdf.key,new TextEncoder().encode("%PDF-1.4\nCORRUPTED"));const bad=await audit.verify(s,graph,adapter,crypto);assert.equal(bad.summary.blocked,1);assert.ok(bad.rows[0].errors.includes("PDF_INTEGRITA_FALLITA"));});
test("rejects handover for site without documents",()=>{assert.throws(()=>audit.handover({schema:"ITE_TECH_AUDIT_288",rows:[],issues:[],revision:0},"TEST-S2"),/SEDE_SENZA_DOCUMENTI/);});
