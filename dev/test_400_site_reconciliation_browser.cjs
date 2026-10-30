'use strict';
// Browser smoke of integrated worksite reconciliation, using synthetic entities only.
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
  await page.locator('#vault-password').fill('ITE-4-RECON-SYNTHETIC');
  await page.locator('#vault-confirm').fill('ITE-4-RECON-SYNTHETIC');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITESiteReconciliation&&!!window.ITEContractBilling&&!!window.ITEJobEconomics&&!!window.ITETestData&&!!ITECommerce.snapshot().settings.testDatasets?.ITE_TEST_3073&&!ITECommerce.busy(),null,{timeout:45000});
  const ids=await page.evaluate(async()=>{
   const ids=ITECommerce.snapshot().settings.testDatasets.ITE_TEST_3073.ids;
   ITE.commit(next=>{
    const site=next.cantieri.find(x=>String(x.id)===String(ids.worksite));
    site.ite_quotes=JSON.stringify([{id:'recon_quote',number:'RECON-001',status:'Accettato',lines:[{line_type:'Fornitura',description:'Materiale sintetico',category:'Idrico',qty:2,unit:'m',price:20,discount:0,vat:10},{line_type:'Posa',description:'Posa sintetica',category:'Idrico',qty:1,unit:'h',price:60,discount:0,vat:10}]}]);
   });
   const bytes=new TextEncoder().encode('%PDF-1.4\n%%EOF'),digest=await crypto.subtle.digest('SHA-256',bytes),hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''),base64=btoa(String.fromCharCode(...bytes)),fileId='file_'+hash;
   await ITECommerce.mutate((next,core)=>{
    if(!next.files.some(f=>f.id===fileId))next.files.push({id:fileId,hash,size:bytes.length,base64,name:'recon-synthetic.pdf',type:'application/pdf'});
    next.documents.push({id:'recon_invoice',type:'Fattura vendita',status:'Registrato',clientId:String(ids.multi),subjectId:String(ids.multi),siteId:String(ids.worksite),propertyId:String(ids.home),plantId:'',deviceId:'',jobId:'',number:'RECON-F001',net:100,tax:10,total:110,date:'2026-10-30',due:'2026-11-30',party:{name:'Cliente sintetico'},lines:[],fileId,sourceName:'recon-synthetic.pdf',payments:[],notes:[]});
    next.settings.contractBillingLinks=[...(next.settings.contractBillingLinks||[]),{id:'bill_recon001',siteId:String(ids.worksite),sourceType:'quote',sourceId:'recon_quote',documentId:'recon_invoice',amountCents:6000,sourceNetCents:10000,createdAt:'2026-10-30T04:00:00Z'}];
    next.settings.financialSettlements=[...(next.settings.financialSettlements||[]),{id:'recon_pay001',kind:'movimento',documentId:'recon_invoice',amountCents:5500,date:'2026-10-30',reference:'Incasso sintetico'}];
   });
   ITEWorksites.open(ids.worksite);
   return ids;
  });
  await page.locator('#ite-site-reconciliation').waitFor({state:'visible',timeout:30000});
  const report=await page.evaluate(()=>{
   const id=document.querySelector('#ite-site-reconciliation').dataset.reconSite;
   const core=ITE.snapshot(),site=core.cantieri.find(x=>String(x.id)===String(id));
   return ITESiteReconciliation.analyze(site,core,ITECommerce.snapshot());
  });
  assert.equal(report.approved,10000);
  assert.equal(report.attributed,6000);
  assert.equal(report.invoiced,10000);
  assert.equal(report.collectedGross,5500);
  assert.equal(report.outstandingGross,5500);
  assert.match(await page.locator('#ite-site-reconciliation').textContent(),/Quadro integrato commessa/);
  page.once('dialog',d=>d.accept());
  const download=page.waitForEvent('download');await page.locator('[data-recon-csv]').click();
  const csv=await fs.promises.readFile(await (await download).path(),'utf8');
  assert.match(csv,/RECON-001/);assert.match(csv,/RECON-F001/);
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK '+(process.env.ITE_TEST_BROWSER||'chromium')+': approved, invoiced, settled, cost panel, CSV');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
