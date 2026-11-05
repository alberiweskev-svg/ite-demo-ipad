/* I.T.E. 4.0 — riepilogo operativo integrato iPad TEST, sola lettura. */
(function(root){'use strict';
const api=root.ITE40FieldDossier,workspace=root.ITEOperationsWorkspace40,registry=root.ITETechnicalRegistry40;
if(!api||!workspace||!registry||!root.document)return;
const KEY='ite40-technical-registry-test-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const panel=root.document.createElement('section');panel.className='panel';panel.id='ite40-field-dossier';
panel.innerHTML='<h2>Fascicolo interventi integrato — TEST 4.0.24</h2><p class="hint">Appuntamenti, operatore, tempi, documenti tecnici e preventivi del medesimo archivio TEST. Nessun PDF importato. Solo consultazione.</p><div class="grid"><label>Cliente TEST<select id="ite40-field-client"><option value="">Tutti i clienti TEST</option></select></label></div><div class="actions"><button type="button" data-field-action="refresh">Aggiorna</button><button type="button" data-field-action="export">Esporta fascicolo JSON TEST</button></div><p role="status" id="ite40-field-status"></p><div id="ite40-field-results"></div>';
(root.document.querySelector('.wrap')||root.document.querySelector('main')||root.document.body).appendChild(panel);
const status=panel.querySelector('#ite40-field-status'),select=panel.querySelector('#ite40-field-client'),results=panel.querySelector('#ite40-field-results');
let last=null;
function refresh(){
 const ws=workspace.create().read();
 const raw=root.localStorage.getItem(KEY),reg=raw?JSON.parse(raw):registry.empty();
 registry.validate(reg,ws);
 const old=select.value;
 select.innerHTML='<option value="">Tutti i clienti TEST</option>'+ws.clients.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
 if(ws.clients.some(c=>c.id===old))select.value=old;
 last=api.build(ws,reg,{clientId:select.value||undefined});
 const report=last;
 results.innerHTML='<p class="hint">Appuntamenti: '+report.counts.appointments+' | Interventi chiusi: '+report.counts.closedInterventions+' | Documenti collegati: '+report.counts.linkedDocuments+' | Segnalazioni: '+report.counts.issues+'</p>'+report.rows.map(r=>'<article class="item"><strong>'+esc(r.clientName)+' — '+esc(r.scheduledStart)+'</strong><small>'+esc(r.siteAddress)+' | '+esc(r.operatorName)+' | '+esc(r.appointmentStatus)+'</small><p>Impianto: '+esc(r.plantType)+' | Apparecchiatura: '+esc(r.deviceName||'Non selezionata')+'</p><p>Intervento: '+esc(r.interventionStatus||'Non avviato')+' | Arrivo: '+esc(r.arrival||'—')+' | Uscita: '+esc(r.departure||'—')+' | Minuti: '+esc(r.minutes??'—')+'</p><p>Documenti: '+r.documentCount+' | Preventivi cliente: '+r.quotes.length+'</p>'+r.documents.map(d=>'<small>'+esc(d.type)+' — '+esc(d.title)+' — '+esc(d.status)+' (rev. '+d.revision+')</small>').join('<br>')+'</article>').join('')+'<h3>Segnalazioni operative</h3>'+(report.issues.length?'<ul>'+report.issues.map(i=>'<li>'+esc(i.code)+' — '+esc(i.id)+' — '+esc(i.detail)+'</li>').join('')+'</ul>':'<p>Nessuna segnalazione nel filtro selezionato.</p>');
 status.textContent='Fascicolo TEST aggiornato';
}
select.addEventListener('change',()=>{try{refresh()}catch(e){status.textContent='Errore: '+e.message}});
panel.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.fieldAction;if(!action)return;try{
 if(action==='refresh')refresh();
 if(action==='export'){refresh();const blob=new Blob([api.exportJSON(last)],{type:'application/json'}),url=URL.createObjectURL(blob),a=root.document.createElement('a');a.href=url;a.download='ite40-fascicolo-interventi-TEST.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
}catch(err){status.textContent='Errore: '+err.message}});
root.addEventListener('storage',e=>{if(e.key===KEY||e.key===workspace.KEY)try{refresh()}catch(err){status.textContent=err.message}});
try{refresh()}catch(err){status.textContent='Archivio TEST non leggibile: '+err.message}
})(typeof window!=='undefined'?window:globalThis);
