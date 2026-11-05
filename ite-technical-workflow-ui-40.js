/* I.T.E. 4.0 — flusso tecnico TEST: interventi, allegati solo metadati, ricerca e ripristino validato. */
(function(root){'use strict';
const doc=root.document,tech=root.ITETechnicalRegistry40,ops=root.ITEOperationsWorkspace40;
if(!doc||!tech||!ops)return;
const KEY='ite40-technical-registry-test-v1',panel=doc.getElementById('ite40-technical-registry');
if(!panel||panel.dataset.workflowReady)return;panel.dataset.workflowReady='1';
const ws=ops.create(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=> 'TEST-ATT-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const actor='TEST-OPERATORE-REGISTRO';
const read=()=>{const r=JSON.parse(root.localStorage.getItem(KEY)||'null')||tech.empty();tech.validate(r,ws.read());return r};
const save=r=>{tech.validate(r,ws.read());root.localStorage.setItem(KEY,JSON.stringify(r));root.dispatchEvent(new Event('ite40-tech-changed'))};
const status=(s,bad=false)=>{const el=doc.getElementById('ite40-tech-status');if(el){el.textContent=s;el.style.color=bad?'#a03132':'#17603b'}};
const create=panel.querySelector('#ite40-tech-create');
const slot=doc.createElement('div');slot.className='item';slot.innerHTML='<h3>Collegamenti e fascicolo TEST</h3><label>Intervento collegato<select id="ite40-link-intervention"><option value="">Nessun intervento</option></select></label><p class="hint">Selezionare prima il cliente nel modulo nuovo documento. L’intervento deve appartenere alla stessa gerarchia.</p><div class="grid"><label>Filtra documenti<input id="ite40-tech-filter" type="search" placeholder="Titolo, tipo, cliente o ID"></label><label>Documento per allegato<select id="ite40-attachment-doc"></select></label></div><form id="ite40-attachment-form"><div class="grid"><label>Nome file (solo metadati)<input name="filename" maxlength="160" required placeholder="rapporto-TEST.pdf"></label><label>Formato<select name="mime"><option value="application/pdf">PDF</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label><label>Dimensione in byte<input name="bytes" type="number" min="0" max="20000000" step="1" required></label></div><button type="submit">Registra metadati allegato</button></form><div class="actions"><button id="ite40-tech-download" type="button">Esporta backup validato</button><label>Ripristina backup TEST<input id="ite40-tech-restore" type="file" accept=".json,application/json"></label></div><p class="hint">Nessun file viene caricato o memorizzato: si registrano soltanto nome, formato e dimensione. Il ripristino sostituisce il registro TEST soltanto dopo validazione completa.</p></div>';
panel.insertBefore(slot,panel.querySelector('#ite40-tech-list'));
const intervention=slot.querySelector('#ite40-link-intervention'),filter=slot.querySelector('#ite40-tech-filter'),docSelect=slot.querySelector('#ite40-attachment-doc');
function refresh(){
 const state=ws.read(),c=create.elements.clientId.value,s=create.elements.siteId.value,p=create.elements.plantId.value,d=create.elements.deviceId.value,old=intervention.value;
 const rows=state.interventions.map(i=>({i,a:state.appointments.find(a=>a.id===i.appointmentId)})).filter(x=>x.a&&x.a.clientId===c&&(!s||x.a.siteId===s)&&(!p||x.a.plantId===p)&&(!d||x.a.deviceId===d));
 intervention.innerHTML='<option value="">Nessun intervento</option>'+rows.map(x=>'<option value="'+esc(x.i.id)+'">'+esc(x.i.id)+' — '+esc(x.a.start)+'</option>').join('');
 if(rows.some(x=>x.i.id===old))intervention.value=old;
 const reg=read(),previous=docSelect.value;
 docSelect.innerHTML=reg.documents.filter(x=>x.status!=='ARCHIVIATO').map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+' ('+esc(x.id)+')</option>').join('');
 if(reg.documents.some(x=>x.id===previous&&x.status!=='ARCHIVIATO'))docSelect.value=previous;
 const term=filter.value.trim().toLowerCase(),list=panel.querySelector('#ite40-tech-list');
 if(list){for(const item of list.querySelectorAll('article.item')){const hay=item.textContent.toLowerCase();item.hidden=!!term&&!hay.includes(term)}}
}
create.addEventListener('change',()=>{try{refresh()}catch(e){status(e.message,true)}});
filter.addEventListener('input',refresh);
create.addEventListener('submit',()=>{const selected=intervention.value;if(!selected)return;
 try{const reg=read(),last=reg.documents[reg.documents.length-1];if(!last||last.interventionId)return;
 const state=ws.read(),i=state.interventions.find(x=>x.id===selected),a=state.appointments.find(x=>x.id===i?.appointmentId);
 if(!a||a.clientId!==last.clientId||(last.siteId&&a.siteId!==last.siteId)||(last.plantId&&a.plantId!==last.plantId)||(last.deviceId&&a.deviceId!==last.deviceId))throw Error('INTERVENTO_NON_COLLEGATO');
 /* Create a replacement through the validated domain API; never mutate an existing document in place. */
 const without={...reg,documents:reg.documents.slice(0,-1),events:reg.events.slice(0,-1)};
 const linked=tech.create(without,state,{id:last.id,clientId:last.clientId,siteId:last.siteId,plantId:last.plantId,deviceId:last.deviceId,interventionId:selected,type:last.type,title:last.title},actor,last.createdAt);
 save(linked);status('Documento TEST collegato all’intervento '+selected);
 }catch(e){status('Collegamento non riuscito: '+e.message,true)}
});
slot.querySelector('#ite40-attachment-form').addEventListener('submit',e=>{e.preventDefault();try{
 const f=e.currentTarget,d=Object.fromEntries(new FormData(f).entries()),bytes=Number(d.bytes);
 if(!Number.isInteger(bytes)||bytes<0||bytes>20000000)throw Error('DIMENSIONE_NON_VALIDA');
 const next=tech.update(read(),ws.read(),docSelect.value,{attachment:{id:id(),filename:d.filename,mime:d.mime,bytes}},actor,new Date().toISOString());
 save(next);f.reset();status('Metadati allegato registrati (nessun file acquisito)');refresh();
 }catch(err){status('Allegato non registrato: '+err.message,true)}});
slot.querySelector('#ite40-tech-download').addEventListener('click',()=>{try{const b=new Blob([tech.backup(read(),ws.read())],{type:'application/json'}),url=URL.createObjectURL(b),a=doc.createElement('a');a.href=url;a.download='ite40-fascicolo-TEST.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Backup TEST esportato')}catch(e){status(e.message,true)}});
slot.querySelector('#ite40-tech-restore').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>2000000)throw Error('BACKUP_TROPPO_GRANDE');const data=await f.text(),next=tech.restore(data,ws.read());save(next);status('Backup TEST validato e ripristinato');root.location.reload()}catch(err){status('Ripristino rifiutato: '+err.message,true)}finally{e.target.value=''}});
root.addEventListener('ite40-tech-changed',refresh);root.addEventListener('storage',e=>{if(e.key===KEY||e.key===ops.KEY){try{refresh()}catch(err){status(err.message,true)}}});
try{refresh()}catch(e){status(e.message,true)}
})(typeof window!=='undefined'?window:globalThis);
