'use strict';
const assert=require('node:assert/strict');
const api=require('../ite-technical-consistency.js');
const core={
 clienti:[{id:1,name:'Cliente [TEST] <Bologna>'},{id:2,name:'CLIENTE RISERVATO'}],
 immobili:[{id:10,client_id:'1',name:'Via Prova 1',city:'Bologna'},{id:11,client_id:'2',name:'Via Segreta'}],
 cantieri:[{id:20,client_id:'1',immobile_id:'10',name:'Cantiere TEST'}],
 impianti:[{id:30,immobile_id:'10',name:'Rete TEST'}],
 apparecchiature:[{id:40,impianto_id:'30',name:'Caldaia TEST'}]
};
const p={id:'td_test40',clientId:'1',propertyId:'10',siteId:'20',plantId:'30',deviceId:'40',interventionId:'50',
 type:'Allegato gas H40',status:'Bozza',revision:2,
 fields:{reference:'=2+2',scope:'Impianto sintetico',pdr:'PDR-001'},structured:{pdrVerificato:'PDR-002'},
 linkedDocIds:['doc1'],checklistEvidence:{'Prove':{status:'Da verificare',evidence:''}}};
const state={documents:[{id:'doc1',clientId:'1',fileId:'file1',sourceName:'originale TEST'}],
 files:[{id:'file1',hash:'a'.repeat(64)}],
 settings:{technicalDrafts:[p],technicalAnnexLinks:[{practiceId:p.id,documentId:'doc1',practiceRevision:1}],
 technicalEvidenceLinks:[{practiceId:p.id,checkId:'check1',practiceRevision:1}],
 fieldChecks:[{id:'check1',clientId:'1',jobId:'50',deviceId:'40',voidedAt:'2026-10-30T12:00:00Z'}],
 cadDrawings:[{id:'cad1',clientId:'1',revision:3}],cadPracticeLinks:[{practiceId:p.id,drawingId:'cad1',drawingRevision:2}]}};
const before=JSON.stringify({p,core,state}),r=api.analyze(p,core,state);
assert(r.summary.blocking>=4);
assert(r.issues.some(x=>x.area==='GAS'&&x.level==='Bloccante'));
assert(r.issues.some(x=>x.area==='CAD'));
assert(r.issues.some(x=>x.area==='Prove'));
assert(r.issues.some(x=>x.area==='Allegati'));
assert(r.proposals.some(x=>x.target==='detail:committente'));
assert(r.proposals.some(x=>x.target==='detail:indirizzoUtenza'));
assert(!r.proposals.some(x=>x.target.includes('pdr')));
assert.equal(JSON.stringify({p,core,state}),before);
const csv=api.toCsv([r]);
assert(csv.startsWith('\uFEFF'));
assert(csv.includes("'=2+2"),'CSV formula injection must be escaped');
const html=api.toHtml([r]);
assert(html.includes('size:A4'));
assert(!html.includes('Cliente [TEST] <Bologna>'));
assert(html.includes('Cliente [TEST] &lt;Bologna&gt;'));
assert(!html.includes('CLIENTE RISERVATO'));
assert(!csv.includes('CLIENTE RISERVATO'));
assert.equal(api.batch([p],'1',core,state).length,1);
assert.throws(()=>api.batch([p,{...p,id:'other',clientId:'2'}],'1',core,state),/clienti differenti/);
assert.throws(()=>api.batch([p,p],'1',core,state),/duplicate/);
assert.throws(()=>api.analyze({...p,propertyId:'11'},core,state),/incoerente/);
const foreign={...state,documents:[{...state.documents[0],clientId:'2'}]};
assert.throws(()=>api.analyze(p,core,foreign),/cliente o sede differente/);
const foreignProof={...state,settings:{...state.settings,fieldChecks:[{...state.settings.fieldChecks[0],clientId:'2'}]}};
assert.throws(()=>api.analyze(p,core,foreignProof),/altro cliente/);
const foreignCad={...state,settings:{...state.settings,cadDrawings:[{...state.settings.cadDrawings[0],clientId:'2'}]}};
assert.throws(()=>api.analyze(p,core,foreignCad),/altro cliente/);
const injection=api.toHtml([{...r,proposals:[{target:'detail:committente',value:'<script>alert(1)</script>',source:'test'}]}]);
assert(!injection.includes('<script>'));
assert.throws(()=>api.batch(Array.from({length:51},(_,i)=>({...p,id:'td_'+i})),'1',core,state),/1 a 50/);
console.log('OK: technical cross-check, PDR, revisions, isolation, safe prefill proposals, A4/CSV and read-only');
