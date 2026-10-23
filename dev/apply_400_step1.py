#!/usr/bin/env python3
"""I.T.E. 4.0 step 1: flatten document archive without changing stored data."""
from pathlib import Path
import hashlib, base64, re, subprocess
root=Path(__file__).resolve().parent.parent
app=root/'app.js'; vault=root/'vault.js'; index=root/'index.html'
def replace_once(s,old,new):
    if s.count(old)!=1: raise RuntimeError('Anchor mismatch: '+old[:70])
    return s.replace(old,new,1)
s=app.read_text()
old='''function archiveFolders(rows,depth=0){if(!rows.length)return '<p class="hint">Nessun documento in questa categoria.</p>';if(depth>=7)return docList(rows);const groups=new Map();for(const d of rows){const path=folderLevels(d),name=path[depth];if(!name){const k='Documenti';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(d)}else{if(!groups.has(name))groups.set(name,[]);groups.get(k).push(d)}}'''
# replace by boundaries to avoid accidental modifications
start=s.index('function archiveFolders(rows,depth=0){')
end=s.index('function automaticHints(d){',start)
new="""function archiveFolders(rows,depth=0){if(!rows.length)return '<p class="hint">Nessun documento in questa categoria.</p>';const groups=new Map();for(const d of rows){const name=d.type==='Articoli'?'Listini e articoli':(d.type==='Da verificare'?'Da classificare':d.type);if(!groups.has(name))groups.set(name,[]);groups.get(name).push(d)}return [...groups].sort(([a],[b])=>a.localeCompare(b,'it')).map(([name,items])=>'<details class="import-folder-level" open><summary>'+esc(name)+' <small>('+items.length+')</small></summary>'+docList(items)+'</details>').join('');}
"""
s=s[:start]+new+s[end:]
s=replace_once(s,"version:'3.0.74'","version:'4.0.0'")
app.write_text(s)
subprocess.run(['node','--check',str(app)],check=True)
def sri(p):return 'sha384-'+base64.b64encode(hashlib.sha384(p.read_bytes()).digest()).decode()
v=vault.read_text()
v=replace_once(v,"script.src='./app.js?v=3.0.74'","script.src='./app.js?v=4.0.0'")
v,n=re.subn(r"script.integrity='sha384-[^']+'","script.integrity='"+sri(app)+"'",v,count=1)
assert n==1
v=v.replace("./test-data.js?v=3.0.74","./test-data.js?v=4.0.0")
vault.write_text(v)
subprocess.run(['node','--check',str(vault)],check=True)
h=index.read_text()
h=h.replace('Gestionale I.T.E. 3.0.74','Gestionale I.T.E. 4.0.0').replace('GESTIONALE 3.0.74','GESTIONALE 4.0.0').replace('Gestionale 3.0.74','Gestionale 4.0.0')
h=replace_once(h,'./vault.js?v=3.0.74','./vault.js?v=4.0.0')
h,n=re.subn(r'(<script src="./vault.js\?v=4.0.0" integrity=")sha384-[^"]+(")',lambda m:m.group(1)+sri(vault)+m.group(2),h,count=1)
assert n==1
index.write_text(h)
assert 'Da classificare' in app.read_text()
print('4.0.0 step 1: archive flattened, syntax and SRI validated')

# Build trigger: 4.0 layout and flat document archive integration.
