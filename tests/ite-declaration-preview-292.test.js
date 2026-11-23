"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const api=require("../ite-declarations-291.js");
const input={id:"TEST-D1",kind:"DICO",title:"<script>alert(1)</script>",clientId:"TEST-C1",siteId:"TEST-S1"};
const graph={clients:[{id:"TEST-C1"}],sites:[{id:"TEST-S1",clientId:"TEST-C1"}],systems:[]};
function draft(){return api.add(api.empty(),0,input,graph);}
test("4.0.292 preview HTML TEST with clear nonlegal disclaimer",()=>{const p=api.preview(draft(),"TEST-D1",{documents:[]},graph);assert.equal(p.schema,"ITE_DECLARATION_PREVIEW_292");assert.match(p.html,/NON VALIDO/);assert.match(p.html,/2\.7\.5/);assert.equal(p.readyForHumanReview,false);});
test("4.0.292 escapes user content and prevents HTML injection",()=>{const p=api.preview(draft(),"TEST-D1",{documents:[]},graph);assert.ok(p.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));assert.ok(!p.html.includes("<script>alert(1)</script>"));});
test("4.0.292 reports missing checks and PDF",()=>{const p=api.preview(draft(),"TEST-D1",{documents:[]},graph);assert.ok(p.missing.includes("pdf_non_collegato"));assert.ok(p.missing.includes("committente"));});
test("4.0.292 rejects unknown draft",()=>assert.throws(()=>api.preview(draft(),"TEST-NO",{documents:[]},graph),/PRATICA_ASSENTE/));
test("4.0.292 validates graph before preview",()=>assert.throws(()=>api.preview(draft(),"TEST-D1",{documents:[]},{clients:[],sites:[]}),/CLIENTE_SEDE_INCOERENTI/));
test("4.0.292 Di.Ri. includes distinct checklist",()=>{const s=api.add(api.empty(),0,{...input,kind:"DIRI"},graph);const p=api.preview(s,"TEST-D1",{documents:[]},graph);assert.match(p.html,/professionista abilitato/);assert.equal(p.kind,"DIRI");});
