'use strict';
const assert=require('node:assert/strict');
const core=require('../ite-integrated-core-225.js'),docs=require('../gestionale4/document-workspace-237.js');
function setup(){const s=core.blank();s.clients.push({id:'c1',name:'Cliente Demo'},{id:'c2',name:'Altro Demo'});s.sites.push({id:'s1',clientId:'c1',address:'Via Demo 1'});return core.createStore(s)}
const doc=(filename,clientId='c1')=>({kind:'DICO',filename,mime:'application/pdf',bytes:128,clientId,siteId:'s1'});
let st=setup(),n=0;
assert.equal(docs.previewBatch(st,[doc('uno.pdf'),doc('due.pdf')]).count,2);
assert.equal(st.snapshot().revision,0);
docs.addBatch(st,[doc('uno.pdf'),doc('due.pdf')],()=>String(++n));
assert.equal(st.snapshot().documents.length,2);assert.equal(docs.audit(st.snapshot()).byKind.DICO,2);assert.equal(docs.dossier(st.snapshot(),'s1').length,2);
const rev=st.snapshot().revision;
for(const [items,code] of [
 [[doc('tre.pdf'),doc('errore.pdf','c2')],/CLIENTE_SEDE_INCOERENTI/],
 [[doc('uno.pdf')],/DOCUMENTO_DUPLICATO/],
 [[doc('a.pdf'),doc('a.pdf')],/DOCUMENTO_DUPLICATO/],
 [[{...doc('x.pdf'),payload:'PDF DATA'}],/CAMPO_DOCUMENTO_NON_AMMESSO/],
 [[{...doc('x.pdf'),base64:'JVBER'}],/CAMPO_DOCUMENTO_NON_AMMESSO/],
 [[{...doc('x.pdf'),url:'https://example.com'}],/CAMPO_DOCUMENTO_NON_AMMESSO/],
 [[{...doc('x.pdf'),id:'user-supplied'}],/ID_ASSEGNATO_DAL_SISTEMA/],
 [[{...doc('x.pdf'),siteId:'missing'}],/SEDE_INESISTENTE/],
 [[{...doc('x.pdf'),clientId:'missing'}],/CLIENTE_INESISTENTE/]
]){assert.throws(()=>docs.addBatch(st,items,()=>String(++n)),code);assert.equal(st.snapshot().revision,rev);}
assert.throws(()=>docs.addBatch(st,[doc('new.pdf'),doc('other.pdf')],()=> 'same'),/ID_DUPLICATO/);
assert.equal(st.snapshot().revision,rev);
docs.addBatch(st,[{kind:'GAS',filename:'gas.pdf',mime:'application/pdf',bytes:100,siteId:'s1'}],()=>String(++n));
assert.equal(st.snapshot().documents[2].clientId,'c1');
assert.equal(docs.audit(st.snapshot()).issues.length,0);
(async()=>{
 const bytes=Uint8Array.from(Buffer.from('%PDF-1.7'));
 const file={name:'di-co-demo.pdf',size:128,slice:()=>({arrayBuffer:async()=>bytes.buffer})};
 const items=await docs.inspectBatch([file],'AUTO','c1','s1');
 assert.equal(items[0].kind,'DICO');assert.equal(items[0].filename,file.name);
 await assert.rejects(()=>docs.inspectBatch([file],'INVALID','c1','s1'),/TIPO_DOCUMENTO_NON_VALIDO/);
 console.log('Document workspace 238: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
