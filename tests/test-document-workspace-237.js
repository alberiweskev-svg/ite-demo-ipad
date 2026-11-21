'use strict';
const assert=require('node:assert/strict');
const core=require('../ite-integrated-core-225.js'),docs=require('../gestionale4/document-workspace-237.js');
function setup(){const s=core.blank();s.clients.push({id:'c1',name:'Cliente Demo'},{id:'c2',name:'Altro Demo'});s.sites.push({id:'s1',clientId:'c1',address:'Via Demo 1'});return core.createStore(s)}
const doc=(filename,clientId='c1')=>({kind:'DICO',filename,mime:'application/pdf',bytes:128,clientId,siteId:'s1'});
let st=setup(),n=0;docs.addBatch(st,[doc('uno.pdf'),doc('due.pdf')],()=>String(++n));assert.equal(st.snapshot().documents.length,2);assert.equal(docs.audit(st.snapshot()).byKind.DICO,2);assert.equal(docs.dossier(st.snapshot(),'s1').length,2);
const rev=st.snapshot().revision;assert.throws(()=>docs.addBatch(st,[doc('tre.pdf'),doc('errore.pdf','c2')],()=>String(++n)),/CLIENTE_SEDE_INCOERENTI/);assert.equal(st.snapshot().revision,rev);assert.equal(st.snapshot().documents.length,2);
assert.throws(()=>docs.addBatch(st,[doc('uno.pdf')],()=>String(++n)),/DOCUMENTO_DUPLICATO/);
assert.throws(()=>docs.addBatch(st,[doc('a.pdf'),doc('a.pdf')],()=>String(++n)),/DOCUMENTO_DUPLICATO/);
assert.throws(()=>docs.addBatch(st,[{...doc('x.pdf'),payload:'PDF DATA'}],()=>String(++n)),/CONTENUTO_PDF_NON_AMMESSO/);
(async()=>{const file={name:'di-co-demo.pdf',size:128,slice:()=>({arrayBuffer:async()=>Uint8Array.from(Buffer.from('%PDF-1.7')).buffer})};const items=await docs.inspectBatch([file],'AUTO','c1','s1');assert.equal(items[0].kind,'DICO');assert.equal(items[0].filename,file.name);console.log('Document workspace 237: OK')})().catch(e=>{console.error(e);process.exitCode=1});
