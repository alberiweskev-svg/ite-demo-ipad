'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const launcher=fs.readFileSync('AVVIA_ANTEPRIMA_WINDOWS.ps1','utf8');
const browserTest=fs.readFileSync('dev/test_400_technical_pdf_browser.cjs','utf8');
for(const [name,source] of [['Windows local preview',launcher],['Chromium/WebKit test server',browserTest]]){
 assert.match(source,/['"]\.mjs['"]\s*[:=]\s*['"]text\/javascript; charset=utf-8['"]/,
  name+' must serve PDF.js modules and worker with JavaScript MIME');
}
assert.match(browserTest,/readFileSync\(await fillable\.path\(\)\)/,
 'Browser test must inspect the downloaded AcroForm PDF');
assert.match(browserTest,/data-tech-file/,
 'Browser test must exercise the actual file import control');
console.log('OK: Windows local preview and browser tests serve PDF.js .mjs as JavaScript');
