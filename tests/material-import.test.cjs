'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prepare}=require('../ite-material-import.js');
const article={brand:'RBM',code:'123',description:'Raccordo',unit:'pz',vat:22,costPrice:2.5};
test('catalogue import creates preview but never stock',()=>{const x=prepare('catalogue',[],[{documentId:'LIST-1',kind:'LISTINO',rows:[article]}]);assert.equal(x.rows[0].action,'NEW');assert.equal(x.stockChanged,false);assert.equal(x.rows[0].quantity,undefined)});
test('warehouse requires purchase invoice or delivery note',()=>{const x=prepare('warehouse',[],[{documentId:'L',kind:'LISTINO',rows:[article]}]);assert.equal(x.rows.length,0);assert.equal(x.issues.length,1)});
test('warehouse invoice linked to delivery note is flagged for reconciliation',()=>{const x=prepare('warehouse',[],[{documentId:'F1',kind:'FATTURA_ACQUISTO',linkedDdtId:'D1',received:false,rows:[{...article,quantity:10}]}]);assert.equal(x.rows[0].possibleDuplicate,true);assert.equal(x.rows[0].requiresReceiptConfirmation,true)});
test('existing catalogue article is matched by producer code and unit',()=>{const x=prepare('catalogue',[{id:'a',...article}],[{documentId:'L',kind:'LISTINO',rows:[article]}]);assert.equal(x.rows[0].existingId,'a')});
test('invalid quantities and duplicate documents cannot enter staging',()=>{const x=prepare('warehouse',[],[{documentId:'D',kind:'DDT',rows:[{...article,quantity:-1}]},{documentId:'D',kind:'DDT',rows:[{...article,quantity:1}]}]);assert.equal(x.rows.length,0);assert.equal(x.issues.length,2)});
