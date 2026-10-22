"""Riproduce le copie locali delle dipendenze; nessun download di librerie a runtime."""
from pathlib import Path
import hashlib,json,urllib.request,time
ROOT=Path(__file__).resolve().parents[1]
for item in json.loads((ROOT/'tools/vendor-sources.json').read_text()):
    path=ROOT/item['path']
    if path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==item['sha256']:continue
    for attempt in range(3):
        try:
            url=item.get('mirror',item['url']) if attempt==2 else item['url']
            with urllib.request.urlopen(url,timeout=90) as response:data=response.read()
            if hashlib.sha256(data).hexdigest()!=item['sha256']:raise ValueError('Impronta non corrispondente: '+item['path'])
            path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            print(item['path'],len(data));break
        except Exception:
            if attempt==2:raise
            time.sleep(2)
