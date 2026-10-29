'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8'),start=app.indexOf('/* ITE_TECHNICAL_DRAFTS_BEGIN'),end=app.indexOf('/* ITE_TECHNICAL_DRAFTS_END');
assert(start>=0&&end>start,'Missing integrated technical drafts');
const s=app.slice(start,end);
function declaration(prefix){const i=s.indexOf(prefix);assert(i>=0,prefix);const j=s.indexOf(';\n',i);return s.slice(i,j+1)}
function extract(name){const i=s.indexOf('function '+name+'(');assert(i>=0,name);const b=s.indexOf('{',i);let n=0,q='',esc=false;for(let p=b;p<s.length;p++){const c=s[p];if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q='';continue}if(c==="'"||c==='"'||c===String.fromCharCode(96)){q=c;continue}if(c==='{')n++;else if(c==='}'&&!--n)return s.slice(i,p+1)}throw Error('Unclosed '+name)}
const context={Date,Array,Set,Map,String,Number,Error,Object};vm.createContext(context);
vm.runInContext([declaration('const CHECKLIST='),declaration('const FIELD_NAMES='),declaration('const CHECK_STATES='),declaration('const STRUCTURED_GROUPS='),declaration('const $='),declaration('const isTechnical='),declaration('const validDate='),extract('record'),extract('contextForIntervention'),extract('compatibleInterventions'),extract('suggestions'),extract('validateDrafts'),extract('structuredMissing'),extract('missing'),'this.validateDrafts=validateDrafts;this.missing=missing;this.structuredGroups=STRUCTURED_GROUPS;'].join('\n'),context);
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

const checked={...row,checklistEvidence:{'Schema impianto':{status:'Documentato',evidence:'Schema sintetico TEST-001'},'Progetto se richiesto':{status:'Non applicabile',evidence:'Caso sintetico: motivazione da verificare'}}};
assert.equal(context.validateDrafts({settings:{technicalDrafts:[checked]},documents:[doc]},base),true);
assert(!context.missing(checked).includes('Schema impianto — da verificare'));
assert(context.missing(checked).includes('Materiali — da verificare'));
for(const checklistEvidence of [
 {'Schema impianto':{status:'Documentato',evidence:''}},
 {'Schema impianto':{status:'Non applicabile',evidence:' '}},
 {'Schema impianto':{status:'Certificato',evidence:'TEST'}},
 {'Campo sconosciuto':{status:'Documentato',evidence:'TEST'}},
 {'Schema impianto':{status:'Documentato',evidence:'X'.repeat(501)}}
])assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[{...row,checklistEvidence}]},documents:[doc]},base));

assert.equal(Object.keys(context.structuredGroups).length,8,'Otto tipologie guidate');
assert.equal(context.structuredGroups.POS.length,12,'POS organizzato in 12 sezioni');
for(const [type,sections] of Object.entries(context.structuredGroups)){
 const example={...row,type,structured:{}};
 assert.equal(context.validateDrafts({settings:{technicalDrafts:[example]},documents:[doc]},base),true,type);
 assert(sections.every(group=>group.fields.length>=2),type+' sezione senza campi');
 assert(context.missing(example).some(x=>x.includes('dati da completare')),type+' non segnala i campi mancanti');
 const field=sections[0].fields[0][0];
 assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[{...example,structured:{[field]:'X'.repeat(2001)}}]},documents:[doc]},base));
 assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[{...example,structured:{campoSconosciuto:'TEST'}}]},documents:[doc]},base));
}
const guided={...row,structured:{committente:'Cliente fittizio',indirizzoImpianto:'Via Test 10',impresaEsecutrice:'Impresa sintetica',descrizioneImpianto:'Impianto elettrico dimostrativo'}};
assert.equal(context.validateDrafts({settings:{technicalDrafts:[guided]},documents:[doc]},base),true);
assert(!context.missing(guided).some(x=>x.includes('Committente e ubicazione:')));
const pos={...row,type:'POS',structured:{cantiere:'Cantiere sintetico',inizioLavori:'2026-10-29',rischi:'Rischi da verificare'}};
assert.equal(context.validateDrafts({settings:{technicalDrafts:[pos]},documents:[doc]},base),true);
for(const invalid of ['2026-02-30','29/10/2026'])assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[{...pos,structured:{inizioLavori:invalid}}]},documents:[doc]},base));
assert.equal(context.validateDrafts({settings:{technicalDrafts:[{...row,structured:undefined}]},documents:[doc]},base),true,'Compatibilità con bozze precedenti');
assert.match(s,/data-tech-detail/);
assert.match(s,/structured:Object\.fromEntries/);
assert.match(s,/structuredRows/);

assert.match(s,/checklistEvidence:Object\.fromEntries/);
assert.match(s,/validateDrafts\(\{settings:\{technicalDrafts:/);
assert.match(s,/checklistRows/);

assert.match(s,/ITEHistory\.create\('Prima revisione pratica tecnica'\)/);assert.match(s,/ITECommerce\.mutate/);
assert.match(s,/BOZZA DI LAVORO · NON VALIDA · NON FIRMATA/);assert.match(app,/ITETechnicalDrafts\.validate\(value,core\)/);
assert.match(app,/technicalSnapshot:\(\)=>/);
assert.match(app,/validateDrafts\(commerce\(\),core\(\)\)/);

/* Collegamento interventi e precompilazione: dati sintetici, mai firme o esiti presunti. */
base.interventi=[{id:8,apparecchiatura_id:'6',client_id:'1',immobile_id:'3',cantiere_id:'7',date:'2026-10-29',kind:'Installazione',description:'Installazione sintetica',outcome:'Completato'}];
base.immobili[0].name='Via Fittizia 10';base.immobili[0].city='Bologna';base.immobili[0].pdr='PDR-FITTIZIO';
const ctx=context.contextForIntervention(base.interventi[0],base);
assert.equal(JSON.stringify(ctx),JSON.stringify({clientId:'1',propertyId:'3',plantId:'5',deviceId:'6',siteId:'7',interventionId:'8'}));
assert.equal(context.validateDrafts({settings:{technicalDrafts:[{...row,interventionId:'8'}]},documents:[doc]},base),true);
for(const interventionId of ['9','abc','8x'])assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[{...row,interventionId}]},documents:[doc]},base));
assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[{...row,interventionId:'8',siteId:''}]},documents:[doc]},base));
assert.throws(()=>context.validateDrafts({settings:{technicalDrafts:[{...row,interventionId:'8',plantId:''}]},documents:[doc]},base));
const suggestion=context.suggestions(base,ctx,base.interventi[0]);
assert.equal(suggestion.structured.committente,'Cliente TEST');
assert.match(suggestion.structured.indirizzoImpianto,/Via Fittizia 10/);
assert.equal(suggestion.fields.pdr,'PDR-FITTIZIO');
assert.equal(suggestion.fields.scope,'Installazione sintetica');
assert.equal(suggestion.structured.pdrVerificato,undefined,'PDR must not be marked verified automatically');
const pending=context.suggestions(base,ctx,{...base.interventi[0],appointment:'1',workflow_status:'Programmato'});
assert.equal(pending.fields.scope,'','Scheduled work must not be represented as completed');
assert.equal(pending.date,'','Scheduled work date must not be attested');
assert.equal(context.compatibleInterventions(base,{clientId:'2'}).length,0);
assert.equal(context.compatibleInterventions(base,{clientId:'1',propertyId:'3'}).length,1);
assert.match(s,/data-tech-intervention/);
assert.match(s,/data-tech-autofill|id="tech-autofill"/);
assert.match(s,/interventi:'interventionId'/);

console.log('OK: technical drafts, 8 structured types, POS 12 sections, legacy compatibility, checklist, originals, revisions, validation and non-official print');
