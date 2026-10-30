'use strict';
// Browser integration: synthetic job consumption -> approved supply -> costing -> CSV -> reversal.
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
  await page.locator('#vault-password').fill('ITE-4-COSTING-SYNTHETIC');
  await page.locator('#vault-confirm').fill('ITE-4-COSTING-SYNTHETIC');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITESiteCosting&&!!window.ITEJobMaterials&&!!window.ITETestData&&!!ITECommerce.snapshot().settings.testDatasets?.ITE_TEST_3073&&!ITECommerce.busy(),null,{timeout:45000});
  const fixture=await page.evaluate(async()=>{
   const ids=ITECommerce.snapshot().settings.testDatasets.ITE_TEST_3073.ids;
   const jobId=Math.max(0,...ITE.snapshot().interventi.map(x=>x.id))+1;
   const start=new Date(Date.now()-600000).toISOString(),end=new Date(Date.now()+3600000).toISOString();
   ITE.commit(next=>{
    const site=next.cantieri.find(x=>String(x.id)===String(ids.worksite));
    site.ite_quotes=JSON.stringify([{id:'q_cost_test',number:'PREV-COST-001',status:'Accettato',lines:[{line_type:'Fornitura',description:'Tubo sintetico',category:'Idrico',qty:5,unit:'m',price:10,discount:0,vat:10},{line_type:'Posa',description:'Posa sintetica',category:'Idrico',qty:1,unit:'h',price:50,discount:0,vat:10}]}]);
    next.interventi.push({id:jobId,appointment:'1',time_tracking:'automatic',workflow_status:'In corso',target_type:'apparecchiature',target_id:ids.boiler,client_id:ids.multi,immobile_id:ids.home,cantiere_id:ids.worksite,apparecchiatura_id:ids.boiler,kind:'Riparazione',description:'Intervento costing sintetico',technician_id:ids.worker,assigned_operators:JSON.stringify([{operator_id:ids.worker,role:'Principale'}]),scheduled_start:start,scheduled_end:end,started_at:start,finished_at:'',work_sessions:JSON.stringify([{id:'cost-session',operator_id:ids.worker,arrived_at:start,departed_at:''}]),callout_policy:'ordinary',callout_fee:'0.00',outcome:'Da completare'});
   });
   await ITECommerce.mutate((next,core)=>{
    next.articles.push({id:'art_cost_test',kind:'Materiale',code:'TEST-COST',description:'Tubo sintetico',unit:'m',price:10,costPrice:3});
    next.movements.push({id:'stock_cost_test',articleId:'art_cost_test',quantity:10,date:'2026-10-30',reason:'Carico fittizio',siteId:ids.worksite,documentId:''});
    ITEJobMaterials.addUsage(next,core,{jobId,actorId:ids.worker,articleId:'art_cost_test',quantity:2.5,note:'Prova consuntivo'});
   });
   ITEWorksites.open(ids.worksite);
   return {ids,jobId};
  });
  await page.locator('#ite-site-costing').waitFor({state:'visible',timeout:30000});
  assert.match(await page.locator('#ite-site-costing').textContent(),/Forniture approvate/);
  await page.locator('[data-site-cost-add]').click();
  await page.locator('#ite-site-cost-form [name=quantity]').fill('2');
  page.once('dialog',d=>d.accept());
  await page.locator('#ite-site-cost-form [type=submit]').click();
  await page.waitForFunction(()=>ITECommerce.snapshot().settings.jobMaterialAllocations?.length===1,null,{timeout:30000});
  const result=await page.evaluate(()=>({a:ITECommerce.snapshot().settings.jobMaterialAllocations[0],balance:ITECommerce.balance('art_cost_test'),html:document.querySelector('#ite-site-costing')?.textContent||''}));
  assert.equal(result.a.quantity,2);assert.equal(result.balance,7.5);assert.match(result.html,/Costi noti attribuiti/);
  page.once('dialog',d=>d.accept());const download=page.waitForEvent('download');await page.locator('[data-site-cost-csv]').click();
  const csv=await fs.promises.readFile(await (await download).path(),'utf8');
  assert.match(csv,/PREV-COST-001/);assert.match(csv,/Tubo sintetico/);
  page.once('dialog',d=>d.accept('Storno sintetico'));
  page.once('dialog',d=>d.accept());
  await page.locator('[data-site-cost-void]').click();
  await page.waitForFunction(()=>!!ITECommerce.snapshot().settings.jobMaterialAllocations?.[0]?.voidedAt,null,{timeout:30000});
  const final=await page.evaluate(async()=>({balance:ITECommerce.balance('art_cost_test'),audit:ITECommerce.snapshot().audit.filter(x=>/ATTRIBUZIONE_CONSUMO_FORNITURA|STORNO_ATTRIBUZIONE_FORNITURA/.test(x.action)).length,backups:(await ITEHistory.list()).map(x=>x.reason)}));
  assert.equal(final.balance,7.5);assert(final.audit>=2);assert(final.backups.some(x=>x.includes('ATTRIBUZIONE_CONSUMO_FORNITURA')));
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK '+(process.env.ITE_TEST_BROWSER||'chromium')+': synthetic worksite costing, manual allocation, no extra stock debit, CSV, reversal and backup');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
