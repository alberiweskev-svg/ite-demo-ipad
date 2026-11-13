"use strict";
const assert=require("node:assert/strict");
const Store=require("../ite-workspace-store-209.js");
const field={
 clients:[{id:"C1"}],sites:[{id:"S1",clientId:"C1"}],
 systems:[{id:"Y1",siteId:"S1"}],equipment:[{id:"E1",systemId:"Y1"}],
 operators:[{id:"O1"}],appointments:[{id:"A1",clientId:"C1",siteId:"S1",equipmentId:"E1",operatorId:"O1",start:"2026-11-13T09:00:00+01:00",end:"2026-11-13T10:00:00+01:00"}],
 interventions:[{id:"I1",appointmentId:"A1"}]
};
const commercial={extras:[{id:"X1",interventionId:"I1",kind:"FORNITURA",priceCents:1000}],quotes:[{id:"Q1",interventionId:"I1",extraIds:["X1"]}]};
const doc={id:"D1",type:"DICO_IDRICA",status:"DA_VERIFICARE",label:"Documento TEST",note:"",size:10,clientId:"C1",siteId:"S1",interventionId:"I1",created:"TEST-2026-11-13"};
const memory=new Map(),storage={getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const a=Store.create(storage,field,commercial);
assert.deepEqual(a.snapshot().technicalDocuments,[]);
let next=a.snapshot();next.technicalDocuments=[doc];a.save(next);
assert.equal(a.snapshot().technicalDocuments.length,1);
let restored=Store.create(storage,field,commercial);restored.restore();assert.deepEqual(restored.snapshot().technicalDocuments,[doc]);
next=restored.snapshot();next.commercial.extras[0].priceCents=2000;restored.save(next);
assert.deepEqual(restored.snapshot().technicalDocuments,[doc],"commercial update preserves technical docs");
next=restored.snapshot();next.technicalDocuments=[{...doc,clientId:"UNKNOWN"}];
assert.throws(()=>restored.save(next),/CLIENTE_ORFANO/);
assert.equal(restored.snapshot().technicalDocuments[0].clientId,"C1");
next=restored.snapshot();next.technicalDocuments=[{...doc,rawPdf:"secret"}];
assert.throws(()=>restored.save(next),/CAMPO_NON_AMMESSO/);
next=restored.snapshot();next.field.clients=[];
assert.throws(()=>restored.save(next));
assert.equal(restored.snapshot().field.clients.length,1);
const old=JSON.parse(restored.exportJson());delete old.technicalDocuments;
const compatible=Store.decode(JSON.stringify(old));assert.deepEqual(compatible.technicalDocuments,[]);
const clone=restored.snapshot();clone.technicalDocuments[0].status="SCARTATO";
assert.equal(restored.snapshot().technicalDocuments[0].status,"DA_VERIFICARE");
assert.throws(()=>a.save(a.snapshot()),/REVISIONE_CONFLITTO_DISPOSITIVO/);
console.log("4.0.218 technical documents shared workspace tests OK");
