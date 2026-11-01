/* Run: node test-commercial-linkage.js */
const assert=require('node:assert/strict'),m=require('./ite-commercial-linkage.js');
const data={catalog:{clients:[{id:'c'}],sites:[{id:'s',clientId:'c'}],systems:[{id:'p',siteId:'s'}],equipment:[{id:'e',systemId:'p'}]},appointments:[{id:'a',clientId:'c',siteId:'s',systemId:'p',equipmentId:'e'}]};
const ref={clientId:'c',siteId:'s',systemId:'p',equipmentId:'e',appointmentId:'a'};
const rows=m.separateSupplyInstall('lavabo 60 cm',120,80);
assert.equal(rows.length,2);assert.equal(rows[0].type,'FORNITURA');assert.equal(rows[1].type,'POSA');
const extra={id:'x',status:'ACCETTATO',clientId:'c',siteId:'s',systemId:'p',appointmentId:'a',lines:[{type:'EXTRA',description:'Sifone',quantity:1,unitPrice:20,vatRate:10}]};
const estimate=m.buildEstimate(data,ref,rows,[extra,{...extra,id:'y',status:'BOZZA'}]);
assert.equal(estimate.total,242);assert.deepEqual(estimate.extraIds,['x']);
assert.equal(m.commitPreview(data,estimate,m.fingerprint(data)).total,242);
assert.throws(()=>m.buildEstimate(data,{...ref,siteId:'wrong'},rows),/GERARCHIA/);
assert.throws(()=>m.buildEstimate(data,ref,rows,[{...extra,siteId:'other'}]),/EXTRA_NON_COERENTE/);
assert.throws(()=>m.buildEstimate(data,ref,rows,[extra,extra]),/DUPLICATO/);
assert.throws(()=>m.line({type:'POSA',description:'x',quantity:-1,unitPrice:2,vatRate:10}),/RIGA_NON_VALIDA/);
assert.throws(()=>m.line({type:'POSA',description:'x',quantity:1,unitPrice:2,vatRate:22.5}),/IVA_NON_VALIDA/);
assert.throws(()=>m.commitPreview({...data,appointments:[]},estimate,m.fingerprint(data)),/DATI_CAMBIATI/);
console.log('Commercial linkage: 10 assertions passed');
