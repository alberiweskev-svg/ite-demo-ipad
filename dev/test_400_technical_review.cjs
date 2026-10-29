'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('app.js','utf8');
function declaration(prefix){const i=src.indexOf(prefix);assert(i>=0,prefix);const end=src.indexOf(';\n',i);return src.slice(i,end+1)}
function extract(name){const i=src.indexOf('function '+name+'(');assert(i>=0,name);const b=src.indexOf('{',i);let depth=0,q='',escaped=false;for(let p=b;p<src.length;p++){const c=src[p];if(q){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===q)q='';continue}if(c==='"'||c==="'"||c==='\x60'){q=c;continue}if(c==='{')depth++;else if(c==='}'&&!--depth)return src.slice(i,p+1)}throw Error('Unclosed '+name)}
const ctx={};vm.createContext(ctx);vm.runInContext([declaration('const CHECKLIST='),declaration('const STRUCTURED_GROUPS='),extract('posSections'),extract('qualityReport'),'this.posSections=posSections;this.qualityReport=qualityReport;'].join('\n'),ctx);
const pos={type:'POS',status:'Bozza',clientId:'1',siteId:'7',fields:{scope:'Lavoro TEST'},structured:{cantiere:'Via Test 1',inizioLavori:'2026-11-10',fineLavori:'2026-11-09'},linkedDocIds:[],checklistEvidence:{}};
const report=ctx.qualityReport(pos);assert.equal(report.sections.length,12);assert(report.open>8);assert(report.issues.some(x=>x.label.includes('fine lavori precede')));assert(report.issues.some(x=>x.area==='Originali'));assert.equal(report.internallyComplete,false);
const filled={...pos,structured:{...pos.structured,fineLavori:'2026-11-12'}};
for(const section of ctx.posSections(filled)){const group=vm.runInContext('STRUCTURED_GROUPS.POS['+section.index+'].fields',ctx);for(const f of group)if(f[3])filled.structured[f[0]]='TEST'}
filled.linkedDocIds=['doc_test'];filled.checklistEvidence=Object.fromEntries(vm.runInContext('CHECKLIST.POS',ctx).map(x=>[x,{status:'Documentato',evidence:'Riferimento TEST'}]));
assert.equal(ctx.qualityReport(filled).open,0);assert.equal(ctx.qualityReport(filled).internallyComplete,true);assert(ctx.posSections(filled).every(x=>!x.missing.length));
assert.equal(ctx.qualityReport({...filled,status:'Annullata'}).internallyComplete,false);
assert.equal(ctx.posSections({type:'Di.Co. elettrica'}).length,0);
console.log('OK: POS 12 sections, missing fields, chronological warnings, sources, checklist, cancelled status');
