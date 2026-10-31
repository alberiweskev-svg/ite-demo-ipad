const test=require('node:test');const assert=require('node:assert/strict');
const importer=require('../ite-material-excel-import.js');
const original=globalThis.XLSX;
test('rejects empty and oversized workbooks',()=>{assert.throws(()=>importer.parse(new ArrayBuffer(0)));assert.throws(()=>importer.parse(new ArrayBuffer(8*1024*1024+1)))});
test('rejects unavailable XLSX parser',()=>{delete globalThis.XLSX;assert.throws(()=>importer.parse(new ArrayBuffer(10)),/non disponibile/);globalThis.XLSX=original});
test('maps a worksheet to material rows without changing stock',()=>{
 globalThis.XLSX={read:()=>({SheetNames:['Materiali'],Sheets:{Materiali:{'!ref':'A1:D2'}}}),utils:{decode_range:()=>({s:{r:0,c:0},e:{r:1,c:3}}),sheet_to_csv:()=> 'marca\tcodice\tdescrizione\tquantità\nRBM\t0016\tRaccordo 16\t4'}};
 try{const result=importer.parse(new ArrayBuffer(10));assert.equal(result.rows[0].code,'0016');assert.equal(result.rows[0].quantity,4);assert.equal(result.stockChanged,false)}finally{globalThis.XLSX=original}
});
test('rejects an unknown sheet',()=>{globalThis.XLSX={read:()=>({SheetNames:['Materiali'],Sheets:{}})};try{assert.throws(()=>importer.parse(new ArrayBuffer(10),{sheetName:'Altro'}),/non trovato/)}finally{globalThis.XLSX=original}});
