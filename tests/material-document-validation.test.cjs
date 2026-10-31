const test=require('node:test');const assert=require('node:assert/strict');const {validate}=require('../ite-material-document-validation.js');
const doc=(kind='DDT',id='D-1',received=true)=>({kind,documentId:id,received,rows:[{code:'001',quantity:2}]});
test('listino is accepted for catalogue only',()=>{assert.equal(validate('catalogue',[doc('LISTINO')]).canPreview,true);assert.equal(validate('warehouse',[doc('LISTINO')]).canPreview,false)});
test('warehouse refuses unreceived invoice',()=>assert.equal(validate('warehouse',[doc('FATTURA_ACQUISTO','F-1',false)]).canPreview,false));
test('warehouse accepts received DDT',()=>assert.equal(validate('warehouse',[doc()]).canPreview,true));
test('duplicate identifiers are rejected case insensitively',()=>assert.equal(validate('catalogue',[doc('DDT','D-1'),doc('DDT','d-1')]).canPreview,false));
test('invoice cannot link itself as DDT',()=>assert.equal(validate('warehouse',[{...doc('FATTURA_ACQUISTO','F-1'),linkedDdtId:'f-1'}]).canPreview,false));
test('validation never changes stock',()=>assert.equal(validate('warehouse',[doc()]).stockChanged,false));
