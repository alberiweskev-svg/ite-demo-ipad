'use strict';
/* Regression tests for worksite hours and labor costs. No real customer data. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
function extract(name){
 const marker='function '+name+'(';const start=source.indexOf(marker);
 assert(start>=0,'Missing function: '+name);
 const begin=source.indexOf('{',start);let depth=0,quote='',escape=false;
 for(let i=begin;i<source.length;i++){
  const c=source[i];if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote='';continue}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue}
  if(c==='{')depth++;if(c==='}'&&!--depth)return source.slice(start,i+1);
 }
 throw Error('Unterminated function: '+name);
}
const db={interventi:[],clienti:[]};
const state={documents:[],movements:[],articles:[]};
const ctx={ITE:{snapshot:()=>db},state,same:(a,b)=>String(a)===String(b),cash:n=>'€ '+Number(n).toFixed(2),Date,Number,JSON,String,Array};
vm.createContext(ctx);
vm.runInContext(extract('workHoursDataForSite')+';'+extract('laborCostForSite')+';'+extract('economicSummaryForSite'),ctx);
const job=(id,props)=>({id,cantiere_id:'C1',...props});
db.clienti=[{id:'A',internal_hourly_cost:'25.50'}];
db.interventi=[job(1,{work_logs:JSON.stringify([{operator_id:'A',duration_minutes:120}])})];
let h=ctx.workHoursDataForSite('C1'),c=ctx.laborCostForSite('C1');
assert.equal(h.total,120);assert.equal(c.estimated,51);assert.equal(c.pricedMinutes,120);
db.interventi=[job(2,{work_logs:JSON.stringify([{operator_id:'A',duration_minutes:''}])})];
h=ctx.workHoursDataForSite('C1');assert.equal(h.unknown,1);assert.equal(h.total,0);
db.interventi=[job(3,{appointment:'1',work_sessions:JSON.stringify([{arrived_at:'2026-10-20T08:00:00Z',departed_at:'2026-10-20T09:00:00Z'},{arrived_at:'2026-10-20T09:00:00Z'}])})];
h=ctx.workHoursDataForSite('C1');assert.equal(h.unknown,1);assert.equal(h.total,0);
db.interventi=[job(4,{appointment:'1',work_sessions:JSON.stringify([{arrived_at:'2026-10-20T08:00:00Z',departed_at:'2026-10-20T09:30:00Z'}])})];
h=ctx.workHoursDataForSite('C1');c=ctx.laborCostForSite('C1');assert.equal(h.total,90);assert.equal(h.ambiguous,1);assert.equal(c.pricedMinutes,0);
db.interventi=[job(5,{work_logs:JSON.stringify([{operator_id:'B',duration_minutes:60}])})];
c=ctx.laborCostForSite('C1');assert.equal(c.unpriced,1);assert.equal(c.estimated,0);
db.interventi=[job(6,{work_logs:JSON.stringify([{operator_id:'A',duration_minutes:60}])})];
db.clienti=[{id:'A',internal_hourly_cost:'1001'}];
c=ctx.laborCostForSite('C1');assert.equal(c.unpriced,1);assert.equal(c.estimated,0);
state.documents=[{siteId:'C1',type:'Fattura vendita',net:''}];
let html=ctx.economicSummaryForSite('C1');
assert.match(html,/1 documenti senza importo verificabile/);
assert.match(html,/Da quantificare/);
state.documents=[{siteId:'C1',type:'Fattura vendita',net:1000},{siteId:'C1',type:'Nota credito vendita',net:200}];
html=ctx.economicSummaryForSite('C1');
assert.match(html,/€ 800\.00/);
state.documents=[{siteId:'C1',type:'Fattura acquisto',net:null,total:null}];
html=ctx.economicSummaryForSite('C1');
assert.match(html,/1 documenti senza importo verificabile/);
state.documents=[{siteId:'C1',type:'Fattura vendita',net:'',total:122}];
html=ctx.economicSummaryForSite('C1');
assert.match(html,/€ 122\.00/);
assert.doesNotMatch(html,/1 documenti senza importo verificabile/);
state.documents=[{siteId:'C2',type:'Fattura vendita',net:9999}];
html=ctx.economicSummaryForSite('C1');
assert.doesNotMatch(html,/€ 9999\\.00/);
state.documents=[{siteId:'C1',type:'Fattura vendita',net:0,total:122}];
html=ctx.economicSummaryForSite('C1');
assert.match(html,/€ 0\\.00/);
assert.doesNotMatch(html,/€ 122\\.00/);
db.interventi=[job(7,{work_logs:JSON.stringify([{operator_id:'A',duration_minutes:60}])}),{id:8,cantiere_id:'C2',work_logs:JSON.stringify([{operator_id:'A',duration_minutes:600}])}];
db.clienti=[{id:'A',internal_hourly_cost:'25.50'}];
h=ctx.workHoursDataForSite('C1');c=ctx.laborCostForSite('C1');
assert.equal(h.total,60);assert.equal(c.estimated,25.5);
console.log('OK: 13 regression scenarios for worksite hours, labor and fiscal totals');
