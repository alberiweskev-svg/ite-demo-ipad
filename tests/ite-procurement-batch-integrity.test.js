/* Synthetic-only regression: node tests/ite-procurement-batch-integrity.test.js */
'use strict';
const assert=require('node:assert/strict');
const gate=require('../ite-procurement-batch-gate.js');
const quote=()=>({id:'Q-FAKE-01',type:'Preventivo fornitore',supplierId:'SUP-FAKE',lines:[{code:'ABC',qty:2,unitPrice:10.25}],review:{status:'confirmed',operator:'Operatore test',reviewedAt:'2026-11-01T06:00:00Z'}});
const invoice=()=>({id:'F-FAKE-01',type:'Fattura acquisto',supplierId:'SUP-FAKE',supplierQuoteId:'Q-FAKE-01',lines:[{code:'ABC',qty:2,unitPrice:11.25}],review:{status:'confirmed',operator:'Operatore test',reviewedAt:'2026-11-01T06:01:00Z'}});
const valid=[quote(),invoice()];
assert.equal(gate.validateBatch(valid).valid,true);
const snapshot=gate.exportSnapshot(valid);
assert.equal(snapshot.schema,'ite-supplier-reviewed-batch-v1');
assert.equal(gate.importSnapshot(snapshot).documents.length,2);
assert.equal(gate.validateBatch([quote(),{...invoice(),id:'Q-FAKE-01'}]).valid,false);
assert.equal(gate.validateBatch([quote(),{...invoice(),supplierId:'OTHER'}]).valid,false);
assert.equal(gate.validateBatch([quote(),{...invoice(),supplierQuoteId:'MISSING'}]).valid,false);
assert.equal(gate.validateBatch([quote(),{...invoice(),review:{...invoice().review,reviewedAt:'not-a-date'}}]).valid,false);
assert.equal(gate.validateBatch([quote(),{...invoice(),lines:[{code:'ABC',qty:0,unitPrice:11}]}]).valid,false);
assert.throws(()=>gate.exportSnapshot([quote(),{...invoice(),supplierQuoteId:''}]));
assert.throws(()=>gate.importSnapshot({...snapshot,documents:[quote(),{...invoice(),supplierId:'OTHER'}]}));
console.log('Supplier batch integrity: 10 synthetic assertions passed');
