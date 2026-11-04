/* I.T.E. 4.0 — dossier audit workspace, synthetic/demo metadata only. */
(function(root){'use strict';
const A=root.ITETechnicalDossierAudit, U=root.ITETechnicalDossierUI;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function actionsFor(ids,ref){return [...new Set(ids)].filter(Boolean).map(documentId=>({action:'COLLEGAMENTO',ref:{...ref,documentId}}));}
function mount(doc,storage){
 if(!A||!U||!doc.getElementById('dossier-attach')||doc.getElementById('dossier-audit-controls'))return false;
 const $=id=>doc.getElementById(id), old=$('dossier-attach');
 const replacement=old.cloneNode(true);old.parentNode.replaceChild(replacement,old);
 const controls=doc.createElement('div');controls.id='dossier-audit-controls';
 controls.innerHTML='<div class="panel"><h3>Operazioni tracciate e verifica fascicolo</h3><p class="hint">Collegamenti e distacchi registrati localmente con operatore e data. Solo dati fittizi nel collaudo pubblico; nessun PDF viene caricato o modificato.</p><div class="grid"><label>Operatore obbligatorio<input id="dossier-operator" maxlength="120" autocomplete="off" placeholder="Tecnico demo"></label><label>Documenti verificati (ID separati da virgola, per lotto)<input id="dossier-batch" placeholder="Lasciare vuoto per il documento selezionato"></label><label>Motivo distacco (minimo 8 caratteri)<input id="dossier-reason" maxlength="1000"></label><label>ID documento da distaccare<input id="dossier-detach-id"></label></div><div class="actions"><button type="button" id="dossier-preview" class="secondary">Anteprima collegamenti</button><button type="button" id="dossier-detach">Distacca con registro</button><button type="button" id="dossier-recover" class="secondary">Ripristina operazione interrotta</button><button type="button" id="dossier-audit-refresh" class="secondary">Verifica registro</button></div><p id="dossier-audit-message" role="status" aria-live="polite"></p><div id="dossier-audit-report"></div></div>';
 $('dossier-results').after(controls);
 const message=(s,bad=false)=>{const e=$('dossier-audit-message');e.textContent=s;e.style.color=bad?'#a03132':''};
 function data(){return U.read(storage)}
 function selection(){
  const ref={clientId:$('dossier-client').value,siteId:$('dossier-site').value,plantId:$('dossier-plant').value,deviceId:$('dossier-device').value,linkedAt:new Date().toISOString().slice(0,10)};
  const typed=$('dossier-batch').value.split(',').map(x=>x.trim()).filter(Boolean);
  const ids=typed.length?typed:[$('dossier-document').value];
  if(!ref.clientId||!ref.siteId||!ids[0])throw Error('Selezionare cliente, sede e documento');
  return actionsFor(ids,ref);
 }
 function operator(){const v=$('dossier-operator').value.trim();if(!v)throw Error('Indicare operatore');return v}
 function run(fn){try{fn()}catch(e){message('Operazione non eseguita: '+e.message,true)}}
 function refresh(){
  const {master,queue}=data(),r=A.inspect(storage,queue,master);
  const c=r.coverage;
  $('dossier-audit-report').innerHTML='<p><strong>'+c.linked+' collegamenti · '+r.audit.events.length+' eventi registrati · '+c.verifiedUnlinked.length+' documenti verificati da collegare</strong></p><p>Coerenza: '+(c.valid?'verificata':'da controllare')+'; anomalie: '+(c.issues.length+c.inconsistent.length+c.missingDocuments.length)+'</p><h4>Ultime operazioni</h4>'+r.audit.events.slice(-15).reverse().map(e=>'<div class="item"><strong>'+esc(e.action)+' · '+esc(e.documentId)+'</strong><small>'+esc(e.at)+' · '+esc(e.operator)+' · '+esc(e.reason)+'</small></div>').join('');
 }
 replacement.addEventListener('click',()=>run(()=>{
  const {master,queue}=data(),r=A.transact(storage,queue,master,selection(),operator(),new Date().toISOString());
  message(r.events.length+' collegamenti registrati con audit.');U.mount(doc,storage);refresh();
 }));
 $('dossier-preview').addEventListener('click',()=>run(()=>{
  const {master,queue,state}=data(),r=A.prepare(state,queue,master,storage.getItem(A.KEY),selection(),operator(),new Date().toISOString());
  message('Anteprima valida: '+r.events.length+' collegamenti; nessun dato modificato.');
 }));
 $('dossier-detach').addEventListener('click',()=>run(()=>{
  const {master,queue}=data(),id=$('dossier-detach-id').value.trim(),reason=$('dossier-reason').value.trim();
  A.transact(storage,queue,master,[{action:'DISTACCO',documentId:id,reason}],operator(),new Date().toISOString());
  message('Distacco registrato: '+id);refresh();
 }));
 $('dossier-recover').addEventListener('click',()=>run(()=>{message(A.recover(storage)?'Archivio ripristinato dal registro temporaneo.':'Nessuna operazione interrotta.');refresh()}));
 $('dossier-audit-refresh').addEventListener('click',()=>run(()=>{refresh();message('Verifica completata.')}));
 run(refresh);return true;
}
const api=Object.freeze({actionsFor,mount});root.ITETechnicalDossierAuditUI=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document&&root.localStorage){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>mount(root.document,root.localStorage));else mount(root.document,root.localStorage)}
})(typeof window!=='undefined'?window:globalThis);
