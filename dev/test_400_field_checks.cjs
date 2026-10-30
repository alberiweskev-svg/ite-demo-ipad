'use strict';
const assert=require('node:assert/strict');
const api=require('../ite-field-checks.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const core={
 clienti:[{id:1,name:'=Cliente fittizio'},{id:2,name:'Operatore fittizio'},{id:3,name:'Altro cliente'}],
 immobili:[{id:10,client_id:'1',name:'Sede TEST'}],
 impianti:[{id:20,immobile_id:'10',name:'Impianto TEST'}],
 apparecchiature:[{id:30,impianto_id:'20',brand:'Marca TEST',model:'Modello TEST'}],
 cantieri:[{id:40,client_id:'1',immobile_id:'10',name:'Cantiere TEST'}],
 interventi:[{id:50,appointment:'1',client_id:'1',immobile_id:'10',impianto_id:'20',apparecchiatura_id:'30',cantiere_id:'40',workflow_status:'In corso',assigned_operators:'[{"operator_id":"2","role":"Principale"}]'}]
};
const state=()=>({settings:{},audit:[]});
const req={jobId:50,actorId:2,category:'Termico',kind:'Misura strumentale',outcome:'Rilevato',label:'Temperatura mandata',value:'45,500',unit:'°C',instrument:'Termometro TEST',note:'Misura a regime'};
const s=state();
assert.equal(api.fields(req).value,'45.500');
assert.throws(()=>api.fields({...req,value:'1e3'}),/numerico/);
assert.throws(()=>api.fields({...req,value:'12.1234'}),/numerico/);
assert.throws(()=>api.fields({...req,unit:'mmHg'}),/Unità/);
assert.throws(()=>api.fields({...req,kind:'Verifica visiva'}),/Solo le misure/);
assert.throws(()=>api.fields({...req,outcome:'Non eseguito'}),/non eseguita/);
assert.throws(()=>api.fields({...req,label:'x'}),/Descrizione/);
assert.throws(()=>api.add(s,core,{...req,actorId:3}),/non assegnato/);
assert.throws(()=>api.add(s,core,{...req,jobId:999}),/non disponibile/);
const row=api.add(s,core,req);
assert.equal(row.clientId,'1');assert.equal(row.plantId,'20');assert.equal(row.deviceId,'30');
assert.equal(s.audit.length,1);assert.equal(api.validate(s,core),true);
assert.equal(api.forIntervention(s,core,50).active.length,1);
assert.equal(api.forDevice(s,core,30)[0].id,row.id);
assert.match(api.render(core.interventi[0],core,s),/Prove e misure tecniche/);
const flagged=api.add(s,core,{...req,kind:'Verifica visiva',label:'Controllo visivo tubazione',outcome:'Da verificare',value:'',note:'=Formula pericolosa'});
assert.equal(api.forIntervention(s,core,50).flagged,1);
assert.match(api.csv(api.forIntervention(s,core,50).all,core),/"'=Cliente fittizio"/);
assert.match(api.csv(api.forIntervention(s,core,50).all,core),/"'=Formula pericolosa"/);
assert.doesNotMatch(api.render(core.interventi[0],core,s),/<script/);
assert.throws(()=>api.voidCheck(s,core,{id:row.id,actorId:2,reason:'no'}),/Motivazione/);
api.voidCheck(s,core,{id:row.id,actorId:2,reason:'Strumento non tarato'});
assert.equal(api.forIntervention(s,core,50).voided,1);
assert.equal(api.forDevice(s,core,30).length,1);
assert.throws(()=>api.voidCheck(s,core,{id:row.id,actorId:2,reason:'Altro motivo'}),/già stornata/);
assert.equal(api.validate(s,core),true);
let bad=clone(s);bad.settings.fieldChecks[1].clientId='3';
assert.throws(()=>api.validate(bad,core),/incoerente/);
bad=clone(s);bad.settings.fieldChecks.push(clone(bad.settings.fieldChecks[0]));
assert.throws(()=>api.validate(bad,core),/duplicata/);
bad=clone(s);bad.settings.fieldChecks[0].voidReason='';
assert.throws(()=>api.validate(bad,core),/Storno prova/);
let wrong=clone(core);wrong.immobili[0].client_id='3';
assert.throws(()=>api.forIntervention(s,wrong,50),/altro cliente/);
wrong=clone(core);wrong.interventi[0].workflow_status='Chiuso';
assert.throws(()=>api.add(state(),wrong,req),/Revisiona intervento/);
assert.throws(()=>api.voidCheck(s,wrong,{id:flagged.id,actorId:2,reason:'Motivo valido'}),/Revisiona intervento/);
assert.equal(s.settings.fieldChecks.length,2);
console.log('OK: prove tecniche, misure, operatori, gerarchia, storico apparecchiatura, storni, audit, CSV e sicurezza');
