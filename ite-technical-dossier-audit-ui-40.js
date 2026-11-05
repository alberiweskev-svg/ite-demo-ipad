/* I.T.E. 4.0 TEST — audit fascicolo tecnico in sola lettura. */
(function(root){'use strict';const doc=root.document,api=root.ITE40TechnicalDossierAudit,ops=root.ITEOperationsWorkspace40;
if(!doc||!api||!ops)return;
const panel=doc.getElementById('ite40-technical-registry');if(!panel||panel.querySelector('#ite40-dossier-audit'))return;
const section=doc.createElement('section');section.id='ite40-dossier-audit';section.className='item';
section.innerHTML='<h3>Controllo integrità fascicolo TEST</h3><p class="hint">Analisi in sola lettura di documenti, interventi, gerarchie, revisioni e metadati. Non valida la conformità normativa Di.Co./Di.Ri.</p><div class="actions"><button type="button" id="ite40-audit-refresh">Verifica fascicolo</button><button type="button" id="ite40-audit-export">Esporta rapporto JSON TEST</button></div><p id="ite40-audit-summary" role="status"></p><div id="ite40-audit-results"></div>';
panel.appendChild(section);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let latest=null;
function refresh(){try{
 const registry=JSON.parse(root.localStorage.getItem('ite40-technical-registry-test-v1')||'null')||{schema:1,documents:[],events:[]};
 latest=api.audit(registry,ops.create().read());
 const c=latest.counts;section.querySelector('#ite40-audit-summary').textContent=c.documents+' documenti · '+c.interventions+' interventi · '+c.linkedInterventions+' collegati · '+c.errors+' errori · '+c.warnings+' avvisi';
 section.querySelector('#ite40-audit-results').innerHTML=latest.issues.length?latest.issues.slice(0,100).map(x=>'<div class="work-check"><strong>'+esc(x.severity)+' — '+esc(x.code)+'</strong><small>'+esc(x.documentId)+': '+esc(x.detail)+'</small></div>').join(''):'<p>Nessuna anomalia rilevata dai controlli implementati.</p>';
 }catch(e){latest=null;section.querySelector('#ite40-audit-summary').textContent='Audit non disponibile: '+e.message;section.querySelector('#ite40-audit-results').textContent='';}}
section.querySelector('#ite40-audit-refresh').addEventListener('click',refresh);
section.querySelector('#ite40-audit-export').addEventListener('click',()=>{if(!latest)refresh();if(!latest)return;const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='ite40-audit-fascicolo-TEST.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
root.addEventListener('ite40-tech-changed',refresh);root.addEventListener('storage',e=>{if(['ite40-technical-registry-test-v1',ops.KEY].includes(e.key))refresh()});refresh();
})(typeof window!=='undefined'?window:globalThis);
