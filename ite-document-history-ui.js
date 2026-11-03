/* I.T.E. 4.0 — document history UI, local metadata only.
 * Does not store PDF bytes or alter legacy technical modules.
 */
(function(root){'use strict';
const D=root.ITEDocumentIntake,H=root.ITEHierarchyWorkspace,W=root.ITEAtomicWorkspace,L=root.ITEDocumentHistory,S=root.ITEDocumentStagingUI;
const KEY='ite40_document_history_links_v1',PREV=KEY+'_previous';
const element=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n};
function read(store){const raw=store.getItem(KEY);if(raw===null)return [];const x=JSON.parse(raw);if(!Array.isArray(x))throw Error('STORICO_NON_VALIDO');return x}
function save(store,links,registry,hierarchy){
 const checked=L.validateLinks(links,registry,hierarchy),old=store.getItem(KEY),previous=store.getItem(PREV);
 // Never overwrite the live register unless its recovery snapshot is durable.
 store.setItem(PREV,old===null?'[]':old);
 try{store.setItem(KEY,JSON.stringify(checked))}
 catch(error){
  // Restore the prior backup if possible; the live register was not touched by a failed setItem.
  try{if(previous===null)store.removeItem(PREV);else store.setItem(PREV,previous)}catch(_){}
  throw error;
 }
 return checked;
}
function snapshot(store){return {registry:S.read(store),hierarchy:W.read(store).data.hierarchy,links:read(store)}}
function mount(){
 if(!D||!H||!W||!L||!S||!root.document)return false;
 const parent=document.getElementById('ite40-document-staging');if(!parent||document.getElementById('ite40-document-history'))return false;
 const panel=element('section');panel.id='ite40-document-history';panel.className='panel';
 panel.append(element('h3','Storico documentale — cliente, sede, impianto e intervento'));
 panel.append(element('p','Collegamenti e cronologia di soli metadati locali. Nessun PDF o dato reale viene trasferito. I moduli tecnici originali restano separati.'));
 const status=element('p');status.setAttribute('role','status');panel.append(status);
 const form=element('div');form.className='grid';panel.append(form);
 function choice(label){const l=element('label',label),s=element('select');l.append(s);form.append(l);return s}
 const doc=choice('Documento'),plant=choice('Impianto'),device=choice('Apparecchiatura'),appointment=choice('Appuntamento'),intervention=choice('Intervento');
 const noteLabel=element('label','Nota collegamento'),note=element('input');noteLabel.append(note);form.append(noteLabel);
 const filter=choice('Filtra cronologia per cliente'),siteFilter=choice('Filtra per sede'),plantFilter=choice('Filtra per impianto');
 const list=element('div');panel.append(list);
 function options(sel,values,selected){sel.replaceChildren();for(const [id,label] of values){const o=element('option',label);o.value=id;sel.append(o)}if(values.some(x=>x[0]===selected))sel.value=selected}
 function populate(){
  const {registry,hierarchy,links}=snapshot(localStorage);
  const selectedDoc=doc.value,selectedFilter=filter.value,selectedSite=siteFilter.value,selectedPlantFilter=plantFilter.value;
  options(doc,[['','Seleziona documento'],...registry.items.map(x=>[x.id,x.filename+' — '+x.type])],selectedDoc);
  options(filter,[['','Tutti i clienti'],...hierarchy.clients.map(x=>[x.id,x.name||x.id])],selectedFilter);
  options(siteFilter,[['','Tutte le sedi'],...hierarchy.sites.filter(x=>!filter.value||x.clientId===filter.value).map(x=>[x.id,x.address||x.id])],selectedSite);
  options(plantFilter,[['','Tutti gli impianti'],...hierarchy.plants.filter(x=>!siteFilter.value||x.siteId===siteFilter.value).map(x=>[x.id,x.description||x.id])],selectedPlantFilter);
  const selected=registry.items.find(x=>x.id===doc.value),siteId=selected&&selected.siteId;
  options(plant,[['','Nessun impianto'],...hierarchy.plants.filter(x=>x.siteId===siteId).map(x=>[x.id,x.description||x.id])],plant.value);
  options(device,[['','Nessuna apparecchiatura'],...hierarchy.devices.filter(x=>x.plantId===plant.value).map(x=>[x.id,x.description||x.id])],device.value);
  options(appointment,[['','Nessun appuntamento'],...hierarchy.appointments.filter(x=>x.siteId===siteId&&x.clientId===(selected&&selected.clientId)).map(x=>[x.id,x.start+' — '+x.operator])],appointment.value);
  options(intervention,[['','Nessun intervento'],...hierarchy.interventions.filter(x=>x.appointmentId===appointment.value).map(x=>[x.id,x.id+' — '+x.status])],intervention.value);
  return links.find(x=>x.documentId===doc.value);
 }
 function showLink(){
  plant.value='';device.value='';appointment.value='';intervention.value='';
  const current=populate();
  if(current){
   plant.value=current.plantId||'';appointment.value=current.appointmentId||'';
   populate();
   device.value=current.deviceId||'';intervention.value=current.interventionId||'';
   note.value=current.note||'';
  }else note.value='';
 }
 doc.addEventListener('change',showLink);
 plant.addEventListener('change',()=>{device.value='';populate()});
 appointment.addEventListener('change',()=>{intervention.value='';populate()});
 filter.addEventListener('change',()=>{siteFilter.value='';plantFilter.value='';render()});
 siteFilter.addEventListener('change',()=>{plantFilter.value='';render()});
 plantFilter.addEventListener('change',render);
 function action(label,fn){const b=element('button',label);b.type='button';b.addEventListener('click',()=>{try{fn()}catch(e){status.textContent='Operazione rifiutata: '+e.message}});panel.append(b)}
 action('Salva collegamento documentale',()=>{
  if(!doc.value)throw Error('DOCUMENTO_OBBLIGATORIO');
  const s=snapshot(localStorage),next=L.link(s.links,{documentId:doc.value,plantId:plant.value||null,deviceId:device.value||null,appointmentId:appointment.value||null,interventionId:intervention.value||null,note:note.value.trim()},s.registry,s.hierarchy);
  save(localStorage,next,s.registry,s.hierarchy);status.textContent='Collegamento salvato nel browser.';render();
 });
 action('Rimuovi collegamento',()=>{
  if(!doc.value)throw Error('DOCUMENTO_OBBLIGATORIO');
  const s=snapshot(localStorage);save(localStorage,L.unlink(s.links,doc.value,s.registry,s.hierarchy),s.registry,s.hierarchy);status.textContent='Collegamento rimosso.';render();
 });
 action('Ripristina collegamenti precedenti',()=>{
  const raw=localStorage.getItem(PREV);if(!raw)throw Error('BACKUP_NON_DISPONIBILE');
  const s=snapshot(localStorage),candidate=JSON.parse(raw);L.validateLinks(candidate,s.registry,s.hierarchy);
  if(!confirm('Ripristinare i collegamenti precedenti?'))return;
  save(localStorage,candidate,s.registry,s.hierarchy);status.textContent='Collegamenti ripristinati.';render();
 });
 action('Controlla archivi ed esporta rapporto JSON',()=>{
  const audit=root.ITECrossArchiveAudit;if(!audit)throw Error('MOTORE_AUDIT_NON_DISPONIBILE');
  const bundle=audit.capture(localStorage,S.KEY,KEY);
  const report=bundle.report;
  status.textContent='Controllo archivi: '+report.documents+' documenti, '+report.linked+' collegati, '+report.issues.length+' anomalie.';
  const blob=new Blob([audit.exportJSON(bundle)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=element('a');
  anchor.href=url;anchor.download='ite40-rapporto-archivi-demo.json';anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 action('Prepara piano riconciliazione (sola lettura)',()=>{
  const planner=root.ITEReconciliationPlanner;
  if(!planner)throw Error('PIANIFICATORE_NON_DISPONIBILE');
  const atomic=W.read(localStorage),s=snapshot(localStorage);
  const plan=planner.plan(atomic,s.registry,s.links);
  if(W.read(localStorage).revision!==plan.sourceRevision)throw Error('ARCHIVIO_MODIFICATO_RICARICARE');
  const review=planner.review(plan,plan.sourceRevision);
  const previous=document.getElementById('ite40-reconciliation-results');
  if(previous)previous.remove();
  const results=element('section');results.id='ite40-reconciliation-results';
  results.append(element('h4','Piano di riconciliazione — nessuna modifica automatica'));
  results.append(element('p','Revisione '+plan.sourceRevision+' · '+plan.report.documents+' documenti · '+plan.blocked.length+' anomalie bloccanti · '+plan.suggestions.length+' verifiche · pronto: '+(review.ready?'sì':'no')));
  for(const item of plan.blocked.slice(0,100))results.append(element('p','Da correggere: '+(item.documentId||'collegamento')+' — '+item.reason));
  for(const item of plan.suggestions.slice(0,100))results.append(element('p','Proposta: '+item.documentId+' — '+item.action+' ('+item.reason+')'));
  if(plan.blocked.length+plan.suggestions.length>200)results.append(element('p','Visualizzazione limitata ai primi 100 elementi per gruppo.'));
  panel.append(results);
  status.textContent='Piano generato in sola lettura. Nessun dato modificato o trasmesso.';
 });
 action('Verifica integrità collegamenti',()=>{
  const s=snapshot(localStorage),r=L.reconcile(s.registry,s.hierarchy,s.links);
  status.textContent='Documenti '+r.documents+' · collegati '+r.linked+' · non collegati '+r.unlinked+' · riferimenti non validi '+r.invalidLinks.length+' · documenti orfani '+r.orphaned.length;
 });
 function render(){
  const s=snapshot(localStorage);populate();list.replaceChildren();const report=L.reconcile(s.registry,s.hierarchy,s.links);
  const warning=element('p','Documenti '+report.documents+' · collegati '+report.linked+' · senza collegamento '+report.unlinked+' · anomalie '+(report.invalidLinks.length+report.orphaned.length));list.append(warning);
  if(report.invalidLinks.length||report.orphaned.length)list.append(element('p','Attenzione: '+report.invalidLinks.length+' collegamenti incoerenti e '+report.orphaned.length+' documenti orfani. I documenti validi restano consultabili; correggere le anomalie prima di modificare i collegamenti.'));
  const result=L.inspect(s.registry,s.hierarchy,s.links,{clientId:filter.value||undefined,siteId:siteFilter.value||undefined,plantId:plantFilter.value||undefined});
  const rows=result.rows;
  for(const row of rows){const item=element('div');item.className='item';item.append(element('strong',row.date+' — '+row.filename));const site=s.hierarchy.sites.find(x=>x.id===row.siteId),plantRecord=s.hierarchy.plants.find(x=>x.id===row.plantId),job=s.hierarchy.interventions.find(x=>x.id===row.interventionId);item.append(element('p',row.type+' · '+row.status+' · sede '+(site?(site.address||site.id):'—')+' · impianto '+(plantRecord?(plantRecord.description||plantRecord.id):'—')+' · intervento '+(job?(job.id+' ('+job.status+')'):'—')));list.append(item)}
  if(!rows.length)list.append(element('p','Nessun documento per il filtro selezionato.'));
 }
 parent.append(panel);try{render();showLink()}catch(e){status.textContent='Storico da verificare: '+e.message}return true;
}
root.ITEDocumentHistoryUI=Object.freeze({mount,read,save,KEY,PREV});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ITEDocumentHistoryUI;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
