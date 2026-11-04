/* I.T.E. 4.0 — fascicolo tecnico integrato, solo metadati locali.
 * I PDF non vengono letti o inviati; la demo pubblica va usata solo con dati fittizi.
 */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace, I=root.ITEDocumentIntake, D=root.ITETechnicalDossier;
const KEY='ite40_document_intake_v1';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opt=(id,label)=>'<option value="'+escape(id)+'">'+escape(label)+'</option>';
function read(storage){
 const master=H.load(storage),raw=storage.getItem(KEY);
 const queue=raw?I.importJSON(raw):I.empty();
 const state=D.load(storage,queue,master);
 return {master,queue,state};
}
function choices(master,queue,state,clientId,siteId){
 const clients=master.clients.map(x=>({id:x.id,label:x.name||x.id}));
 const sites=master.sites.filter(x=>!clientId||x.clientId===clientId).map(x=>({id:x.id,label:x.address||x.id}));
 const plants=master.plants.filter(x=>!siteId||x.siteId===siteId).map(x=>({id:x.id,label:x.name||x.description||x.id}));
 const plantIds=new Set(plants.map(x=>x.id));
 const devices=master.devices.filter(x=>!siteId||plantIds.has(x.plantId)).map(x=>({id:x.id,label:x.model||x.name||x.id}));
 const documents=queue.items.filter(x=>['VERIFICATO','ARCHIVIATO'].includes(x.status)&&['DICO_ELETTRICO','DICO_IDRICO','DIRI','ALLEGATI_GAS','POS','CAD'].includes(x.type)&&(!clientId||x.clientId===clientId)&&(!siteId||x.siteId===siteId)&&!state.links.some(l=>l.documentId===x.id)).map(x=>({id:x.id,label:x.type+' · '+x.filename}));
 return {clients,sites,plants,devices,documents};
}
function mount(doc,storage){
 const host=doc.getElementById('fascicolo-tecnico');if(!host||!H||!I||!D)return false;
 host.innerHTML='<h2>Fascicolo tecnico 4.0 — collaudo</h2><p class="hint">Solo metadati di documenti già verificati. Non importa né modifica PDF, Di.Co., Di.Ri., POS, Allegati GAS o CAD originali. Usare esclusivamente dati fittizi nella demo pubblica.</p><div class="grid"><label>Cliente<select id="dossier-client"></select></label><label>Sede<select id="dossier-site"></select></label><label>Impianto (facoltativo)<select id="dossier-plant"></select></label><label>Apparecchiatura (facoltativa)<select id="dossier-device"></select></label><label>Documento verificato da collegare<select id="dossier-document"></select></label></div><div class="actions"><button type="button" id="dossier-attach">Collega documento verificato</button><button type="button" id="dossier-refresh" class="secondary">Aggiorna fascicolo</button></div><p id="dossier-status" role="status" aria-live="polite"></p><div id="dossier-summary"></div><div id="dossier-results"></div>';
 const $=id=>doc.getElementById(id), ids=['client','site','plant','device','document'];
 const select=id=>$('dossier-'+id);
 const fill=(id,items,emptyLabel)=>{const el=select(id),old=el.value;el.innerHTML=opt('',emptyLabel)+items.map(x=>opt(x.id,x.label)).join('');if(items.some(x=>x.id===old))el.value=old;};
 const status=(s,error=false)=>{const el=$('dossier-status');el.textContent=s;el.style.color=error?'#a03132':''};
 function render(){
  try{
   const {master,queue,state}=read(storage);
   const client=select('client').value,site=select('site').value;
   const c=choices(master,queue,state,client,site);
   fill('client',c.clients,'Seleziona cliente');fill('site',c.sites,'Seleziona sede');
   const selectedSite=select('site').value, selectedClient=select('client').value;
   const current=choices(master,queue,state,selectedClient,selectedSite);
   fill('plant',current.plants,'Nessun impianto');fill('device',current.devices,'Nessuna apparecchiatura');
   fill('document',current.documents,'Seleziona documento');
   const rows=D.dossier(state,queue,master,{clientId:selectedClient||undefined,siteId:selectedSite||undefined});
   $('dossier-summary').textContent=rows.length+' documenti collegati; '+current.documents.length+' verificati disponibili per il collegamento.';
   $('dossier-results').innerHTML=rows.length?rows.map(x=>'<div class="item"><strong>'+escape(x.type)+' · '+escape(x.number||x.filename)+'</strong><small>'+escape(x.documentDate||'Data non indicata')+' · '+escape(x.status)+' · '+escape(x.clientId)+' / '+escape(x.siteId)+'</small></div>').join(''):'<p class="hint">Nessun documento collegato per i filtri selezionati.</p>';
  }catch(e){status('Fascicolo non disponibile: '+e.message,true)}
 }
 function attach(){
  try{
   const {master,queue,state}=read(storage),clientId=select('client').value,siteId=select('site').value,documentId=select('document').value;
   if(!clientId||!siteId||!documentId)throw Error('Selezionare cliente, sede e documento verificato');
   const plantId=select('plant').value,deviceId=select('device').value;
   const next=D.attach(state,queue,master,{clientId,siteId,documentId,plantId,deviceId,linkedAt:new Date().toISOString().slice(0,10)});
   D.save(storage,next,queue,master);status('Collegamento salvato localmente; copia precedente conservata.');render();
  }catch(e){status('Collegamento non eseguito: '+e.message,true)}
 }
 ['client','site'].forEach(id=>select(id).addEventListener('change',render));
 $('dossier-refresh').addEventListener('click',()=>{status('');render()});
 $('dossier-attach').addEventListener('click',attach);
 render();return true;
}
const api=Object.freeze({read,choices,mount});root.ITETechnicalDossierUI=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document&&root.localStorage){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>mount(root.document,root.localStorage));else mount(root.document,root.localStorage)}
})(typeof window!=='undefined'?window:globalThis);
