const test=require('node:test');
const assert=require('node:assert/strict');
const board=require('../ite-operational-board.js');
test('an appointment reference cannot resolve to a quote with the same ID',()=>{
 const core={clienti:[{id:'C'}],immobili:[{id:'S',client_id:'C'}],impianti:[],apparecchiature:[],interventi:[{id:'I',client_id:'C',immobile_id:'S',appointmentId:'Q'}],appuntamenti:[]};
 const commerce={quotes:[{id:'Q',clientId:'C',siteId:'S'}]};
 const result=board.workflows(core,commerce);
 assert.equal(result.links.length,0);
 assert.equal(result.issues.some(x=>x.code==='COLLEGAMENTO_NON_VALIDO'),true);
});
test('an appointment reference resolves to an actual appointment',()=>{
 const core={clienti:[{id:'C'}],immobili:[{id:'S',client_id:'C'}],impianti:[],apparecchiature:[],interventi:[{id:'I',client_id:'C',immobile_id:'S',appointmentId:'A'}],appuntamenti:[{id:'A',client_id:'C',immobile_id:'S'}]};
 const result=board.workflows(core,{});
 assert.equal(result.links.length,1);
 assert.equal(result.links[0].from,'Appuntamento:A');
 assert.equal(result.links[0].to,'Intervento:I');
});
