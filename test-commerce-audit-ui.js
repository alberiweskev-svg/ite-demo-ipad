/* Regression: accounting audit dashboard wiring and safe rendering. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),ui=fs.readFileSync('ite-commerce-audit-ui.js','utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1].split('?')[0].replace(/^\.\//,''));
const position=name=>scripts.indexOf(name);
for(const name of ['ite-hierarchy-workspace.js','ite-commerce.js','ite-commerce-ledger.js','ite-commerce-audit.js','ite-commerce-audit-ui.js'])assert(position(name)>=0,'Missing '+name);
assert(position('ite-commerce-ledger.js')<position('ite-commerce-audit.js'));
assert(position('ite-commerce-audit.js')<position('ite-commerce-audit-ui.js'));
assert.match(ui,/A\.audit\(ledger,commerce/);
assert.match(ui,/A\.proposeStatuses\(ledger,commerce/);
assert.match(ui,/textContent=String\(text\)/);
assert.doesNotMatch(ui,/innerHTML|eval\s*\(|\.save\s*\(/);
assert.match(ui,/Nessun dato modificato/);
console.log('Audit dashboard integration checks passed');
