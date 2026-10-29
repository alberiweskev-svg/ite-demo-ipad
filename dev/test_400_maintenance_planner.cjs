'use strict';
// Synthetic-only regression for I.T.E. 4.0 maintenance planning, no real customer records.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={Date,Number,String,Array,Map,Object,JSON,Intl,Error,globalThis:null};
context.window={addEventListener(){}};
context.document={addEventListener(){}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('ite-maintenance-planner.js','utf8'),context);
const api=context.window.ITEMaintenancePlanner;
assert.ok(api&&typeof api.derive==='function');
assert.equal(api.day('2026-02-29'),'');
assert.equal(api.day('2024-02-29'),'2024-02-29');
assert.equal(api.plusMonths('2025-01-31',1),'2025-02-28');
assert.equal(api.plusMonths('2024-01-31',1),'2024-02-29');
assert.equal(api.plusMonths('2025-12-31',13),'2027-01-31');
assert.equal(api.daysBetween('2026-10-29','2026-10-30'),1);
const data={
 clienti:[{id:1,name:'Cliente Fittizio Uno'},{id:2,name:'Cliente Fittizio Due'}],
 immobili:[{id:10,client_id:'1',name:'Via Prova 10',city:'Bologna'},{id:20,client_id:'2',name:'Via Prova 20',city:'Bologna'}],
 impianti:[{id:100,immobile_id:'10',name:'Termico test'},{id:200,immobile_id:'20',name:'Clima test'}],
 apparecchiature:[
  {id:1000,impianto_id:'100',category:'Caldaia',brand:'Baxi',model:'TEST',serial:'TEST-1000'},
  {id:2000,impianto_id:'200',category:'Condizionatore',brand:'Hisense',model:'TEST',serial:'TEST-2000'},
  {id:3000,impianto_id:'100',category:'Caldaia',brand:'Prova',model:'NUOVO',serial:'TEST-3000'},
  {id:4000,impianto_id:'999',category:'Caldaia',brand:'Orfano',serial:'ORFANO'}],
 interventi:[
  {id:1,apparecchiatura_id:'1000',kind:'Manutenzione',date:'2025-10-01',outcome:'Completato'},
  {id:2,apparecchiatura_id:'1000',kind:'Riparazione',date:'2026-10-15',outcome:'Completato'},
  {id:3,apparecchiatura_id:'2000',kind:'Manutenzione',date:'2026-09-01',outcome:'Completato'},
  {id:4,apparecchiatura_id:'2000',kind:'Manutenzione',appointment:'1',workflow_status:'Programmato',scheduled_start:'2026-11-20T09:00:00Z'},
  {id:5,apparecchiatura_id:'3000',kind:'Manutenzione',date:'NON VALIDA',outcome:'Completato'}]
};
const result=api.derive(data,{today:'2026-10-29',months:12,horizon:60});
assert.equal(result.rows.length,3,'Broken hierarchy must not appear in client results');
assert.equal(result.issues.length,1);
const byId=id=>result.rows.find(r=>r.deviceId===String(id));
assert.equal(byId(1000).status,'Scaduta');
assert.equal(byId(1000).last,'2025-10-01','Repairs cannot reset maintenance');
assert.equal(byId(1000).due,'2026-10-01');
assert.equal(byId(2000).status,'Programmata');
assert.equal(byId(2000).scheduled,'2026-11-20');
assert.equal(byId(3000).status,'Dati da verificare');
assert.equal(result.counts['Scaduta'],1);
assert.equal(result.counts['Programmata'],1);
assert.equal(api.filtered(result.rows,{query:'hisense'}).length,1);
assert.equal(api.filtered(result.rows,{status:'Scaduta'}).length,1);
assert.throws(()=>api.derive(data,{today:'2026-10-29',months:0}),/Intervallo/);
assert.throws(()=>api.derive(data,{today:'2026-10-29',horizon:366}),/Intervallo/);
const source=JSON.stringify(data);
api.derive(data,{today:'2026-10-29'});
assert.equal(JSON.stringify(data),source,'Planner must never mutate customer data');
const malicious=[{...byId(1000),client:' =HYPERLINK("https://example.invalid")',serial:'@SUM(1+1)',device:'-cmd',site:'+FORMULA'}];
const csv=api.csv(malicious);
assert.ok(csv.startsWith('\uFEFF'));
assert.ok(csv.includes('"\' =HYPERLINK('),'Spreadsheet formula injection in customer name');
assert.ok(csv.includes('"\'@SUM(1+1)"'));
assert.ok(csv.includes('"\'-cmd"'));
assert.ok(csv.includes('"\'+FORMULA"'));
assert.ok(!csv.includes('ORFANO'),'Orphan equipment must never be exported');
const app=fs.readFileSync('index.html','utf8');
assert.match(app,/id="scadenziario"/);
assert.match(app,/href="#scadenziario"/);
assert.match(app,/id="plan-export"/);
assert.match(app,/ite-maintenance-planner\.js\?v=4\.0\.0" integrity="sha384-/);
console.log('OK: maintenance hierarchy, completion, dates, planned visits, filters, privacy, CSV injection and tablet integration');
