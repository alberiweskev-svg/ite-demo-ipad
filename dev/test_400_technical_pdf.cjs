'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('technical-pdf.js','utf8');
const sandbox={Uint8Array,Blob,Set,Map,Object,Array,String,Number,Error};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox);
const {build,compose,paginate}=sandbox.ITETechnicalPDF;
const base={clienti:[{id:1,name:'Cliente Fittizio Bologna'},{id:2,name:'Cliente Esterno'}]};
const rows=[{id:'test1',type:'Di.Co. elettrica',clientId:'1',revision:2,status:'Bozza',date:'2026-10-29',fields:{reference:'DICO-FITTIZIO-001',scope:'Impianto di prova con accentate: città, perché e €',notes:'(verifica) \\ prova'},structured:{committente:'Mario TEST',descrizioneImpianto:'Prova '.repeat(60)},checklistEvidence:{'Schema impianto':{status:'Da verificare',evidence:'Non attestato',documentId:'doc1'}},linkedDocIds:['doc1','docOther'],originalPrefill:{committente:{value:'Mario TEST',documentId:'doc1'}}}];
const docs=[{id:'doc1',clientId:'1',type:'Di.Co. elettrica',number:'ORIG-FITTIZIO',sourceName:'originale_sintetico.txt'},{id:'docOther',clientId:'2',type:'Di.Co. elettrica',number:'SEGRETO-ALTRO-CLIENTE'}];
const data=build(rows,'1',docs,base),pdf=Buffer.from(data).toString('latin1');
assert(pdf.startsWith('%PDF-1.4'));assert(pdf.includes('xref\n0 '));assert(pdf.endsWith('%%EOF\n'));
assert(pdf.includes('DICO-FITTIZIO-001'));assert(pdf.includes('ORIG-FITTIZIO'));assert(pdf.includes('NON VALIDA'));
assert(!pdf.includes('SEGRETO-ALTRO-CLIENTE'));assert(!pdf.includes('Cliente Esterno'));
const foreignPrefill={...rows[0],originalPrefill:{injected:{value:'SEGRETO-PREFILL-ALTRO-CLIENTE',documentId:'docOther'}}};
const foreignPdf=Buffer.from(build([foreignPrefill],'1',docs,base)).toString('latin1');
assert(!foreignPdf.includes('SEGRETO-PREFILL-ALTRO-CLIENTE'));assert(foreignPdf.includes('fonte non verificabile'));

assert(pdf.includes('città, perché e \x80'),'WinAnsi must preserve accents and euro');
assert(pdf.includes('\\(verifica\\) \\\\ prova'),'Escape parentheses and backslashes');
const match=pdf.match(/startxref\n(\d+)\n/);assert(match);assert.equal(pdf.slice(Number(match[1]),Number(match[1])+5),'xref\n');
assert.throws(()=>build(rows,'2',docs,base),/altro cliente/);
assert.throws(()=>build(rows,'',docs,base),/cliente/);
assert.throws(()=>build(rows,'9',docs,base),/anagrafica/);
assert.throws(()=>build(Array(101).fill(rows[0]),'1',docs,base),/100/);
assert.throws(()=>build([rows[0],rows[0]],'1',docs,base),/duplicate/);
const many=Array.from({length:10},(_,i)=>({...rows[0],id:'r'+i,structured:{notes:'Molto testo '.repeat(180)}}));
const multiPdf=Buffer.from(build(many,'1',docs,base)).toString('latin1');
assert((multiPdf.match(/\/Type \/Page \/Parent/g)||[]).length>=10,'Pagination must create separate pages');
assert.equal(rows[0].revision,2,'Export must not mutate archive');
assert(compose(rows,'1',docs,base).length>5);assert(paginate(compose(rows,'1',docs,base)).length>=1);
console.log('OK: PDF bytes/xref, WinAnsi, escaping, pagination, client isolation, no originals, limits, no mutation');



/* Milestone 21: PDF contestualizzato, fonti collegate e controlli CAD sintetici. */
const linkedBase={
 clienti:[{id:1,name:'Cliente Fittizio Bologna'},{id:2,name:'Cliente Esterno'}],
 immobili:[{id:3,client_id:'1',name:'Via Esempio 3',city:'Bologna'},{id:33,client_id:'2',name:'VIA RISERVATA'}],
 impianti:[{id:5,immobile_id:'3',name:'Rete idrica TEST'}],
 apparecchiature:[{id:6,impianto_id:'5',brand:'Marca',model:'TEST 24'}],
 cantieri:[{id:7,client_id:'1',immobile_id:'3',name:'Cantiere sintetico'}],
 interventi:[{id:8,apparecchiatura_id:'6',date:'2026-10-29',kind:'Installazione',description:'Intervento di prova'}]
};
const linkedRow={...rows[0],propertyId:'3',plantId:'5',deviceId:'6',siteId:'7',interventionId:'8',
 structured:{committente:'Mario TEST'},originalPrefill:{'detail:committente':{value:'Mario TEST',documentId:'doc1'}}};
const groups={'Di.Co. elettrica':[{title:'Identificazione committente',fields:[
 ['committente','Committente','text',true],['ubicazione','Ubicazione','text',true]]}]};
sandbox.ITEStructuredDocuments={materialTrace:()=>({rows:[{code:'TEST-PZ',description:'Presa dimostrativa',quantity:2,unit:'pz',status:'Da verificare sul campo'}],warnings:['Distinta di prova']})};
const linkedOptions={groups,drawings:[{id:'cad1',clientId:'1',revision:2,title:'Schema fittizio'}],
 links:[{practiceId:'test1',drawingId:'cad1',drawingRevision:2}],
 review:()=>({issues:[{label:'Prova di continuità da verificare'}]})};
const detailed=compose([linkedRow],'1',docs,linkedBase,linkedOptions).map(x=>x.text||'').join('\n');
assert(detailed.includes('Via Esempio 3'),'Sede from hierarchy must appear');
assert(detailed.includes('Rete idrica TEST'),'Plant from hierarchy must appear');
assert(detailed.includes('TEST 24'),'Device from hierarchy must appear');
assert(detailed.includes('Intervento di prova'),'Intervention from hierarchy must appear');
assert(detailed.includes('Identificazione committente'),'Structured group must appear');
assert(detailed.includes('OBBLIGATORIO DA VERIFICARE'),'Missing required group field must appear');
assert(detailed.includes('TEST-PZ'),'CAD preliminary material must appear');
assert(detailed.includes('Prova di continuità da verificare'),'Technical review must appear');
assert(detailed.includes('ORIG-FITTIZIO'),'Verified provenance must appear');
const detailedPdf=Buffer.from(build([linkedRow],'1',docs,linkedBase,linkedOptions)).toString('latin1');
assert(detailedPdf.includes('Via Esempio 3')&&detailedPdf.includes('TEST-PZ'));
assert.throws(()=>compose([{...linkedRow,propertyId:'33'}],'1',docs,linkedBase),/incoerenti/);
assert.throws(()=>compose([{...linkedRow,deviceId:'999'}],'1',docs,linkedBase),/incoerenti/);
const mismatchedSource=compose([{...linkedRow,structured:{committente:'Modificato manualmente'}}],'1',docs,linkedBase).map(x=>x.text||'').join('\n');
assert(mismatchedSource.includes('fonte non verificabile'),'Stale prefill provenance must be rejected');
assert(!mismatchedSource.includes('originale ORIG-FITTIZIO'),'Stale provenance must not be attributed');
const unrelatedDoc={id:'doc-site',clientId:'1',propertyId:'33',sourceName:'SEGRETO-ALTRA-SEDE'};
const otherSite=compose([{...linkedRow,linkedDocIds:['doc-site'],originalPrefill:{'detail:committente':{value:'Mario TEST',documentId:'doc-site'}}}],
 '1',[...docs,unrelatedDoc],linkedBase).map(x=>x.text||'').join('\n');
assert(!otherSite.includes('SEGRETO-ALTRA-SEDE'),'Original of another site must be excluded');
console.log('OK: PDF context hierarchy, grouped fields, CAD materials, review, source provenance, cross-site and cross-client isolation');
