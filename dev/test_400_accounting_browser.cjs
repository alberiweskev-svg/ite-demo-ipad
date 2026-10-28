'use strict';
// Browser E2E: fattura sintetica -> anteprima -> archivio -> backup -> riapertura.
// Nessun dato reale e nessuna modifica a GitHub Pages.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||'.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep))throw Error('outside root');
  if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
  fs.createReadStream(target).on('error',()=>{if(!res.headersSent)res.writeHead(404);res.end()}).pipe(res);
 }catch(_){res.writeHead(404);res.end('Not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  const password='ITE-4-Synthetic-Accounting-Test!';
  await page.locator('#vault-password').fill(password);
  await page.locator('#vault-confirm').fill(password);
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.locator('#app-nav a[href="#importazioni"]').first().evaluate(el=>el.click());
  const name='fattura-fittizia-e2e.txt';
  const bytes=Buffer.from('FATTURA FITTIZIA - SOLO TEST\nNumero: DEMO-2026-001\nData: 2026-10-28\nTotale: 123,45 EUR\nNESSUN DATO REALE\n','utf8');
  await page.locator('#import-files').setInputFiles({name,mimeType:'text/plain',buffer:bytes});
  await page.waitForFunction(()=>window.ITECommerce.queue().length>0&&document.getElementById('import-status').textContent.includes('Analisi completata'),null,{timeout:45000});
  const preview=await page.evaluate(()=>window.ITECommerce.queue()[0]);
  assert.equal(preview.file.size,bytes.length,'Dimensione originale diversa nell’anteprima');
  assert.deepEqual(Buffer.from(preview.file.base64,'base64'),bytes,'Originale alterato nell’anteprima');
  // Una fattura di testo priva di identificativi fiscali verificabili resta da classificare.
  await page.locator('#import-queue [data-q="type"]').first().selectOption('Da verificare');
  await page.locator('#import-apply').click();
  await page.waitForFunction(name=>window.ITECommerce.snapshot().documents.some(d=>d.sourceName===name),name,{timeout:60000});
  const saved=await page.evaluate(name=>{
   const state=window.ITECommerce.snapshot();
   const doc=state.documents.find(d=>d.sourceName===name);
   return {doc,file:state.files.find(f=>f.id===doc?.fileId)};
  },name);
  assert.ok(saved.doc&&saved.file,'Fattura sintetica o originale non registrati');
  assert.equal(saved.doc.type,'Da verificare','Classificazione prudente non rispettata');
  assert.deepEqual(Buffer.from(saved.file.base64,'base64'),bytes,'Byte registrati differenti');
  const backup=await page.evaluate(()=>window.ITEBackup.pack());
  assert.equal(backup.format,'ITE-complete');
  assert.ok(backup.commerce.documents.some(d=>d.id===saved.doc.id),'Documento assente nel backup completo');
  assert.ok(backup.commerce.files.some(f=>f.id===saved.file.id),'Originale assente nel backup completo');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#vault-password').fill(password);
  await page.locator('#vault-submit').click({noWaitAfter:true});
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  const restored=await page.evaluate(id=>{
   const state=window.ITECommerce.snapshot();
   const doc=state.documents.find(d=>d.id===id);
   return {doc,file:state.files.find(f=>f.id===doc?.fileId)};
  },saved.doc.id);
  assert.ok(restored.doc&&restored.file,'Fattura non recuperata dopo riapertura archivio cifrato');
  assert.deepEqual(Buffer.from(restored.file.base64,'base64'),bytes,'Byte persi dopo riapertura');
  const downloadPromise=page.waitForEvent('download',{timeout:30000});
  await page.evaluate(id=>window.ITECommerce.openOriginal(id),saved.doc.id);
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),name);
  assert.deepEqual(await fs.promises.readFile(await download.path()),bytes,'Originale scaricato alterato');
  assert.deepEqual(errors,[],'Errori browser: '+errors.join(' | '));
  console.log('OK: fattura fittizia importata, registrata, inclusa nel backup, riaperta e scaricata senza perdita di byte');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
