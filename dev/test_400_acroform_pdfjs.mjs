import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {getDocument} from '../vendor/pdf.mjs';
const sandbox={Uint8Array,Set,Map,Object,Array,String,Number,Error};sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('technical-pdf.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('technical-acroform.js','utf8'),sandbox);
const groups={'Di.Co. elettrica':[{title:'Identificazione',fields:[['committente','Committente','text',true],['noteTecniche','Note tecniche','textarea',false]]}]};
const row={id:'pdfjs-test',clientId:'1',type:'Di.Co. elettrica',fields:{reference:'TEST-001',scope:'Impianto di prova'},structured:{committente:'Cliente TEST',noteTecniche:'Verifica da completare'},linkedDocIds:[]};
const base={clienti:[{id:1,name:'Cliente TEST'}]};
const pdf=sandbox.ITETechnicalAcroform.build(row,'1',[],base,{groups});
const loading=getDocument({data:pdf,disableFontFace:true,useSystemFonts:true});
const doc=await loading.promise;
assert(doc.numPages>=1);
const fields=await doc.getFieldObjects();
assert(fields&&Object.keys(fields).length>=8,'AcroForm must expose editable fields');
assert(fields['detail.committente']?.[0]?.value==='Cliente TEST','Prefilled value must be readable');
assert(fields['general.reference']?.[0]?.value==='TEST-001','Reference must be readable');
const page=await doc.getPage(1);
const text=await page.getTextContent();
assert(text.items.some(x=>x.str.includes('BOZZA NON UFFICIALE')),'Visible non-official warning required');
await loading.destroy();
// Real PDF.js round-trip for all eight technical document types, including empty fields.
const allTypes=['Di.Co. elettrica','Di.Co. idrica / termica','Di.Ri.','Allegato gas H40','Allegato gas I40','Allegato gas A12','Allegato gas B12','POS'];
for(const type of allTypes){
 const sample={...row,id:'pdfjs-'+type.replace(/[^a-z0-9]/gi,'_'),type,revision:1,date:'2026-10-29',
  fields:{reference:'TEST-'+type,scope:'Prova sintetica',notes:''},
  structured:{committente:'Cliente TEST',noteTecniche:''}};
 const typeGroups={[type]:groups['Di.Co. elettrica']};
 const bytes=sandbox.ITETechnicalAcroform.build(sample,'1',[],base,{groups:typeGroups});
 const task=getDocument({data:bytes,disableFontFace:true,useSystemFonts:true});
 try{
  const document=await task.promise;
  const objects=await document.getFieldObjects();
  const values=sandbox.ITETechnicalAcroform.fieldObjectsToValues(objects);
  assert.equal(values['system.practiceId'],sample.id,type+' identity');
  assert.equal(values['system.revision'],'1',type+' revision');
  assert.equal(values['general.notes'],'',type+' blank field');
  assert.deepEqual(Array.from(sandbox.ITETechnicalAcroform.previewImport(sample,values,typeGroups)),[],type+' unchanged');
  values['general.notes']='Nota di prova '+type;
  const changes=sandbox.ITETechnicalAcroform.previewImport(sample,values,typeGroups);
  assert.equal(changes.length,1,type+' changed');
  const merged=sandbox.ITETechnicalAcroform.applyImport(sample,changes,['general.notes']);
  assert.equal(merged.fields.notes,'Nota di prova '+type);
  assert.equal(sample.fields.notes,'',type+' source remains immutable');
 }finally{await task.destroy();}
}
console.log('OK: PDF.js AcroForm round-trip for all eight practice types, empty fields, protected metadata, selective merge');
