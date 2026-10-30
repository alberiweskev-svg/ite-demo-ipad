'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
global.ITETechnicalPackage=require('../ite-technical-package.js');
const ui=require('../ite-technical-package-ui.js');
const core={clienti:[{id:'c1',name:'Cliente TEST'}],immobili:[],cantieri:[],impianti:[],apparecchiature:[]};
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
