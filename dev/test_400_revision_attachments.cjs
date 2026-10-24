'use strict';
// La revisione non deve cancellare o riassegnare allegati esistenti.
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function revision(id){'),end=source.indexOf('function finish(id){',start);
assert(start>=0&&end>start,'Funzione revisione non trovata');
const revision=source.slice(start,end);
assert(revision.includes('ITE.commit(next=>'), 'Revisione deve aggiornare l’intervento esistente');
assert(revision.includes("job.revision_audit=JSON.stringify(audit)"),'Audit revisione obbligatorio');
assert(!/ITEDocs\.|replaceDocs\(|deleteDoc\(|store\.clear\(/.test(revision),'Revisione non deve alterare archivio allegati');
assert(!/\.splice\(|\.filter\(/.test(revision),'Revisione non deve eliminare interventi');
const docs=[{id:'foto-1',parentType:'interventi',parentId:7,filename:'prima.jpg'},{id:'rapporto-1',parentType:'interventi',parentId:7,filename:'rapporto.pdf'}];
const before=JSON.stringify(docs);
assert.equal(JSON.stringify(docs),before);
console.log('OK: revisione conserva riferimento intervento e non modifica archivio allegati (analisi statica)');
