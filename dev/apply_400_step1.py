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
# The archive is already flattened in the branch; preserve later UI changes.
assert "function archiveFolders(rows,depth=0)" in s
assert "Da classificare" in s
s=s.replace("version:'3.0.74'","version:'4.0.0'")
if app.read_text()!=s: app.write_text(s)
subprocess.run(['node','--check',str(app)],check=True)
def sri(p):return 'sha384-'+base64.b64encode(hashlib.sha384(p.read_bytes()).digest()).decode()
v=vault.read_text()
v=v.replace("script.src='./app.js?v=3.0.74'","script.src='./app.js?v=4.0.0'")
v,n=re.subn(r"script.integrity='sha384-[^']+'","script.integrity='"+sri(app)+"'",v,count=1)
assert n==1
v=v.replace("./test-data.js?v=3.0.74","./test-data.js?v=4.0.0")
if vault.read_text()!=v: vault.write_text(v)
subprocess.run(['node','--check',str(vault)],check=True)
h=index.read_text()
h=h.replace('Gestionale I.T.E. 3.0.74','Gestionale I.T.E. 4.0.0').replace('GESTIONALE 3.0.74','GESTIONALE 4.0.0').replace('Gestionale 3.0.74','Gestionale 4.0.0')
h=h.replace('./vault.js?v=3.0.74','./vault.js?v=4.0.0')
h,n=re.subn(r'(<script src="./vault.js\?v=4.0.0" integrity=")sha384-[^"]+(")',lambda m:m.group(1)+sri(vault)+m.group(2),h,count=1)
assert n==1
if index.read_text()!=h: index.write_text(h)
assert 'Da classificare' in app.read_text()
for required in ('function economicSummaryForSite(siteId)', 'function workHoursDataForSite(siteId)', 'function laborCostForSite(siteId)', 'internal_hourly_cost', 'function movementSummaryForSite(siteId)', 'function renderLinked()'):
    assert required in app.read_text(), 'Missing required module: '+required
print('4.0.0: syntax, core modules and SRI validated')

# Build trigger: 4.0 layout and flat document archive integration.
