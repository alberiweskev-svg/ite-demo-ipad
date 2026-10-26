'use strict';
// Protezione contro sovrascritture da una seconda scheda: solo dati fittizi.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const begin=source.indexOf('function readSites(main,raw){');
const end=source.indexOf('\ntry{const raw=ITEVault.storage.getItem(STORE)',begin);
const guard=source.indexOf('function assertArchiveFresh(){');
const persist=source.indexOf('function persist(){',guard);
const persistEnd=source.indexOf('function feedback(',persist);
assert(begin>=0&&end>begin&&guard>end&&persist>guard&&persistEnd>persist,'Archive freshness guard not found');
const makeData=(name='Cliente demo')=>({
 clienti:[{id:1,name}],immobili:[],impianti:[],apparecchiature:[],interventi:[],cantieri:[]
});
const initial=makeData(),values=new Map(),writes=[];
const storage={
 getItem:key=>values.has(key)?values.get(key):null,
 setItem:(key,value)=>{writes.push(key);values.set(key,value)}
};
const context={
 ITEVault:{storage},STORE:'ite_test',AUX:'ite_test_aziendale_v1',
 seed:initial,db:structuredClone(initial),committed:JSON.stringify(initial),
 valid:()=>true,JSON,Array,Object,Error,window:{},storage:true,
 writeArchive:()=>{writes.push('archive-write')}
};
vm.createContext(context);
vm.runInContext(source.slice(begin,end)+'\n'+source.slice(guard,persistEnd)+
 ';this.check=assertArchiveFresh;this.save=persist;',context);
// Prima apertura: nessuna chiave ancora scritta.
assert.doesNotThrow(()=>context.check());
const main=data=>JSON.stringify({...data,cantieri:undefined});
storage.setItem('ite_test',main(initial));writes.length=0;
assert.doesNotThrow(()=>context.check());
// Un'altra scheda ha aggiornato l'anagrafica: non sovrascriverla.
storage.setItem('ite_test',main(makeData('Cliente aggiornato da altra scheda')));writes.length=0;
assert.throws(()=>context.check(),/Archivio modificato da un’altra scheda/);
context.db=makeData('Modifica locale non salvata');
assert.throws(()=>context.save(),/Archivio modificato da un’altra scheda/);
assert.equal(context.db.clienti[0].name,'Cliente demo','Rollback della modifica locale');
assert.deepEqual(writes,[],'Non deve scrivere sul disco quando rileva un conflitto');
assert.equal(JSON.parse(storage.getItem('ite_test')).clienti[0].name,'Cliente aggiornato da altra scheda');
// Anche un cambiamento dei cantieri nella chiave aggiuntiva deve bloccare il salvataggio.
storage.setItem('ite_test',main(initial));
storage.setItem('ite_test_aziendale_v1',JSON.stringify({schema:1,cantieri:[{id:3,name:'Cantiere seconda scheda'}]}));
writes.length=0;
assert.throws(()=>context.check(),/Archivio modificato da un’altra scheda/);
// Il registro pending valido deve essere interpretato, non scambiato per corruzione.
const next=makeData('Cliente aggiornato');
const nextMain=main(next);
storage.setItem('ite_test',nextMain);
storage.setItem('ite_test_aziendale_v1',JSON.stringify({
 schema:1,cantieri:[{id:5,name:'Cantiere confermato'}],
 pending:{previousMain:main(initial),nextMain,previousCantieri:[]}
}));
context.committed=JSON.stringify({...next,cantieri:[{id:5,name:'Cantiere confermato'}]});
assert.doesNotThrow(()=>context.check());
// Se il registro è corrotto, il controllo deve fallire senza tentare di scrivere.
storage.setItem('ite_test_aziendale_v1','{bad-json');
writes.length=0;
assert.throws(()=>context.check(),SyntaxError);
assert.deepEqual(writes,[]);
// Una seconda scheda scrive dopo il primo controllo di freschezza, ma prima
// della prima scrittura del giornale. Il secondo controllo deve bloccare il salvataggio.
const writerStart=source.indexOf('function writeArchive(value){');
const writerEnd=source.indexOf('\n\ntry{const raw=',writerStart);
assert(writerStart>=0&&writerEnd>writerStart,'Archive writer not found');
vm.runInContext(source.slice(writerStart,writerEnd),context);
values.set('ite_test',main(initial));
values.delete('ite_test_aziendale_v1');
context.committed=JSON.stringify(initial);
context.db=makeData('Modifica locale');
writes.length=0;
const readBeforeRace=storage.getItem;
let raceInjected=false;
storage.getItem=key=>{
 const current=readBeforeRace(key);
 if(!raceInjected&&key==='ite_test_aziendale_v1'){
  raceInjected=true;
  values.set('ite_test',main(makeData('Modifica da altra scheda')));
 }
 return current;
};
assert.throws(()=>context.save(),/Archivio modificato da un’altra scheda/);
assert.equal(raceInjected,true,'Il test deve simulare davvero la modifica concorrente');
assert.deepEqual(writes,[],'Nessuna scrittura locale dopo il conflitto');
assert.equal(JSON.parse(values.get('ite_test')).clienti[0].name,'Modifica da altra scheda');
assert.equal(context.db.clienti[0].name,'Cliente demo','Rollback della modifica locale');
console.log('OK: rilevazione conflitti tra schede, cantieri, pending journal e rollback senza sovrascritture');
