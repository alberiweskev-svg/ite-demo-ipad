'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={Uint8Array,Blob,Set,Map,Object,Array,String,Number,Error};sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('technical-pdf.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('technical-acroform.js','utf8'),sandbox);
const api=sandbox.ITETechnicalAcroform;
const base={clienti:[{id:1,name:'Cliente Fittizio'},{id:2,name:'Altro Cliente'}],
 immobili:[{id:10,client_id:1,name:'Via Prova 1'},{id:20,client_id:2,name:'Via Riservata'}],
 impianti:[{id:11,immobile_id:10,name:'Impianto test'}],apparecchiature:[],cantieri:[],interventi:[]};
const groups={};
for(const type of ['Di.Co. elettrica','Di.Co. idrica / termica','Di.Ri.','Allegato gas H40','Allegato gas I40','Allegato gas A12','Allegato gas B12','POS']){
 groups[type]=[{title:'Identificazione',fields:[['committente','Committente','text',true],
  ['ubicazione','Ubicazione','text',true],['descrizione','Descrizione lavori','textarea',false]]}];
}
const row={id:'prova-1',type:'Di.Co. elettrica',clientId:'1',propertyId:10,plantId:11,
 fields:{reference:'DICO-TEST-001',scope:'Lavori di prova',notes:'Accento città e simbolo €'},
 structured:{committente:'Mario TEST',ubicazione:'Via Prova 1',descrizione:'Controllo da verificare'},
 revision:2,linkedDocIds:[]};
const toLatin=buf=>Buffer.from(buf).toString('latin1');
const pdf=toLatin(api.build(row,'1',[],base,{groups}));
assert(pdf.startsWith('%PDF-1.4\n'));
assert(pdf.endsWith('%%EOF\n'));
assert(pdf.includes('/AcroForm 5 0 R')&&pdf.includes('/NeedAppearances false'));
assert(pdf.includes('/Subtype /Widget /FT /Tx'));
assert(pdf.includes('/T (detail.committente) /V (Mario TEST)'));
assert(pdf.includes('/T (general.reference) /V (DICO-TEST-001)'));
assert(pdf.includes('/Ff 4096'),'Multiline fields should be editable');
assert(pdf.includes('NON FIRMATA - NON VALIDA'));
assert(!pdf.includes('Altro Cliente')&&!pdf.includes('Via Riservata'));
const xref=Number(pdf.match(/startxref\n(\d+)\n/)[1]);assert.equal(pdf.slice(xref,xref+5),'xref\n');
const count=api.fieldsFor(row,groups).length;
assert.equal((pdf.match(/\/Subtype \/Widget/g)||[]).length,count);
assert.equal((pdf.match(/\/Subtype \/Form/g)||[]).length,count);
assert.throws(()=>api.build({...row,clientId:'2'},'1',[],base,{groups}),/altro cliente/);
assert.throws(()=>api.build({...row,propertyId:20},'1',[],base,{groups}),/incoerenti/);
assert.throws(()=>api.build(row,'2',[],base,{groups}),/altro cliente/);
assert.throws(()=>api.build(row,'9',[],base,{groups}),/anagrafica|altro cliente/);
assert.throws(()=>api.build({...row,type:'Sconosciuto'},'1',[],base,{groups}),/previsto|incompatibili/);
const injection={...row,fields:{...row.fields,scope:'test ) \\ ( /JavaScript << >>'}};
const safe=toLatin(api.build(injection,'1',[],base,{groups}));
assert(safe.includes('test \\) \\\\ \\( /JavaScript << >>'),'PDF string escaping must prevent dictionary breakout');
assert.equal(row.structured.committente,'Mario TEST','Export must not mutate archive');
for(const type of Object.keys(groups)){
 const testRow={...row,type};
 const out=toLatin(api.build(testRow,'1',[],base,{groups}));
 assert(out.includes('/AcroForm 5 0 R')&&out.includes('/T (detail.committente)'),type);
}
const pos={...row,type:'POS',structured:{...row.structured}};
const many=Array.from({length:35},(_,i)=>['field'+i,'Campo '+i,'textarea',i%2===0]);
const manyGroups={POS:[{title:'Blocco operativo',fields:many}]};
const longPdf=toLatin(api.build(pos,'1',[],base,{groups:manyGroups}));
assert((longPdf.match(/\/Type \/Page \/Parent/g)||[]).length>3,'POS must paginate');
assert((longPdf.match(/\/Subtype \/Widget/g)||[]).length===41,'All fields must remain editable');
console.log('OK: 8 practice types, editable AcroForm, multiline, pagination, XRef, escaping, client/site isolation, no mutation.');
