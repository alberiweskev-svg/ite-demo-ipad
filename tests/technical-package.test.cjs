'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../ite-technical-package.js');
const core={clienti:[{id:'1',name:'Cliente TEST'},{id:'2',name:'Altro TEST'}],immobili:[{id:'10',client_id:'1',name:'Sede TEST'}],cantieri:[],impianti:[],apparecchiature:[]};
const p=()=>({id:'draft1',clientId:'1',propertyId:'10',type:'Di.Ri.',revision:2,status:'Bozza',fields:{reference:'=1+1',scope:'Test'},structured:{},linkedDocIds:['doc1']});
const s=()=>({documents:[{id:'doc1',clientId:'1',fileId:'file1',type:'Di.Ri.',sourceName:'test.pdf'}],files:[{id:'file1',hash:'a'.repeat(64)}],settings:{technicalAnnexLinks:[],technicalEvidenceLinks:[],fieldChecks:[],cadPracticeLinks:[],cadDrawings:[]}});
test('manifest includes originals and never certifies',()=>{const x=api.manifest(p(),core,s());assert.equal(x.originals.length,1);assert.equal(x.originals[0].status,'DA VERIFICARE');assert.equal(x.state,'DA VERIFICARE MANUALMENTE');assert.match(x.disclaimer,/BOZZA/);});
test('missing original file blocks delivery',()=>{const state=s();state.files=[];const x=api.manifest(p(),core,state);assert.equal(x.state,'BLOCCATA');assert.equal(x.originals[0].status,'FILE ASSENTE');});
test('untrusted hash blocks delivery',()=>{const state=s();state.files[0].hash='unknown';assert.equal(api.manifest(p(),core,state).originals[0].status,'HASH NON DISPONIBILE');});
test('revoked annex ignored and stale annex revision blocked',()=>{const state=s();state.settings.technicalAnnexLinks=[{practiceId:'draft1',documentId:'doc1',practiceRevision:1,removedAt:''}];assert.equal(api.manifest(p(),core,state).state,'BLOCCATA');state.settings.technicalAnnexLinks[0].removedAt='2026-10-01';assert.equal(api.manifest(p(),core,state).state,'DA VERIFICARE MANUALMENTE');});
test('foreign client original is rejected',()=>{const state=s();state.documents[0].clientId='2';assert.throws(()=>api.manifest(p(),core,state),/cliente o sede differente|altro cliente/);});
test('cross-client and duplicate batches rejected',()=>{assert.throws(()=>api.bundle([p(),{...p(),id:'draft2',clientId:'2'}],'1',core,s()),/Cliente diverso/);assert.throws(()=>api.bundle([p(),p()],'1',core,s()),/duplicata/);});
test('CSV neutralizes formulas and HTML escapes markup',()=>{const q=p();q.fields.scope='<script>alert(1)</script>';const x=api.manifest(q,core,s());assert(api.csv([x]).includes("'=1+1"));assert(!api.html([x]).includes('<script>'));assert(api.html([x]).includes('NON FIRMATA'));});
test('read-only manifest leaves source unchanged',()=>{const q=p(),state=s(),before=JSON.stringify({q,state});api.manifest(q,core,state);assert.equal(JSON.stringify({q,state}),before);});

test('readiness groups multiple draft types and never authorizes release',()=>{
 const a=p(),b={...p(),id:'draft2',type:'Allegato gas H40',linkedDocIds:[]};
 const summary=api.readiness([a,b],'1',core,s());
 assert.equal(summary.count,2);
 assert.equal(summary.releaseAllowed,false);
 assert.equal(summary.groups['Di.Ri.'].count,1);
 assert.equal(summary.groups['Allegato gas H40'].count,1);
 assert.equal(summary.originals,1);
});
test('readiness isolates clients and detects blocked originals',()=>{
 const state=s();state.files=[];
 const summary=api.readiness([p()],'1',core,state);
 assert.equal(summary.blocked,1);
 assert.equal(summary.groups['Di.Ri.'].blocked,1);
 assert.throws(()=>api.readiness([p()],'2',core,state),/Cliente diverso/);
});
test('proof of different intervention is never included',()=>{
 const practice={...p(),interventionId:'job1'};
 const state=s();
 state.settings.fieldChecks=[{id:'check1',clientId:'1',jobId:'job2'}];
 state.settings.technicalEvidenceLinks=[{practiceId:'draft1',checkId:'check1',practiceRevision:2,removedAt:''}];
 assert.throws(()=>api.manifest(practice,core,state),/intervento differente/);
});
test('proof of different equipment is never included',()=>{
 const practice={...p(),plantId:'plant1',deviceId:'device1'};
 const localCore={...core,impianti:[{id:'plant1',immobile_id:'10'}],apparecchiature:[{id:'device1',impianto_id:'plant1'}]};
 const state=s();
 state.settings.fieldChecks=[{id:'check1',clientId:'1',deviceId:'device2'}];
 state.settings.technicalEvidenceLinks=[{practiceId:'draft1',checkId:'check1',practiceRevision:2,removedAt:''}];
 assert.throws(()=>api.manifest(practice,localCore,state),/apparecchiatura differente/);
});

test('audit flags absent originals and proofs without certifying',()=>{
 const practice={...p(),linkedDocIds:[]};
 const a=api.auditPackage([practice],'1',core,s());
 assert.equal(a.practices,1);
 assert.equal(a.authorizedForIssue,false);
 assert.equal(a.readyForManualReview,true);
 assert(a.findings.some(x=>x.code==='ORIGINALI_ASSENTI'));
 assert(a.findings.some(x=>x.code==='PROVE_ASSENTI'));
});
test('audit flags missing source file as blocking',()=>{
 const state=s();state.files=[];
 const a=api.auditPackage([p()],'1',core,state);
 assert.equal(a.blocked,1);
 assert.equal(a.readyForManualReview,false);
 assert(a.findings.some(x=>x.code==='FILE ASSENTE'&&x.severity==='BLOCCANTE'));
});
