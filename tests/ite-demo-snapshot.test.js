const assert=require('node:assert/strict');
const {test}=require('node:test');
const {create}=require('../ite-demo-snapshot.js');
function memory(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}}
const validate=s=>({valid:Array.isArray(s.appointments)});
test('demo snapshot save, load and restore backup',()=>{
 const adapter=create(memory(),validate);
 assert.equal(adapter.load(),null);
 adapter.save({appointments:[{id:'A'}]});
 assert.equal(adapter.save({appointments:[{id:'B'}]}).backupCreated,true);
 assert.equal(adapter.load().state.appointments[0].id,'B');
 assert.equal(adapter.restoreBackup().state.appointments[0].id,'A');
});
test('rejects invalid state without overwriting prior snapshot',()=>{
 const adapter=create(memory(),validate);
 adapter.save({appointments:[]});
 assert.throws(()=>adapter.save({wrong:true}),/integro/);
 assert.deepEqual(adapter.load().state,{appointments:[]});
});
test('rejects corrupted persisted data before replacement',()=>{
 const store=memory(),adapter=create(store,validate);
 store.setItem('ite4.demo.snapshot.v1','broken');
 assert.throws(()=>adapter.save({appointments:[]}));
 assert.equal(store.getItem('ite4.demo.snapshot.v1'),'broken');
});
