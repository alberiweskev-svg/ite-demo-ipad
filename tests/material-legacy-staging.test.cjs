const test=require('node:test'),assert=require('node:assert/strict');
const {stage}=require('../ite-material-legacy-staging.js');
const XLSX={utils:{sheet_to_json:s=>s}};
const wb={SheetNames:['LINEA ANTRACITE','IDRAULICA'],Sheets:{'LINEA ANTRACITE':[['Sottogruppo'],['Codice','Descrizione','Prezzo','Giacenza'],['03981','Modulo','15,50',300]],IDRAULICA:[]}};
test('requires explicit brand and document id',()=>{const x=stage(wb,{XLSX});assert.equal(x.readyForReview,false);assert.equal(x.issues.filter(i=>i.severity==='blocking').length,2)});
test('stages catalogue without stock',()=>{const x=stage(wb,{XLSX,brand:'Vimar',documentId:'TEST'});assert.equal(x.readyForReview,true);assert.equal(x.preview.rows[0].article.manufacturerCode,'03981');assert.equal(x.preview.rows[0].article.salePrice,15.5);assert.equal(x.preview.rows[0].quantity,undefined);assert.equal(x.stockChanged,false)});
test('existing article is matched',()=>{const x=stage(wb,{XLSX,brand:'Vimar',documentId:'TEST',existing:[{id:'a1',brand:'Vimar',manufacturerCode:'03981',description:'Modulo',unit:'pz'}]});assert.equal(x.preview.rows[0].action,'MATCH')});
