'use strict';
// Regressione salvataggio anagrafiche/interventi: validazioni prima della scrittura.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function persist(){'),end=source.indexOf('function feedback(',start);
assert(start>=0&&end>start,'Persistenza principale non trovata');
const code=source.slice(start,end);
function scenario(fail){
 const calls=[],original={interventi:[{id:1,technician_id:'1'}]},incoming={interventi:[{id:1,technician_id:'2'}]};
 const context={db:structuredClone(incoming),committed:JSON.stringify(original),storage:true,window:{
  ITEAgenda:{validateDatabase:()=>{calls.push('agenda');if(fail==='agenda')throw Error('Agenda incoerente')}},
  ITEOperators:{validateDatabase:()=>{calls.push('operators');if(fail==='operators')throw Error('Operatore incoerente')}}
 },writeArchive:()=>{calls.push('write');if(fail==='storage')throw Error('Memoria piena')},JSON,Error};
 context.ITEAgenda=context.window.ITEAgenda;context.ITEOperators=context.window.ITEOperators;
 vm.createContext(context);vm.runInContext(code+';this.runPersist=persist',context);
 let error='';try{context.runPersist()}catch(e){error=e.message}
 return {calls,error,db:context.db};
}
for(const fail of ['agenda','operators','storage']){
 const r=scenario(fail);
 assert(r.error.includes('Salvataggio non riuscito'),fail);
 assert.equal(r.db.interventi[0].technician_id,'1',fail);
 assert.equal(r.calls.includes('write'),fail==='storage',fail);
}
const success=scenario();
assert.deepEqual(success.calls,['agenda','operators','write']);
assert.equal(success.error,'');
assert.equal(success.db.interventi[0].technician_id,'2');
console.log('OK: 4 scenari salvataggio, operatori e rollback');
