"""Rigenera SRI dopo modifiche ai file dell'applicazione."""
from pathlib import Path
import hashlib,base64,re
ROOT=Path(__file__).resolve().parents[1]
def sri(path):return 'sha384-'+base64.b64encode(hashlib.sha384((ROOT/path).read_bytes()).digest()).decode()
p=ROOT/'vault.js';s=p.read_text()
for name,path in [('script','app.js'),('dataset','test-data.js')]:
    pattern=re.compile(r"("+name+r"\.src='[^']+';)(?:"+name+r"\.integrity='[^']+';"+name+r"\.crossOrigin='anonymous';)?")
    s,n=pattern.subn(lambda m:m[1]+name+".integrity='"+sri(path)+"';"+name+".crossOrigin='anonymous';",s,count=1)
    if n!=1:raise ValueError('Riferimento script non trovato: '+path)
p.write_text(s)
p=ROOT/'index.html';s=p.read_text()
for path in ['vault.js','vendor/vault-crypto.js']:
    pattern=re.compile(r'<script src="(\./'+re.escape(path)+r'(?:\?[^\"]*)?)"[^>]*>')
    s,n=pattern.subn(lambda m:'<script src="'+m[1]+'" integrity="'+sri(path)+'" crossorigin="anonymous">',s,count=1)
    if n!=1:raise ValueError('Script iniziale non trovato: '+path)
p.write_text(s)
print('Integrità script rigenerata')
