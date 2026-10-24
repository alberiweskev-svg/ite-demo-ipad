'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||'.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 let target;
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep))throw Error('outside root');
  if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
  fs.createReadStream(target).on('error',()=>{if(!res.headersSent)res.writeHead(404);res.end()}).pipe(res);
 }catch(_){res.writeHead(404);res.end('Not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  assert.equal(response.status(),200);
  assert.equal(await page.locator('#vault-gate').count(),1,'Missing encrypted entry screen');
  assert.equal(await page.locator('#app-shell').count(),1,'Missing application shell');
  assert.equal(await page.locator('#vault-gate').isVisible(),true,'Encrypted entry screen not visible');
  assert.equal(await page.locator('#app-shell').isVisible(),false,'Application shell must remain locked');
  assert.deepEqual(errors,[],'Browser runtime errors: '+errors.join(' | '));
  console.log('OK: Chromium loads encrypted entry screen and keeps app locked');
  // Use only synthetic credentials and a fresh, isolated browser profile.
  await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-confirm').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.locator('#vault-gate').isVisible(),false,'Vault gate remains visible after unlock');
  assert.deepEqual(errors,[],'Runtime errors after unlock: '+errors.join(' | '));
  console.log('OK: Chromium creates a test vault and opens the application shell');
  const testKey='ite_307_demo_ipad_v1_smoke_check';
  const testValue='SYNTHETIC_BROWSER_TEST_VALUE';
  const encrypted=await page.evaluate(([key,value])=>{
    window.ITEVault.storage.setItem(key,value);
    return localStorage.getItem(key);
  },[testKey,testValue]);
  assert.ok(encrypted,'Encrypted test value was not stored');
  assert.ok(!encrypted.includes(testValue),'Sensitive value was stored in cleartext');
  await page.locator('#vault-lock').click();
  await page.locator('#vault-gate').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('#app-shell').isVisible(),false,'App visible after vault lock');
  await page.locator('#vault-password').fill('WRONG-SYNTHETIC-PASSWORD');
  await page.locator('#vault-submit').click();
  await page.waitForFunction(()=>/Password errata o archivio danneggiato|Password non valida/.test(document.getElementById('vault-message').textContent),{timeout:30000});
  assert.equal(await page.locator('#app-shell').isVisible(),false,'Wrong password unlocked archive');
  await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.evaluate(key=>window.ITEVault.storage.getItem(key),testKey),testValue,'Encrypted value not recovered after reload');
  await page.evaluate(key=>window.ITEVault.storage.removeItem(key),testKey);
  assert.deepEqual(errors,[],'Browser errors during lock/reopen: '+errors.join(' | '));
  console.log('OK: Encrypted persistence, lock, wrong password rejection, and correct reopen');
  // Check navigation and app startup in the real DOM without writing customer records.
  assert.equal(await page.locator('#execution-status').isVisible(),false,'Application script did not initialize');
  const routes=['#clienti-cliente','#calendario','#cantieri','#magazzino','#importazioni'];
  for(const route of routes){
    await page.locator('#app-nav a[href="'+route+'"]').first().evaluate(element=>element.click());
    await page.waitForTimeout(200);
    assert.equal(new URL(page.url()).hash,route,'Navigation did not reach '+route);
    assert.equal(await page.locator('#app-shell').isVisible(),true,'App disappeared on '+route);
    assert.deepEqual(errors,[],'Browser errors on '+route+': '+errors.join(' | '));
  }
  console.log('OK: Chromium navigates clients, calendar, worksites, warehouse, and imports');
  // Tablet/mobile navigation must open and close using the visible menu controls.
  await page.setViewportSize({width:768,height:1024});
  await page.locator('#menu-toggle').click();
  await page.waitForFunction(()=>document.body.classList.contains('menu-open'));
  assert.equal(await page.locator('#app-nav').isVisible(),true,'Tablet menu did not open');
  await page.locator('#menu-close').click();
  await page.waitForFunction(()=>!document.body.classList.contains('menu-open'));
  await page.locator('#menu-toggle').click();
  await page.locator('#app-nav a[href="#home"]').first().click();
  await page.waitForFunction(()=>location.hash==='#home');
  assert.equal(await page.locator('#app-shell').isVisible(),true,'App disappeared after tablet navigation');
  assert.deepEqual(errors,[],'Browser errors during tablet navigation: '+errors.join(' | '));
  console.log('OK: Tablet menu opens, closes, and navigates to home');
  // Verify appointment wizard structure and ordering with no personal data.
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#app-nav a[href="#calendario"]').first().evaluate(element=>element.click());
  await page.locator('#agenda-new').click();
  assert.equal(await page.locator('#appointment-form').isVisible(),true,'Appointment form did not open');
  assert.equal(await page.locator('#appointment-client').isEnabled(),true,'Client must be selectable first');
  assert.equal(await page.locator('#appointment-site').isDisabled(),true,'Site must wait for client');
  assert.equal(await page.locator('#appointment-category').isDisabled(),true,'Equipment category must wait for site');
  assert.equal(await page.locator('#appointment-device').isDisabled(),true,'Equipment must wait for category');
  assert.equal(await page.locator('#appointment-policy').inputValue(),'ordinary','Ordinary classification should be default');
  assert.equal(await page.locator('#appointment-fee').isDisabled(),true,'Callout fee must be disabled for ordinary work');
  await page.locator('#appointment-cancel').click();
  assert.equal(await page.locator('#appointment-form').isVisible(),false,'Cancel did not close appointment form');
  assert.deepEqual(errors,[],'Browser errors during appointment wizard: '+errors.join(' | '));
  console.log('OK: Appointment form starts client-first, guards dependent fields, and excludes ordinary callout fee');
  // A fresh archive may have no customers; the wizard must not offer orphan sites.
  await page.locator('#agenda-new').click();
  const clientOptions=await page.locator('#appointment-client option').count();
  assert.ok(clientOptions>=1,'Client selector is missing');
  assert.equal(await page.locator('#appointment-site option').count(),1,'Orphan sites offered before client selection');
  assert.equal(await page.locator('#appointment-category option').count(),1,'Equipment categories offered before site selection');
  assert.equal(await page.locator('#appointment-subject-hint').textContent(),'Seleziona prima il cliente.');
  assert.equal(await page.locator('#appointment-policy').isVisible(),false,'Policy must stay hidden until the subject is selected');
  // Use only the synthetic demonstration client and site shipped in a fresh archive.
  await page.locator('#appointment-client').selectOption('1');
  await page.locator('#appointment-site').selectOption('1');
  await page.locator('#appointment-category').selectOption('other');
  assert.equal(await page.locator('#appointment-policy').isVisible(),true,'Policy must become visible after client/site/subject selection');
  assert.equal(await page.locator('#appointment-notes').getAttribute('required'),'','Other work requires a description');
  await page.locator('#appointment-policy').selectOption('extraordinary');
  assert.equal(await page.locator('#appointment-fee').isEnabled(),true,'Extraordinary work must enable callout fee');
  assert.equal(await page.locator('#appointment-fee').inputValue(),'50.00','Extraordinary callout fee default changed');
  await page.locator('#appointment-policy').selectOption('quoted');
  assert.equal(await page.locator('#appointment-fee').isDisabled(),true,'Quoted work must disable callout fee');
  assert.equal(await page.locator('#appointment-fee').inputValue(),'0.00','Quoted work must clear callout fee');
  await page.locator('#appointment-cancel').click();
  console.log('OK: Empty-archive client-first wizard and ordinary/extraordinary/quoted fee policies');
  // End-to-end synthetic appointment: save, verify encryption, reload and recover.
  const operatorId=await page.evaluate(()=>{
    const id=Math.max(0,...window.ITE.snapshot().clienti.map(p=>p.id))+1;
    window.ITE.commit(next=>next.clienti.push({id,kind:'Dipendente',roles:['Dipendente'],name:'[TEST] Tecnico Chromium'}));
    return String(id);
  });
  await page.locator('#agenda-new').click();
  await page.locator('#appointment-client').selectOption('1');
  await page.locator('#appointment-site').selectOption('1');
  await page.locator('#appointment-category').selectOption('other');
  await page.locator('#appointment-notes').fill('[TEST] Verifica appuntamento sintetico');
  await page.locator('#appointment-start').fill('2026-11-16T10:00');
  await page.locator('#appointment-duration').fill('60');
  await page.locator('#appointment-primary').selectOption(operatorId);
  await page.locator('#appointment-policy').selectOption('extraordinary');
  await page.locator('#appointment-form button[type="submit"]').click();
  const persisted=await page.evaluate(()=>{
    const jobs=window.ITE.snapshot().interventi;
    const job=jobs.find(j=>j.description==='[TEST] Verifica appuntamento sintetico');
    return {job,raw:localStorage.getItem('ite_307_demo_ipad_v1')};
  });
  assert.ok(persisted.job,'Synthetic appointment was not saved');
  assert.equal(persisted.job.client_id,'1');
  assert.equal(persisted.job.immobile_id,'1');
  assert.equal(persisted.job.technician_id,operatorId);
  assert.equal(persisted.job.callout_fee,'50.00');
  assert.ok(persisted.raw&&!persisted.raw.includes('Verifica appuntamento sintetico'),'Appointment stored in cleartext');
  // Exercise the full client -> site -> equipment path with the same synthetic operator.
  await page.locator('#agenda-new').click();
  await page.locator('#appointment-client').selectOption('1');
  await page.locator('#appointment-site').selectOption('1');
  await page.locator('#appointment-category').selectOption('category:Caldaia');
  await page.locator('#appointment-device').selectOption('1');
  await page.locator('#appointment-notes').fill('[TEST] Manutenzione caldaia sintetica');
  await page.locator('#appointment-start').fill('2026-11-16T12:00');
  await page.locator('#appointment-primary').selectOption(operatorId);
  await page.locator('#appointment-form button[type="submit"]').click();
  const equipmentJob=await page.evaluate(()=>window.ITE.snapshot().interventi.find(j=>j.description==='[TEST] Manutenzione caldaia sintetica'));
  assert.ok(equipmentJob,'Equipment appointment was not saved');
  assert.equal(equipmentJob.target_type,'apparecchiature');
  assert.equal(equipmentJob.target_id,'1');
  assert.equal(equipmentJob.apparecchiatura_id,'1');
  assert.equal(equipmentJob.client_id,'1');
  assert.equal(equipmentJob.immobile_id,'1');
  assert.equal(equipmentJob.callout_fee,'0.00','Ordinary equipment appointment unexpectedly charged callout');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  const restored=await page.evaluate(()=>window.ITE.snapshot().interventi.find(j=>j.description==='[TEST] Verifica appuntamento sintetico'));
  assert.ok(restored,'Synthetic appointment disappeared after encrypted archive reload');
  assert.equal(restored.id,persisted.job.id,'Appointment ID changed after reload');
  const equipmentRestored=await page.evaluate(()=>window.ITE.snapshot().interventi.find(j=>j.description==='[TEST] Manutenzione caldaia sintetica'));
  assert.ok(equipmentRestored,'Equipment appointment disappeared after encrypted archive reload');
  assert.equal(equipmentRestored.id,equipmentJob.id,'Equipment appointment ID changed after reload');
  assert.deepEqual(errors,[],'Browser errors during synthetic appointment persistence: '+errors.join(' | '));
  console.log('OK: Synthetic appointment saves with correct links, remains encrypted, and survives reload');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
