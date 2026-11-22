/* Integrated 4.0.251 UI wiring smoke test: synthetic, no customer records. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const api=require('./operations-250.js');
assert.match(html,/<script src="operations-250\.js"><\/script>/);
assert.ok(html.includes('data-tab="operations"'));
assert.match(html,/function renderOperations251\(s\)/);
for(const method of ['reschedule','closeWithoutQuote','siteLedger','siteLedgerCSV']){
 assert.equal(typeof api[method],'function',method+' exported');
 assert.ok(html.includes('api.'+method+'('),method+' wired');
}
assert.ok(html.includes("if(tab==='operations'){renderOperations251(s);return}"));
assert.ok(html.includes("state.appointments=next.appointments;state.interventions=next.interventions"));
assert.ok(html.includes("state.interventions=next.interventions"));
assert.ok(html.includes("type=\"datetime-local\""));
console.log('4.0.251 UI wiring smoke: PASS');
