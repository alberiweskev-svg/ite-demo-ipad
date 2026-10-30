'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),engine=process.env.ITE_TEST_BROWSER==='webkit'?webkit:chromium;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+path.sep))throw Error('outside');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end()}).pipe(res)}catch{res.statusCode=404;res.end('not found')}});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#vault-password').fill('ITE-4-EVIDENCE-SYNTHETIC-TEST');
  await page.locator('#vault-confirm').fill('ITE-4-EVIDENCE-SYNTHETIC-TEST');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITETechnicalEvidence&&!!window.ITEFieldChecks&&!!window.ITETestData&&!!window.ITETechnicalDrafts&&!ITECommerce.busy()&&!!ITECommerce.snapshot().settings.testDatasets?.ITE_TEST_3073,null,{timeout:45000});
  const practiceId=await page.evaluate(async()=>{
   const ids=ITECommerce.snapshot().settings.testDatasets.ITE_TEST_3073.ids;
   const jobId=Math.max(0,...ITE.snapshot().interventi.map(x=>Number(x.id)||0))+1;
   const start=new Date(Date.now()-600000).toISOString(),end=new Date(Date.now()+3600000).toISOString();
   ITE.commit(next=>next.interventi.push({id:jobId,appointment:'1',time_tracking:'automatic',workflow_status:'In corso',target_type:'apparecchiature',target_id:ids.boiler,client_id:ids.multi,immobile_id:ids.home,cantiere_id:ids.worksite,apparecchiatura_id:ids.boiler,kind:'Manutenzione',description:'Prova sintetica collegamento pratica',technician_id:ids.worker,assigned_operators:JSON.stringify([{operator_id:ids.worker,role:'Principale'}]),scheduled_start:start,scheduled_end:end,started_at:start,finished_at:'',work_sessions:JSON.stringify([{id:'evidence-session',operator_id:ids.worker,arrived_at:start,departed_at:''}]),callout_policy:'ordinary',callout_fee:'0.00',outcome:'Da completare'}));
   const practice={id:'td_55555555-5555-4555-8555-555555555555',type:'Di.Co. idrica / termica',status:'Bozza',revision:1,history:[],clientId:String(ids.multi),propertyId:String(ids.home),plantId:'',deviceId:String(ids.boiler),siteId:String(ids.worksite),interventionId:String(jobId),date:'2026-10-30',fields:{reference:'DICO-EVIDENCE-TEST',scope:'Verifica sintetica'},structured:{},checklistEvidence:{},linkedDocIds:[],created:start,updated:start};
   // The device's plant must be reflected in the technical practice.
   const device=ITE.snapshot().apparecchiature.find(x=>String(x.id)===String(ids.boiler));
   practice.plantId=String(device.impianto_id);
   await ITECommerce.mutate(next=>{
    ITEFieldChecks.add(next,ITE.snapshot(),{jobId,actorId:ids.worker,category:'Termico',kind:'Misura strumentale',outcome:'Rilevato',label:'Temperatura sintetica mandata',value:'48.5',unit:'°C',instrument:'Strumento fittizio',note:'Valore da verificare'});
    next.settings.technicalDrafts=[...(next.settings.technicalDrafts||[]),practice];
   });
   ITERouter.show('importazioni','push');ITETechnicalDrafts.render();
   return practice.id;
  });
  await page.locator('[data-tech-evidence="'+practiceId+'"]').waitFor({state:'visible',timeout:30000});
  await page.locator('[data-tech-evidence="'+practiceId+'"]').click();
  await page.locator('#ite-evidence-check').selectOption({index:1});
  await page.locator('#ite-evidence-reviewer').fill('Operatore TEST');
  await page.locator('#ite-evidence-note').fill('Collegamento esplicito per controllo documentale');
  await page.locator('[data-evidence-add]').click();
  await page.waitForFunction(id=>ITECommerce.snapshot().settings.technicalEvidenceLinks?.some(x=>x.practiceId===id),practiceId,{timeout:30000});
  await page.locator('#ite-tech-evidence-overlay').waitFor({state:'visible',timeout:30000});
  assert.match(await page.locator('#ite-tech-evidence-overlay').innerText(),/Riferimento attivo - da verificare/);
  page.once('dialog',d=>d.accept());const download=page.waitForEvent('download');
  await page.locator('[data-evidence-csv]').click();
  const exported=fs.readFileSync(await (await download).path(),'utf8');
  assert.match(exported,/Temperatura sintetica mandata/);assert.match(exported,/DICO-EVIDENCE-TEST/);
  await page.locator('#ite-evidence-reviewer').fill('Operatore TEST');
  page.once('dialog',d=>d.accept('Revoca di prova sintetica'));
  await page.locator('[data-evidence-revoke]').click();
  await page.waitForFunction(id=>ITECommerce.snapshot().settings.technicalEvidenceLinks?.find(x=>x.practiceId===id)?.removedAt,practiceId,{timeout:30000});
  const audit=await page.evaluate(async id=>({
   rows:ITECommerce.snapshot().settings.technicalEvidenceLinks.filter(x=>x.practiceId===id),
   audit:ITECommerce.snapshot().audit.filter(x=>/PROVA_PRATICA/.test(x.action)).map(x=>x.action),
   backups:(await ITEHistory.list()).map(x=>x.reason)
  }),practiceId);
  assert.equal(audit.rows.length,1);assert(audit.rows[0].removedAt);
  assert(audit.audit.includes('COLLEGA_PROVA_PRATICA')&&audit.audit.includes('REVOCA_PROVA_PRATICA'));
  assert(audit.backups.some(x=>x.includes('collegamento prova'))&&audit.backups.some(x=>x.includes('revoca collegamento')));
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK '+engine.name()+': technical evidence linked to Di.Co., encrypted save, backup, audit, CSV and revocation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
