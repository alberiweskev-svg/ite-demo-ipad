"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const a=require("../ite-declarations-291.js"),h=require("../ite-declaration-handover-293.js");
const g={clients:[{id:"TEST-C1"}],sites:[{id:"TEST-S1",clientId:"TEST-C1"}],systems:[]};
const doc={id:"TEST-P1",type:"DICO",clientId:"TEST-C1",siteId:"TEST-S1",status:"archiviato",pdf:{sha256:"a".repeat(64)}};
function setup(){let s=a.add(a.empty(),0,{id:"TEST-D1",kind:"DICO",title:"Test",clientId:"TEST-C1",siteId:"TEST-S1"},g);return s;}
test("blocks incomplete dossier and keeps legal validity false",()=>{const p=h.prepare(setup(),"TEST-D1",{documents:[]},g,a);assert.ok(p.issues.includes("pdf_non_collegato"));assert.equal(p.legalValidity,false);assert.equal(h.manifest(p).canIssue,false);});
test("rejects mismatched client/site graph",()=>assert.throws(()=>h.prepare(setup(),"TEST-D1",{documents:[]},{clients:[],sites:[]},a),/ANAGRAFICA_INCOERENTE/));
test("rejects unknown declaration",()=>assert.throws(()=>h.prepare(setup(),"TEST-NO",{documents:[]},g,a),/PRATICA_ASSENTE/));
test("tracks related technical attachments without embedding PDF",()=>{const p=h.prepare(setup(),"TEST-D1",{documents:[doc,{...doc,id:"TEST-GAS",type:"GAS"}]},g,a);assert.equal(p.relatedDocuments.length,2);assert.equal(JSON.stringify(p).includes("base64"),false);});
test("refuses unverified PDF hash",async()=>{const p=h.prepare(setup(),"TEST-D1",{documents:[]},g,a);p.primaryDocument={id:"TEST-P1",pdfPresent:true};const v=await h.verifyPdf(p,async()=>({bytes:new Uint8Array([1]),expectedHash:"a".repeat(64)}),async()=> "b".repeat(64));assert.ok(v.issues.includes("PDF_HASH_NON_COINCIDENTE"));assert.equal(v.integrityVerified,false);});
test("verifies matching hash but never authorizes legal issue",async()=>{const p=h.prepare(setup(),"TEST-D1",{documents:[]},g,a);p.primaryDocument={id:"TEST-P1",pdfPresent:true};const v=await h.verifyPdf(p,async()=>({bytes:new Uint8Array([1]),expectedHash:"a".repeat(64)}),async()=> "a".repeat(64));assert.equal(v.integrityVerified,true);assert.equal(h.manifest(v).canDeliverOfficial,false);});
test("missing hash fails closed",async()=>{const p=h.prepare(setup(),"TEST-D1",{documents:[]},g,a);p.primaryDocument={id:"TEST-P1",pdfPresent:true};const v=await h.verifyPdf(p,async()=>({bytes:new Uint8Array([1])}),async()=> "a".repeat(64));assert.ok(v.issues.includes("PDF_NON_LEGGIBILE_O_HASH_ASSENTE"));});
