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
 assert.equal(m.audit.groups['Di.Co. elettrica'].count,1);assert.equal(m.audit.groups['Di.Co. elettrica'].review+m.audit.groups['Di.Co. elettrica'].blocked,1);
 m.core=core;m.state=state;
 const html=ui.render(m);
 assert(html.includes('BOZZA INTERNA'));
 assert(html.includes('Riepilogo per tipologia'));
 assert(html.includes('Di.Co. elettrica: 1 pratiche'));
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

test('filter by type and review state isolates dossier rows and exports',()=>{
 const second={...p,id:'d2',type:'POS',fields:{reference:'POS-TEST'},linkedDocIds:['missing']};
 const mixed={...state,settings:{...state.settings,technicalDrafts:[p,second]}};
 const all=ui.model('c1',core,mixed);
 assert.equal(all.rows.length,2);assert.equal(all.audit.blocked,1);
 const pos=ui.model('c1',core,mixed,{type:'POS',status:'BLOCCATA'});
 assert.equal(pos.rows.length,1);assert.equal(pos.rows[0].id,'d2');assert.equal(pos.audit.blocked,1);assert.equal(pos.allCount,2);
 const reports=global.ITETechnicalPackage.bundle(pos.rows,'c1',core,mixed);
 assert.match(global.ITETechnicalPackage.csv(reports),/POS-TEST/);
 assert(!global.ITETechnicalPackage.csv(reports).includes('Di.Co. elettrica'));
 const review=ui.model('c1',core,mixed,{status:'DA VERIFICARE MANUALMENTE'});
 assert.equal(review.rows.length,1);assert.equal(review.rows[0].id,'d1');
 const none=ui.model('c1',core,mixed,{type:'POS',status:'DA VERIFICARE MANUALMENTE'});
 assert.equal(none.rows.length,0);assert.match(ui.render(none),/Nessuna pratica corrisponde/);
});
test('filter type labels remain escaped in dashboard',()=>{
 const hostile={...p,id:'d2',type:'<img src=x onerror=alert(1)>',fields:{reference:'TEST'}};
 const mixed={...state,settings:{...state.settings,technicalDrafts:[hostile]}};
 const m=ui.model('c1',core,mixed,{type:hostile.type});m.core=core;m.state=mixed;
 const html=ui.render(m);
 assert(!html.includes('<img src=x onerror=alert(1)>'));
 assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('export snapshot detects revision changes',()=>{
 const a=ui.model('c1',core,state);a.core=core;a.state=state;
 const changed={...state,settings:{...state.settings,technicalDrafts:[{...p,revision:2}]}};
 const b=ui.model('c1',core,changed);b.core=core;b.state=changed;
 assert.equal(ui.compareSelection(a,b),false);assert.equal(ui.compareSelection(a,a),true);
});
test('export snapshot detects changed SHA-256 and proof links',()=>{
 const linked={...p,linkedDocIds:['doc1']};
 const base={...state,documents:[{id:'doc1',clientId:'c1',fileId:'f1',type:'Di.Co.'}],files:[{id:'f1',hash:'a'.repeat(64)}],settings:{...state.settings,technicalDrafts:[linked]}};
 const a=ui.model('c1',core,base);a.core=core;a.state=base;
 const altered={...base,files:[{id:'f1',hash:'b'.repeat(64)}]};
 const b=ui.model('c1',core,altered);b.core=core;b.state=altered;
 assert.equal(ui.compareSelection(a,b),false);
 const proof={...base,settings:{...base.settings,technicalEvidenceLinks:[{practiceId:'d1',checkId:'missing',practiceRevision:1}]}};
 const c=ui.model('c1',core,proof);c.core=core;c.state=proof;
 assert.equal(ui.compareSelection(a,c),false);
});
test('export snapshot is read only and rejects empty selection',()=>{
 const before=JSON.stringify(state);
 const a=ui.model('c1',core,state);a.core=core;a.state=state;
 const b=ui.model('c2',core,state);b.core=core;b.state=state;
 assert.equal(ui.compareSelection(a,b),false);
 assert.equal(JSON.stringify(state),before);
});
