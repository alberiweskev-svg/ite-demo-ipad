'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const browserName=process.env.ITE_TEST_BROWSER==='webkit'?'WebKit':'Chromium';
const browserType=browserName==='WebKit'?webkit:chromium;
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
 const browser=await browserType.launch({headless:true});
 try{
  const context=await browser.newContext();
  let page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Separate Safari-engine tab close/reopen from the currently failing reload path.
  async function reopenTab(){
    await page.close();
    page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
    await page.locator('#vault-submit').click({noWaitAfter:true});
    await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  }
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  assert.equal(response.status(),200);
  assert.equal(await page.locator('#vault-gate').count(),1,'Missing encrypted entry screen');
  assert.equal(await page.locator('#app-shell').count(),1,'Missing application shell');
  assert.equal(await page.locator('#vault-gate').isVisible(),true,'Encrypted entry screen not visible');
  assert.equal(await page.locator('#app-shell').isVisible(),false,'Application shell must remain locked');
  // Regression: the tablet layout uses display:block!important on #app-shell.
  // Its [hidden] state must win in portrait, landscape, and desktop modes.
  for(const [width,height] of [[768,1024],[1024,768],[1280,800]]){
    await page.setViewportSize({width,height});
    assert.equal(await page.locator('#app-shell').evaluate(el=>getComputedStyle(el).display),'none',
      'Locked archive content visible at '+width+'x'+height);
  }
  console.log('OK: Locked archive remains visually hidden on iPad portrait, landscape and desktop');
  assert.deepEqual(errors,[],'Browser runtime errors: '+errors.join(' | '));
  console.log('OK: '+browserName+' loads encrypted entry screen and keeps app locked');
  // Use only synthetic credentials and a fresh, isolated browser profile.
  await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-confirm').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.locator('#vault-gate').isVisible(),false,'Vault gate remains visible after unlock');
  assert.deepEqual(errors,[],'Runtime errors after unlock: '+errors.join(' | '));
  console.log('OK: '+browserName+' creates a test vault and opens the application shell');
  // A second tab in the same browser profile must never unlock the same
  // encrypted archive concurrently: it could otherwise overwrite newer work.
  const concurrentTab=await context.newPage();
  try{
    const concurrentErrors=[];
    concurrentTab.on('pageerror',e=>concurrentErrors.push(e.message));
    await concurrentTab.goto(url,{waitUntil:'networkidle',timeout:30000});
    await concurrentTab.waitForFunction(
      ()=>document.getElementById('vault-message').textContent.includes('già aperto in un’altra scheda'),
      {timeout:30000}
    );
    assert.equal(await concurrentTab.locator('#app-shell').isVisible(),false,
      'Concurrent tab exposed protected archive');
    assert.equal(await concurrentTab.locator('#vault-submit').isDisabled(),true,
      'Concurrent tab allowed vault unlock despite exclusive session');
    assert.deepEqual(concurrentErrors,[],'Concurrent-tab browser errors: '+concurrentErrors.join(' | '));
    assert.equal(await page.locator('#app-shell').isVisible(),true,
      'Rejected concurrent tab interrupted the active operator');
    console.log('OK: Second browser tab is denied concurrent encrypted archive access');
  }finally{await concurrentTab.close()}
  const testKey='ite_307_demo_ipad_v1_smoke_check';
  const testValue='SYNTHETIC_BROWSER_TEST_VALUE';
  const encrypted=await page.evaluate(([key,value])=>{
    window.ITEVault.storage.setItem(key,value);
    return localStorage.getItem(key);
  },[testKey,testValue]);
  assert.ok(encrypted,'Encrypted test value was not stored');
  assert.ok(!encrypted.includes(testValue),'Sensitive value was stored in cleartext');
  // Verify the real manual-lock transition while the tablet layout is active.
  await page.setViewportSize({width:768,height:1024});
  await page.locator('#vault-lock').click();
  await page.locator('#vault-gate').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('#app-shell').isVisible(),false,'App visible after vault lock');
  assert.equal(await page.locator('#app-shell').evaluate(el=>getComputedStyle(el).display),'none',
    'Manual lock left the app shell visible on iPad portrait');
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#vault-password').fill('WRONG-SYNTHETIC-PASSWORD');
  await page.locator('#vault-submit').click();
  await page.waitForFunction(()=>/Password errata o archivio danneggiato|Password non valida/.test(document.getElementById('vault-message').textContent),{timeout:30000});
  assert.equal(await page.locator('#app-shell').isVisible(),false,'Wrong password unlocked archive');
  await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
  // La riapertura puo' ricaricare la pagina: attendere lo stato visibile, non il navigation event.
  await page.locator('#vault-submit').click({noWaitAfter:true});
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
  console.log('OK: '+browserName+' navigates clients, calendar, worksites, warehouse, and imports');
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
  // WebKit Linux is a Safari-engine compatibility smoke check, not an iPad device test.
  // Its full attachment/reload E2E currently crashes the WebKit test page after
  // a synthetic camera upload. Keep that scenario under Chromium regression
  // until the WebKit crash is investigated; do not report it as WebKit-tested.
  if(process.env.ITE_TEST_BROWSER==='webkit'&&!process.env.ITE_TEST_WEBKIT_CAMERA_FULL){
    console.log('OK: WebKit vault, encryption, concurrent-tab lock and tablet navigation (attachment reload NOT tested)');
    return;
  }
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
  await page.locator('#app-nav a[href="#calendario"]').first().evaluate(element=>element.click());
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
  // Operative workflow: assigned technician records arrival and departure.
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#app-nav a[href="#calendario"]').first().evaluate(element=>element.click());
  await page.locator('#agenda-actor').selectOption(operatorId);
  await page.locator('#agenda-date').fill('2026-11-16');
  await page.locator('#agenda-date').dispatchEvent('change');
  await page.locator('[data-agenda-open="'+equipmentJob.id+'"]').first().click();
  const startButton=page.locator('[data-agenda-start="'+equipmentJob.id+'"]').first();
  await startButton.waitFor({state:'visible',timeout:10000});
  await startButton.click();
  const afterArrival=await page.evaluate(id=>window.ITE.snapshot().interventi.find(j=>j.id===id),equipmentJob.id);
  assert.equal(afterArrival.workflow_status,'In corso','Arrival did not start intervention');
  assert.equal(JSON.parse(afterArrival.work_sessions).length,1,'Arrival did not create technician session');
  assert.equal(JSON.parse(afterArrival.work_sessions)[0].operator_id,operatorId,'Wrong technician in arrival session');
  await page.locator('[data-agenda-finish="'+equipmentJob.id+'"]').first().click();
  const afterDeparture=await page.evaluate(id=>window.ITE.snapshot().interventi.find(j=>j.id===id),equipmentJob.id);
  assert.equal(afterDeparture.workflow_status,'Chiuso','Departure did not close intervention');
  assert.ok(JSON.parse(afterDeparture.work_sessions)[0].departed_at,'Departure timestamp missing');
  assert.deepEqual(errors,[],'Browser errors during intervention workflow: '+errors.join(' | '));
  console.log('OK: Assigned technician records arrival, session and departure on equipment appointment');
  // A revision must retain the first closure and create a distinct work session.
  await page.locator('[data-agenda-revise="'+equipmentJob.id+'"]').first().click();
  const afterRevision=await page.evaluate(id=>window.ITE.snapshot().interventi.find(j=>j.id===id),equipmentJob.id);
  assert.equal(afterRevision.workflow_status,'In corso','Revision did not reopen intervention');
  assert.equal(JSON.parse(afterRevision.work_sessions).length,2,'Revision did not create a second session');
  assert.ok(JSON.parse(afterRevision.revision_audit).some(e=>e.action==='RIAPERTURA_REVISIONE'&&e.previous_closed_at===afterDeparture.finished_at),'First closure missing from revision audit');
  await page.locator('[data-agenda-finish="'+equipmentJob.id+'"]').first().click();
  const afterSecondClosure=await page.evaluate(id=>window.ITE.snapshot().interventi.find(j=>j.id===id),equipmentJob.id);
  assert.equal(afterSecondClosure.workflow_status,'Chiuso','Revision did not close');
  assert.ok(JSON.parse(afterSecondClosure.revision_audit).some(e=>e.action==='CHIUSURA_DOPO_REVISIONE'),'Second closure not audited');
  assert.equal(JSON.parse(afterSecondClosure.work_sessions).length,2,'Historical session lost after revision');
  // Isolate whether WebKit navigation fails even BEFORE any document is saved.
  // Diagnostic only: no synthetic attachments exist at this checkpoint.
  if(process.env.ITE_TEST_BROWSER==='webkit'&&process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='4'){
    console.log('DIAGNOSTIC: WebKit direct reload after intervention revision, before attachments');
    console.log('DIAGNOSTIC: WebKit pre-reload state '+JSON.stringify(await page.evaluate(()=>({commerceBusy:window.ITECommerce?.busy?.(),warehouseEditorHidden:document.getElementById('warehouse-editor')?.hidden,docsSaving:window.ITEDocs?.isSaving?.(),backupBusy:window.ITEBackup?.busy?.()}))));
    await page.reload({waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
    await page.locator('#vault-submit').click({noWaitAfter:true});
    await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
    const recovered=await page.evaluate(id=>window.ITE.snapshot().interventi.find(j=>j.id===id),equipmentJob.id);
    assert.equal(recovered?.workflow_status,'Chiuso','Revision disappeared on pre-attachment WebKit reload');
    assert.deepEqual(errors,[],'WebKit runtime errors before attachments: '+errors.join(' | '));
    console.log('DIAGNOSTIC: WebKit pre-attachment reload and revision recovery passed');
    return;
  }
  // Attach a synthetic document to the intervention and ensure revisions never sever its link.
  // Both fixtures must contain complete PNG data. A four-byte PNG signature
  // is not a valid image and can obscure WebKit navigation crash diagnostics.
  const sampleBytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNUTZnGwMDAxMDAwMDAAAANLQEjE3xxwgAAAABJRU5ErkJggg==','base64');
  assert.ok(sampleBytes.length>40,'Synthetic photo fixture must be a complete PNG');
  const docId='test-revision-attachment';
  await page.evaluate(async ({id,jobId,bytes})=>{
    const docs=await window.ITEDocs.listDocs();
    docs.push({id,type:'Fotografia tecnica',parentType:'interventi',parentId:String(jobId),subjectId:'1',siteId:'',date:'2026-11-16',expires:'',number:'',note:'[TEST] Allegato revisione',fileName:'test-revisione.png',size:bytes.length,mime:'image/png',created:Date.now(),fileBytes:new Uint8Array(bytes).buffer});
    await window.ITEDocs.replaceDocs(docs);
  },{id:docId,jobId:equipmentJob.id,bytes:Array.from(sampleBytes)});
  // Simulate a photo selected through the real file input (synthetic bytes only).
  await page.locator('#app-nav a[href="#documenti"]').first().evaluate(element=>element.click());
  await page.locator('#documenti button[onclick="ITEDocs.showForm()"]').click();
  await page.locator('#docs-parent-type').selectOption('interventi');
  await page.locator('#docs-parent-id').selectOption(String(equipmentJob.id));
  await page.locator('#docs-note').fill('[TEST] Foto selettore');
  await page.locator('#docs-file').setInputFiles({name:'test-upload.png',mimeType:'image/png',buffer:sampleBytes});
  await page.locator('#docs-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.getElementById('docs-feedback').textContent.includes('salvati e verificati'),{timeout:30000});
  const photoBefore=await page.evaluate(async()=>{const doc=(await window.ITEDocs.listDocs()).find(d=>d.fileName==='test-upload.png');return doc?{id:doc.id,parentId:doc.parentId,bytes:Array.from(new Uint8Array(doc.fileBytes))}:null});
  assert.ok(photoBefore,'Uploaded synthetic photo missing');
  assert.equal(String(photoBefore.parentId),String(equipmentJob.id));
  assert.deepEqual(Buffer.from(photoBefore.bytes),sampleBytes);
  console.log('OK: Synthetic photo saved through upload form with verified bytes');
  // Diagnostic only: distinguish the first attachment reload from the later camera reload.
  if(process.env.ITE_TEST_BROWSER==='webkit'&&['1','2','3'].includes(process.env.ITE_TEST_WEBKIT_CAMERA_FULL)){
    const closeReopen=process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='2';
    const sameTabNavigation=process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='3';
    const navigationLabel=closeReopen?'tab close/reopen':sameTabNavigation?'same-tab goto':'reload';
    console.log('DIAGNOSTIC: WebKit '+navigationLabel+' after first synthetic photo, before camera input');
    if(closeReopen)await reopenTab();
    else {
      if(sameTabNavigation)await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      else await page.reload({waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
      await page.locator('#vault-submit').click({noWaitAfter:true});
      await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
    }
    const checkpoint=await page.evaluate(async id=>(await window.ITEDocs.listDocs()).some(d=>d.id===id),photoBefore.id);
    assert.equal(checkpoint,true,'First synthetic photo missing after WebKit reload');
    console.log('DIAGNOSTIC: WebKit first-photo '+navigationLabel+' and encrypted reopen passed');
    await page.locator('#app-nav a[href="#documenti"]').first().evaluate(element=>element.click());
  }
  // Simulate the dedicated iPad camera input using synthetic image bytes (no real camera access).
  await page.locator('#documenti button[onclick="ITEDocs.showForm()"]').click();
  await page.locator('#docs-parent-type').selectOption('interventi');
  await page.locator('#docs-parent-id').selectOption(String(equipmentJob.id));
  // Use a valid 1x1 PNG: a four-byte JPEG marker is not a decodable camera image.
  const cameraBytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2dWW0AAAAASUVORK5CYII=','base64');
  await page.locator('#docs-camera').setInputFiles({name:'camera-test.png',mimeType:'image/png',buffer:cameraBytes});
  assert.equal(await page.locator('#docs-file').evaluate(el=>el.required),false,'Camera selection should allow form submission without picker file');
  await page.locator('#docs-form button[type="submit"]').click();
  await page.locator('#docs-form').waitFor({state:'hidden',timeout:30000});
  assert.equal(await page.locator('#docs-file').evaluate(el=>el.required),true,'Picker required state must reset after saving');
  const cameraBefore=await page.evaluate(async()=>{const doc=(await window.ITEDocs.listDocs()).find(d=>d.fileName==='camera-test.png');return doc?{id:doc.id,parentId:doc.parentId,bytes:Array.from(new Uint8Array(doc.fileBytes))}:null});
  assert.ok(cameraBefore,'Synthetic camera photo was not saved');
  assert.equal(String(cameraBefore.parentId),String(equipmentJob.id));
  assert.deepEqual(Buffer.from(cameraBefore.bytes),cameraBytes);
  console.log('OK: Dedicated camera input stores synthetic photo and restores form validation');
  const docsBefore=await page.evaluate(()=>window.ITEDocs.listDocs());
  assert.ok(docsBefore.some(d=>d.id===docId&&d.parentType==='interventi'&&d.parentId===String(equipmentJob.id)),'Synthetic document not linked to intervention');
  if(process.env.ITE_TEST_BROWSER==='webkit'&&process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='2')await reopenTab();
  else {
    if(process.env.ITE_TEST_BROWSER==='webkit'&&process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='3')await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    else await page.reload({waitUntil:process.env.ITE_TEST_BROWSER==='webkit'?'domcontentloaded':'networkidle',timeout:30000});
    await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
    await page.locator('#vault-submit').click();
    await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  }
  const docsAfter=await page.evaluate(()=>window.ITEDocs.listDocs());
  assert.ok(docsAfter.some(d=>d.id===docId&&d.parentId===String(equipmentJob.id)&&d.note==='[TEST] Allegato revisione'),'Document disappeared or lost intervention link after encrypted reload');
  const photoAfter=await page.evaluate(async id=>{const doc=(await window.ITEDocs.listDocs()).find(d=>d.id===id);return doc?{parentId:doc.parentId,bytes:Array.from(new Uint8Array(doc.fileBytes))}:null},photoBefore.id);
  assert.ok(photoAfter,'Uploaded photo missing after vault reload');
  assert.deepEqual(Buffer.from(photoAfter.bytes),sampleBytes);
  assert.equal(String(photoAfter.parentId),String(equipmentJob.id));
  const cameraAfter=await page.evaluate(async id=>{const doc=(await window.ITEDocs.listDocs()).find(d=>d.id===id);return doc?{parentId:doc.parentId,bytes:Array.from(new Uint8Array(doc.fileBytes))}:null},cameraBefore.id);
  assert.ok(cameraAfter,'Camera photo missing after encrypted vault reload');
  assert.equal(String(cameraAfter.parentId),String(equipmentJob.id));
  assert.deepEqual(Buffer.from(cameraAfter.bytes),cameraBytes);
  console.log('OK: Dedicated camera photo survives encrypted vault '+(process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='2'?'tab close/reopen':process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='3'?'same-tab goto':'reload')+' with correct intervention link');
  // Historical files must not be deleted after the intervention is closed.
  const retained=await page.evaluate(async id=>{
    await window.ITEDocs.remove(id);
    const doc=(await window.ITEDocs.listDocs()).find(d=>d.id===id);
    return {bytes:doc?Array.from(new Uint8Array(doc.fileBytes)):null,feedback:document.getElementById('docs-feedback').textContent};
  },photoBefore.id);
  assert.ok(retained.bytes,'Closed intervention attachment was deleted');
  assert.deepEqual(Buffer.from(retained.bytes),sampleBytes,'Historical attachment bytes changed after blocked deletion');
  assert.match(retained.feedback,/Eliminazione non riuscita: Intervento chiuso/,'Closed intervention deletion was not explicitly blocked');
  console.log('OK: Closed intervention retains uploaded photo when deletion is attempted');
  if(process.env.ITE_TEST_BROWSER==='webkit'&&process.env.ITE_TEST_WEBKIT_CAMERA_FULL==='2'){
    assert.deepEqual(errors,[],'WebKit browser errors during attachment close/reopen: '+errors.join(' | '));
    console.log('OK: WebKit close/reopen preserves both synthetic photos and their intervention links; page.reload remains a separate known issue');
    return;
  }
  // Lock an unattended, unlocked archive even when an unsaved form is open.
  await page.locator('#app-nav a[href="#calendario"]').first().evaluate(el=>el.click());
  await page.locator('#agenda-new').click();
  assert.equal(await page.locator('#appointment-form').isVisible(),true,'Synthetic appointment form did not open');
  await page.evaluate(()=>{
    // Simulate a real background-tab visibility change: unrelated foreground
    // handlers must not run during the idle-lock check.
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
    const now=Date.now();
    Date.now=()=>now+5*60*60*1000;
    setTimeout(()=>document.dispatchEvent(new Event('visibilitychange')),50);
  });
  await page.locator('#vault-gate').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('#app-shell').isVisible(),false,'Idle timeout left sensitive data visible behind an open form');
  await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-submit').click({noWaitAfter:true});
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  const photoAfterIdle=await page.evaluate(async id=>{
    const d=(await window.ITEDocs.listDocs()).find(row=>row.id===id);
    return d?Array.from(new Uint8Array(d.fileBytes)):null;
  },photoBefore.id);
  assert.deepEqual(Buffer.from(photoAfterIdle||[]),sampleBytes,'Idle lock changed a committed attachment');
  console.log('OK: Four-hour inactivity locks an open form and preserves committed attachment bytes');
  // On a suspended iPad, the first touch can arrive before the minute timer
  // resumes. The touch must not reset an expired inactivity deadline.
  await page.evaluate(()=>{
    const now=Date.now();
    Date.now=()=>now+5*60*60*1000;
    setTimeout(()=>document.dispatchEvent(new Event('pointerdown',{bubbles:true})),50);
  });
  await page.locator('#vault-gate').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('#app-shell').isVisible(),false,'First touch after long suspension kept the archive unlocked');
  await page.locator('#vault-password').fill('ITE-4-Test-Only-2026!');
  await page.locator('#vault-submit').click({noWaitAfter:true});
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  const photoAfterTouchLock=await page.evaluate(async id=>{
    const d=(await window.ITEDocs.listDocs()).find(row=>row.id===id);
    return d?Array.from(new Uint8Array(d.fileBytes)):null;
  },photoBefore.id);
  assert.deepEqual(Buffer.from(photoAfterTouchLock||[]),sampleBytes,'Touch-triggered idle lock changed a committed attachment');
  console.log('OK: First touch after four-hour suspension locks the vault and preserves committed photo');

  console.log('OK: Uploaded photo bytes and intervention link survive vault reload');
  assert.deepEqual(errors,[],'Browser errors during revision workflow: '+errors.join(' | '));
  console.log('OK: Revision retains first closure, adds second session and audits final closure');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
