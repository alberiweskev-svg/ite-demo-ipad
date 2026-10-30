/* I.T.E. 4.0 — pannello operativo fascicoli tecnici, consultazione e export locale. */
(function(root){'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function model(clientId,core,state){
 const api=root.ITETechnicalPackage;if(!api?.auditPackage||!api?.readiness)throw Error('Modulo fascicoli non disponibile.');
 if(!clientId||!Array.isArray(core?.clienti)||!core.clienti.some(x=>same(x.id,clientId)))throw Error('Selezionare un cliente valido.');
 const rows=(Array.isArray(state?.settings?.technicalDrafts)?state.settings.technicalDrafts:[]).filter(p=>same(p.clientId,clientId));
 if(!rows.length)return {empty:true,clientId,rows:[],audit:null};
 if(rows.length>50)throw Error('Limite di 50 pratiche per fascicolo: suddividere la selezione.');
 const audit=api.auditPackage(rows,clientId,core,state);
 return {empty:false,clientId,rows,audit};
}
function render(data){
 if(data.empty)return '<p>Nessuna pratica tecnica per il cliente selezionato.</p>';
 const a=data.audit;
 return '<p><b>'+a.practices+' pratiche</b> · '+a.blocked+' bloccate · '+a.review+' da verificare</p>'+
 '<p><strong>BOZZA INTERNA — NON AUTORIZZA EMISSIONE O FIRMA.</strong></p>'+
 '<table><thead><tr><th>Pratica</th><th>Stato</th><th>Originali</th><th>Prove</th></tr></thead><tbody>'+
 data.rows.map((p,i)=>{const r=root.ITETechnicalPackage.manifest(p,data.core,data.state);
 return '<tr><td>'+esc(p.type)+' — '+esc(p.fields?.reference||p.id)+'</td><td>'+esc(r.state)+'</td><td>'+r.originals.length+'</td><td>'+r.proofs.length+'</td></tr>';}).join('')+
 '</tbody></table><h4>Segnalazioni documentali ('+a.findings.length+')</h4>'+
 (a.findings.length?'<ul>'+a.findings.map(f=>'<li>'+esc(f.severity)+' · '+esc(f.practiceId)+' · '+esc(f.code)+(f.sourceId?' · '+esc(f.sourceId):'')+'</li>').join('')+'</ul>':'<p>Nessuna anomalia documentale rilevata. Resta obbligatoria la verifica manuale.</p>');
}
function install(){
 const panel=root.document?.getElementById('technical-drafts-panel');
 if(!panel||panel.querySelector('#ite-package-dashboard'))return;
 const list=panel.querySelector('#tech-list'),filter=panel.querySelector('#tech-filter-client');
 if(!list||!filter)return;
 const host=root.document.createElement('section');host.id='ite-package-dashboard';
 host.innerHTML='<h3>Fascicoli tecnici — controllo integrato</h3>'+
 '<p>Selezionare il cliente e premere Aggiorna. Controllo interno, senza modifica dei documenti.</p>'+
 '<div class="actions"><button type="button" data-package-action="refresh">Aggiorna quadro</button>'+
 '<button type="button" data-package-action="csv" class="secondary">Esporta CSV</button>'+
 '<button type="button" data-package-action="html" class="secondary">Esporta A4</button></div>'+
 '<div id="ite-package-output" role="status" aria-live="polite"></div>';
 list.parentElement.insertBefore(host,list);
 let current=null;
 function snapshot(){
  if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio bloccato o salvataggio in corso.');
  return {core:root.ITE.snapshot(),state:root.ITECommerce.snapshot()};
 }
 function refresh(){
  const {core,state}=snapshot(),id=filter.value;
  current=model(id,core,state);current.core=core;current.state=state;
  host.querySelector('#ite-package-output').innerHTML=render(current);
 }
 function download(format){
  if(format!=='csv'&&format!=='html')throw Error('Formato non supportato.');
  if(!current||current.empty)throw Error('Aggiornare il quadro prima di esportare.');
  if(!same(filter.value,current.clientId))throw Error('Cliente cambiato: aggiornare il quadro.');
  const {core,state}=snapshot(),fresh=model(current.clientId,core,state);
  if(fresh.empty)throw Error('Nessuna pratica disponibile.');
  if(!root.confirm('Il file '+format.toUpperCase()+' sara NON cifrato e potra contenere dati cliente. Confermi il download locale?'))return;
  const reports=root.ITETechnicalPackage.bundle(fresh.rows,fresh.clientId,core,state);
  const data=format==='csv'?root.ITETechnicalPackage.csv(reports):root.ITETechnicalPackage.html(reports);
  const blob=new Blob([data],{type:format==='csv'?'text/csv;charset=utf-8':'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=root.document.createElement('a');
  a.href=url;a.download='ITE_FASCICOLI_BOZZA.'+(format==='csv'?'csv':'html');root.document.body.append(a);a.click();a.remove();
  root.setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 filter.addEventListener('change',()=>{current=null;host.querySelector('#ite-package-output').textContent='Cliente modificato: premere Aggiorna quadro prima di esportare.';});
 host.addEventListener('click',e=>{
  const button=e.target.closest('button[data-package-action]');if(!button)return;
  try{if(button.dataset.packageAction==='refresh')refresh();else download(button.dataset.packageAction);}
  catch(err){host.querySelector('#ite-package-output').textContent='Operazione non disponibile: '+err.message;}
 });
}
root.ITETechnicalPackageUI=Object.freeze({model,render,install});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ITETechnicalPackageUI;
if(root.document&&root.addEventListener){root.addEventListener('ite-vault-ready',install);root.addEventListener('ite-pagechange',install);if(root.ITEVault?.isUnlocked?.())install();}
})(typeof window!=='undefined'?window:globalThis);
