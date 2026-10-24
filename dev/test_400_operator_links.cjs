'use strict';
// Regressione: i tecnici assegnati (anche come supporto) non devono perdere
// il collegamento agli interventi quando si modifica l'anagrafica.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
function extract(name){
 const start=source.indexOf('function '+name+'(');
 assert(start>=0,'Funzione mancante: '+name);
 const begin=source.indexOf('{',start);let depth=0,quote='',escaped=false;
 for(let i=begin;i<source.length;i++){
  const c=source[i];
  if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote='';continue}
  if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
  if(c==='{')depth++;else if(c==='}'&&!--depth)return source.slice(start,i+1);
 }
 throw Error('Funzione incompleta: '+name);
}
const assigned=[
 {operator_id:'3',role:'Principale'},
 {operator_id:'2',role:'Supporto'}
];
const data={
 clienti:[
  {id:1,name:'[TEST] Cliente',kind:'Cliente',roles:['Cliente']},
  {id:2,name:'[TEST] Supporto',kind:'Dipendente',roles:['Dipendente']},
  {id:3,name:'[TEST] Principale',kind:'Dipendente',roles:['Dipendente']},
  {id:4,name:'[TEST] Soggetto libero',kind:'Cliente',roles:['Cliente']}
 ],
 immobili:[],interventi:[{id:10,appointment:'1',technician_id:'3',assigned_operators:JSON.stringify(assigned)}]
};
let roles=['Dipendente'],saves=0,alerts=[],confirms=0;
class FakeFormData{
 *[Symbol.iterator](){yield ['name','[TEST] Supporto aggiornato'];}
 getAll(key){return key==='roles'?roles:[];}
}
const ctx={
 db:data,editing:{k:'clienti',id:2},FormData:FakeFormData,
 document:{getElementById:()=>({})},
 window:{},alert:msg=>alerts.push(msg),confirm:()=>{confirms++;return true},
 persist:()=>saves++,render:()=>{},cancel:()=>{},feedback:()=>{},
 JSON,String,Set,Number,Math,FormData
};
vm.createContext(ctx);
vm.runInContext(['eligible','read','references','save','remove'].map(extract).join(';')+
 ';this.api={eligible,read,references,save,remove}',ctx);
ctx.ITEOperators={eligible:ctx.api.eligible,references:ctx.api.references};
ctx.window.ITEOperators=ctx.ITEOperators;
const job=data.interventi[0];
assert.equal(ctx.api.references(job,2),true,'Il supporto assegnato deve risultare collegato');
assert.equal(ctx.api.references(job,3),true,'Il principale deve risultare collegato');
assert.equal(ctx.api.references(job,1),false,'Un soggetto non assegnato non deve risultare collegato');
assert.equal(ctx.api.references({work_logs:JSON.stringify([{operator_id:'2',duration_minutes:60}])},2),true,'Conservare riferimenti ai tempi legacy');
ctx.api.save({preventDefault(){}});
assert.equal(saves,1,'Modifica anagrafica Dipendente assegnato bloccata erroneamente');
assert.equal(data.clienti[1].name,'[TEST] Supporto aggiornato');
roles=['Cliente'];
ctx.api.save({preventDefault(){}});
assert.equal(saves,1,'Rimozione del ruolo operativo non bloccata');
assert.deepEqual(data.clienti[1].roles,['Dipendente'],'Ruolo operativo alterato');
assert.ok(alerts.some(msg=>msg.includes('ruolo operativo')),'Avviso riassegnazione mancante');
ctx.api.remove('clienti',2);
assert.equal(data.clienti.length,4,'Eliminato un supporto ancora assegnato');
assert.equal(confirms,0,'Richiesta conferma non necessaria per eliminazione vietata');
assert.ok(alerts.some(msg=>msg.includes('operatore collegato')),'Avviso eliminazione mancante');
roles=['Titolare'];
ctx.api.save({preventDefault(){}});
assert.equal(saves,2,'Cambio tra ruoli operativi legittimi bloccato');
assert.deepEqual(data.clienti[1].roles,['Titolare']);
ctx.api.remove('clienti',4);
assert.equal(data.clienti.length,3,'Soggetto non collegato non eliminabile');
assert.equal(confirms,1);
console.log('OK: 8 operator-link checks (support, principal, legacy, edit, role guard, delete guard, operative role, unrelated delete)');
