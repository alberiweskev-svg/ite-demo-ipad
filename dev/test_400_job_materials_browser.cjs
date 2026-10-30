'use strict';
// Synthetic browser integration: intervention -> warehouse debit -> reversal -> worksite -> CSV.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),engine=process.env.ITE_TEST_BROWSER==='webkit'?webkit:chromium;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+name);if(file!==root&&!file.startsWith(root+path.sep))throw Error('outside');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end()}).pipe(res)}catch{res.statusCode=404;res.end('not found')}});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#vault-password').fill('ITE-4-JOB-MATERIALS-SYNTHETIC');
  await page.locator('#vault-confirm').fill('ITE-4-JOB-MATERIALS-SYNTHETIC');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITEJobMaterials&&!!window.ITETestData&&!!ITECommerce.snapshot().settings.testDatasets?.ITE_TEST_3073&&!ITECommerce.busy(),null,{timeout:45000});
  const fixture=await page.evaluate(async()=>{
   const ids=ITECommerce.snapshot().settings.testDatasets.ITE_TEST_3073.ids;
   const jobId=Math.max(0,...ITE.snapshot().interventi.map(x=>x.id))+1;
   const start=new Date(Date.now()-600000).toISOString(),end=new Date(Date.now()+3600000).toISOString();
   ITE.commit(next=>next.interventi.push({id:jobId,appointment:'1',time_tracking:'automatic',workflow_status:'In corso',target_type:'apparecchiature',target_id:ids.boiler,client_id:ids.multi,immobile_id:ids.home,cantiere_id:ids.worksite,apparecchiatura_id:ids.boiler,kind:'Riparazione',description:'Intervento materiali sintetico',technician_id:ids.worker,assigned_operators:JSON.stringify([{operator_id:ids.worker,role:'Principale'}]),scheduled_start:start,scheduled_end:end,started_at:start,finished_at:'',work_sessions:JSON.stringify([{id:'synthetic-session',operator_id:ids.worker,arrived_at:start,departed_at:''}]),callout_policy:'ordinary',callout_fee:'0.00',outcome:'Da completare'}));
   await ITECommerce.mutate(next=>{
    next.articles.push({id:'art_materials_synthetic',kind:'Materiale',code:'TEST-MAT-001',description:'Tubo sintetico',unit:'m',price:5,costPrice:3});
    next.movements.push({id:'stock_materials_synthetic',articleId:'art_materials_synthetic',quantity:10,date:'2026-10-30',reason:'Carico sintetico',siteId:ids.worksite,documentId:''});
   });
   document.getElementById('agenda-actor').value=ids.worker;
   document.getElementById('agenda-actor').dispatchEvent(new Event('change',{bubbles:true}));
   ITEAgenda.open(jobId);
   return {ids,jobId};
  });
  await page.locator('#ite-job-materials-form').waitFor({state:'visible',timeout:30000});
  await page.locator('#ite-job-materials-form [name=articleId]').selectOption('art_materials_synthetic');
  await page.locator('#ite-job-materials-form [name=quantity]').fill('2.5');
  await page.locator('#ite-job-materials-form [name=note]').fill('Bagno fittizio');
  await page.locator('#ite-job-materials-form [type=submit]').click();
  await page.waitForFunction(()=>ITECommerce.snapshot().settings.jobMaterialUsage?.length===1,null,{timeout:30000});
  const first=await page.evaluate(()=>({usage:ITECommerce.snapshot().settings.jobMaterialUsage[0],balance:ITECommerce.balance('art_materials_synthetic')}));
  assert.equal(first.usage.jobId,String(fixture.jobId));assert.equal(first.usage.quantity,2.5);assert.equal(first.balance,7.5);
  await page.locator('#ite-job-materials [data-job-material-void]').waitFor({state:'visible',timeout:30000});
  page.once('dialog',d=>d.accept('Quantità errata, test'));
  await page.locator('#ite-job-materials [data-job-material-void]').click();
  await page.waitForFunction(()=>!!ITECommerce.snapshot().settings.jobMaterialUsage?.[0]?.reversedAt,null,{timeout:30000});
  assert.equal(await page.evaluate(()=>ITECommerce.balance('art_materials_synthetic')),10);
  page.once('dialog',d=>d.accept());const download=page.waitForEvent('download');await page.locator('[data-job-material-csv]').click();
  const csv=await fs.promises.readFile(await (await download).path(),'utf8');
  assert.match(csv,/Tubo sintetico/);assert.match(csv,/Stornato/);
  await page.evaluate(id=>ITEWorksites.open(id),fixture.ids.worksite);
  await page.locator('#ite-site-materials').waitFor({state:'visible',timeout:30000});
  assert.match(await page.locator('#ite-site-materials').textContent(),/1 storni/);
  const result=await page.evaluate(async()=>({audit:ITECommerce.snapshot().audit.filter(x=>/CONSUMO_MATERIALE|STORNO_CONSUMO/.test(x.action)).length,backups:(await ITEHistory.list()).map(x=>x.reason)}));
  assert(result.audit>=2);assert(result.backups.some(x=>x.includes('scarico materiali')));
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK '+(process.env.ITE_TEST_BROWSER||'chromium')+': synthetic job materials, encrypted persistence, stock debit, reversal, worksite and CSV');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
