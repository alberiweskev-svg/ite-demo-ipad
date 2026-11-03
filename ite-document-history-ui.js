/* I.T.E. 4.0 — document history UI, local metadata only.
 * Does not store PDF bytes or alter legacy technical modules.
 */
(function(root){'use strict';
const D=root.ITEDocumentIntake,H=root.ITEHierarchyWorkspace,W=root.ITEAtomicWorkspace,L=root.ITEDocumentHistory,S=root.ITEDocumentStagingUI;
const KEY='ite40_document_history_links_v1',PREV=KEY+'_previous';
const element=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n};
function read(store){const raw=store.getItem(KEY);if(raw===null)return [];const x=JSON.parse(raw);if(!Array.isArray(x))throw Error('STORICO_NON_VALIDO');return x}
function save(store,links,registry,hierarchy){const checked=L.validateLinks(links,registry,hierarchy),old=store.getItem(KEY);if(old!==null)store.setItem(PREV,old);store.setItem(KEY,JSON.stringify(checked));return checked}
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
 const filter=choice('Filtra cronologia per cliente');
 const list=element('div');panel.append(list);
 function options(sel,values,selected){sel.replaceChildren();for(const [id,label] of values){const o=element('option',label);o.value=id;sel.append(o)}if(values.some(x=>x[0]===selected))sel.value=selected}
 function populate(){
  const {registry,hierarchy,links}=snapshot(localStorage);
  const previousDoc=doc.value,previousFilter=filter.value;
  options(doc,[['','Seleziona documento'],...registry.items.map(x=>[x.id,x.filename+' — '+x.type])],previousDoc);
  options(filter,[['','Tutti i clienti'],...hierarchy.clients.map(x=>[x.id,x.name||x.id])],previousFilter);
  const selected=registry.items.find(x=>x.id===doc.value),siteId=selected&&selected.siteId;
  const plants=hierarchy.plants.filter(x=>x.siteId===siteId),plantId=plant.value;
  options(plant,[['','Nessun impianto'],...plants.map(x=>[x.id,x.description||x.id])],plantId);
  const devices=hierarchy.devices.filter(x=>x.plantId===plant.value);
  options(device,[['','Nessuna apparecchiatura'],...devices.map(x=>[x.id,x.description||x.id])],device.value);
  const appointments=hierarchy.appointments.filter(x=>x.siteId===siteId&&x.clientId===(selected&&selected.clientId));
  options(appointment,[['','Nessun appuntamento'],...appointments.map(x=>[x.id,x.start+' — '+x.operator])],appointment.value);
  options(intervention,[['','Nessun intervento'],...hierarchy.interventions.filter(x=>x.appointmentId===appointment.value).map(x=>[x.id,x.id+' — '+x.status])],intervention.value);
  const current=links.find(x=>x.documentId===doc.value);
  return current;
 }
 function showLink(){const current=populate();if(current){plant.value=current.plantId||'';populate();device.value=current.deviceId||'';appointment.value=current.appointmentId||'';populate();intervention.value=current.interventionId||'';note.value=current.note||''}else note.value=''}
 doc.addEventListener('change',showLink);
 plant.addEventListener('change',()=>{device.value='';populate()});
 appointment.addEventListener('change',()=>{intervention.value='';populate()});
 filter.addEventListener('change',render);
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
 action('Verifica integrità collegamenti',()=>{
  const s=snapshot(localStorage),r=L.reconcile(s.registry,s.hierarchy,s.links);
  status.textContent='Documenti '+r.documents+' · collegati '+r.linked+' · non collegati '+r.unlinked+' · riferimenti non validi '+r.invalidLinks.length+' · documenti orfani '+r.orphaned.length;
 });
 function render(){
  const s=snapshot(localStorage);list.replaceChildren();const report=L.reconcile(s.registry,s.hierarchy,s.links);
  const warning=element('p','Documenti '+report.documents+' · collegati '+report.linked+' · senza collegamento '+report.unlinked+' · anomalie '+(report.invalidLinks.length+report.orphaned.length));list.append(warning);
  if(report.invalidLinks.length||report.orphaned.length){list.append(element('p','Riferimenti incoerenti: correggere anagrafiche e collegamenti prima di consultare lo storico.'));return}
  const rows=L.timeline(s.registry,s.hierarchy,s.links,{clientId:filter.value||undefined});
  for(const row of rows){const item=element('div');item.className='item';item.append(element('strong',row.date+' — '+row.filename));item.append(element('p',row.type+' · '+row.status+' · sede '+(row.siteId||'—')+' · impianto '+(row.plantId||'—')+' · intervento '+(row.interventionId||'—')));list.append(item)}
  if(!rows.length)list.append(element('p','Nessun documento per il filtro selezionato.'));
 }
 parent.append(panel);try{render();showLink()}catch(e){status.textContent='Storico da verificare: '+e.message}return true;
}
root.ITEDocumentHistoryUI=Object.freeze({mount,read,save,KEY,PREV});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ITEDocumentHistoryUI;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
