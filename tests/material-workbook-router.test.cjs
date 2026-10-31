'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const {inspect}=require('../ite-material-workbook-router.js');
const XLSX={read:()=>({SheetNames:['Bianca','Antracite'],Sheets:{Bianca:[['Codice','Descrizione','Prezzo','Giacenza'],['03981','Modulo','15,50',20]],Antracite:[['Codice','Descrizione','Prezzo'],['30210.G','Presa',12]]}}),utils:{sheet_to_json:s=>s}};
test('multi-sheet catalogue staging does not import historic stock',()=>{const r=inspect(new ArrayBuffer(20),{legacyArchive:true,mode:'catalogue',brand:'Vimar',documentId:'TEST',XLSX});assert.equal(r.legacyResult.preview.rows.length,2);assert.equal(r.legacyResult.preview.rows[0].article.manufacturerCode,'03981');assert.equal(r.stockChanged,false)});
test('legacy workbook cannot enter warehouse',()=>assert.throws(()=>inspect(new ArrayBuffer(20),{legacyArchive:true,mode:'warehouse',XLSX}),/soltanto/));
test('legacy staging requires explicit manufacturer and document ID',()=>{const r=inspect(new ArrayBuffer(20),{legacyArchive:true,XLSX});assert.equal(r.legacyResult.readyForReview,false);assert.equal(r.issues.filter(x=>x.severity==='blocking').length,2)});
test('rejects invalid and oversized workbooks',()=>{assert.throws(()=>inspect(new ArrayBuffer(0),{XLSX}));assert.throws(()=>inspect(new ArrayBuffer(8*1024*1024+1),{XLSX}))});
