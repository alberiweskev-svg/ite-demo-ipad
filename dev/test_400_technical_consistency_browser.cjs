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
  await page.locator('#vault-password').fill('ITE-4-CONSISTENCY-SYNTHETIC');
  await page.locator('#vault-confirm').fill('ITE-4-CONSISTENCY-SYNTHETIC');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITETechnicalConsistency&&!!window.ITETestData&&!!window.ITETechnicalDrafts&&!ITECommerce.busy()&&!!ITECommerce.snapshot().settings.testDatasets?.ITE_TEST_3073,null,{timeout:45000});
  const id=await page.evaluate(async()=>{
   const ids=ITECommerce.snapshot().settings.testDatasets.ITE_TEST_3073.ids;
   const practice={id:'td_44444444-4444-4444-8444-444444444440',type:'Di.Co. idrica / termica',status:'Bozza',revision:1,history:[],
    clientId:String(ids.multi),propertyId:String(ids.home),plantId:'',deviceId:'',siteId:String(ids.worksite),interventionId:'',date:'2026-10-30',
    fields:{reference:'DICO-CONSISTENCY-TEST',scope:'Impianto sintetico'},structured:{},checklistEvidence:{},linkedDocIds:[]};
   await ITECommerce.mutate(next=>{next.settings.technicalDrafts=[...(next.settings.technicalDrafts||[]),practice]});
   ITERouter.show('importazioni','push');ITETechnicalDrafts.render();
   return practice.id;
  });
  await page.locator('[data-tech-consistency="'+id+'"]').waitFor({state:'visible',timeout:30000});
  await page.locator('[data-tech-consistency="'+id+'"]').click();
  await page.locator('#ite-consistency-overlay').waitFor({state:'visible'});
  assert.match(await page.locator('#ite-consistency-overlay').innerText(),/Proposte da verificare/);
  page.once('dialog',d=>d.accept());
  const dl=page.waitForEvent('download');
  await page.locator('[data-consistency-csv]').click();
  assert.match(fs.readFileSync(await (await dl).path(),'utf8'),/DICO-CONSISTENCY-TEST/);
  await page.locator('[data-consistency-apply]').click();
  await page.locator('#tech-form').waitFor({state:'visible'});
  const details=await page.evaluate(()=>({values:[...document.querySelectorAll('#tech-form [data-tech-detail]')].filter(x=>x.value).map(x=>[x.dataset.techDetail,x.value]),
   saved:ITECommerce.snapshot().settings.technicalDrafts.find(x=>x.id==='td_44444444-4444-4444-8444-444444444440').structured}));
  assert(details.values.some(x=>x[0]==='committente'));
  assert.deepEqual(details.saved,{},'Prefill must remain unsaved until explicit user save');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('OK '+(process.env.ITE_TEST_BROWSER||'chromium')+': consistency UI, safe CSV, guided unsaved prefill');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
