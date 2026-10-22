from pathlib import Path
import re,json,hashlib,base64,html,shutil
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'index.html'
raw=source.read_text()
if 'id="vault-gate"' in raw:raise SystemExit('Build già eseguita: usa la sorgente 3.0.72.')
scripts=re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>',raw)
app='\n;\n'.join(scripts).replace('3.0.72','3.0.73')
app=app.replace("document.querySelector('body>header')","document.querySelector('#app-shell>header')")
app=app.replace('localStorage.','ITEVault.storage.').replace('indexedDB.open(DB,1)','ITEVault.openDatabase(DB,1)')
app=app.replace('new Blob([JSON.stringify(value)]', 'new Blob([JSON.stringify(ITEVault.sealBackup(value))]')
app=app.replace("const b=JSON.parse(await f.text());", "const b=await ITEVault.openBackup(JSON.parse(await f.text()));")
app=app.replace("downloadText(record.payload,'ITE_backup_'", "downloadText(JSON.stringify(ITEVault.sealBackup(JSON.parse(record.payload))),'ITE_backup_'")
# Il vecchio export anagrafico è ancora raggiungibile, sebbene l'import semplice sia disattivato.
app=app.replace("JSON.stringify({version:'3.0.73',data:db},null,2)","JSON.stringify(ITEVault.sealBackup({version:'3.0.73',data:db}),null,2)")
app=app.replace('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js','./vendor/tesseract.min.js').replace('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs','./vendor/pdf.mjs').replace('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs','./vendor/pdf.worker.mjs').replace('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js','./vendor/xlsx.full.min.js').replace('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js','./vendor/jszip.min.js')
app=app.replace("T.createWorker('ita',1,{logger:","T.createWorker('ita',1,{workerPath:new URL('./vendor/ocr-worker.min.js',location.href).href,corePath:new URL('./vendor/tesseract-core-lstm.wasm.js',location.href).href,langPath:new URL('./vendor/tessdata/',location.href).href,gzip:true,logger:")
app=app.replace("{data:bytes.slice(),isEvalSupported:false}","{data:bytes.slice(),isEvalSupported:false,standardFontDataUrl:new URL('./vendor/pdf-fonts/',location.href).href}")
app=app.replace('Per PDF, OCR, Excel e ZIP il primo caricamento dei motori richiede connessione. Analisi eseguita sul dispositivo, senza inviare i documenti a servizi IA.','PDF, OCR, Excel e ZIP usano componenti inclusi nel gestionale. Analisi sul dispositivo: i documenti non vengono inviati a servizi IA.')
(ROOT/'app.js').write_text(app)
raw=re.sub(r'<script(?:\s[^>]*)?>[\s\S]*?</script>','',raw).replace('3.0.72','3.0.73')
handlers=sorted(set(html.unescape(m) for m in re.findall(r'\bon\w+="([^"]*)"',raw+'\n'+app)))
hashes=' '.join("'sha256-"+base64.b64encode(hashlib.sha256(x.encode()).digest()).decode()+"'" for x in handlers)
base='https://alberiweskev-svg.github.io/ite-demo-ipad/'
csp=f"default-src 'none'; script-src 'self' 'unsafe-hashes' 'wasm-unsafe-eval' {hashes}; style-src 'self' 'unsafe-inline'; img-src data: blob:; font-src 'self' data:; connect-src {base}version.json {base}vendor/ blob: data:; worker-src 'self' blob:; object-src blob:; frame-src blob:; base-uri 'none'; form-action 'none'"
# Same policy is written with the local base URL by the test HTTP server.
raw=raw.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+csp+'"><meta name="referrer" content="no-referrer">',1)
css='''<style>.vault-gate{min-height:100vh;display:grid;place-items:center;padding:20px;background:#eff4f8}.vault-card{width:min(100%,520px);border:1px solid #c8d6e1;border-radius:16px;background:white;color:#173451;padding:28px;box-shadow:0 12px 36px #17345118}.vault-card h1{font-size:25px}.vault-card p{line-height:1.5}.vault-status{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;margin-top:10px}.vault-status button{padding:8px 12px;font-size:13px}.test-banner{border-left:4px solid #b97211}.test-banner button{margin:5px}#vault-message{white-space:pre-wrap;color:#933126}dialog::backdrop{background:#173451aa}body:has(#vault-gate:not([hidden])){padding-left:0!important}</style>'''
raw=raw.replace('</head>',css+'</head>',1)
gate='''<div class="vault-gate" id="vault-gate"><div class="vault-card"><strong>I.T.E. · GESTIONALE 3.0.73</strong><h1 id="vault-heading">Proteggi il tuo archivio</h1><p>Dati e documenti restano su questo dispositivo. La password serve a cifrare l’archivio e i backup; non viene inviata a ChatGPT o a servizi esterni.</p><form id="vault-form"><label>Password dell’archivio<input id="vault-password" type="password" required autocomplete="current-password"></label><label id="vault-confirm-label">Ripeti la password<input id="vault-confirm" type="password" autocomplete="new-password"></label><button type="submit" id="vault-submit">Proteggi e apri</button></form><p class="hint">Alla prima apertura scegli almeno 12 caratteri e conserva la password: non possiamo recuperarla. Chiudi le altre schede del gestionale prima della protezione iniziale. I dati già presenti verranno conservati e cifrati.</p><p id="vault-message" role="status" aria-live="polite"></p></div></div><div id="app-shell" hidden>'''
raw=raw.replace('<body>','<body>'+gate,1).replace('</body>','</div><script src="./vendor/vault-crypto.js"></script><script src="./vault.js?v=3.0.73"></script></body>',1)
source.write_text(raw)
print(json.dumps({'scripts':len(scripts),'handler_hashes':len(handlers),'csp':csp}))
