'use strict';
// Persistenza archivio interventi + cantieri attraverso riapertura e scritture interrotte.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function readSites(main,raw){');
const end=source.indexOf('\ntry{const raw=ITEVault.storage.getItem(STORE)',start);
assert(start>=0&&end>start,'Gestione archivio non trovata');
const values=new Map();let failKey='';
const storage={getItem:k=>values.has(k)?values.get(k):null,
 setItem:(k,v)=>{if(k===failKey)throw Error('Simulated write interruption');values.set(k,v)},
 removeItem:k=>values.delete(k)};
const initial={clienti:[],immobili:[],impianti:[],apparecchiature:[],interventi:[],cantieri:[]};
const context={ITEVault:{storage},STORE:'ite_test',AUX:'ite_test_aziendale_v1',db:initial,valid:()=>true,JSON,Array,Error};
vm.createContext(context);
vm.runInContext(source.slice(start,end)+';this.write=writeArchive;this.readSites=readSites;',context);
const job={id:7,workflow_status:'In corso',revision_audit:'[{"action":"RIAPERTURA_REVISIONE"}]',work_sessions:'[]'};
const next={...initial,interventi:[job],cantieri:[{id:3,name:'Cantiere demo'}]};
context.write(next);
const main=JSON.parse(storage.getItem('ite_test'));
assert.deepEqual(main.interventi,[job]);
assert.equal(main.cantieri,undefined,'Cantieri conservati nella chiave aggiuntiva');
assert.equal(context.readSites(storage.getItem('ite_test'),storage.getItem('ite_test_aziendale_v1'))[0].id,3);
assert.equal(JSON.parse(storage.getItem('ite_test_aziendale_v1')).pending,undefined);
const previousMain=storage.getItem('ite_test');
failKey='ite_test';
assert.throws(()=>context.write({...next,interventi:[]}),/Simulated write interruption/);
failKey='';
assert.equal(storage.getItem('ite_test'),previousMain);
assert.equal(context.readSites(storage.getItem('ite_test'),storage.getItem('ite_test_aziendale_v1'))[0].id,3);
// Interruzione dopo la scrittura principale: il giornale pending deve consentire il recupero.
const pendingMain=JSON.stringify({...next,cantieri:undefined,interventi:[{...job,workflow_status:'Chiuso'}]});
const previousSites=[{id:3,name:'Cantiere demo'}];
const pendingSites=[{id:4,name:'Cantiere aggiornato'}];
storage.setItem('ite_test_aziendale_v1',JSON.stringify({
 schema:1,cantieri:pendingSites,pending:{
 previousMain:previousMain,nextMain:pendingMain,previousCantieri:previousSites
 }}));
assert.equal(context.readSites(previousMain,storage.getItem('ite_test_aziendale_v1'))[0].id,3);
storage.setItem('ite_test',pendingMain);
assert.equal(context.readSites(pendingMain,storage.getItem('ite_test_aziendale_v1'))[0].id,4);
assert.throws(()=>context.readSites('unrelated archive',storage.getItem('ite_test_aziendale_v1')),/Archivio modificato/);
// Se la scrittura finale della chiave aggiuntiva fallisce, il giornale deve restare recuperabile.
values.clear();
context.write(next);
const lastMain=storage.getItem('ite_test');
const originalSet=storage.setItem;
let auxWrites=0;
storage.setItem=(key,value)=>{
 if(key==='ite_test_aziendale_v1'&&++auxWrites===2)throw Error('Simulated finalization failure');
 return originalSet(key,value);
};
context.write({...next,cantieri:[{id:8,name:'Nuovo cantiere'}]});
storage.setItem=originalSet;
const journal=JSON.parse(storage.getItem('ite_test_aziendale_v1'));
assert(journal.pending,'Il giornale deve restare disponibile se fallisce la finalizzazione');
assert.equal(context.readSites(storage.getItem('ite_test'),storage.getItem('ite_test_aziendale_v1'))[0].id,8);
assert.notEqual(storage.getItem('ite_test'),lastMain,'La scrittura principale è completata');
console.log('OK: archivio interventi persistente, cantieri recuperabili e rollback su scrittura interrotta');
