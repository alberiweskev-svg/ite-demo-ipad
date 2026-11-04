'use strict';
const assert=require('node:assert/strict');
const UI=require('./ite-technical-dossier-audit-ui.js');
const H=require('./ite-hierarchy-workspace.js'),I=require('./ite-document-intake.js'),D=require('./ite-technical-dossier.js'),A=require('./ite-technical-dossier-audit.js');
let h=H.add(H.empty(),'clients',{id:'c',name:'Cliente demo'});
h=H.add(h,'sites',{id:'s',clientId:'c',address:'Via Fittizia 1'});
let q=I.empty();for(const id of ['d1','d2']){q=I.add(q,{id,filename:id+'.pdf',addedAt:'2026-11-04',type:'DIRI',clientId:'c',siteId:'s'});q=I.verify(q,id,'Tecnico demo')}
const actions=UI.actionsFor(['d1','d1','d2'],{clientId:'c',siteId:'s',linkedAt:'2026-11-04'});
assert.equal(actions.length,2);
const state=A.prepare(D.empty(),q,h,null,actions,'Tecnico demo','2026-11-04T11:55:00+01:00');
assert.equal(state.state.links.length,2);assert.equal(state.audit.events.length,2);
assert.equal(D.empty().links.length,0);
assert.throws(()=>A.prepare(D.empty(),q,h,null,UI.actionsFor(['missing'],{clientId:'c',siteId:'s'}),'Tecnico demo','2026-11-04T11:55:00+01:00'));
console.log('Dossier audit UI integration: synthetic tests passed');
