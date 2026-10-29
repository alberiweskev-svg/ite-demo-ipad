'use strict';
// E2E solo con documenti e controparti inventati.
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
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle'});
  await page.locator('#vault-password').fill('ITE-4-FINANCIAL-TEST-SYNTHETIC');
  await page.locator('#vault-confirm').fill('ITE-4-FINANCIAL-TEST-SYNTHETIC');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>window.ITECommerce&&!window.ITECommerce.busy(),null,{timeout:30000});
  await page.evaluate(async()=>{
   const bytes=new TextEncoder().encode('%PDF-1.4\n%%EOF'),digest=await crypto.subtle.digest('SHA-256',bytes),hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''),base64=btoa(String.fromCharCode(...bytes));
   const docs=[['fin-synthetic-invoice','Fattura vendita',110],['fin-synthetic-credit','Nota credito vendita',30]];
   await ITECommerce.mutate(next=>{
    const fileId='file_'+hash;
    if(!next.files.some(f=>f.id===fileId))next.files.push({id:fileId,hash,size:bytes.length,base64,name:'originale-sintetico.pdf',type:'application/pdf'});
    for(const [id,type,total] of docs)next.documents.push({id,type,total,net:total/1.1,tax:total-total/1.1,number:id,date:'2026-10-01',due:'2026-10-20',status:'Registrato',party:{name:'Cliente Inventato Test',vat:'11111111111'},clientId:'',subjectId:'',siteId:'',propertyId:'',plantId:'',deviceId:'',jobId:'',lines:[],fileId,sourceName:'originale-sintetico.pdf',payments:[],ddtRefs:[],notes:[]});
   });
   ITERouter.show('importazioni','push');
  });
  await page.locator('#ite-financial-desk').waitFor({state:'attached'});
  await page.locator('#ite-financial-desk > summary').click();
  await page.locator('#ite-financial-results [data-fin-pay="fin-synthetic-invoice"]').waitFor();
  assert.match(await page.locator('#ite-financial-summary').textContent(),/110,00/);
  await page.locator('[data-fin-pay="fin-synthetic-invoice"]').click();
  await page.locator('#ite-financial-form [name="amount"]').fill('50.00');
  page.once('dialog',d=>d.accept());
  await page.locator('#ite-financial-form [type="submit"]').click();
  await page.waitForFunction(()=>window.ITECommerce.snapshot().settings.financialSettlements?.length===1,null,{timeout:30000});
  await page.waitForFunction(()=>document.getElementById('ite-financial-results').textContent.includes('Parzialmente incassata'));
  assert.match(await page.locator('#ite-financial-results').textContent(),/Parzialmente incassata/);
  await page.locator('#ite-financial-offset').click();
  await page.locator('#ite-financial-form [name="amount"]').fill('30.00');
  page.once('dialog',d=>d.accept());
  await page.locator('#ite-financial-form [type="submit"]').click();
  await page.waitForFunction(()=>window.ITECommerce.snapshot().settings.financialSettlements?.length===2,null,{timeout:30000});
  await page.waitForFunction(()=>document.getElementById('ite-financial-results').textContent.includes('Rimborsata'));
  assert.match(await page.locator('#ite-financial-results').textContent(),/Rimborsata/);
  await page.locator('#ite-financial-filter').selectOption('credito');
  assert.equal(await page.locator('#ite-financial-results [data-fin-pay]').count(),0);
  page.once('dialog',d=>d.accept());
  const download=page.waitForEvent('download');await page.locator('#ite-financial-export').click();
  const csv=await fs.promises.readFile(await (await download).path(),'utf8');assert.ok(csv.includes('Nota credito vendita')&&!csv.includes('Fattura vendita'));
  await page.locator('#ite-financial-desk details > summary').last().click();
  const onVoidDialog=d=>d.accept(d.type()==='prompt'?'Registrazione errata':undefined);
  page.on('dialog',onVoidDialog);
  await page.locator('[data-fin-void]').last().click();
  page.off('dialog',onVoidDialog);
  await page.waitForFunction(()=>window.ITECommerce.snapshot().settings.financialSettlements.some(e=>e.voidedAt),null,{timeout:30000});
  await page.waitForFunction(()=>document.getElementById('ite-financial-ledger').textContent.includes('STORNATO'));
  assert.match(await page.locator('#ite-financial-ledger').textContent(),/STORNATO/);
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK '+(process.env.ITE_TEST_BROWSER||'chromium')+': synthetic invoice, partial receipt, TD04 compensation, CSV and audited reversal');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
