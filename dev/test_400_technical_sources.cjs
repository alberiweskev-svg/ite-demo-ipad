'use strict';
const assert=require('node:assert/strict');
globalThis.ITECad=require('../ite-cad.js');
globalThis.ITETechnicalDrafts={
 contextForIntervention:(j,db)=>({clientId:String(j.client_id),propertyId:String(j.immobile_id),plantId:String(j.impianto_id),deviceId:String(j.apparecchiatura_id),siteId:String(j.cantiere_id),interventionId:String(j.id)}),
 qualityReport:()=>({open:2})
};
const flow=require('../ite-cad-workflow.js');
const core={
 clienti:[{id:1,name:'[TEST] Cliente Uno'},{id:2,name:'[TEST] Altro Cliente'}],
 immobili:[{id:3,client_id:'1',name:'Via Collaudo 3',city:'Bologna',province:'BO',pdr:'PDR-TEST-ONLY'},{id:4,client_id:'2',name:'Via Test 4'}],
 impianti:[{id:5,immobile_id:'3',name:'Riscaldamento TEST'}],
 apparecchiature:[{id:6,impianto_id:'5',category:'Caldaia',brand:'Baxi TEST',model:'MOD-TEST',serial:'SER-TEST',power:'24'}],
 cantieri:[{id:7,client_id:'1',immobile_id:'3',name:'Cantiere TEST'}],
 interventi:[{id:8,client_id:'1',immobile_id:'3',impianto_id:'5',apparecchiatura_id:'6',cantiere_id:'7',description:'Installazione apparecchio sintetico',appointment:'1',workflow_status:'Chiuso'}]
};
const p={id:'td_11111111-1111-4111-8111-111111111111',type:'Di.Co. idrica / termica',clientId:'1',propertyId:'3',plantId:'5',deviceId:'6',siteId:'7',interventionId:'8',status:'Bozza',revision:1,fields:{reference:'TEST-1'},linkedDocIds:[]};
const art={id:'art_12345678',code:'ART-TEST-1',description:'Valvola sintetica',kind:'Materiale',unit:'pz',priceRole:'cost',price:10};
const sym=ITECad.make('symbol',{x:30,y:30},{x:30,y:30},'valvola');
const elements=ITECad.operate([sym],'linkArticle',sym.id,{articleId:art.id});
const d={id:'cad_12345678',title:'Schema TEST',clientId:'1',propertyId:'3',plantId:'5',siteId:'7',revision:1,archived:false,scaleCmPerUnit:2,elements};
const link=flow.addLink([],d,p,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-29T11:00:00Z');
const commerce={settings:{cadDrawings:[d],cadPracticeLinks:link,technicalDrafts:[p]},articles:[art],movements:[]};
const res=flow.technicalSources(p,core,commerce);
const by=target=>res.candidates.find(x=>x.target===target)?.value;
assert.equal(by('detail:committente'),'[TEST] Cliente Uno');
assert.match(by('detail:indirizzoImpianto'),/Via Collaudo 3/);
assert.match(by('detail:tipoRete'),/MOD-TEST/);
assert.match(by('field:scope'),/Installazione apparecchio sintetico/);
assert.match(by('detail:materialiRiferimento'),/ART-TEST-1/);
assert.match(by('field:materials'),/PRELIMINARE/);
assert.match(by('detail:schemaRiferimento'),/revisione 1/);
assert.equal(by('detail:pdrVerificato'),undefined);
assert.equal(by('field:checks'),undefined);
assert.equal(commerce.movements.length,0);
assert.equal(flow.technicalAudit([p],core,commerce,'1')[0].open,2);
assert.equal(flow.technicalAudit([p],core,commerce,'2').length,0);
assert.throws(()=>flow.technicalAudit([p],core,commerce,''),/cliente/);
assert.throws(()=>flow.technicalSources({...p,clientId:'2'},core,commerce),/incoerenti|cliente/i);
assert.throws(()=>flow.technicalSources({...p,propertyId:'4'},core,commerce),/incoerenti/);
assert.throws(()=>flow.technicalSources({...p,interventionId:'999'},core,commerce),/Intervento/);
const pending=flow.technicalSources(p,{...core,interventi:[{...core.interventi[0],workflow_status:'Programmato'}]},commerce);
assert.equal(pending.candidates.some(x=>x.target==='field:scope'),false,'Scheduled appointment cannot certify performed work');
assert(pending.warnings.some(x=>x.includes('non chiuso')));
const stale=flow.technicalSources(p,core,{...commerce,settings:{...commerce.settings,cadDrawings:[{...d,revision:2}]}});
assert(!stale.candidates.some(x=>x.target==='field:materials'));
assert(stale.warnings.some(x=>x.includes('modificata')));
const unlinked=flow.technicalSources({...p,id:'td_22222222-2222-4222-8222-222222222222'},core,commerce);
assert(!unlinked.candidates.some(x=>x.target==='detail:schemaRiferimento'));
assert(unlinked.warnings.some(x=>x.includes('Nessuna tavola')));
const gas=flow.technicalSources({...p,type:'Allegato gas H40'},core,commerce);
assert(!gas.candidates.some(x=>x.target==='detail:pdrVerificato'));
assert(gas.candidates.some(x=>x.target==='detail:potenza'));
assert(!gas.candidates.some(x=>x.target==='detail:tubazioni'),'CAD symbols must not attest gas piping');
const incomplete=flow.technicalSources(p,core,{...commerce,articles:[]});
assert(incomplete.warnings.some(x=>x.includes('Articolo CAD')));
assert(!incomplete.candidates.some(x=>x.target==='field:materials'));
assert.throws(()=>flow.technicalAudit(Array.from({length:101},()=>p),core,commerce,'1'),/esteso/);
console.log('OK: technical crosscheck, client isolation, completed intervention, CAD materials, stale revision, GAS safety, audit, no stock movement');
