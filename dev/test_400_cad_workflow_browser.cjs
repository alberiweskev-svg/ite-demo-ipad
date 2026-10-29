'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const engine=process.env.ITE_TEST_BROWSER==='webkit'?webkit:chromium;
const root=path.resolve(process.argv[2]||'.');
const server=http.createServer((req,res)=>{try{
 const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(target!==root&&!target.startsWith(root+path.sep))throw Error('Outside root');
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
  await page.locator('#vault-password').fill('ITE-CAD-QUOTE-TEST-2026!');
  await page.locator('#vault-confirm').fill('ITE-CAD-QUOTE-TEST-2026!');
  await page.locator('#vault-submit').click();
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  await page.waitForFunction(()=>!!window.ITECadWorkflow&&!!window.ITECommerce&&!ITECommerce.busy(),{timeout:30000});
  const fixture=await page.evaluate(async()=>{
   const core=ITE.snapshot(),client=core.clienti[0],property=core.immobili.find(x=>String(x.client_id)===String(client.id));
   if(!client||!property)throw Error('Synthetic client/property missing');
   const siteId=90001;
   ITE.commit(next=>next.cantieri.push({id:siteId,name:'Cantiere CAD TEST',client_id:String(client.id),immobile_id:String(property.id)}));
   const article={id:'art_12345678',code:'TEST-PRESA',description:'Presa sintetica',unit:'pz',price:50,kind:'Materiale',priceRole:'cost'};
   const symbol=ITECad.make('symbol',{x:20,y:20},{x:20,y:20},'presa');
   const elements=ITECad.operate([symbol],'linkArticle',symbol.id,{articleId:article.id});
   const drawing={id:'cad_12345678',title:'Disegno CAD TEST',clientId:String(client.id),propertyId:String(property.id),siteId:String(siteId),plantId:'',updated:new Date().toISOString(),archived:false,revision:1,scaleCmPerUnit:2,elements,history:[]};
   await ITECommerce.mutate(next=>{next.articles.push(article);next.settings.cadDrawings=[...(next.settings.cadDrawings||[]),drawing]});
   return {siteId,drawId:drawing.id};
  });
  await page.evaluate(()=>ITERouter.show('ite-cad','push'));
  await page.locator('#cad-workflow').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Aggiorna disegni, pratiche e cantieri'}).click();
  await page.locator('#cad-workflow select').nth(0).selectOption(fixture.drawId);
  await page.locator('#cad-workflow select').nth(2).selectOption(String(fixture.siteId));
  await page.locator('#cad-workflow input[inputmode=decimal]').fill('58');
  const before=await page.evaluate(()=>ITECommerce.snapshot().movements.length);
  await page.getByRole('button',{name:'Crea preventivo CAD con fornitura e posa'}).click();
  await page.waitForFunction(id=>{const s=ITE.snapshot().cantieri.find(x=>x.id===id);return s&&JSON.parse(s.ite_quotes||'[]').length===1},fixture.siteId,{timeout:60000});
  const result=await page.evaluate(async id=>{
   const site=ITE.snapshot().cantieri.find(x=>x.id===id),q=JSON.parse(site.ite_quotes)[0];
   return {q,movements:ITECommerce.snapshot().movements.length,backup:(await ITEHistory.list()).map(x=>x.reason)};
  },fixture.siteId);
  assert.equal(result.q.status,'Da accettare');
  assert.equal(result.q.lines.length,2);
  assert.equal(result.q.lines[0].line_type,'Fornitura');
  assert.equal(result.q.lines[0].price,65);
  assert.equal(result.q.lines[1].line_type,'Posa');
  assert.equal(result.q.lines[1].price,58);
  assert.equal(result.q.amount,123);
  assert.equal(result.movements,before,'No stock movement from quote');
  assert(result.backup.some(x=>x.includes('Prima preventivo CAD')));
  await page.getByRole('button',{name:'Crea preventivo CAD con fornitura e posa'}).click();
  await page.waitForFunction(()=>document.querySelector('#cad-workflow [aria-live=polite]')?.textContent.includes('già un preventivo'));
  assert.equal(await page.evaluate(id=>JSON.parse(ITE.snapshot().cantieri.find(x=>x.id===id).ite_quotes).length,fixture.siteId),1);
  assert.deepEqual(errors,[]);
  console.log('OK: '+(process.env.ITE_TEST_BROWSER||'chromium')+' CAD quote, separated supply/installation, backup, duplicate guard, stock unchanged');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
