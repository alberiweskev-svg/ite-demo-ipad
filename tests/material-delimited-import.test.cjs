'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parse,preview}=require('../ite-material-delimited-import.js');
const csv='Marca;Codice;Descrizione;Quantità;Prezzo acquisto;IVA\nRBM;00123;"Raccordo; Ø16";10;2,50;22';
test('semicolon CSV preserves quoted separators and manufacturer leading zeros',()=>{const r=parse(csv);assert.equal(r.rows[0].code,'00123');assert.equal(r.rows[0].description,'Raccordo; Ø16');assert.equal(r.rows[0].costPrice,2.5)});
test('catalogue CSV import previews without changing stock',()=>{const r=preview('catalogue',[],[{name:'catalogo.csv',documentId:'L1',kind:'LISTINO',text:csv}]);assert.equal(r.rows.length,1);assert.equal(r.stockChanged,false)});
test('warehouse DDT preview requires receipt confirmation',()=>{const r=preview('warehouse',[],[{name:'bolla.csv',documentId:'D1',kind:'DDT',received:true,text:csv}]);assert.equal(r.rows[0].quantity,10);assert.equal(r.rows[0].requiresReceiptConfirmation,true)});
test('reject missing required columns',()=>assert.throws(()=>parse('Descrizione;Quantità\nTubo;2'),/obbligatorie/));
test('reject unclosed quotes',()=>assert.throws(()=>parse('Marca;Codice;Descrizione\nRBM;1;"Non chiusa'),/virgolette/));
