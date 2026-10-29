'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),engine=process.env.ITE_TEST_BROWSER==='webkit'?webkit:chromium;
const root=path.resolve(process.argv[2]||'.');
const server=http.createServer((req,res)=>{try{
 const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(target!==root&&!target.startsWith(root+path.sep))throw Error('outside root');
 const file=fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
 res.setHeader('Content-Type',{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.wasm':'application/wasm'}[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).on('error',()=>{if(!res.headersSent)res.writeHead(404);res.end()}).pipe(res);
}catch{res.writeHead(404);res.end('Not found')}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#vault-password').fill('ITE-TECH-CROSSCHECK-TEST-2026!');
  await page.locator('#vault-confirm').fill('ITE-TECH-CROSSCHECK-TEST-2026!');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITECadWorkflow?.technicalSources&&!!window.ITETechnicalDrafts&&!ITECommerce.busy(),{timeout:30000});
  const ids=await page.evaluate(async()=>{
   const db=ITE.snapshot(),client=db.clienti[0],property=db.immobili.find(x=>String(x.client_id)===String(client.id));
   if(!client||!property)throw Error('Missing synthetic customer/property');
   const siteId=90061;
   ITE.commit(next=>next.cantieri.push({id:siteId,name:'Cantiere INCROCIO TEST',client_id:String(client.id),immobile_id:String(property.id)}));
   const article={id:'art_87654321',code:'ART-TEST-ASSIST',description:'Presa prova sintetica',unit:'pz',kind:'Materiale',price:15,priceRole:'cost'};
   const symbol=ITECad.make('symbol',{x:30,y:30},{x:30,y:30},'presa');
   const elements=ITECad.operate([symbol],'linkArticle',symbol.id,{articleId:article.id});
   const drawing={id:'cad_87654321',title:'Schema incrocio TEST',clientId:String(client.id),propertyId:String(property.id),siteId:String(siteId),plantId:'',updated:new Date().toISOString(),archived:false,revision:1,scaleCmPerUnit:2,elements,history:[]};
   const practice={id:'td_33333333-3333-4333-8333-333333333333',type:'Di.Co. elettrica',status:'Bozza',revision:1,history:[],clientId:String(client.id),propertyId:String(property.id),plantId:'',deviceId:'',siteId:String(siteId),interventionId:'',date:'',fields:{reference:'CROSS-TEST-1',materials:'Materiale manuale da conservare'},structured:{},checklistEvidence:{},linkedDocIds:[],created:new Date().toISOString(),updated:new Date().toISOString()};
   const links=ITECadWorkflow.addLink([],drawing,practice,crypto.randomUUID(),new Date().toISOString());
   await ITECommerce.mutate(next=>{next.articles.push(article);next.settings.cadDrawings=[...(next.settings.cadDrawings||[]),drawing];next.settings.technicalDrafts=[...(next.settings.technicalDrafts||[]),practice];next.settings.cadPracticeLinks=[...(next.settings.cadPracticeLinks||[]),...links]});
   return {practiceId:practice.id};
  });
  await page.evaluate(()=>{ITERouter.show('importazioni','push');ITETechnicalDrafts.render()});
  await page.locator('#tech-crosscheck-audit').waitFor({state:'visible',timeout:15000});
  await page.locator('#tech-filter-client').selectOption('1');
  await page.locator('#tech-crosscheck-audit').click();
  assert.match(await page.locator('#tech-crosscheck-report').innerText(),/pratiche analizzate/);
  await page.locator('[data-tech-edit="'+ids.practiceId+'"]').click();
  await page.locator('#tech-crosscheck').waitFor({state:'visible'});
  await page.locator('#tech-crosscheck button').first().click();
  assert.match(await page.locator('#tech-crosscheck').innerText(),/ART-TEST-ASSIST/);
  assert.equal(await page.locator('#tech-form [name="materials"]').inputValue(),'Materiale manuale da conservare');
  const checkbox=page.locator('#tech-crosscheck label').filter({hasText:'detail:materialiRiferimento'}).locator('input[type="checkbox"]');
  await checkbox.check();
  await page.getByRole('button',{name:'Applica solo le proposte selezionate'}).click();
  assert.match(await page.locator('[data-tech-detail="materialiRiferimento"]').inputValue(),/ART-TEST-ASSIST/);
  assert.equal(await page.locator('#tech-form [name="materials"]').inputValue(),'Materiale manuale da conservare');
  await page.locator('#tech-form button[type="submit"]').click();
  await page.waitForFunction(id=>ITECommerce.snapshot().settings.technicalDrafts.find(x=>x.id===id)?.revision===2,ids.practiceId,{timeout:30000});
  const result=await page.evaluate(async id=>{
   const d=ITECommerce.snapshot().settings.technicalDrafts.find(x=>x.id===id);
   return {d,backups:(await ITEHistory.list()).map(x=>x.reason),stock:ITECommerce.snapshot().movements.length};
  },ids.practiceId);
  assert.match(result.d.structured.materialiRiferimento,/ART-TEST-ASSIST/);
  assert.equal(result.d.fields.materials,'Materiale manuale da conservare');
  assert.equal(result.d.history.length,1);
  assert(result.backups.includes('Prima revisione pratica tecnica'));
  assert.equal(result.stock,0,'Crosscheck must not move warehouse stock');
  assert.deepEqual(errors,[]);
  console.log('OK: '+(process.env.ITE_TEST_BROWSER||'chromium')+' technical crosscheck from CAD, no overwrite, manual save, revision and backup');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
