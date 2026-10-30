'use strict';
// Milestone 45: regression coverage for technical drafts and source isolation.
// Synthetic records only. No production data or certification output.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('../ite-technical-consistency.js');
const core={clienti:[{id:'c1',name:'Cliente Prova'},{id:'c2',name:'Altro Cliente'}],
 immobili:[{id:'s1',client_id:'c1',name:'Sede Prova'},{id:'s2',client_id:'c2',name:'Sede Altra'}],
 cantieri:[{id:'w1',client_id:'c1',immobile_id:'s1',name:'Cantiere Prova'}],
 impianti:[{id:'p1',immobile_id:'s1'}],apparecchiature:[{id:'d1',impianto_id:'p1'}]};
const practice=()=>({id:'draft1',clientId:'c1',propertyId:'s1',siteId:'w1',plantId:'p1',deviceId:'d1',
 type:'Di.Co. elettrica',revision:2,status:'Bozza',fields:{reference:'TEST-1',scope:'Prova sintetica'},structured:{},linkedDocIds:[]});
const state=()=>({documents:[],files:[],settings:{technicalAnnexLinks:[],technicalEvidenceLinks:[],fieldChecks:[],cadDrawings:[],cadPracticeLinks:[]}});
test('no original is a review, not an invented certification',()=>{
 const r=api.analyze(practice(),core,state());
 assert(r.issues.some(x=>x.area==='Originali'&&x.level==='Verificare'));
 assert(r.proposals.some(x=>x.target==='detail:committente'));
 assert.equal(r.summary.blocking,0);
});
test('missing original file is blocking',()=>{
 const p=practice(),s=state();p.linkedDocIds=['doc1'];s.documents=[{id:'doc1',clientId:'c1',fileId:'missing'}];
 assert(api.analyze(p,core,s).issues.some(x=>x.area==='Originali'&&x.level==='Bloccante'));
});
test('duplicate original is explicitly flagged',()=>{
 const p=practice(),s=state();p.linkedDocIds=['doc1','doc1'];
 s.documents=[{id:'doc1',clientId:'c1',fileId:'f1'}];s.files=[{id:'f1'}];
 assert(api.analyze(p,core,s).issues.some(x=>x.message==='Documento duplicato.'));
});
test('cross-customer original cannot leak into a practice',()=>{
 const p=practice(),s=state();p.linkedDocIds=['doc2'];s.documents=[{id:'doc2',clientId:'c2',fileId:'f2'}];
 assert.throws(()=>api.analyze(p,core,s),/cliente o sede differente/);
});
test('cross-customer plant and equipment hierarchy is rejected',()=>{
 const p=practice();p.propertyId='s2';
 assert.throws(()=>api.analyze(p,core,state()),/incoerente/);
});
test('revoked evidence is ignored and current revision is checked',()=>{
 const p=practice(),s=state();
 s.settings.fieldChecks=[{id:'check1',clientId:'c1',jobId:'job1',deviceId:'d1'}];
 s.settings.technicalEvidenceLinks=[{practiceId:p.id,checkId:'check1',practiceRevision:1,removedAt:'2026-01-01'}];
 assert.equal(api.analyze(p,core,s).summary.proofs,0);
 s.settings.technicalEvidenceLinks[0].removedAt='';
 assert(api.analyze(p,core,s).issues.some(x=>x.area==='Prove'&&x.message.includes('revisione precedente')));
});
test('export escapes HTML and spreadsheet formulas',()=>{
 const r=api.analyze({...practice(),fields:{reference:'=HYPERLINK("x")',scope:'<script>alert(1)</script>'}},core,state());
 const csv=api.toCsv([r]),html=api.toHtml([r]);
 assert(csv.includes("'=HYPERLINK"));
 assert(!html.includes('<script>'));
 assert(html.includes('BOZZA INTERNA'));
});
test('batch rejects mixed clients and leaves inputs untouched',()=>{
 const p=practice(),s=state(),before=JSON.stringify({p,s});
 assert.throws(()=>api.batch([p,{...p,id:'draft2',clientId:'c2'}],'c1',core,s),/clienti differenti/);
 assert.equal(JSON.stringify({p,s}),before);
});
