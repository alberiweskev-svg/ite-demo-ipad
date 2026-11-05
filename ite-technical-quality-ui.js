/* I.T.E. 4.0 — Quality gate visibile e applicato alle conferme del registro TEST. */
(function(root){'use strict';
if(typeof document==='undefined')return;
const KEY='ite40-technical-demo-v1';
const H={clients:[{id:'TEST-CLIENTE',sites:[{id:'TEST-SEDE',plants:[{id:'TEST-IMPIANTO',devices:[{id:'TEST-APPARECCHIO'}]}]}]}]};
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(){const v=JSON.parse(localStorage.getItem(KEY)||'{"records":[]}');if(!Array.isArray(v.records)||v.records.some(d=>!/^TEST-[A-Z0-9-]+$/.test(d.id||'')))throw Error('ARCHIVIO_TEST_NON_VALIDO');return v}
function mount(){
const Q=root.ITETechnicalQuality,M=root.ITETechnicalRegister;
if(!Q||!M||!$('ite-tech-panel')||$('ite-tech-quality'))return;
const box=document.createElement('fieldset');box.id='ite-tech-quality';
box.innerHTML='<legend>Controllo qualità documenti — TEST</legend><p class="hint">La conferma richiede allegati coerenti con il tipo di documento. Controllo dimostrativo, non verifica normativa.</p><div class="actions"><button type="button" id="ite-tech-quality-refresh">Controlla registro</button><button type="button" id="ite-tech-quality-confirm" class="secondary">Conferma documenti idonei</button></div><p id="ite-tech-quality-summary" role="status"></p><div id="ite-tech-quality-rows"></div>';
$('ite-tech-panel').appendChild(box);
function report(){try{
const state=read(),rows=Q.inspectRegister(state,H,M);
$('ite-tech-quality-summary').textContent=rows.filter(x=>x.ready).length+' idonei / '+rows.filter(x=>!x.ready).length+' bloccati / '+rows.length+' totali';
$('ite-tech-quality-rows').innerHTML=rows.map(x=>'<div class="item"><strong>'+safe(x.id)+'</strong><small>'+safe(x.ready?'Requisiti presenti':'Bloccato: '+x.issues.join(', '))+'</small></div>').join('')||'<p>Nessun documento TEST.</p>';
return {state,rows}
}catch(e){$('ite-tech-quality-summary').textContent='Errore: '+e.message;return null}}
$('ite-tech-quality-refresh').addEventListener('click',report);
$('ite-tech-quality-confirm').addEventListener('click',()=>{try{
const r=report();if(!r)return;
const ids=r.rows.filter(x=>x.ready&&r.state.records.find(d=>d.id===x.id)?.status==='BOZZA_DA_VERIFICARE').map(x=>x.id);
if(!ids.length)throw Error('NESSUN_DOCUMENTO_IDONEO_IN_BOZZA');
const operator=$('ite-tech-operator')?.value||'TECNICO TEST';
const next=Q.confirmBatch(r.state,ids,H,M,operator,new Date().toISOString());
localStorage.setItem(KEY,JSON.stringify(next));
document.dispatchEvent(new CustomEvent('ite:technical-register-external-update'));
report();
$('ite-tech-quality-summary').textContent=ids.length+' documenti confermati e registro sincronizzato.';
}catch(e){$('ite-tech-quality-summary').textContent='Conferma respinta: '+e.message}});
/* Il vecchio pulsante di conferma non deve aggirare il controllo qualità. */
$('ite-tech-confirm')?.addEventListener('click',event=>{try{
const r=report(),id=$('ite-tech-record')?.value;
if(!r||!Q.inspect(r.state.records.find(d=>d.id===id),H,M).ready)throw Error('REQUISITI_DOCUMENTALI_INCOMPLETI');
}catch(e){event.stopImmediatePropagation();event.preventDefault();$('ite-tech-quality-summary').textContent='Conferma bloccata: '+e.message}},true);
document.addEventListener('ite:technical-register-changed',report);
window.addEventListener('storage',event=>{if(event.key===KEY)report()});
report();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
