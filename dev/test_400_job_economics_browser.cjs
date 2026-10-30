'use strict';
// Browser integration: synthetic intervention hours + stock consumption + expenses + CSV + reversal.
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
  await page.locator('#vault-password').fill('ITE-4-ECONOMICS-SYNTHETIC');
  await page.locator('#vault-confirm').fill('ITE-4-ECONOMICS-SYNTHETIC');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITEJobEconomics&&!!window.ITESiteCosting&&!!window.ITETestData&&!!ITECommerce.snapshot().settings.testDatasets?.ITE_TEST_3073&&!ITECommerce.busy(),null,{timeout:45000});
  const ids=await page.evaluate(async()=>{
   const ids=ITECommerce.snapshot().settings.testDatasets.ITE_TEST_3073.ids;
   const jobId=Math.max(0,...ITE.snapshot().interventi.map(x=>x.id))+1;
   const start='2026-10-29T08:00:00.000Z',end='2026-10-29T09:00:00.000Z';
   ITE.commit(next=>{
    const site=next.cantieri.find(x=>String(x.id)===String(ids.worksite));
    site.ite_quotes=JSON.stringify([{id:'q_econ_test',number:'PREV-ECON-001',status:'Accettato',lines:[{line_type:'Fornitura',description:'Materiale sintetico',category:'Idrico',qty:5,unit:'m',price:10,discount:0,vat:10},{line_type:'Posa',description:'Posa sintetica',category:'Idrico',qty:1,unit:'h',price:50,discount:0,vat:10}]}]);
    next.interventi.push({id:jobId,appointment:'1',time_tracking:'automatic',workflow_status:'Chiuso',target_type:'apparecchiature',target_id:ids.boiler,client_id:ids.multi,immobile_id:ids.home,cantiere_id:ids.worksite,apparecchiatura_id:ids.boiler,kind:'Riparazione',description:'Intervento economia sintetico',technician_id:ids.worker,assigned_operators:JSON.stringify([{operator_id:ids.worker,role:'Principale'}]),scheduled_start:start,scheduled_end:end,started_at:start,finished_at:end,work_sessions:JSON.stringify([{id:'econ-session',operator_id:String(ids.worker),arrived_at:start,departed_at:end}]),work_logs:JSON.stringify([{operator_id:String(ids.worker),role:'Principale',duration_minutes:60,duration_seconds:3600}]),labor_minutes:'60',callout_policy:'ordinary',callout_fee:'0.00',outcome:'Completato'});
   });
   await ITECommerce.mutate((next,core)=>{
    next.articles.push({id:'art_econ_test',kind:'Materiale',code:'TEST-ECON',description:'Tubo sintetico',unit:'m',price:10,costPrice:3});
    next.movements.push({id:'stock_econ_test',articleId:'art_econ_test',quantity:10,date:'2026-10-30',reason:'Carico fittizio',siteId:ids.worksite,documentId:''});
    ITEJobMaterials.addUsage(next,core,{jobId,actorId:ids.worker,articleId:'art_econ_test',quantity:2,note:'Prova economia'});
   });
   ITEWorksites.open(ids.worksite);
   return ids;
  });
  await page.locator('#ite-job-economics').waitFor({state:'visible',timeout:30000});
  assert.match(await page.locator('#ite-job-economics').textContent(),/Manodopera registrata/);
  const initial=await page.evaluate(()=>ITEJobEconomics.analyze(ITE.snapshot().cantieri.find(x=>String(x.id)===String(document.querySelector('#ite-job-economics').dataset.econSite)),ITE.snapshot(),ITECommerce.snapshot()));
  assert(initial.work.costCents>0);assert.equal(initial.materialCents,600);
  await page.locator('[data-econ-add]').click();
  await page.locator('#ite-econ-form [name=amount]').fill('18.50');
  await page.locator('#ite-econ-form [name=description]').fill('Noleggio attrezzatura sintetico');
  await page.locator('#ite-econ-form [name=category]').selectOption({label:'Noleggio'});
  page.once('dialog',d=>d.accept());
  await page.locator('#ite-econ-form [type=submit]').click();
  await page.waitForFunction(()=>ITECommerce.snapshot().settings.jobSiteExpenses?.length===1,null,{timeout:30000});
  const after=await page.evaluate(()=>({expense:ITECommerce.snapshot().settings.jobSiteExpenses[0],html:document.querySelector('#ite-job-economics').textContent}));
  assert.equal(after.expense.amountCents,1850);assert.match(after.html,/Noleggio/);
  page.once('dialog',d=>d.accept());const download=page.waitForEvent('download');await page.locator('[data-econ-csv]').click();
  const csv=await fs.promises.readFile(await (await download).path(),'utf8');assert.match(csv,/Noleggio attrezzatura sintetico/);
  const handle=d=>d.type()==='prompt'?d.accept('Rettifica sintetica'):d.accept();
  page.on('dialog',handle);await page.locator('[data-econ-void]').click();page.off('dialog',handle);
  await page.waitForFunction(()=>!!ITECommerce.snapshot().settings.jobSiteExpenses?.[0]?.voidedAt,null,{timeout:30000});
  const final=await page.evaluate(async()=>({audit:ITECommerce.snapshot().audit.filter(x=>/COSTO_COMMESSA_REGISTRATO|STORNO_COSTO_COMMESSA/.test(x.action)).length,backups:(await ITEHistory.list()).map(x=>x.reason)}));
  assert(final.audit>=2);assert(final.backups.some(x=>x.includes('COSTO_COMMESSA_REGISTRATO')));
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK '+(process.env.ITE_TEST_BROWSER||'chromium')+': synthetic labor, material cost, expense, CSV, reversal, backup');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
