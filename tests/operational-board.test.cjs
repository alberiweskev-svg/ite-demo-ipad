'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const board=require('../ite-operational-board.js');
const fixture=()=>({core:{clienti:[{id:'c1'},{id:'c2'}],immobili:[{id:'s1',client_id:'c1'},{id:'s2',client_id:'c2'}],impianti:[{id:'p1',immobile_id:'s1'}],apparecchiature:[{id:'d1',impianto_id:'p1'}],interventi:[{id:'j1',client_id:'c1',immobile_id:'s1',apparecchiatura_id:'d1'}],appuntamenti:[{id:'a1',client_id:'c1',immobile_id:'s1',status:'Programmato'}]},commerce:{quotes:[{id:'q1',clientId:'c1',siteId:'s1'}],extras:[{id:'e1',clientId:'c1',siteId:'s1'}],documents:[{id:'f1',clientId:'c1',siteId:'s1',type:'Fattura vendita'}],settings:{technicalDrafts:[{id:'t1',clientId:'c1',propertyId:'s1'}]}}});
test('integrates nine operational categories without changing archives',()=>{const f=fixture(),before=JSON.stringify(f),r=board.build(f.core,f.commerce);assert.equal(r.summary.items,10);assert.equal(r.groups['Appuntamento'].count,1);assert.equal(r.groups.Extra.count,1);assert.equal(r.groups['Pratica tecnica'].count,1);assert.equal(JSON.stringify(f),before);assert.equal(r.releaseAllowed,false);});
test('filters client and site and refuses foreign site',()=>{const f=fixture(),r=board.build(f.core,f.commerce,{clientId:'c1',siteId:'s1'});assert.equal(r.summary.items,9);assert(r.items.every(x=>x.clientId==='c1'&&x.siteId==='s1'));assert.throws(()=>board.build(f.core,f.commerce,{clientId:'c1',siteId:'s2'}),/non appartenente/);});
test('reports cross-client intervention without disclosing it to other client view',()=>{const f=fixture();f.core.interventi[0].client_id='c2';const a=board.build(f.core,f.commerce,{clientId:'c2'});assert(a.issues.some(x=>x.code==='CLIENTE_SEDE_DIVERSI'));const b=board.build(f.core,f.commerce,{clientId:'c1'});assert(!b.items.some(x=>x.kind==='Intervento'));});
test('CSV formula injection and HTML markup are escaped',()=>{const f=fixture();f.core.appuntamenti[0].description='=HYPERLINK(1)';f.commerce.extras[0].description='<script>alert(1)</script>';const r=board.build(f.core,f.commerce);assert(board.csv(r).includes("'=HYPERLINK(1)"));assert(!board.html(r).includes('<script>'));assert(board.html(r).includes('&lt;script&gt;'));});

test('correlates appointment, intervention, quote, extra and invoice only for matching client and site',()=>{
 const f=fixture();
 f.core.interventi[0].appointmentId='a1';
 f.commerce.quotes[0].interventionId='j1';
 f.commerce.extras[0].quoteId='q1';
 f.commerce.documents[0].interventionId='j1';
 const before=JSON.stringify(f);
 const w=board.workflows(f.core,f.commerce,{clientId:'c1',siteId:'s1'});
 assert.equal(w.totals.linked,4);
 assert.equal(w.issues.length,0);
 assert.equal(w.stages.appointments,1);
 assert.equal(w.stages.interventions,1);
 assert.equal(w.stages.quotes,1);
 assert.equal(w.stages.extras,1);
 assert.equal(w.stages.documents,1);
 assert.equal(JSON.stringify(f),before);
 const b=board.build(f.core,f.commerce,{clientId:'c1',siteId:'s1'});
 assert.match(board.csv(b),/COLLEGAMENTO/);
 assert.match(board.html(b),/Flusso operativo/);
});
test('blocks cross-customer links and does not leak their relationships in filtered exports',()=>{
 const f=fixture();
 f.commerce.documents[0].interventionId='j1';
 f.commerce.documents[0].clientId='c2';
 const w=board.workflows(f.core,f.commerce,{clientId:'c1'});
 assert.equal(w.totals.linked,0);
 assert(!w.links.some(x=>x.to==='Documento:f1'));
 assert(board.workflows(f.core,f.commerce,{clientId:'c2'}).links.length===0);
});
test('detects orphan references and duplicate operational identifiers',()=>{
 const f=fixture();
 f.commerce.extras[0].quoteId='missing';
 f.commerce.extras.push({...f.commerce.extras[0]});
 const w=board.workflows(f.core,f.commerce);
 assert(w.issues.some(x=>x.code==='COLLEGAMENTO_NON_VALIDO'));
 assert(w.issues.some(x=>x.code==='ID_DUPLICATO'));
});
test('escapes malicious linked identifiers in A4 and CSV',()=>{
 const f=fixture();
 f.core.appuntamenti[0].id='=evil';
 f.core.interventi[0].appointmentId='=evil';
 const b=board.build(f.core,f.commerce);
 assert(!board.html(b).includes('<script>'));
 assert(board.csv(b).includes("'=evil"));
});
