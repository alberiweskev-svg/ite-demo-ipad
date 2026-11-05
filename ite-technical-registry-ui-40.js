/* I.T.E. 4.0 - Registro tecnico collegato al workspace TEST. Nessun contenuto PDF salvato. */
(function(root){'use strict';
const tech=root.ITETechnicalRegistry40,ops=root.ITEOperationsWorkspace40;
if(!tech||!ops||!root.document)return;
const KEY='ite40-technical-registry-test-v1';
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const id=()=> 'TEST-DOC-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const types=['DICO_ELETTRICO','DICO_IDRICO','DIRI','ALLEGATI_GAS','POS','CAD'];
let ws;try{ws=ops.create()}catch(_){return}
const panel=root.document.createElement('section');panel.id='ite40-technical-registry';panel.className='panel';
panel.innerHTML='<h2>Registro tecnico 4.0 — collaudo TEST</h2><p class="hint">Di.Co., Di.Ri., Allegati GAS, POS e CAD: registro e revisioni, non editor originali 2.7.5. Nessun PDF o dato reale viene importato.</p><div class="actions"><button type="button" data-action="export">Esporta registro TEST</button><button type="button" data-action="reset" class="secondary">Azzera registro TEST</button></div><p id="ite40-tech-status" role="status"></p><form id="ite40-tech-create" class="item"><strong>Nuovo documento tecnico</strong><div class="grid"><label>Cliente TEST<select name="clientId" required></select></label><label>Sede<select name="siteId"></select></label><label>Impianto<select name="plantId"></select></label><label>Apparecchiatura<select name="deviceId"></select></label><label>Tipo<select name="type" required>'+types.map(t=>'<option value="'+t+'">'+t+'</option>').join('')+'</select></label><label>Titolo<input name="title" maxlength="180" required placeholder="Dichiarazione TEST"></label></div><button type="submit">Crea documento TEST</button></form><div id="ite40-tech-list"></div>';
(root.document.querySelector('.wrap')||root.document.querySelector('main')||root.document.body).appendChild(panel);
const form=panel.querySelector('#ite40-tech-create');
const msg=(v,err)=>{const n=panel.querySelector('#ite40-tech-status');n.textContent=v;n.style.color=err?'#a03132':'#17603b'};
function read(){const raw=root.localStorage.getItem(KEY);const reg=raw?JSON.parse(raw):tech.empty();tech.validate(reg,ws.read());return reg}
function write(reg){tech.validate(reg,ws.read());root.localStorage.setItem(KEY,JSON.stringify(reg));return reg}
function options(node,arr,placeholder){const old=node.value;node.innerHTML='<option value="">'+escape(placeholder)+'</option>'+arr.map(x=>'<option value="'+escape(x.id)+'">'+escape(x.label)+'</option>').join('');if(arr.some(x=>x.id===old))node.value=old}
function hierarchy(){
 const state=ws.read(),clients=state.clients;
 const c=form.elements.clientId,s=form.elements.siteId,p=form.elements.plantId,d=form.elements.deviceId;
 options(c,clients.map(x=>({id:x.id,label:x.name+' ('+x.id+')'})),'Seleziona cliente');
 const client=clients.find(x=>x.id===c.value);
 options(s,(client?.sites||[]).map(x=>({id:x.id,label:x.address})),'Nessuna sede');
 const site=client?.sites.find(x=>x.id===s.value);
 options(p,(site?.plants||[]).map(x=>({id:x.id,label:x.type})),'Nessun impianto');
 const plant=site?.plants.find(x=>x.id===p.value);
 options(d,(plant?.devices||[]).map(x=>({id:x.id,label:x.brand+' '+x.model})),'Nessuna apparecchiatura');
}
function render(){
 hierarchy();const reg=read(),state=ws.read();
 panel.querySelector('#ite40-tech-list').innerHTML='<p class="hint">Documenti TEST: '+reg.documents.length+'</p>'+reg.documents.map(x=>{
 const client=state.clients.find(c=>c.id===x.clientId);
 return '<article class="item"><strong>'+escape(x.title)+' — '+escape(x.type)+'</strong><small>'+escape(client?.name||x.clientId)+' | '+escape(x.status)+' | Rev. '+x.revision+' | '+escape(x.id)+'</small><div class="actions">'+(x.status==='ARCHIVIATO'?'':'<button type="button" data-id="'+escape(x.id)+'" data-state="DA_VERIFICARE">Da verificare</button><button type="button" data-id="'+escape(x.id)+'" data-state="VERIFICATO">Verificato</button><button type="button" data-id="'+escape(x.id)+'" data-state="ARCHIVIATO">Archivia</button>')+'</div><small>Revisioni registrate: '+x.history.length+' — allegati: solo metadati</small></article>'
 }).join('');
}
form.addEventListener('change',e=>{if(['clientId','siteId','plantId'].includes(e.target.name)){const changed=e.target.name;if(changed==='clientId'){form.elements.siteId.value='';form.elements.plantId.value='';form.elements.deviceId.value=''}else if(changed==='siteId'){form.elements.plantId.value='';form.elements.deviceId.value=''}else form.elements.deviceId.value='';hierarchy()}});
form.addEventListener('submit',e=>{e.preventDefault();try{
 const d=Object.fromEntries(new FormData(form).entries());
 if(!d.clientId)throw Error('Selezionare un cliente TEST');
 const raw={id:id(),clientId:d.clientId,type:d.type,title:d.title};
 for(const k of ['siteId','plantId','deviceId'])if(d[k])raw[k]=d[k];
 write(tech.create(read(),ws.read(),raw,'TEST-OPERATORE-REGISTRO',new Date().toISOString()));
 form.elements.title.value='';render();msg('Documento TEST creato')
}catch(err){msg('Non salvato: '+err.message,true)}});
panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;try{
 if(b.dataset.state){write(tech.update(read(),ws.read(),b.dataset.id,{status:b.dataset.state},'TEST-OPERATORE-REGISTRO',new Date().toISOString()));render();msg('Revisione registrata')}
 if(b.dataset.action==='reset'){write(tech.empty());render();msg('Registro TEST azzerato')}
 if(b.dataset.action==='export'){const blob=new Blob([tech.backup(read(),ws.read())],{type:'application/json'}),url=URL.createObjectURL(blob),a=root.document.createElement('a');a.href=url;a.download='ite40-registro-tecnico-TEST.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);msg('Backup TEST esportato')}
}catch(err){msg('Operazione non riuscita: '+err.message,true)}});
root.addEventListener('storage',e=>{if(e.key===KEY||e.key===ops.KEY){try{render()}catch(err){msg(err.message,true)}}});
try{render()}catch(err){msg('Archivio TEST non leggibile: '+err.message,true)}
})(typeof window!=='undefined'?window:globalThis);
