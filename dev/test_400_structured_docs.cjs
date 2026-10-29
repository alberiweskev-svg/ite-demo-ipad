'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={Set,Map,Array,Object,String,Number,Error};sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('technical-structured-docs.js','utf8'),sandbox);
const {validate,assess,build}=sandbox.ITEStructuredDocuments;
const base={
 clienti:[{id:1,name:'Cliente [TEST] <Bologna>'},{id:2,name:'CLIENTE SEGRETO NON ESPORTARE'}],
 immobili:[{id:3,client_id:'1',name:'Via Prova 3'},{id:4,client_id:'2',name:'Via Segreta'}],
 impianti:[{id:5,immobile_id:'3',name:'Rete idrica TEST'}],
 apparecchiature:[{id:6,impianto_id:'5',brand:'Marca TEST',model:'X1'}],
 cantieri:[{id:7,client_id:'1',immobile_id:'3',name:'Cantiere TEST'}],
 interventi:[{id:8,client_id:'1',description:'Intervento sintetico'}]
};
const docs=[
 {id:'d1',clientId:'1',propertyId:'3',type:'Di.Co. idrica / termica',number:'DICO-SYN-001',sourceName:'fittizio.txt',date:'2026-10-29'},
 {id:'d2',clientId:'2',type:'Di.Co. elettrica',number:'ORIGINALE SEGRETO NON ESPORTARE'}
];
const p={id:'td_test_1',type:'Di.Co. idrica / termica',status:'Bozza',revision:2,clientId:'1',propertyId:'3',plantId:'5',deviceId:'6',siteId:'7',interventionId:'8',date:'2026-10-29',fields:{reference:'TEST-001',scope:'Impianto <fittizio>',materials:'Rame & raccordi'},structured:{committente:'[TEST] Committente',indirizzoImpianto:'Via Prova 3'},checklistEvidence:{'Schema impianto':{status:'Documentato',evidence:'Riferimento sintetico',documentId:'d1'}},linkedDocIds:['d1'],originalPrefill:{'detail:committente':{value:'[TEST] Committente',documentId:'d1'}}};
const groups={'Di.Co. idrica / termica':[{title:'Committente e ubicazione',fields:[['committente','Committente','text',true],['indirizzoImpianto','Indirizzo','text',true],['impresaEsecutrice','Impresa','text',true]]}]};
const before=JSON.stringify({p,base,docs});
const result=build([p],'1',docs,base,{groups,drawings:[{id:'cad_test',title:'Schema TEST',clientId:'1',revision:2}],links:[{drawingId:'cad_test',practiceId:p.id,drawingRevision:1}]});
assert.match(result.html,/<!doctype html>/);
assert.match(result.html,/size:A4/);
assert.match(result.html,/BOZZA NON VALIDA/);
assert.match(result.html,/&lt;Bologna&gt;/);
assert.match(result.html,/Impianto &lt;fittizio&gt;/);
assert.match(result.html,/Rame &amp; raccordi/);
assert.match(result.html,/DICO-SYN-001/);
assert.match(result.html,/revisione superata/);
assert(!result.html.includes('ORIGINALE SEGRETO NON ESPORTARE'));
assert(!result.html.includes('CLIENTE SEGRETO NON ESPORTARE'));
assert.equal(result.annexes.length,1);
assert(result.issuesByPractice[0].issues.some(x=>x.includes('Impresa')));
assert.equal(JSON.stringify({p,base,docs}),before,'Export must be read-only');
assert.throws(()=>build([{...p,clientId:'2'}],'1',docs,base),/cliente diverso/);
assert.throws(()=>build([{...p,linkedDocIds:['d2']}],'1',docs,base),/Originale mancante/);
assert.throws(()=>build([{...p,propertyId:'4'}],'1',docs,base),/Collegamenti anagrafici/);
assert.throws(()=>build([p,p],'1',docs,base),/duplicata/);
assert.throws(()=>build(Array.from({length:51},(_,i)=>({...p,id:'td_test_'+i})),'1',docs,base),/1 a 50/);
assert.throws(()=>build([p],'2',docs,base),/cliente diverso/);
const foreignSource={...p,originalPrefill:{'detail:committente':{value:'INIEZIONE SEGRETA',documentId:'d2'}}};
const safe=build([foreignSource],'1',docs,base,{groups});
assert(!safe.html.includes('INIEZIONE SEGRETA'));
assert(safe.html.includes('Fonte non verificabile'));
const gas={...p,type:'Allegato gas H40',structured:{indirizzoUtenza:'Via TEST'},fields:{...p.fields,pdr:'ANAGRAFICA-TEST'}};
assert(assess(gas,docs).some(x=>x.includes('PDR non attestato')));
const pos={...p,type:'POS',siteId:'',structured:{inizioLavori:'2026-10-30',fineLavori:'2026-10-29'}};
assert(assess(pos,docs).some(x=>x.includes('Date POS incoerenti')));
assert(validate([p],'1',docs,base));
console.log('OK: structured A4 dossier, linked entities, original index, XSS escape, CAD revision, PDR safety, isolation, read-only');
