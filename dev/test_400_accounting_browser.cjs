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

function makeSyntheticInvoicePdf(lines){
  // PDF A4 minimo, generato interamente in memoria con testo e dati fittizi.
  const escapePdf=s=>s.replace(/([\\()])/g,'\\$1');
  const stream=['BT','/F1 12 Tf','50 780 Td',...lines.flatMap((line,i)=>[
    ...(i?['0 -20 Td']:[]),`(${escapePdf(line)}) Tj`
  ]),'ET'].join('\n')+'\n';
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream,'latin1')} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let pdf='%PDF-1.4\n';
  const offsets=[];
  for(let i=0;i<objects.length;i++){
    offsets.push(Buffer.byteLength(pdf,'latin1'));
    pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const startxref=Buffer.byteLength(pdf,'latin1');
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(const offset of offsets)pdf+=`${String(offset).padStart(10,'0')} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  return Buffer.from(pdf,'latin1');
}

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
  // FatturaPA XML interamente fittizia: verifica estrazione strutturata e originali.
  const xmlName='fattura-elettronica-fittizia.xml';
  const xmlText=[
   '<?xml version="1.0" encoding="UTF-8"?>',
   '<FatturaElettronica versione="FPR12">',
   '<FatturaElettronicaHeader>',
   '<CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>00000000000</IdCodice></IdFiscaleIVA><Anagrafica><Denominazione>FORNITORE FITTIZIO SRL</Denominazione></Anagrafica></DatiAnagrafici></CedentePrestatore>',
   '<CessionarioCommittente><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>11111111111</IdCodice></IdFiscaleIVA><Anagrafica><Denominazione>CLIENTE FITTIZIO SRL</Denominazione></Anagrafica></DatiAnagrafici></CessionarioCommittente>',
   '</FatturaElettronicaHeader>',
   '<FatturaElettronicaBody><DatiGenerali><DatiGeneraliDocumento><TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa><Data>2026-10-28</Data><Numero>XML-DEMO-001</Numero><ImportoTotaleDocumento>122.00</ImportoTotaleDocumento></DatiGeneraliDocumento></DatiGenerali>',
   '<DatiBeniServizi><DettaglioLinee><NumeroLinea>1</NumeroLinea><Descrizione>Materiale di prova non reale</Descrizione><Quantita>1.00</Quantita><PrezzoUnitario>100.00</PrezzoUnitario><PrezzoTotale>100.00</PrezzoTotale><AliquotaIVA>22.00</AliquotaIVA></DettaglioLinee><DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>100.00</ImponibileImporto><Imposta>22.00</Imposta></DatiRiepilogo></DatiBeniServizi>',
   '</FatturaElettronicaBody></FatturaElettronica>'
  ].join('');
  const xmlBytes=Buffer.from(xmlText,'utf8');
  await page.locator('#import-files').setInputFiles({name:xmlName,mimeType:'application/xml',buffer:xmlBytes});
  await page.waitForFunction(name=>window.ITECommerce.queue().some(d=>d.sourceName===name)&&document.getElementById('import-status').textContent.includes('Analisi completata'),xmlName,{timeout:45000});
  const xmlPreview=await page.evaluate(name=>window.ITECommerce.queue().find(d=>d.sourceName===name),xmlName);
  assert.equal(xmlPreview.number,'XML-DEMO-001','Numero XML non estratto');
  assert.equal(xmlPreview.date,'2026-10-28','Data XML non estratta');
  assert.equal(xmlPreview.net,100,'Imponibile XML non estratto');
  assert.equal(xmlPreview.tax,22,'IVA XML non estratta');
  assert.equal(xmlPreview.total,122,'Totale XML non estratto');
  assert.equal(xmlPreview.lines.length,1,'Riga XML non estratta');
  assert.equal(xmlPreview.type,'Da verificare','Non classificare come acquisto/vendita senza identità aziendale fittizia impostata');
  assert.deepEqual(Buffer.from(xmlPreview.file.base64,'base64'),xmlBytes,'XML originale alterato in anteprima');
  await page.locator('#import-apply').click();
  await page.waitForFunction(name=>window.ITECommerce.snapshot().documents.some(d=>d.sourceName===name),xmlName,{timeout:60000});
  const xmlSaved=await page.evaluate(name=>{
   const state=window.ITECommerce.snapshot();
   const doc=state.documents.find(d=>d.sourceName===name);
   return {doc,file:state.files.find(f=>f.id===doc?.fileId)};
  },xmlName);
  assert.ok(xmlSaved.doc&&xmlSaved.file,'Fattura XML fittizia non registrata');
  assert.deepEqual(Buffer.from(xmlSaved.file.base64,'base64'),xmlBytes,'XML alterato dopo registrazione');
  const xmlBackup=await page.evaluate(()=>window.ITEBackup.pack());
  assert.ok(xmlBackup.commerce.documents.some(d=>d.id===xmlSaved.doc.id),'XML assente nel backup');
  assert.ok(xmlBackup.commerce.files.some(f=>f.id===xmlSaved.file.id),'Originale XML assente nel backup');
  // Un XML con intestazione ma senza corpo non deve sparire senza spiegazione.
  // Il parser lo segnala e l'originale rimane nella coda "Da verificare".
  const incompleteName='fattura-xml-senza-corpo-fittizia.xml';
  const incompleteBytes=Buffer.from('<?xml version="1.0"?><FatturaElettronica><FatturaElettronicaHeader/></FatturaElettronica>','utf8');
  await page.locator('#import-files').setInputFiles({name:incompleteName,mimeType:'application/xml',buffer:incompleteBytes});
  await page.waitForFunction(name=>window.ITECommerce.queue().some(d=>d.sourceName===name)&&document.getElementById('import-status').textContent.includes('Analisi completata'),incompleteName,{timeout:45000});
  const incompletePreview=await page.evaluate(name=>window.ITECommerce.queue().find(d=>d.sourceName===name),incompleteName);
  assert.equal(incompletePreview.type,'Da verificare','XML senza corpo non deve essere classificato come fattura');
  assert.ok(incompletePreview.notes.some(note=>note.includes('senza corpo documento')),'Segnalazione del corpo XML mancante assente');
  assert.deepEqual(Buffer.from(incompletePreview.file.base64,'base64'),incompleteBytes,'Originale XML non valido non conservato in anteprima');
  assert.equal(await page.evaluate(name=>window.ITECommerce.snapshot().documents.some(d=>d.sourceName===name),incompleteName),false,'XML incompleto registrato senza conferma');

  await page.reload({waitUntil:'networkidle'});
  await page.locator('#vault-password').fill(password);
  await page.locator('#vault-submit').click({noWaitAfter:true});
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  const xmlReopened=await page.evaluate(id=>{
   const state=window.ITECommerce.snapshot();
   const doc=state.documents.find(d=>d.id===id);
   return {doc,file:state.files.find(f=>f.id===doc?.fileId)};
  },xmlSaved.doc.id);
  assert.ok(xmlReopened.doc&&xmlReopened.file,'Fattura XML non recuperata dopo riapertura');
  assert.deepEqual(Buffer.from(xmlReopened.file.base64,'base64'),xmlBytes,'XML alterato dopo riapertura');
  const xmlDownloadPromise=page.waitForEvent('download',{timeout:30000});
  await page.evaluate(id=>window.ITECommerce.openOriginal(id),xmlSaved.doc.id);
  const xmlDownload=await xmlDownloadPromise;
  assert.equal(xmlDownload.suggestedFilename(),xmlName);
  assert.deepEqual(await fs.promises.readFile(await xmlDownload.path()),xmlBytes,'XML scaricato alterato');

  // PDF testuale reale (non un .txt rinominato): lettura PDF.js e originali cifrati.
  const pdfName='fattura-pdf-fittizia.pdf';
  const pdfBytes=makeSyntheticInvoicePdf([
    'Fattura n. 321 del 28/10/2026',
    'Cliente: CLIENTE FITTIZIO PDF SRL',
    'Imponibile: 100,00',
    'Totale IVA: 22,00',
    'Totale documento: 122,00',
    'SOLO DATI FITTIZI'
  ]);
  await page.locator('#import-files').setInputFiles({name:pdfName,mimeType:'application/pdf',buffer:pdfBytes});
  await page.waitForFunction(name=>window.ITECommerce.queue().some(d=>d.sourceName===name)&&document.getElementById('import-status').textContent.includes('Analisi completata'),pdfName,{timeout:60000});
  const pdfPreview=await page.evaluate(name=>window.ITECommerce.queue().find(d=>d.sourceName===name),pdfName);
  assert.equal(pdfPreview.number,'321','Numero PDF non estratto');
  assert.equal(pdfPreview.date,'2026-10-28','Data PDF non estratta');
  assert.equal(pdfPreview.net,100,'Imponibile PDF non estratto');
  assert.equal(pdfPreview.tax,22,'IVA PDF non estratta');
  assert.equal(pdfPreview.total,122,'Totale PDF non estratto');
  assert.equal(pdfPreview.type,'Da verificare','PDF senza direzione fiscale certa classificato automaticamente');
  assert.match(pdfPreview.text,/CLIENTE FITTIZIO PDF SRL/,'Testo PDF.js non estratto');
  assert.deepEqual(Buffer.from(pdfPreview.file.base64,'base64'),pdfBytes,'PDF originale alterato in anteprima');
  await page.locator('#import-apply').click();
  await page.waitForFunction(name=>window.ITECommerce.snapshot().documents.some(d=>d.sourceName===name),pdfName,{timeout:60000});
  const pdfSaved=await page.evaluate(name=>{
    const state=window.ITECommerce.snapshot();
    const doc=state.documents.find(d=>d.sourceName===name);
    return {doc,file:state.files.find(f=>f.id===doc?.fileId)};
  },pdfName);
  assert.ok(pdfSaved.doc&&pdfSaved.file,'PDF fittizio non registrato');
  assert.deepEqual(Buffer.from(pdfSaved.file.base64,'base64'),pdfBytes,'PDF originale alterato dopo salvataggio');
  const pdfBackup=await page.evaluate(()=>window.ITEBackup.pack());
  assert.ok(pdfBackup.commerce.documents.some(d=>d.id===pdfSaved.doc.id),'PDF assente nel backup');
  assert.ok(pdfBackup.commerce.files.some(f=>f.id===pdfSaved.file.id),'Originale PDF assente nel backup');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#vault-password').fill(password);
  await page.locator('#vault-submit').click({noWaitAfter:true});
  await page.locator('#app-shell').waitFor({state:'visible',timeout:45000});
  const pdfReopened=await page.evaluate(id=>{
    const state=window.ITECommerce.snapshot();
    const doc=state.documents.find(d=>d.id===id);
    return {doc,file:state.files.find(f=>f.id===doc?.fileId)};
  },pdfSaved.doc.id);
  assert.ok(pdfReopened.doc&&pdfReopened.file,'PDF non recuperato dopo riapertura cifrata');
  assert.deepEqual(Buffer.from(pdfReopened.file.base64,'base64'),pdfBytes,'PDF alterato dopo riapertura');
  const pdfDownloadPromise=page.waitForEvent('download',{timeout:30000});
  await page.evaluate(id=>window.ITECommerce.openOriginal(id),pdfSaved.doc.id);
  const pdfDownload=await pdfDownloadPromise;
  assert.equal(pdfDownload.suggestedFilename(),pdfName);
  assert.deepEqual(await fs.promises.readFile(await pdfDownload.path()),pdfBytes,'PDF scaricato alterato');
  console.log('OK: PDF fittizio letto da PDF.js, registrato, incluso nel backup, riaperto e scaricato senza alterazioni');

  console.log('OK: FatturaPA XML fittizia estratta, registrata, inclusa nel backup, riaperta e scaricata senza alterazioni');
  assert.deepEqual(errors,[],'Errori browser: '+errors.join(' | '));
  console.log('OK: fattura fittizia importata, registrata, inclusa nel backup, riaperta e scaricata senza perdita di byte');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
