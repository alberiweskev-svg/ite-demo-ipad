const test=require('node:test'),assert=require('node:assert/strict');const {parse}=require('../ite-purchased-codes-import.js');
const header=['Prc','Codice Art.','Descr. Art.','Cat. Sc.','Stato'];
test('preserves leading zeros, supplier category and no stock',()=>{const r=parse([header,['ABB','00059','Coperchio','BLD60A40',' ']]);assert.equal(r.rows[0].manufacturerCode,'00059');assert.equal(r.rows[0].supplierCategory,'BLD60A40');assert.equal(r.rows[0].quantity,null);assert.equal(r.stockChanged,false)});
test('separates same code across manufacturers',()=>{const r=parse([header,['ABB','001','A'],['VIW','001','B']]);assert.equal(r.rows.length,2)});
test('detects duplicates within supplier export',()=>{const r=parse([header,['ABB','001','A'],['ABB','001','A']]);assert.equal(r.issues[0].code,'DUPLICATE')});
test('matches existing catalogue without inventing prices',()=>{const r=parse([header,['ABB','001','A']],{existing:[{brand:'ABB',manufacturerCode:'001'}]});assert.equal(r.rows[0].action,'MATCH');assert.equal(r.rows[0].price,null)});
