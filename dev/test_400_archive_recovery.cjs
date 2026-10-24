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
const context={ITEVault:{storage},STORE:'ite_test',db:initial,valid:()=>true,JSON,Array,Error};
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
console.log('OK: archivio interventi persistente, cantieri recuperabili e rollback su scrittura interrotta');
