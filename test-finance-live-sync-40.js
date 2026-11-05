/* Regression contract for finance dashboard/batch synchronization. Run: node test-finance-live-sync-40.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const finance=fs.readFileSync('ite-finance-demo-ui-40.js','utf8');
const batch=fs.readFileSync('ite-finance-batch-ui-40.js','utf8');
assert.match(finance,/function save\(s\).*dispatchEvent\(new CustomEvent\('ite40:finance-changed'/);
assert.match(finance,/addEventListener\('ite40:finance-changed'/);
assert.match(finance,/addEventListener\('storage',e=>\{if\(e.key===KEY\)/);
assert.match(batch,/localStorage\.setItem\(KEY,JSON\.stringify\(result\.state\)\);root\.dispatchEvent\(new CustomEvent\('ite40:finance-changed'/);
assert.doesNotMatch(batch,/Aggiornare il riepilogo con un ricaricamento/);
for(const [name,source] of [['finance',finance],['batch',batch]]) new vm.Script(source,{filename:name});
console.log('OK: finance event, batch notification, cross-tab storage filter and JS syntax');
