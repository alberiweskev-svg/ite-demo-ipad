/* 4.0.216 synthetic-only unified document association persistence regression. */
const assert=require("node:assert/strict");
const S=require("../ite-workspace-store-209.js"),A=require("../ite-workspace-audit-215.js");
const field={clients:[{id:"C1"},{id:"C2"}],sites:[{id:"S1",clientId:"C1"}],systems:[{id:"P1",siteId:"S1"}],equipment:[{id:"E1",systemId:"P1"}],operators:[{id:"O1"}],appointments:[{id:"A1",clientId:"C1",siteId:"S1",equipmentId:"E1",operatorId:"O1",start:"2026-11-13T08:00:00",end:"2026-11-13T09:00:00"}],interventions:[{id:"I1",appointmentId:"A1"}]};
const commercial={extras:[{id:"X1",interventionId:"I1",kind:"FORNITURA",priceCents:10000},{id:"X2",interventionId:"I1",kind:"POSA",priceCents:5000}],quotes:[{id:"Q1",interventionId:"I1",extraIds:["X1","X2"]}]};
const fiscal=[{id:"D1",direction:"OUT",type:"VENDITA",documentCode:"TD01",number:"1",date:"2026-11-13",counterpartyId:"C1",netCents:10000,vatCents:1000,grossCents:11000}];
const db=new Map(),storage={getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,v),removeItem:k=>db.delete(k)};
const a=S.create(storage,field,commercial),base=a.snapshot(),link={documentId:"D1",clientId:"C1",quoteId:"Q1"};
const saved=a.save({...base,fiscal,documentLinks:[link]},base.revision);
assert.equal(saved.revision,1);assert.equal(saved.documentLinks.length,1);
assert.equal(A.validateLinks(saved,saved.documentLinks).linked.length,1);
const b=S.create(storage,field,commercial);assert.deepEqual(b.restore().documentLinks,[link]);
const old=a.snapshot();assert.throws(()=>a.save({...old,documentLinks:[link,link]},old.revision),/COLLEGAMENTO_NON_VALIDO/);
assert.throws(()=>S.decode(JSON.stringify({...saved,documentLinks:[{documentId:"D1",clientId:"C1"},{documentId:"D1",clientId:"C2"}]})),/COLLEGAMENTO_NON_VALIDO/);
const legacy={...saved};delete legacy.documentLinks;assert.deepEqual(S.decode(JSON.stringify(legacy)).documentLinks,[]);
const current=b.snapshot();const updated=b.save({...current,documentLinks:[]},current.revision);assert.deepEqual(updated.documentLinks,[]);assert.deepEqual(updated.fiscal,fiscal);
assert.throws(()=>a.save({...old,documentLinks:[]},old.revision),/REVISIONE_CONFLITTO_DISPOSITIVO/);
assert.deepEqual(S.decode(b.exportJson()).documentLinks,[]);
console.log("ITE 4.0.216 persistent document associations: OK");
