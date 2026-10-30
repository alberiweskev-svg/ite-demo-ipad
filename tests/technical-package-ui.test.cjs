'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
global.ITETechnicalPackage=require('../ite-technical-package.js');
const ui=require('../ite-technical-package-ui.js');
const core={clienti:[{id:'c1',name:'Cliente TEST'},{id:'c2',name:'Altro cliente fittizio'}],immobili:[],cantieri:[],impianti:[],apparecchiature:[]};
const p={id:'d1',clientId:'c1',type:'Di.Co. elettrica',revision:1,status:'Bozza',fields:{reference:'<script>TEST</script>',scope:'test'},linkedDocIds:[]};
const state={documents:[],files:[],settings:{technicalDrafts:[p],technicalAnnexLinks:[],technicalEvidenceLinks:[],fieldChecks:[],cadPracticeLinks:[],cadDrawings:[]}};
test('dashboard groups technical drafts without mutation',()=>{
 const before=JSON.stringify(state),m=ui.model('c1',core,state);
 assert.equal(m.audit.practices,1);assert.equal(m.audit.authorizedForIssue,false);
 m.core=core;m.state=state;
 const html=ui.render(m);
 assert(html.includes('BOZZA INTERNA'));
 assert(!html.includes('<script>TEST</script>'));
 assert(html.includes('&lt;script&gt;TEST&lt;/script&gt;'));
 assert.equal(JSON.stringify(state),before);
});
test('empty client dashboard does not disclose other customer',()=>{
 const m=ui.model('c2',core,state);assert.equal(m.empty,true);
 assert(!ui.render(m).includes('TEST'));
});
test('missing client is rejected',()=>assert.throws(()=>ui.model('',core,state),/Selezionare/));

test('unknown client is rejected rather than returning empty dossier',()=>{
 assert.throws(()=>ui.model('missing',core,state),/cliente valido/);
});
test('large dossiers are rejected before export or rendering',()=>{
 const many={...state,settings:{...state.settings,technicalDrafts:Array.from({length:51},(_,i)=>({...p,id:'d'+i}))}};
 assert.throws(()=>ui.model('c1',core,many),/50 pratiche/);
});
test('document audit findings are visible in dashboard without HTML injection',()=>{
 const broken={...state,settings:{...state.settings,technicalDrafts:[{...p,linkedDocIds:['<img src=x onerror=alert(1)>']}]}};
 const m=ui.model('c1',core,broken);m.core=core;m.state=broken;
 const html=ui.render(m);
 assert.match(html,/DOCUMENTO ASSENTE/);
 assert(!html.includes('<img src=x onerror=alert(1)>'));
 assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});
