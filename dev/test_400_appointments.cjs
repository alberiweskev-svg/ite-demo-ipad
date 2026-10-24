'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function saveAppointment(event){');
assert(start>=0,'Missing saveAppointment');
let depth=0,quote='',escaped=false,begin=source.indexOf('{',start),end=-1;
for(let i=begin;i<source.length;i++){const c=source[i];if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break}}
assert(end>0,'Unterminated saveAppointment');
const fn=source.slice(start,end);
function scenario(primary,supports){
 const alerts=[],calls=[],interventi=[],elements={
 'appointment-client':{value:'1'},'appointment-site':{value:'none'},'appointment-category':{value:'other'},'appointment-device':{value:''},'appointment-worksite':{value:''},
 'appointment-notes':{value:'Controllo impianto'},'appointment-primary':{value:primary},'appointment-duration':{value:'60'},
 'appointment-policy':{value:'ordinary'},'appointment-fee':{value:'0'},'appointment-start':{value:'2026-10-26T09:00'},
 'appointment-supports':{querySelectorAll:()=>supports.map(value=>({value}))},'appointment-kind':{value:'Manutenzione'},'agenda-date':{value:''}
 };
 const people={'1':{id:1,roles:['Cliente']},'2':{id:2,roles:['Dipendente']},'3':{id:3,roles:['Dipendente']}};
 const ctx={
 $:key=>elements[key],person:key=>people[key],db:()=>({cantieri:[],interventi}),
 ITEOperators:{eligible:p=>!!p&&p.roles.includes('Dipendente')},
 plannedConflicts:()=>[],records:()=>interventi,editingId:null,alert:msg=>alerts.push(msg),
 ITE:{commit:callback=>{const next={interventi};callback(next);calls.push('commit')}},
 validateDatabase:()=>{},localDate:()=> '2026-10-26',cancel:()=>{},renderCalendar:()=>{},open:()=>{},message:()=>{},
 confirm:()=>true,Date,Number,JSON,Math,String,Set
 };
 vm.createContext(ctx);vm.runInContext(fn+';saveAppointment({preventDefault(){}})',ctx);
 return {alerts,calls,interventi};
}
let r=scenario('2',['2']);assert.equal(r.calls.length,0);assert.match(r.alerts[0],/assegnato due volte/);
r=scenario('',['3']);assert.equal(r.calls.length,0);assert.match(r.alerts[0],/tecnico principale/);
r=scenario('2',['3']);assert.equal(r.calls.length,1);assert.equal(r.interventi.length,1);
assert.equal(JSON.parse(r.interventi[0].assigned_operators).length,2);
assert.equal(r.interventi[0].intervention_subject,'other');
console.log('OK: 3 appointment tests (duplicate operator, missing primary, valid other intervention)');
