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
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
