#!/usr/bin/env python3
"""Apply the 3.0.74 guided import change to the isolated development branch.
Fail closed if the expected 3.0.73 anchors are missing.
"""
from pathlib import Path
import hashlib
import base64
import subprocess

root = Path(__file__).resolve().parent.parent
app = root / "app.js"
vault = root / "vault.js"
index = root / "index.html"
s = app.read_text()
helper = (root / "dev/ite-import-guided.js.txt").read_text()
assert "function iteGuide(d,core)" in helper

def replace_once(source, old, new):
    assert source.count(old) == 1, f"Expected exactly one anchor: {old[:90]!r}, got {source.count(old)}"
    return source.replace(old, new, 1)

s = replace_once(s, "function technicalCard(d,i,dup,issues,core){", helper + "\nfunction technicalCard(d,i,dup,issues,core){")
a = s.index("function technicalCard(d,i,dup,issues,core){")
b = s.index("function detectTechnical(d){", a)
card = """function technicalCard(d,i,dup,issues,core){
 return '<details class="panel" data-queue="'+i+'" '+(i===0?'open':'')+'><summary><b>'+esc(d.sourceName)+' · '+esc(d.type)+'</b>'+(dup?' — già presente':'')+'</summary><label><input class="commerce-check" data-q="selected" type="checkbox" '+(d.selected&&!dup?'checked':'')+' '+(dup?'disabled':'')+'> Importa questa scheda</label><div class="grid"><label>Categoria<select data-q="type">'+types.map(t=>'<option '+(t===d.type?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label><label>Titolo / riferimento<input data-q="number" value="'+esc(d.number)+'"></label><label>Data documento<input data-q="date" type="date" value="'+esc(d.date)+'"></label><label>Scadenza<input data-q="due" type="date" value="'+esc(d.due)+'"></label></div>'+iteGuide(d,core)+learningControls(d,i)+financialDetails(d)+'<p class="hint">'+esc([...d.notes,...issues].join(' · '))+'</p><label><input class="commerce-check" data-q="reviewed" type="checkbox" '+(d.reviewed?'checked':'')+'> Ho verificato categoria, dati e collegamenti</label>'+(d.text?'<details><summary>Testo letto dal documento</summary><pre class="commerce-text">'+esc(d.text)+'</pre></details>':'')+'</details>';
}
"""
s = s[:a] + card + s[b:]
s = replace_once(s, "for(const el of box.querySelectorAll('[data-party]'))d.party[el.dataset.party]=el.value.trim()", "for(const el of box.querySelectorAll('[data-party]'))d.party[el.dataset.party]=el.value.trim();for(const el of box.querySelectorAll('[data-guide]')){d.guide=d.guide||{};d.guide[el.dataset.guide]=el.type==='checkbox'?el.checked:el.value.trim()}")
s = replace_once(s, "if(d.type==='Anagrafiche'){d.subjectIds=[];", "if(nonFinancial(d))iteRegisterGuide(d,core,next);\n if(d.type==='Anagrafiche'){d.subjectIds=[];")
s = replace_once(s, "delete d.reviewed;if(existing)", "delete d.reviewed;delete d.guide;if(existing)")
s = replace_once(s, "$('import-apply').onclick=()=>applyQueue().catch(e=>say(e.message));", "$('import-apply').onclick=()=>applyQueue().catch(e=>{say('Registrazione non completata: '+e.message);$('import-status').scrollIntoView({block:'nearest'});});")
s = replace_once(s, "$('import-queue').addEventListener('click',e=>{", """$('import-queue').addEventListener('change',e=>{const el=e.target;if(el.matches('[data-q="clientId"],[data-q="propertyId"],[data-q="plantId"]')){readQueue();const d=queue[Number(el.closest('[data-queue]')?.dataset.queue)];if(!d)return;if(el.dataset.q==='clientId'){d.propertyId='';d.plantId='';d.deviceId=''}else if(el.dataset.q==='propertyId'){d.plantId='';d.deviceId=''}else d.deviceId='';drawQueue()}});
 $('import-queue').addEventListener('click',e=>{""")
s = s.replace("version:'3.0.73'", "version:'3.0.74'")
assert "iteRegisterGuide(d,core,next)" in s
app.write_text(s)
subprocess.run(["node", "--check", str(app)], check=True)

def sri(path):
    return "sha384-" + base64.b64encode(hashlib.sha384(path.read_bytes()).digest()).decode()

v = vault.read_text()
v = replace_once(v, "script.src='./app.js?v=3.0.73'", "script.src='./app.js?v=3.0.74'")
import re
v, n = re.subn(r"script.integrity='sha384-[^']+'", "script.integrity='" + sri(app) + "'", v, count=1)
assert n == 1
v = v.replace("./test-data.js?v=3.0.73", "./test-data.js?v=3.0.74")
vault.write_text(v)
subprocess.run(["node", "--check", str(vault)], check=True)

h = index.read_text()
h = replace_once(h, "Gestionale I.T.E. 3.0.73 — Demo iPad", "Gestionale I.T.E. 3.0.74 — Demo iPad")
h = replace_once(h, "./vault.js?v=3.0.73", "./vault.js?v=3.0.74")
h, n = re.subn(r'(<script src="./vault.js\?v=3.0.74" integrity=")sha384-[^"]+(")', lambda m: m.group(1)+sri(vault)+m.group(2), h, count=1)
assert n == 1
index.write_text(h)

assert 'function iteGuide(d,core)' in app.read_text()
assert '3.0.74' in index.read_text()
print("3.0.74 patch applied, JavaScript syntax valid, SHA384 integrity refreshed.")
