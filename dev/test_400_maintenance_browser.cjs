'use strict';
// Browser smoke test: all data synthetic. Does not publish to GitHub Pages.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.');
const engine=process.env.ITE_BROWSER==='webkit'?webkit:chromium;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep))throw Error('Outside preview');
  if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
  fs.createReadStream(target).on('error',()=>{res.statusCode=404;res.end()}).pipe(res);
 }catch(_){res.statusCode=404;res.end('Not found');}
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#app-shell').isVisible(),false);
  assert.equal(await page.locator('#plan-results').textContent(),'');
  await page.locator('#vault-password').fill('ITE-4-TEST-SCADENZIARIO');
  await page.locator('#vault-confirm').fill('ITE-4-TEST-SCADENZIARIO');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.evaluate(()=>{
   const today=new Date(),last=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth()-14,1)).toISOString().slice(0,10);
   ITE.commit(db=>{
    db.interventi.push({id:999,apparecchiatura_id:'1',date:last,kind:'Manutenzione',description:'Manutenzione sintetica',outcome:'Completato'});
   });
   ITERouter.show('scadenziario','push');
  });
  await page.locator('#plan-results article').first().waitFor();
  assert.match(await page.locator('#plan-results').textContent(),/Cliente dimostrativo/);
  assert.match(await page.locator('#plan-results').textContent(),/Scaduta/);
  assert.match(await page.locator('#plan-summary').textContent(),/scadute 1/);
  await page.locator('#plan-search').fill('NON ESISTENTE');
  assert.equal(await page.locator('#plan-results article').count(),0);
  await page.locator('#plan-search').fill('TEST001');
  assert.equal(await page.locator('#plan-results article').count(),1);
  page.once('dialog',d=>d.accept());
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#plan-export').click();
  const download=await downloadPromise;
  const csv=await fs.promises.readFile(await download.path(),'utf8');
  assert.ok(csv.startsWith('\uFEFF')&&csv.includes('Cliente dimostrativo')&&csv.includes('TEST001'));
  assert.ok(!csv.includes('ORFANO'));
  await page.locator('[data-plan-device="1"]').click();
  await page.locator('#appointment-form').waitFor({state:'visible'});
  assert.equal(await page.locator('#appointment-client').inputValue(),'1');
  assert.equal(await page.locator('#appointment-site').inputValue(),'1');
  assert.equal(await page.locator('#appointment-device').inputValue(),'1');
  await page.locator('#appointment-cancel').click();
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  console.log('OK: '+(process.env.ITE_BROWSER||'chromium')+' integrated planner, synthetic maintenance, filtering, CSV and calendar handoff');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
