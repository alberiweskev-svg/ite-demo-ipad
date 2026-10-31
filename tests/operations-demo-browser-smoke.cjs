const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/ite-operations-demo.html');
  await page.locator('#load-samples').click();
  assert.equal(await page.locator('.appointment').count(),3,'sample appointments');
  await page.locator('#operator-filter').selectOption('DEMO-T2');
  assert.equal(await page.locator('.appointment').count(),1,'technician filter');
  await page.locator('#operator-filter').selectOption('');
  assert.equal(await page.locator('.appointment').count(),3,'all technicians');
  await page.locator('#day-filter').fill('2000-01-01');
  assert.equal(await page.locator('.appointment').count(),0,'day filter');
  await page.locator('#clear-day').click();
  assert.equal(await page.locator('.appointment').count(),3,'clear day filter');
  await page.locator('#reset-demo').click();
  assert.equal(await page.locator('.appointment').count(),0,'reset');
  assert.deepEqual(errors,[],'browser runtime errors');
  console.log('ITE demo browser smoke OK');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
