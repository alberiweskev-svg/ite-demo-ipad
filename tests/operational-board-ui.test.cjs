'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../ite-operational-board-ui.js'),'utf8');
test('unified 4.0 page exposes operational dashboard and work navigation',()=>{
 assert.match(html,/id="quadro-operativo"/);
 assert.match(html,/href="#quadro-operativo"/);
 for(const id of ['ops-client','ops-site','ops-kind','ops-search','ops-refresh','ops-csv','ops-a4','ops-issues'])assert(html.includes('id="'+id+'"'));
});
test('operational scripts load before vault unlock and do not replace legacy',()=>{
 for(const name of ['ite-operational-integrity.js','ite-operational-board.js','ite-operational-board-ui.js'])assert(html.includes('src="./'+name+'?v=4.0.0"'));
 assert(html.indexOf('ite-operational-board-ui.js?v=4.0.0')<html.indexOf('vault.js?v=4.0.0'));
 assert(html.includes('pos-operativo.js')&&html.includes('ite-cad.js'));
});
test('dashboard uses encrypted snapshots, guards export freshness and escapes DOM',()=>{
 assert.match(ui,/ITEVault\?\.isUnlocked\(\)/);
 assert.match(ui,/ITE\.snapshot\(\)/);
 assert.match(ui,/ITECommerce\.snapshot\(\)/);
 assert.match(ui,/inputSignature\(fresh\)!==signature/);
 assert.match(ui,/textContent=item\.kind/);
 assert(!/innerHTML\s*=/.test(ui));
});
test('dashboard is explicitly read only',()=>{
 assert(!/\.mutate\(|\.commit\(|\.replaceData\(/.test(ui));
 assert.match(ui,/Nessuna certificazione generata/);
});
