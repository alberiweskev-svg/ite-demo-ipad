/* I.T.E. 4.0 — pannello operativo fascicoli tecnici, consultazione e export locale. */
(function(root){'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function model(clientId,core,state,options={}){
 const api=root.ITETechnicalPackage;if(!api?.auditPackage||!api?.readiness)throw Error('Modulo fascicoli non disponibile.');
 if(!clientId||!Array.isArray(core?.clienti)||!core.clienti.some(x=>same(x.id,clientId)))throw Error('Selezionare un cliente valido.');
 const rows=(Array.isArray(state?.settings?.technicalDrafts)?state.settings.technicalDrafts:[]).filter(p=>same(p.clientId,clientId));
 if(!rows.length)return {empty:true,clientId,rows:[],audit:null,types:[],allCount:0,filters:{type:'all',status:'all'}};
 if(rows.length>50)throw Error('Limite di 50 pratiche per fascicolo: suddividere la selezione.');
 const allAudit=api.auditPackage(rows,clientId,core,state);
 const statuses=new Map(api.bundle(rows,clientId,core,state).map(r=>[r.practiceId,r.state]));
 const type=String(options.type||'all'),status=String(options.status||'all');
 const selected=rows.filter(p=>(type==='all'||p.type===type)&&(status==='all'||statuses.get(String(p.id))===status));
 const audit=selected.length?api.auditPackage(selected,clientId,core,state):null;
 return {empty:false,clientId,rows:selected,allCount:rows.length,allAudit,audit,filters:{type,status},
  types:[...new Set(rows.map(p=>p.type))].sort((a,b)=>String(a).localeCompare(String(b),'it'))};
}
function signature(data){
 if(!data||!data.rows?.length)return '';
 const reports=root.ITETechnicalPackage.bundle(data.rows,data.clientId,data.core,data.state);
 // Compare every export-visible field, not just practice IDs: revisions, hashes,
 // proof states, missing sources and findings must invalidate a stale selection.
 return JSON.stringify(reports);
}
function compareSelection(previous,next){
 if(!previous||!next||previous.empty||next.empty||!previous.rows.length||!next.rows.length)return false;
 return signature(previous)===signature(next);
}
function render(data){
 if(data.empty)return '<p>Nessuna pratica tecnica per il cliente selezionato.</p>';
 const a=data.audit;
 if(!a)return '<p>Nessuna pratica corrisponde ai filtri selezionati. Nessun documento esportabile.</p>';
 return '<p>Visualizzate '+data.rows.length+' pratiche su '+data.allCount+' del cliente selezionato.</p>'+ '<p><b>'+a.practices+' pratiche</b> · '+a.blocked+' bloccate · '+a.review+' da verificare</p>'+
 '<p><strong>BOZZA INTERNA — NON AUTORIZZA EMISSIONE O FIRMA.</strong></p>'+
 '<h4>Riepilogo per tipologia</h4><ul>'+
 Object.entries(a.groups||{}).map(([type,g])=>'<li>'+esc(type)+': '+g.count+' pratiche · '+g.blocked+' bloccate · '+g.review+' da verificare · '+g.originals+' originali · '+g.proofs+' prove</li>').join('')+'</ul>'+
 '<table><thead><tr><th>Pratica</th><th>Stato</th><th>Originali</th><th>Prove</th><th>Blocchi</th><th>Verifiche</th></tr></thead><tbody>'+
 data.rows.map((p,i)=>{const r=root.ITETechnicalPackage.manifest(p,data.core,data.state);
 return '<tr><td>'+esc(p.type)+' — '+esc(p.fields?.reference||p.id)+'</td><td>'+esc(r.state)+'</td><td>'+r.originals.length+'</td><td>'+r.proofs.length+'</td><td>'+r.blocking+'</td><td>'+r.review+'</td></tr>';}).join('')+
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
 '<div class="actions"><label>Tipologia <select id="ite-package-type"><option value="all">Tutte</option></select></label>'+
 '<label>Stato <select id="ite-package-status"><option value="all">Tutti</option><option value="BLOCCATA">Bloccate</option><option value="DA VERIFICARE MANUALMENTE">Da verificare</option></select></label></div>'+
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
  const typeSelect=host.querySelector('#ite-package-type'),statusSelect=host.querySelector('#ite-package-status');
  const type=typeSelect.value,status=statusSelect.value;
  current=model(id,core,state,{type,status});current.core=core;current.state=state;
  const old=typeSelect.value;
  typeSelect.replaceChildren(new Option('Tutte','all'),...current.types.map(x=>new Option(x,x)));
  typeSelect.value=current.types.includes(old)?old:'all';
  host.querySelector('#ite-package-output').innerHTML=render(current);
 }
 function download(format){
  if(format!=='csv'&&format!=='html')throw Error('Formato non supportato.');
  if(!current||current.empty||!current.rows.length)throw Error('Nessuna pratica nei filtri. Aggiornare il quadro prima di esportare.');
  if(!same(filter.value,current.clientId))throw Error('Cliente cambiato: aggiornare il quadro.');
  const {core,state}=snapshot(),fresh=model(current.clientId,core,state,current.filters);
  if(fresh.empty||!fresh.rows.length)throw Error('Nessuna pratica disponibile nei filtri.');
  const originalIds=current.rows.map(p=>String(p.id)).join('|'),freshIds=fresh.rows.map(p=>String(p.id)).join('|');
  fresh.core=core;fresh.state=state;
  if(originalIds!==freshIds||!compareSelection(current,fresh))throw Error('Pratiche, revisioni, allegati o prove modificati: aggiornare il quadro.');
  if(!root.confirm('Il file '+format.toUpperCase()+' sara NON cifrato e potra contenere dati cliente. Confermi il download locale?'))return;
  const reports=root.ITETechnicalPackage.bundle(fresh.rows,fresh.clientId,core,state);
  const data=format==='csv'?root.ITETechnicalPackage.csv(reports):root.ITETechnicalPackage.html(reports);
  const blob=new Blob([data],{type:format==='csv'?'text/csv;charset=utf-8':'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=root.document.createElement('a');
  a.href=url;a.download='ITE_FASCICOLI_BOZZA.'+(format==='csv'?'csv':'html');root.document.body.append(a);a.click();a.remove();
  root.setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 function invalidate(){current=null;host.querySelector('#ite-package-output').textContent='Selezione modificata: premere Aggiorna quadro prima di esportare.';}
 filter.addEventListener('change',()=>{host.querySelector('#ite-package-type').replaceChildren(new Option('Tutte','all'));invalidate();});
 host.querySelector('#ite-package-type').addEventListener('change',invalidate);
 host.querySelector('#ite-package-status').addEventListener('change',invalidate);
 host.addEventListener('click',e=>{
  const button=e.target.closest('button[data-package-action]');if(!button)return;
  try{if(button.dataset.packageAction==='refresh')refresh();else download(button.dataset.packageAction);}
  catch(err){host.querySelector('#ite-package-output').textContent='Operazione non disponibile: '+err.message;}
 });
}
root.ITETechnicalPackageUI=Object.freeze({model,render,install,signature,compareSelection});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ITETechnicalPackageUI;
if(root.document&&root.addEventListener){root.addEventListener('ite-vault-ready',install);root.addEventListener('ite-pagechange',install);if(root.ITEVault?.isUnlocked?.())install();}
})(typeof window!=='undefined'?window:globalThis);
