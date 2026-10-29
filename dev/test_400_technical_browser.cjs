'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),root=path.resolve(process.argv[2]||'.');
const browserType=process.env.ITE_TEST_BROWSER==='webkit'?webkit:chromium;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{try{const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(target!==root&&!target.startsWith(root+path.sep))throw Error('outside root');const file=fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).on('error',()=>{if(!res.headersSent)res.writeHead(404);res.end()}).pipe(res)}catch{res.writeHead(404);res.end('Not found')}});
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await browserType.launch({headless:true});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.locator('#vault-password').fill('ITE-TECH-TEST-ONLY-2026!');
 await page.locator('#vault-confirm').fill('ITE-TECH-TEST-ONLY-2026!');
 await page.locator('#vault-submit').click();
 await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
 await page.evaluate(()=>ITERouter.show('importazioni','push'));
 assert.equal(await page.locator('#technical-drafts-panel').isVisible(),true);
 await page.evaluate(()=>ITECommerce.ready);
 await page.waitForFunction(()=>!ITECommerce.busy(),{timeout:30000});
 await page.evaluate(async()=>{
  const raw=new TextEncoder().encode('ORIGINALE TECNICO FITTIZIO: NESSUNA FIRMA O PROVA');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const fileId='file_'+hash;
  await ITECommerce.mutate(next=>{
   next.files.push({id:fileId,base64:btoa(String.fromCharCode(...raw)),size:raw.length,hash});
   next.documents.push({id:'doc_tech_test',type:'Di.Co. elettrica',fileId,clientId:'1',propertyId:'1',siteId:'',lines:[],number:'DICO-ORIG-TEST-007',sourceName:'dico_fittizia.txt',date:'2026-10-28'});
  });
 });
 await page.locator('#tech-new').click();
 await page.locator('#tech-form [name="type"]').selectOption('Di.Co. elettrica');
 await page.locator('#tech-form [name="clientId"]').selectOption('1');
 await page.locator('#tech-form [name="propertyId"]').selectOption('1');
 await page.locator('#tech-form [name="plantId"]').selectOption('1');
 await page.locator('#tech-form [name="deviceId"]').selectOption('1');
 await page.locator('[data-tech-doc][value="doc_tech_test"]').check();
 await page.locator('#tech-original-reference').click();
 assert.equal(await page.locator('#tech-form [name="reference"]').inputValue(),'DICO-ORIG-TEST-007');
 await page.locator('#tech-form [name="reference"]').fill('DICO-TEST-001');
 await page.locator('#tech-form [name="scope"]').fill('Impianto elettrico sintetico');
 await page.locator('#tech-form [name="materials"]').fill('Materiali fittizi');
 await page.locator('#tech-form [name="checks"]').fill('Verifiche da documentare: nessun esito attestato');
 assert.equal(await page.locator('[data-tech-section]').count(),4);
 await page.locator('[data-tech-detail="committente"]').fill('Committente TEST fittizio');
 await page.locator('[data-tech-detail="indirizzoImpianto"]').fill('Via Prova 10, Bologna');
 await page.locator('[data-tech-section]').nth(1).locator('summary').click();
 await page.locator('[data-tech-detail="impresaEsecutrice"]').fill('Impresa TEST sintetica');
 await page.locator('[data-tech-section]').nth(2).locator('summary').click();
 await page.locator('[data-tech-detail="descrizioneImpianto"]').fill('Circuiti elettrici fittizi');
 await page.locator('[data-tech-check]').first().selectOption('Documentato');
 await page.locator('[data-tech-evidence]').first().fill('Schema sintetico fittizio TEST-001');
 await page.locator('[data-tech-source]').first().selectOption('doc_tech_test');
 await page.locator('#tech-form button[type="submit"]').click();
 await page.waitForFunction(()=>ITECommerce.snapshot().settings.technicalDrafts?.length===1,{timeout:30000});
 const first=await page.evaluate(async()=>({draft:ITECommerce.snapshot().settings.technicalDrafts[0],backups:(await ITEHistory.list()).map(x=>x.reason),saved:(await ITEBackup.pack()).commerce.settings.technicalDrafts.length}));
 assert.equal(first.draft.type,'Di.Co. elettrica');assert.equal(first.draft.structured.committente,'Committente TEST fittizio');assert.equal(first.draft.structured.descrizioneImpianto,'Circuiti elettrici fittizi');assert.equal(first.draft.checklistEvidence['Schema impianto'].status,'Documentato');assert.equal(first.draft.checklistEvidence['Schema impianto'].evidence,'Schema sintetico fittizio TEST-001');assert.equal(first.draft.checklistEvidence['Schema impianto'].documentId,'doc_tech_test');assert.deepEqual(first.draft.linkedDocIds,['doc_tech_test']);assert.equal(first.draft.revision,1);assert.equal(first.draft.propertyId,'1');assert.equal(first.draft.plantId,'1');assert.equal(first.saved,1);assert(first.backups.includes('Prima revisione pratica tecnica'));
 await page.locator('[data-tech-edit]').first().click();
 await page.locator('#tech-form [name="notes"]').fill('Revisione sintetica n. 2');
 await page.locator('#tech-form button[type="submit"]').click();
 await page.waitForFunction(()=>ITECommerce.snapshot().settings.technicalDrafts?.[0]?.revision===2,{timeout:30000});
 const second=await page.evaluate(()=>ITECommerce.snapshot().settings.technicalDrafts[0]);
 assert.equal(second.structured.committente,'Committente TEST fittizio');assert.equal(second.checklistEvidence['Schema impianto'].status,'Documentato');assert.equal(second.checklistEvidence['Schema impianto'].documentId,'doc_tech_test');assert.equal(second.history.length,1);assert.equal(second.history[0].action,'REVISIONE');assert.equal(second.history[0].before.revision,1);
 const downloadPromise=page.waitForEvent('download');
 await page.locator('[data-tech-print]').first().click();
 const download=await downloadPromise;assert.match(download.suggestedFilename(),/^ITE_BOZZA_/);
 const printText=fs.readFileSync(await download.path(),'utf8');assert.match(printText,/NON VALIDA · NON FIRMATA/);assert.match(printText,/Schema sintetico fittizio TEST-001/);assert.match(printText,/Committente TEST fittizio/);assert.match(printText,/Circuiti elettrici fittizi/);assert.match(printText,/Registro originali tecnici collegati/);assert.match(printText,/DICO-ORIG-TEST-007/);assert.match(printText,/dico_fittizia\.txt/);assert.match(printText,/Cliente dimostrativo/);
 
 // Una seconda pratica POS usa lo stesso archivio, senza alterare la Di.Co. salvata.
 await page.locator('#tech-new').click();
 await page.locator('#tech-form [name="type"]').selectOption('POS');
 assert.equal(await page.locator('[data-tech-section]').count(),12,'POS must expose twelve guided sections');
  assert.match(await page.locator('#tech-pos-nav').innerText(),/sezione 1 di 12/);
  await page.locator('[data-pos-next]').click();
  assert.match(await page.locator('#tech-pos-nav').innerText(),/sezione 2 di 12/);
  await page.locator('[data-pos-prev]').click();
 await page.locator('#tech-form [name="clientId"]').selectOption('1');
 await page.locator('#tech-form [name="propertyId"]').selectOption('1');
 await page.locator('#tech-form [name="reference"]').fill('POS-TEST-001');
 await page.locator('[data-tech-detail="cantiere"]').fill('Cantiere sintetico Bologna');
 await page.locator('[data-tech-detail="inizioLavori"]').fill('2026-10-29');
 await page.locator('[data-tech-section]').nth(7).locator('summary').click();
 await page.locator('[data-tech-detail="rischi"]').fill('Rischi fittizi da verificare');
 await page.locator('#tech-form button[type="submit"]').click();
 await page.waitForFunction(()=>ITECommerce.snapshot().settings.technicalDrafts?.length===2,{timeout:30000});
 const pos=await page.evaluate(async()=>({draft:ITECommerce.snapshot().settings.technicalDrafts.find(x=>x.type==='POS'),backup:(await ITEBackup.pack()).commerce.settings.technicalDrafts.length}));
 assert.equal(pos.draft.structured.cantiere,'Cantiere sintetico Bologna');
 assert.equal(pos.draft.structured.inizioLavori,'2026-10-29');
 assert.equal(pos.draft.structured.rischi,'Rischi fittizi da verificare');
 assert.equal(pos.backup,2,'Full backup lost one of the technical drafts');
  await page.locator('[data-tech-review]').last().click();
  assert.match(await page.locator('#tech-review-overlay').innerText(),/12 blocchi/);
  assert.match(await page.locator('#tech-review-overlay').innerText(),/controlli aperti/);
  await page.locator('#tech-review-close').click();


 // Collegamento da intervento fittizio: cliente, sede, impianto, apparecchio e dati suggeriti.
 await page.evaluate(()=>{
  ITE.commit(db=>{
   db.immobili[0].pdr='PDR-FITTIZIO-001';
   db.interventi.push({id:901,apparecchiatura_id:'1',client_id:'1',immobile_id:'1',date:'2026-10-29',kind:'Installazione',description:'Posa sintetica verificabile',outcome:'Completato'});
  });
  ITETechnicalDrafts.openFor({clientId:'1',propertyId:'1',plantId:'1',deviceId:'1',interventionId:'901'});
 });
 assert.equal(await page.locator('#tech-form [name="interventionId"]').inputValue(),'901');
 assert.equal(await page.locator('#tech-form [name="plantId"]').inputValue(),'1');
 assert.equal(await page.locator('[data-tech-detail="committente"]').inputValue(),'Cliente dimostrativo');
 assert.match(await page.locator('[data-tech-detail="indirizzoImpianto"]').inputValue(),/Via Esempio 10/);
 assert.equal(await page.locator('#tech-form [name="pdr"]').inputValue(),'PDR-FITTIZIO-001');
 assert.equal(await page.locator('#tech-form [name="scope"]').inputValue(),'Posa sintetica verificabile');
 await page.locator('#tech-form [name="reference"]').fill('DICO-LINK-TEST-001');
 await page.locator('#tech-form button[type="submit"]').click();
 await page.waitForFunction(()=>ITECommerce.snapshot().settings.technicalDrafts?.length===3,{timeout:30000});
 const linked=await page.evaluate(()=>ITECommerce.snapshot().settings.technicalDrafts.find(x=>x.fields.reference==='DICO-LINK-TEST-001'));
 assert.equal(linked.interventionId,'901');
 assert.equal(linked.structured.committente,'Cliente dimostrativo');
 assert.equal(linked.structured.pdrVerificato,undefined);


 // Originale tecnico fittizio: conferma selettiva e tracciabilità.
 await page.evaluate(async()=>{
  const raw=new TextEncoder().encode('ORIGINALE FITTIZIO DI.CO.');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(x=>x.toString(16).padStart(2,'0')).join('');
  await ITECommerce.mutate(next=>{
   next.files.push({id:'file_'+hash,base64:btoa(String.fromCharCode(...raw)),size:raw.length,hash});
   next.documents.push({id:'doc_tech_prefill',type:'Di.Co. elettrica',fileId:'file_'+hash,clientId:'1',propertyId:'1',siteId:'',lines:[],number:'DICO-TEST-55',sourceName:'originale_prefill_fittizio.txt',text:'Committente: Mario Fittizio\nUbicazione impianto: Via Prova 20\nImpresa esecutrice: Impresa TEST\nDescrizione lavori: Circuito sintetico\nProve e verifiche: SUPERATE'});
  });
 });
 await page.locator('#tech-new').click();
 await page.locator('#tech-form [name="clientId"]').selectOption('1');
 await page.locator('#tech-form [name="propertyId"]').selectOption('1');
 await page.locator('[data-tech-detail="committente"]').fill('');
 await page.locator('[data-tech-doc][value="doc_tech_prefill"]').check();
 await page.locator('#tech-original-proposals').click();
 await page.locator('[data-tech-proposal]').first().waitFor();
 assert((await page.locator('[data-tech-proposal]').count())>=3);
 await page.locator('[data-tech-proposal]').first().check();
 await page.locator('#tech-apply-proposals').click();
 assert.equal(await page.locator('[data-tech-detail="committente"]').inputValue(),'Mario Fittizio');
 assert.equal(await page.locator('#tech-form [name="checks"]').inputValue(),'','Original text must not certify checks');
 await page.locator('#tech-form button[type="submit"]').click();
 await page.waitForFunction(()=>ITECommerce.snapshot().settings.technicalDrafts?.length===4,{timeout:30000});
 const saved=await page.evaluate(async()=>({draft:ITECommerce.snapshot().settings.technicalDrafts.find(x=>x.originalPrefill?.['detail:committente']?.documentId==='doc_tech_prefill'),backup:(await ITEBackup.pack()).commerce.settings.technicalDrafts}));
 assert.equal(saved.draft.originalPrefill['detail:committente'].value,'Mario Fittizio');
 assert.deepEqual(saved.draft.linkedDocIds,['doc_tech_prefill']);
 assert(saved.backup.some(x=>x.id===saved.draft.id&&x.originalPrefill?.['detail:committente']?.documentId==='doc_tech_prefill'));


 // Registro e fascicolo: filtri coerenti, storico revisioni e download solo locale.
 await page.locator('#tech-filter-client').selectOption('1');
 await page.locator('#tech-filter-type').selectOption('POS');
 assert.equal(await page.locator('[data-tech-edit]').count(),1);
 await page.locator('#tech-filter-type').selectOption('');
 assert.equal(await page.locator('[data-tech-edit]').count(),4);
 await page.locator('[data-tech-history]').first().click();
 assert.equal(await page.locator('#tech-history-overlay').isVisible(),true);
 assert.match(await page.locator('#tech-history-overlay').innerText(),/Revisione 1 → 2/);
 await page.locator('#tech-history-close').click();
 const dossierDownload=page.waitForEvent('download');
 await page.locator('#tech-dossier').click();
 const dossier=await dossierDownload;
 assert.match(dossier.suggestedFilename(),/^ITE_FASCICOLO_BOZZA_/);
 const dossierText=fs.readFileSync(await dossier.path(),'utf8');
 assert.match(dossierText,/FASCICOLO TECNICO DI LAVORO/);
 assert.match(dossierText,/POS-TEST-001/);
 assert.match(dossierText,/DICO-TEST-001/);
 assert.match(dossierText,/originale_prefill_fittizio\.txt/);
 assert.match(dossierText,/NON VALIDO/);
 assert.equal((await page.evaluate(()=>ITECommerce.snapshot().settings.technicalDrafts)).length,4);
 await page.locator('#tech-filter-client').selectOption('');
 await page.locator('#tech-dossier').click();
 assert.match(await page.locator('#tech-status').innerText(),/Seleziona un cliente specifico/);

 assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
 console.log('OK: technical Di.Co. structured fields, POS 12 sections, encrypted persistence, backup, revision history and non-official printable draft');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
