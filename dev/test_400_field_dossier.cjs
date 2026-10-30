'use strict';
const assert=require('node:assert/strict');
const checks=require('../ite-field-checks.js');
const dossier=require('../ite-intervention-dossier.js');
const core={
 clienti:[{id:1,name:'Cliente TEST'},{id:2,name:'Tecnico TEST'}],
 immobili:[{id:10,client_id:1,name:'Sede TEST'}],
 impianti:[{id:20,immobile_id:10,name:'Impianto TEST'}],
 apparecchiature:[{id:30,impianto_id:20,brand:'Marca TEST',model:'Modello TEST'}],
 cantieri:[{id:40,client_id:1,immobile_id:10,name:'Cantiere TEST'}],
 interventi:[{id:50,appointment:'1',client_id:1,immobile_id:10,impianto_id:20,apparecchiatura_id:30,cantiere_id:40,kind:'Manutenzione',date:'2026-10-30',workflow_status:'In corso',description:'Intervento fittizio',outcome:'Da verificare',assigned_operators:'[{"operator_id":"2"}]',work_sessions:'[]',revision_audit:'[]'}]
};
const state={settings:{},audit:[]};
checks.add(state,core,{jobId:50,actorId:2,category:'Termico',kind:'Misura strumentale',outcome:'Rilevato',label:'Temperatura mandata',value:'48.5',unit:'°C',note:'Dato TEST'});
checks.add(state,core,{jobId:50,actorId:2,category:'Termico',kind:'Verifica visiva',outcome:'Da verificare',label:'Ispezione impianto',value:'',note:'Verifica fittizia'});
const r=dossier.build(core,state,50);
assert.equal(r.checks.length,2);assert.equal(r.fieldVoided,0);
assert.ok(r.warnings.some(x=>x.includes('prove tecniche da verificare')));
assert.match(dossier.printable(r),/Temperatura mandata/);
assert.match(dossier.printable(r),/48.5/);
assert.match(dossier.csv(r),/Ispezione impianto/);
assert.doesNotMatch(dossier.printable(r),/unitCostCents|Tariffa interna/);
const row=state.settings.fieldChecks[0];
checks.voidCheck(state,core,{id:row.id,actorId:2,reason:'Correzione misura'});
const revised=dossier.build(core,state,50);
assert.equal(revised.checks.length,1);assert.equal(revised.fieldVoided,1);
console.log('OK: field checks included in dossier, flagged checks, reversals excluded, A4/CSV safe');
