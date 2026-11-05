'use strict';
const assert=require('node:assert/strict');
const op=require('./ite-operations-40.js');
const ws=require('./ite-operations-workspace-40.js');
const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};
const w=ws.create(storage),t='2026-11-05T08:00:00Z';
let s=op.empty();
s=op.addClient(s,{id:'TEST-C1',name:'Cliente demo'},'tester',t);
s=op.addSite(s,'TEST-C1',{id:'TEST-S1',address:'Via Demo 1'},'tester',t);
s=op.addPlant(s,'TEST-C1','TEST-S1',{id:'TEST-P1',type:'Termico'},'tester',t);
s=op.addDevice(s,{clientId:'TEST-C1',siteId:'TEST-S1',plantId:'TEST-P1'},{id:'TEST-D1',brand:'Demo',model:'Demo',serial:'000'},'tester',t);
s=op.addOperator(s,{id:'TEST-O1',name:'Tecnico Demo',color:'#008800'},'tester',t);
s=op.appointment(s,{id:'TEST-A1',clientId:'TEST-C1',siteId:'TEST-S1',plantId:'TEST-P1',deviceId:'TEST-D1',operatorId:'TEST-O1',start:'2026-11-05T09:00:00Z',end:'2026-11-05T10:00:00Z',kind:'Manutenzione'},'tester',t);
s=op.arrive(s,'TEST-A1','TEST-O1','2026-11-05T09:02:00Z');
s=op.finish(s,'TEST-INT-A1','TEST-O1','2026-11-05T09:45:00Z',{description:'Test completato'});
s=op.quote(s,{id:'TEST-Q1',clientId:'TEST-C1',lines:[
{id:'TEST-L1',category:'IDRICO',kind:'FORNITURA',description:'Rubinetto demo',quantity:1,unitPrice:100},
{id:'TEST-L2',category:'IDRICO',kind:'POSA',description:'Posa demo',quantity:2,unitPrice:50},
{id:'TEST-L3',category:'IDRICO',kind:'POSA',description:'Extra demo',quantity:1,unitPrice:30,extra:true}
]},'tester',t);
assert.equal(w.save(s).valid,true);
assert.equal(w.calendar('2026-11-05T00:00:00Z','2026-11-06T00:00:00Z','TEST-O1').length,1);
assert.equal(w.equipmentHistory('TEST-D1')[0].intervention.status,'CHIUSO');
assert.equal(w.quoteReport('TEST-Q1').totals.approved,200);
assert.equal(w.quoteReport('TEST-Q1').totals.pendingExtra,30);
const backup=w.backup();w.restore(backup);assert.equal(w.read().clients.length,1);
assert.throws(()=>w.restore(JSON.stringify({format:'ITE40_OPERATIONS_TEST_BACKUP',schema:1,state:{...s,clients:[{...s.clients[0],id:'REAL-C1'}]}})),/DATI_NON_VALIDI/);
assert.equal(w.read().clients[0].id,'TEST-C1');
assert.throws(()=>w.transact(x=>({...x,operators:[...x.operators,{id:'TEST-O1',name:'Duplicate'}]})),/DATI_NON_VALIDI/);
assert.equal(w.read().operators.length,1);
assert.throws(()=>w.restore('{"schema":2}'),/FORMATO_BACKUP/);
console.log('PASS: workspace integration, TEST isolation, calendar, equipment history, quotes, backup and atomic validation');
