'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8'),start=app.indexOf('/* ITE_TECHNICAL_DRAFTS_BEGIN'),end=app.indexOf('/* ITE_TECHNICAL_DRAFTS_END');
assert(start>=0&&end>start,'Missing integrated technical drafts');
const s=app.slice(start,end);
function declaration(prefix){const i=s.indexOf(prefix);assert(i>=0,prefix);const j=s.indexOf(';\n',i);return s.slice(i,j+1)}
function extract(name){const i=s.indexOf('function '+name+'(');assert(i>=0,name);const b=s.indexOf('{',i);let n=0,q='',esc=false;for(let p=b;p<s.length;p++){const c=s[p];if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q='';continue}if(c==="'"||c==='"'||c===String.fromCharCode(96)){q=c;continue}if(c==='{')n++;else if(c==='}'&&!--n)return s.slice(i,p+1)}throw Error('Unclosed '+name)}
const context={Date,Array,Set,Map,String,Number,Error,Object};vm.createContext(context);
vm.runInContext([declaration('const CHECKLIST='),declaration('const FIELD_NAMES='),declaration('const $='),declaration('const isTechnical='),declaration('const validDate='),extract('validateDrafts'),extract('missing'),'this.validateDrafts=validateDrafts;this.missing=missing;'].join('\n'),context);
const base={clienti:[{id:1,name:'Cliente TEST'},{id:2,name:'Altro TEST'}],immobili:[{id:3,client_id:'1'},{id:4,client_id:'2'}],impianti:[{id:5,immobile_id:'3'}],apparecchiature:[{id:6,impianto_id:'5'}],cantieri:[{id:7,client_id:'1',immobile_id:'3'}]};
const doc={id:'doc_TEST',type:'Di.Co. elettrica',clientId:'1',propertyId:'3',siteId:'7'};
const row={id:'td_00000000-0000-4000-8000-000000000001',type:'Di.Co. elettrica',status:'Bozza',revision:1,history:[],clientId:'1',propertyId:'3',plantId:'5',deviceId:'6',siteId:'7',date:'2026-10-28',fields:{scope:'TEST',materials:'TEST',checks:''},linkedDocIds:['doc_TEST']};
const archive={settings:{technicalDrafts:[row]},documents:[doc]};
assert.equal(context.validateDrafts(archive,base),true);assert(context.missing(row).includes('Verifiche da documentare'));
const bad=(patch,docs=archive.documents)=>({settings:{technicalDrafts:[{...row,...patch}]},documents:docs});
for(const x of [{clientId:'2'},{propertyId:'4'},{plantId:'999'},{deviceId:'999'},{siteId:'999'},{date:'2026-02-30'},{type:'Unknown'},{revision:0},{linkedDocIds:['missing']},{linkedDocIds:['doc_TEST','doc_TEST']},{fields:{scope:'x'.repeat(4001)}}])assert.throws(()=>context.validateDrafts(bad(x),base));
assert.throws(()=>context.validateDrafts(bad({},[{...doc,clientId:'2'}]),base));
assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[row,row]},documents:[doc]},base));
assert.equal(context.validateDrafts({settings:{},documents:[]},base),true);
assert.match(s,/ITEHistory\.create\('Prima revisione pratica tecnica'\)/);assert.match(s,/ITECommerce\.mutate/);
assert.match(s,/BOZZA DI LAVORO · NON VALIDA · NON FIRMATA/);assert.match(app,/ITETechnicalDrafts\.validate\(value,core\)/);
console.log('OK: technical drafts, links, originals, revisions, validation and non-official print');
