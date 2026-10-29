'use strict';
/* Synthetic technical originals only. Never use customer documents in CI. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
class MockZip{
 constructor(){this.entries=new Map();MockZip.latest=this;}
 file(name,value){if(this.entries.has(name))throw Error('Duplicate ZIP entry');this.entries.set(name,value);return this;}
 async generateAsync(options){assert.equal(options.type,'blob');return new Blob(['ZIP-MOCK-TEST']);}
}
const sandbox={Set,Map,Array,Object,String,Number,Error,Uint8Array,Blob,atob,crypto:webcrypto,JSZip:MockZip};
sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('technical-structured-docs.js','utf8'),sandbox);
const api=sandbox.ITEStructuredDocuments;
assert.equal(typeof api.buildOriginalPackage,'function');
const base={clienti:[{id:'1',name:'Cliente sintetico'},{id:'2',name:'CLIENTE RISERVATO'}],
 immobili:[{id:'s1',client_id:'1',name:'Sede sintetica'},{id:'s2',client_id:'2',name:'Sede riservata'}],
 cantieri:[],impianti:[],apparecchiature:[],interventi:[]};
const bytes=Buffer.from('%PDF-1.4\nDocumento tecnico sintetico - NON VALIDO\n','utf8');
const hash=createHash('sha256').update(bytes).digest('hex');
const file={id:'file_'+hash,hash,name:'../../originale_TEST.pdf',size:bytes.length,base64:bytes.toString('base64')};
const docs=[{id:'d1',type:'Di.Co. elettrica',clientId:'1',propertyId:'s1',fileId:file.id,sourceName:'Originale sintetico',number:'TEST-001'},
 {id:'d2',type:'Di.Ri.',clientId:'1',propertyId:'s1',fileId:file.id,sourceName:'Copia sintetica',number:'TEST-002'},
 {id:'foreign',type:'Di.Co. elettrica',clientId:'2',propertyId:'s2',fileId:file.id,sourceName:'RISERVATO',number:'NO'}];
const p={id:'p1',type:'Di.Co. elettrica',clientId:'1',propertyId:'s1',status:'Bozza',revision:2,
 fields:{reference:'TEST-DICO-001',scope:'Circuito fittizio'},structured:{},linkedDocIds:['d1','d2'],checklistEvidence:{}};
const rows=[p],commerce={files:[file]},before=JSON.stringify({rows,docs,base,commerce});
(async()=>{
 const result=await api.buildOriginalPackage(rows,'1',docs,base,commerce,{}, {JSZip:MockZip,subtle:webcrypto.subtle,atob});
 assert.equal(result.originals,2);assert.equal(result.uniqueFiles,1);
 assert.equal(result.manifest.documents.length,2);
 assert(result.manifest.documents.every(x=>x.sha256===hash));
 assert(result.manifest.documents.every(x=>x.filePath.startsWith('ORIGINALI/')));
 assert(!result.manifest.documents.some(x=>x.filePath.includes('..')));
 assert.equal(result.manifest.totalOriginalBytes,bytes.length*2);
 assert.equal(result.manifest.status,'BOZZA_NON_FIRMATA');
 const zip=MockZip.latest;
 for(const path of ['manifest.json','LEGGIMI_PRIMA.txt','FASCICOLO_BOZZA.html','REGISTRO_VERIFICHE.csv','PIANO_COMPLETAMENTO_BOZZA.html','ATTIVITA_DA_VERIFICARE.csv'])
  assert(zip.entries.has(path),path);
 const names=[...zip.entries.keys()].filter(x=>x.startsWith('ORIGINALI/'));
 assert.equal(names.length,1);assert.equal(Buffer.compare(Buffer.from(zip.entries.get(names[0])),bytes),0);
 assert(!JSON.stringify(result.manifest).includes('RISERVATO'));
 assert(!String(zip.entries.get('FASCICOLO_BOZZA.html')).includes('CLIENTE RISERVATO'));
 assert.match(String(zip.entries.get('FASCICOLO_BOZZA.html')),/TEST-DICO-001/);
 assert.equal(JSON.stringify({rows,docs,base,commerce}),before,'Export must never mutate source archives');
 const invalid=(f,rows0=rows,docs0=docs)=>api.buildOriginalPackage(rows0,'1',docs0,base,{files:[f]}, {},{JSZip:MockZip,subtle:webcrypto.subtle,atob});
 await assert.rejects(invalid({...file,base64:Buffer.from(bytes.map(x=>x^1)).toString('base64')}),/SHA-256/);
 await assert.rejects(invalid({...file,size:file.size+1}),/SHA-256/);
 await assert.rejects(invalid({...file,hash:'0'.repeat(64)}),/metadati/);
 await assert.rejects(invalid({...file,id:'file_wrong'}),/assente/);
 await assert.rejects(invalid({...file,base64:'!!!'}),/codifica/);
 await assert.rejects(invalid({...file,base64:Buffer.from('NOT A PDF').toString('base64'),hash:createHash('sha256').update('NOT A PDF').digest('hex'),id:'file_'+createHash('sha256').update('NOT A PDF').digest('hex'),size:9}),/assente|PDF/);
 await assert.rejects(invalid({...file,size:15000001}),/15 MB|30 MB|grandi/);
 await assert.rejects(invalid(file,[{...p,linkedDocIds:[]}]),/Nessun originale/);
 await assert.rejects(invalid(file,[{...p,linkedDocIds:['foreign']}]),/altro cliente|cliente/);
 await assert.rejects(invalid(file,[{...p,clientId:'2'}]),/cliente diverso/);
 await assert.rejects(invalid(file,[{...p,propertyId:'s2'}]),/Collegamenti/);
 await assert.rejects(invalid(file,[p,p]),/duplicata/);
 assert.throws(()=>api.packageOriginalRefs(Array.from({length:31},(_,i)=>({...p,id:'p'+i,linkedDocIds:['d1']})),'1',docs,base),/1 a 50|duplicata|Nessun/); // 31 practices, one unique original: still safe
 console.log('OK: ZIP technical originals SHA-256, dedup, manifest, A4+CSV, anti-path-traversal, client isolation and read-only');
})().catch(e=>{console.error(e);process.exitCode=1});
