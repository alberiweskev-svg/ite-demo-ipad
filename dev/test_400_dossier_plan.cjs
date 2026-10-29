'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={Set,Map,Array,Object,String,Number,Error};sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('technical-structured-docs.js','utf8'),sandbox);
const api=sandbox.ITEStructuredDocuments;
const base={
 clienti:[{id:'1',name:'Cliente prova <TEST>'},{id:'2',name:'CLIENTE RISERVATO'}],
 immobili:[{id:'s1',client_id:'1',name:'Sede prova'},{id:'s2',client_id:'2',name:'Sede riservata'}],
 cantieri:[],impianti:[],apparecchiature:[],interventi:[]
};
const make=(id,type,ref,pdr='')=>({id,type,clientId:'1',propertyId:'s1',siteId:'',plantId:'',deviceId:'',status:'Bozza',revision:1,
 fields:{reference:ref,scope:'Impianto sintetico'},structured:{pdrVerificato:pdr},linkedDocIds:[],checklistEvidence:{}});
const a=make('a','Allegato gas H40','=FORMULA-TEST','PDR-0001');
const b=make('b','Allegato gas I40','GAS-2','PDR-0002');
const c=make('c','Allegato gas H40','=FORMULA-TEST','PDR-0001');
const docs=[],rows=[a,b,c],before=JSON.stringify({rows,docs,base});
const plan=api.dossierPlan(rows,'1',docs,base);
assert.equal(plan.summary.practices,3);
assert.equal(plan.summary.external,3);
assert(plan.summary.priority>0);
assert(plan.actions.some(x=>x.section==='Coerenza GAS'&&x.task==='PDR discordante'));
assert(plan.actions.filter(x=>x.section==='Numerazione'&&x.task==='Riferimento duplicato').length===2);
assert(plan.actions.some(x=>x.section==='Originali'));
assert(plan.actions.every(x=>['Prioritaria','Operativa','Esterna'].includes(x.priority)));
const csv=api.dossierPlanCsv(rows,'1',docs,base);
assert(csv.csv.startsWith('\uFEFF'));
assert(csv.csv.includes("'=FORMULA-TEST"),'CSV formula injection must be neutralized');
assert(csv.csv.includes('PDR discordante'));
const html=api.dossierPlanHtml(rows,'1',docs,base);
assert.match(html.html,/size:A4 landscape/);
assert.match(html.html,/BOZZA OPERATIVA NON VALIDA/);
assert.match(html.html,/Cliente prova &lt;TEST&gt;/);
assert(!html.html.includes('CLIENTE RISERVATO'));
assert(!html.html.includes('<script>'));
const dossier=api.build(rows,'1',docs,base);
assert.match(dossier.html,/Piano di completamento/);
assert.match(dossier.html,/Attività prioritarie del piano/);
assert.equal(JSON.stringify({rows,docs,base}),before,'Exports must not modify archives');
assert.throws(()=>api.dossierPlan([{...a,clientId:'2'}],'1',docs,base),/cliente diverso/);
assert.throws(()=>api.dossierPlan([{...a,propertyId:'s2'}],'1',docs,base),/Collegamenti anagrafici/);
assert.throws(()=>api.dossierPlan([a,a],'1',docs,base),/duplicata/);
assert.throws(()=>api.dossierPlan(rows,'2',docs,base),/cliente diverso/);
const isolated=api.dossierPlanHtml([a],'1',docs,base);
assert(!isolated.html.includes('CLIENTE RISERVATO'));
console.log('OK: cross-practice PDR, duplicate references, prioritized plan, CSV anti-formula, A4, privacy and immutability');
