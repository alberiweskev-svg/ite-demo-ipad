const test=require('node:test');
const assert=require('node:assert/strict');
const bridge=require('../ite-core-operations-bridge.js');
test('maps persisted hierarchy without altering original data',()=>{
 const core={clienti:[{id:'C1',ragione_sociale:'Cliente prova'}],immobili:[{id:'S1',client_id:'C1',indirizzo:'Via prova'}],impianti:[{id:'I1',immobile_id:'S1',tipo:'Caldaia'}],apparecchiature:[{id:'D1',impianto_id:'I1',modello:'Modello prova'}]};
 const original=JSON.stringify(core),result=bridge.bridge(core);
 assert.equal(result.issues.length,0);
 assert.equal(result.state.devices[0].systemId,'I1');
 assert.equal(result.state.sites[0].clientId,'C1');
 assert.equal(result.readOnly,true);
 assert.equal(result.persisted,false);
 assert.equal(JSON.stringify(core),original);
});
test('flags missing parent references without inventing customers',()=>{
 const core={clienti:[],immobili:[{id:'S1',client_id:'MISSING'}],impianti:[],apparecchiature:[]};
 const result=bridge.bridge(core);
 assert.equal(result.issues.some(x=>x.code==='CLIENTE_ASSENTE'),true);
 assert.equal(result.state.clients.length,0);
});
