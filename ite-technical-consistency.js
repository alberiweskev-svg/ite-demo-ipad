/* I.T.E. 4.0 — cross-check of technical records; drafts only, no certification. */
(function(root){'use strict';
const arr=v=>Array.isArray(v)?v:[];
const same=(a,b)=>String(a??'')===String(b??'');
const find=(rows,id)=>arr(rows).find(x=>same(x.id,id));
const str=v=>String(v??'').trim();
const esc=v=>str(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csv=v=>{let s=String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
function analyze(p,core,state){
 if(!p?.id||!p.clientId||!core||!state)throw Error('Pratica o archivi non disponibili.');
 const client=find(core.clienti,p.clientId),property=p.propertyId?find(core.immobili,p.propertyId):null;
 const site=p.siteId?find(core.cantieri,p.siteId):null,plant=p.plantId?find(core.impianti,p.plantId):null;
 const device=p.deviceId?find(core.apparecchiature,p.deviceId):null;
 if(!client||p.propertyId&&(!property||!same(property.client_id,p.clientId))||
 p.siteId&&(!site||!same(site.client_id,p.clientId))||
 p.plantId&&(!plant||!property||!same(plant.immobile_id,property.id))||
 p.deviceId&&(!device||!plant||!same(device.impianto_id,plant.id))||
 property&&site?.immobile_id&&!same(site.immobile_id,property.id))
 throw Error('Gerarchia cliente, sede, impianto o apparecchiatura incoerente: operazione bloccata.');
 const issues=[],proposals=[],add=(level,area,message)=>issues.push({level,area,message});
 const propose=(target,value,source)=>{
  value=str(value);if(!value)return;
  const existing=str(target.startsWith('detail:')?p.structured?.[target.slice(7)]:p.fields?.[target]);
  if(!existing)proposals.push({target,value,source});
  else if(existing.toLocaleLowerCase('it')!==value.toLocaleLowerCase('it'))add('Verificare','Anagrafica','Campo '+target+' diverso dalla fonte '+source+'; non sovrascritto.');
 };
 if(p.status==='Annullata')add('Bloccante','Stato','Pratica annullata.');
 if(!str(p.fields?.reference))add('Verificare','Pratica','Numero o riferimento mancante.');
 if(!str(p.fields?.scope))add('Verificare','Pratica','Descrizione lavori mancante.');
 propose('detail:committente',client.name||client.ragione_sociale,'cliente');
 const address=[property?.name,property?.city,property?.province].filter(Boolean).join(', ');
 propose('detail:indirizzoImpianto',address,'sede');propose('detail:indirizzoUtenza',address,'sede');
 propose('detail:cantiere',site?.name,'cantiere');
 for(const group of arr(root.ITETechnicalDrafts?.structuredGroups?.[p.type]))
  for(const f of arr(group.fields))if(f[3]&&!str(p.structured?.[f[0]])&&!proposals.some(x=>x.target==='detail:'+f[0]))
   add('Verificare','Campi richiesti',group.title+': '+f[1]+' da compilare.');
 if(p.type?.startsWith('Allegato gas')){
  if(!str(p.structured?.pdrVerificato))add('Verificare','GAS','PDR da attestare su documento, mai dedotto.');
  if(str(p.fields?.pdr)&&str(p.structured?.pdrVerificato)&&str(p.fields.pdr)!==str(p.structured.pdrVerificato))
   add('Bloccante','GAS','PDR generale diverso da PDR verificato.');
 }
 if(p.type==='POS'&&!p.siteId)add('Verificare','POS','Cantiere non collegato.');
 const docs=arr(state.documents),files=arr(state.files),seen=new Set();
 for(const id of arr(p.linkedDocIds)){
  if(seen.has(String(id))){add('Verificare','Originali','Documento duplicato.');continue;}seen.add(String(id));
  const d=find(docs,id);
  if(!d){add('Bloccante','Originali','Originale mancante.');continue;}
  if(!same(d.clientId||d.subjectId,p.clientId)||d.propertyId&&p.propertyId&&!same(d.propertyId,p.propertyId)||
    d.siteId&&p.siteId&&!same(d.siteId,p.siteId))throw Error('Originale di cliente o sede differente: operazione bloccata.');
  if(!d.fileId||!find(files,d.fileId))add('Bloccante','Originali','File originale non disponibile.');
 }
 const annex=arr(state.settings?.technicalAnnexLinks).filter(a=>same(a.practiceId,p.id)&&!a.removedAt);
 for(const a of annex){
  const d=find(docs,a.documentId);
  if(!d){add('Bloccante','Allegati','Originale registrato mancante.');continue;}
  if(!same(d.clientId||d.subjectId,p.clientId))throw Error('Allegato di altro cliente: operazione bloccata.');
  if(!same(a.practiceRevision,p.revision))add('Bloccante','Allegati','Riferimento a revisione precedente.');
  if(!d.fileId||!find(files,d.fileId))add('Bloccante','Allegati','File registrato non disponibile.');
 }
 if(!seen.size&&!annex.length)add('Verificare','Originali','Nessun originale tecnico collegato.');
 const links=arr(state.settings?.technicalEvidenceLinks).filter(x=>same(x.practiceId,p.id)&&!x.removedAt);
 for(const l of links){
  const check=find(state.settings?.fieldChecks,l.checkId);
  if(!check){add('Bloccante','Prove','Prova collegata non trovata.');continue;}
  if(!same(check.clientId,p.clientId))throw Error('Prova di altro cliente: operazione bloccata.');
  if(p.interventionId&&!same(check.jobId,p.interventionId)||p.deviceId&&check.deviceId&&!same(check.deviceId,p.deviceId))
   add('Bloccante','Prove','Prova riferita a intervento o apparecchiatura differente.');
  if(check.voidedAt)add('Bloccante','Prove','Prova stornata ancora collegata.');
  if(!same(l.practiceRevision,p.revision))add('Bloccante','Prove','Prova collegata a revisione precedente.');
 }
 const cadLinks=arr(state.settings?.cadPracticeLinks).filter(x=>same(x.practiceId,p.id));
 for(const l of cadLinks){
  const drawing=find(state.settings?.cadDrawings,l.drawingId);
  if(!drawing){add('Bloccante','CAD','Disegno collegato mancante.');continue;}
  if(!same(drawing.clientId,p.clientId))throw Error('Disegno di altro cliente: operazione bloccata.');
  if(!same(l.drawingRevision,drawing.revision))add('Bloccante','CAD','Revisione disegno superata.');
 }
 for(const [item,check] of Object.entries(p.checklistEvidence||{})){
  if(!['Documentato','Non applicabile'].includes(check?.status)||!str(check?.evidence))
   add('Verificare','Checklist',item+': esito o motivazione mancanti.');
  if(check?.documentId&&!seen.has(String(check.documentId))&&!annex.some(a=>same(a.documentId,check.documentId)))
   add('Bloccante','Checklist',item+': fonte non collegata.');
 }
 return {practiceId:p.id,clientId:String(p.clientId),type:p.type,reference:str(p.fields?.reference)||'Senza numero',
  revision:p.revision,status:p.status,issues,proposals,summary:{blocking:issues.filter(x=>x.level==='Bloccante').length,
  review:issues.filter(x=>x.level==='Verificare').length,suggestions:proposals.length,originals:seen.size+annex.length,proofs:links.length,drawings:cadLinks.length}};
}
function batch(rows,clientId,core,state){
 if(!clientId||!find(core?.clienti,clientId)||!Array.isArray(rows)||!rows.length||rows.length>50)
  throw Error('Selezionare da 1 a 50 pratiche di un cliente.');
 const ids=new Set();
 return rows.map(p=>{if(!same(p.clientId,clientId)||ids.has(String(p.id)))throw Error('Pratiche duplicate o di clienti differenti.');
 ids.add(String(p.id));return analyze(p,core,state);});
}
function toCsv(reports){
 const lines=[['Pratica','Tipo','Revisione','Stato','Priorita','Area','Controllo / proposta','Fonte'].map(csv).join(';')];
 for(const r of reports){
  for(const i of r.issues)lines.push([r.reference,r.type,r.revision,r.status,i.level,i.area,i.message,''].map(csv).join(';'));
  for(const p of r.proposals)lines.push([r.reference,r.type,r.revision,r.status,'Proposta',p.target,p.value,p.source].map(csv).join(';'));
 }
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
function toHtml(reports){
 const body=reports.map(r=>'<section><h2>'+esc(r.type)+' — '+esc(r.reference)+'</h2><p>Revisione '+esc(r.revision)+' · '+esc(r.status)+' · '+r.summary.blocking+' blocchi · '+r.summary.review+' verifiche</p>'+
  '<table><thead><tr><th>Priorità</th><th>Area</th><th>Controllo</th></tr></thead><tbody>'+
  (r.issues.map(i=>'<tr><td>'+esc(i.level)+'</td><td>'+esc(i.area)+'</td><td>'+esc(i.message)+'</td></tr>').join('')||'<tr><td colspan="3">Nessuna anomalia automatica; verifica manuale comunque necessaria.</td></tr>')+
  '</tbody></table><h3>Proposte non applicate</h3><table><tbody>'+
  (r.proposals.map(p=>'<tr><th>'+esc(p.target)+'</th><td>'+esc(p.value)+'</td><td>'+esc(p.source)+'</td></tr>').join('')||'<tr><td>Nessuna proposta</td></tr>')+'</tbody></table></section>').join('');
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>ITE coerenza fonti</title><style>@page{size:A4;margin:15mm}body{font:12px Arial;color:#172e3a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:6px;overflow-wrap:anywhere;text-align:left}section{break-after:page}</style></head><body><h1>I.T.E. — Controllo incrociato fonti</h1><p><b>BOZZA INTERNA NON FIRMATA. NON È DICHIARAZIONE DI CONFORMITÀ.</b> Fonti da verificare manualmente; non sostituisce Di.Co./Di.Ri./GAS originali.</p>'+body+'</body></html>';
}
function install(){
 const panel=root.document?.getElementById('technical-drafts-panel'),list=panel?.querySelector('#tech-list');
 if(!list||panel.dataset.iteConsistencyInstalled)return;
 panel.dataset.iteConsistencyInstalled='1';
 const refresh=()=>{
  for(const b of list.querySelectorAll('[data-tech-edit]')){
   if(b.parentElement?.querySelector('[data-tech-consistency="'+b.dataset.techEdit+'"]'))continue;
   const c=root.document.createElement('button');c.type='button';c.className='secondary';c.dataset.techConsistency=b.dataset.techEdit;c.textContent='Coerenza fonti';b.insertAdjacentElement('afterend',c);
  }
  const anchor=panel.querySelector('#tech-dossier');
  if(anchor&&!panel.querySelector('#tech-consistency-a4')){
   const a=root.document.createElement('button'),c=root.document.createElement('button');
   a.type=c.type='button';a.className=c.className='secondary';a.id='tech-consistency-a4';c.id='tech-consistency-csv';
   a.textContent='Controllo incrociato A4';c.textContent='Controllo incrociato CSV';
   anchor.insertAdjacentElement('afterend',a);a.insertAdjacentElement('afterend',c);
  }
 };
 refresh();new MutationObserver(refresh).observe(list,{childList:true,subtree:true});
 const snapshot=()=>{if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio bloccato o salvataggio in corso.');
  return {core:root.ITE.snapshot(),state:root.ITECommerce.snapshot()};};
 const download=(data,ext)=>{
  if(!root.confirm('Report locale '+ext.toUpperCase()+' NON cifrato, contenente dati del cliente. Confermi?'))return;
  const blob=new Blob([data],{type:ext==='csv'?'text/csv;charset=utf-8':'text/html;charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=root.document.createElement('a');a.href=url;a.download='ITE_CONTROLLO_FONTI_BOZZA.'+ext;root.document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 };
 const open=report=>{
  const cover=root.document.createElement('div');cover.id='ite-consistency-overlay';
  cover.style.cssText='position:fixed;inset:0;z-index:99999;background:#142d3fcb;display:flex;align-items:center;justify-content:center;padding:12px';
  const card=root.document.createElement('div');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Controllo incrociato fonti');
  card.style.cssText='background:white;color:#20313c;border-radius:12px;padding:18px;max-width:780px;width:100%;max-height:90vh;overflow:auto';
  card.innerHTML='<h3>Coerenza fonti — '+esc(report.reference)+'</h3><p>'+report.summary.blocking+' blocchi · '+report.summary.review+' verifiche · '+report.summary.suggestions+' proposte</p><p>Controllo interno non certificativo. Nessuna modifica o salvataggio automatico.</p><ul>'+
  report.issues.map(i=>'<li><b>'+esc(i.level)+' — '+esc(i.area)+'</b>: '+esc(i.message)+'</li>').join('')+'</ul><h4>Proposte da verificare</h4><ul>'+
  report.proposals.map(p=>'<li>'+esc(p.target)+' = '+esc(p.value)+' ('+esc(p.source)+')</li>').join('')+
  '</ul><div class="actions"><button type="button" data-consistency-apply>Apri revisione e precompila campi vuoti</button><button type="button" data-consistency-a4 class="secondary">Scarica A4</button><button type="button" data-consistency-csv class="secondary">Scarica CSV</button><button type="button" data-consistency-close class="secondary">Chiudi</button></div>';
  cover.append(card);root.document.body.append(cover);
  cover.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b||!cover.contains(b))return;
   if(b.hasAttribute('data-consistency-close')){cover.remove();return;}
   if(b.hasAttribute('data-consistency-a4')){download(toHtml([report]),'html');return;}
   if(b.hasAttribute('data-consistency-csv')){download(toCsv([report]),'csv');return;}
   if(b.hasAttribute('data-consistency-apply')){
    try{
     const edit=[...list.querySelectorAll('[data-tech-edit]')].find(x=>same(x.dataset.techEdit,report.practiceId));
     if(!edit)throw Error('Pratica non visibile.');
     cover.remove();edit.click();
     const host=panel.querySelector('#tech-editor'),form=host?.querySelector('#tech-form');
     if(!form||!same(host.dataset.id,report.practiceId))throw Error('Revisione non aperta; nessun dato applicato.');
     let count=0;
     for(const p of report.proposals){
      const el=p.target.startsWith('detail:')?[...form.querySelectorAll('[data-tech-detail]')].find(x=>x.dataset.techDetail===p.target.slice(7)):form.elements[p.target];
      if(el&&!str(el.value)){el.value=p.value;el.dispatchEvent(new Event('input',{bubbles:true}));count++;}
     }
     const note=root.document.createElement('p');note.setAttribute('role','status');
     note.textContent=count+' proposte nei campi vuoti. Verificare e salvare manualmente con backup e storico.';
     form.insertBefore(note,form.firstChild);
    }catch(err){const s=panel.querySelector('#tech-status');if(s)s.textContent=err.message;}
   }
  });
 };
 list.addEventListener('click',e=>{
  const b=e.target.closest('[data-tech-consistency]');if(!b||!list.contains(b))return;
  e.preventDefault();e.stopPropagation();
  try{const {core,state}=snapshot();open(analyze(find(state.settings?.technicalDrafts,b.dataset.techConsistency),core,state));}
  catch(err){const s=panel.querySelector('#tech-status');if(s)s.textContent='Controllo non disponibile: '+err.message;}
 },true);
 panel.addEventListener('click',e=>{
  const b=e.target.closest('#tech-consistency-a4,#tech-consistency-csv');if(!b)return;
  e.preventDefault();e.stopPropagation();
  try{
   const {core,state}=snapshot(),clientId=panel.querySelector('#tech-filter-client')?.value;
   const rows=[...list.querySelectorAll('[data-tech-edit]')].map(x=>find(state.settings?.technicalDrafts,x.dataset.techEdit)).filter(Boolean);
   const reports=batch(rows,clientId,core,state);
   download(b.id==='tech-consistency-csv'?toCsv(reports):toHtml(reports),b.id==='tech-consistency-csv'?'csv':'html');
  }catch(err){const s=panel.querySelector('#tech-status');if(s)s.textContent='Esportazione bloccata: '+err.message;}
 },true);
}
const api=Object.freeze({analyze,batch,toCsv,toHtml,install});
root.ITETechnicalConsistency=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document&&root.addEventListener){root.addEventListener('ite-vault-ready',install);root.addEventListener('ite-pagechange',install);if(root.ITEVault?.isUnlocked?.())install();}
})(typeof window!=='undefined'?window:globalThis);
