const test=require('node:test');
const assert=require('node:assert/strict');
const {plan}=require('../ite-material-workflow.js');
const row={brand:'RBM',manufacturerCode:'0016',description:'Raccordo 16',unit:'pz',quantity:4};
test('catalogue preview never changes stock',()=>{
 const p=plan('catalogue',[],[{documentId:'LIST-1',kind:'LISTINO',rows:[row]}]);
 assert.equal(p.preview.rows.length,1);assert.equal(p.canConfirm,true);assert.equal(p.stockChanged,false);
});
test('warehouse requires received goods',()=>{
 const p=plan('warehouse',[],[{documentId:'DDT-1',kind:'DDT',received:false,rows:[row]}]);
 assert.equal(p.canConfirm,false);assert.equal(p.receipts.issues[0].code,'NOT_RECEIVED');
});
test('warehouse received DDT is eligible for explicit confirmation',()=>{
 const p=plan('warehouse',[],[{documentId:'DDT-1',kind:'DDT',received:true,rows:[row]}]);
 assert.equal(p.canConfirm,true);assert.equal(p.receipts.candidates[0].quantity,4);
});
test('already loaded document row is blocked',()=>{
 const p=plan('warehouse',[],[{documentId:'DDT-1',kind:'DDT',received:true,rows:[row]}],[{documentId:'DDT-1',lineIndex:0,key:'RBM|0016|PZ'}]);
 assert.equal(p.canConfirm,false);assert.equal(p.receipts.issues[0].code,'ALREADY_LOADED');
});
test('invoice linked to previously loaded DDT cannot load again',()=>{
 const p=plan('warehouse',[],[{documentId:'INV-1',kind:'FATTURA_ACQUISTO',linkedDdtId:'DDT-1',received:true,rows:[row]}],[{documentId:'DDT-1',lineIndex:0,key:'RBM|0016|PZ'}]);
 assert.equal(p.canConfirm,false);assert.equal(p.receipts.issues[0].code,'DDT_ALREADY_LOADED');
});
