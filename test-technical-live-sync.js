/* Regression contract for technical register UI synchronization (synthetic data only).
   Run: node test-technical-live-sync.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const demo=fs.readFileSync('ite-technical-demo-ui.js','utf8');
const quality=fs.readFileSync('ite-technical-quality-ui.js','utf8');
const pdf=fs.readFileSync('ite-local-pdf.js','utf8');
assert.match(demo,/ite:technical-register-changed/);
assert.match(demo,/ite:technical-register-external-update/);
assert.match(demo,/state=read\(\);render\(\)/);
assert.match(quality,/addEventListener\('ite:technical-register-changed',report\)/);
assert.match(quality,/dispatchEvent\(new CustomEvent\('ite:technical-register-external-update'\)\)/);
assert.match(quality,/Q\.inspectRegister\(state,H,M\)/);
assert.match(quality,/Q\.confirmBatch\(/);
assert.doesNotMatch(quality,/Aggiorna la pagina per sincronizzare/);
assert.match(pdf,/MAX_BYTES=8\*1024\*1024/);
assert.match(pdf,/MAX_PAGES=12/);
assert.match(pdf,/SOLO_PDF_FITTIZI_TEST/);
assert.match(pdf,/PDF_SCANSIONE_SENZA_TESTO/);
console.log('Technical live-sync and PDF safety regression contract OK');
