'use strict';
// E2E: esclusivamente clienti, fatture e documenti sintetici. Nessun PDF reale.
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
  await page.locator('#vault-password').fill('ITE-4-CONTRACT-BILLING-SYNTHETIC');
  await page.locator('#vault-confirm').fill('ITE-4-CONTRACT-BILLING-SYNTHETIC');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITEContractBilling&&!!window.ITECommerce&&!ITECommerce.busy(),null,{timeout:30000});
  const fixture=await page.evaluate(async()=>{
   const core=ITE.snapshot(),client=core.clienti[0],property=core.immobili.find(x=>String(x.client_id)===String(client.id));
   if(!client||!property)throw Error('Dati sintetici di base non disponibili.');
   const siteId=90280,clientId=String(client.id);
   const supply={line_type:'Fornitura',category:'Idrico',description:'Materiale sintetico',qty:1,price:100,discount:0,vat:10};
   const install={line_type:'Posa',category:'Idrico',description:'Posa sintetica',qty:1,price:50,discount:0,vat:10};
   ITE.commit(next=>next.cantieri.push({id:siteId,name:'Cantiere contratto sintetico',client_id:clientId,immobile_id:String(property.id),ite_quotes:JSON.stringify([{id:'q-test',number:'P-SINTETICO',status:'Accettato',lines:[supply,install]}]),ite_extras:JSON.stringify([{id:'e-test',description:'Extra sintetico',status:'Parzialmente approvato',approved_line_indices:[0],lines:[supply,install],sal:[{label:'Acconto',percent:40},{label:'Saldo',percent:60}]}])}));
   const bytes=new TextEncoder().encode('%PDF-1.4\n%%EOF'),digest=await crypto.subtle.digest('SHA-256',bytes),hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''),base64=btoa(String.fromCharCode(...bytes)),fileId='file_'+hash;
   await ITECommerce.mutate(next=>{
    if(!next.files.some(f=>f.id===fileId))next.files.push({id:fileId,hash,size:bytes.length,base64,name:'sintetico.pdf',type:'application/pdf'});
    next.documents.push({id:'invoice-synthetic',type:'Fattura vendita',total:220,net:200,tax:20,number:'FT-SINTETICA',date:'2026-10-29',status:'Registrato',party:{name:'Cliente sintetico'},clientId,subjectId:clientId,siteId:String(siteId),propertyId:String(property.id),plantId:'',deviceId:'',jobId:'',lines:[],fileId,sourceName:'sintetico.pdf',payments:[],notes:[]});
   });
   ITEWorksites.open(siteId);
   return {siteId};
  });
  await page.locator('#ite-contract-billing').waitFor({state:'visible',timeout:30000});
  assert.match(await page.locator('#ite-contract-billing').textContent(),/Fatturazione lavori approvati e SAL/);
  assert.match(await page.locator('#ite-contract-billing').textContent(),/Quote SAL contrattuali/);
  await page.locator('[data-contract-add]').click();
  await page.locator('#ite-contract-billing-form').waitFor({state:'visible'});
  await page.locator('#ite-contract-billing-form [name=amount]').fill('100.00');
  page.once('dialog',d=>d.accept());
  await page.locator('#ite-contract-billing-form [type=submit]').click();
  await page.waitForFunction(()=>ITECommerce.snapshot().settings.contractBillingLinks?.length===1,null,{timeout:30000});
  const link=await page.evaluate(()=>ITECommerce.snapshot().settings.contractBillingLinks[0]);
  assert.equal(link.amountCents,10000);
  assert.equal(link.documentId,'invoice-synthetic');
  assert.equal(link.sourceId,'q-test');
  assert.equal(link.siteId,String(fixture.siteId));
  await page.locator('#ite-contract-billing [data-contract-void]').waitFor({state:'visible',timeout:30000});
  page.on('dialog',d=>d.accept(d.type()==='prompt'?'Attribuzione errata, test':undefined));
  await page.locator('#ite-contract-billing [data-contract-void]').click();
  await page.waitForFunction(()=>!!ITECommerce.snapshot().settings.contractBillingLinks?.[0]?.voidedAt,null,{timeout:30000});
  assert.match(await page.locator('#ite-contract-billing').textContent(),/STORNATA/);
  const download=page.waitForEvent('download');await page.locator('[data-contract-csv]').click();
  const csv=await fs.promises.readFile(await (await download).path(),'utf8');
  assert.match(csv,/FT-SINTETICA/);assert.match(csv,/Stornato/);
  const result=await page.evaluate(async()=>({audit:ITECommerce.snapshot().audit.filter(a=>/COLLEGAMENTO_FATTURA/.test(a.action)).length,backups:(await ITEHistory.list()).map(x=>x.reason)}));
  assert(result.audit>=2);assert(result.backups.some(x=>x.includes('COLLEGAMENTO_FATTURA')));
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK '+(process.env.ITE_TEST_BROWSER||'chromium')+': synthetic quote/extra billing, encrypted persistence, audit, backup, reversal and CSV');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
