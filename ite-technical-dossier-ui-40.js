/* I.T.E. 4.0.46 — TEST dossier interface. Metadata only; never stores PDF bytes. */
(function(root){'use strict';if(typeof document==='undefined')return;
const KEY='ITE40_TECH_DOSSIER_TEST_1';
function hierarchy(){
 const api=root.ITEWorkflowBridge40,engine=root.ITEWorkflows40;
 if(!api||!engine)throw Error('Motore appuntamenti TEST non caricato');
 const store=api.create(root.localStorage,engine);store.load();
 const d=store.get();return {clients:d.clients,sites:d.sites,plants:d.plants,equipment:d.equipment,appointments:d.appointments};
}
function mount(){
 const api=root.ITETechnicalDossier40,host=document.getElementById('importazioni')||document.getElementById('anagrafiche');
 if(!api||!host)return;
 const panel=document.createElement('section');panel.className='panel';panel.id='ite-dossier-test';
 const title=document.createElement('h3');title.textContent='Fascicolo tecnico — TEST 4.0.46';
 const note=document.createElement('p');note.className='hint';note.textContent='Di.Co. elettrica/idrica, Di.Ri., Allegati GAS, POS, CAD e rapporti. Solo metadati e impronta PDF; nessun PDF viene salvato o inviato. Non sostituisce i moduli 2.7.5.';
 const message=document.createElement('p');message.setAttribute('aria-live','polite');
 const form=document.createElement('form');form.className='grid';
 function field(label,kind='text'){const l=document.createElement('label');l.textContent=label;const e=document.createElement(kind==='select'?'select':'input');if(kind!=='select')e.type=kind;e.required=true;l.append(e);form.append(l);return e}
 const docId=field('ID documento TEST'),type=field('Tipo documento','select'),name=field('Titolo'),day=field('Data','date'),operator=field('ID operatore TEST');
 const client=field('Cliente','select'),site=field('Sede','select'),plant=field('Impianto','select'),equipment=field('Apparecchiatura','select'),appointment=field('Appuntamento (facoltativo)','select');
 const save=document.createElement('button');save.type='submit';save.textContent='Crea bozza TEST';form.append(save);
 for(const t of api.TYPES){const o=document.createElement('option');o.value=t;o.textContent=t;type.append(o)}
 day.value=new Date().toISOString().slice(0,10);operator.value='TEST-TECNICO1';docId.placeholder='TEST-DOC-001';
 const list=document.createElement('select'),file=document.createElement('input');file.type='file';file.accept='application/pdf,.pdf';
 const attachmentId=document.createElement('input');attachmentId.placeholder='TEST-PDF-001';attachmentId.value='TEST-PDF-001';
 const attach=document.createElement('button');attach.type='button';attach.textContent='Verifica PDF locale e registra impronta';
 const transitions=document.createElement('div');transitions.className='actions';
 const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='Esporta fascicolo JSON TEST';
 const restore=document.createElement('input');restore.type='file';restore.accept='.json,application/json';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Aggiorna collegamenti TEST';
 const filters=document.createElement('div');filters.className='grid';
 const filterClient=document.createElement('select'),filterType=document.createElement('select'),filterState=document.createElement('select');
 for(const [el,caption,values] of [[filterType,'Tutti i tipi',api.TYPES],[filterState,'Tutti gli stati',api.STATES]]){
   const all=document.createElement('option');all.value='';all.textContent=caption;el.append(all);
   for(const value of values){const opt=document.createElement('option');opt.value=value;opt.textContent=value;el.append(opt)}
 }
 const filterLabel=(caption,el)=>{const l=document.createElement('label');l.textContent=caption;l.append(el);filters.append(l)};
 filterLabel('Filtra cliente',filterClient);filterLabel('Filtra tipo',filterType);filterLabel('Filtra stato',filterState);
 const summary=document.createElement('p');summary.className='hint';summary.setAttribute('aria-live','polite');
 const output=document.createElement('pre');output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:350px;overflow:auto';
 panel.append(title,note,message,form,list,attachmentId,file,attach,transitions,refresh,exportButton,restore,filters,summary,output);host.append(panel);
 let db;try{db=JSON.parse(root.localStorage.getItem(KEY)||'null')||api.empty()}catch(e){db=api.empty();message.textContent='Archivio TEST non leggibile: inizializzato archivio vuoto (nessun dato precedente sovrascritto)'}
 function options(el,rows,optional){const old=el.value;el.replaceChildren();if(optional){const o=document.createElement('option');o.value='';o.textContent='Nessuno';el.append(o)}
 for(const row of rows){const o=document.createElement('option');o.value=row.id;o.textContent=(row.name||row.nome||row.id)+' ('+row.id+')';el.append(o)}if([...el.options].some(o=>o.value===old))el.value=old}
 function linked(){const h=hierarchy();options(client,h.clients);options(site,h.sites.filter(x=>x.clientId===client.value));options(plant,h.plants.filter(x=>x.siteId===site.value),true);options(equipment,h.equipment.filter(x=>x.plantId===plant.value),true);options(appointment,h.appointments.filter(x=>x.clientId===client.value&&x.siteId===site.value),true);return h}
 client.addEventListener('change',linked);site.addEventListener('change',linked);plant.addEventListener('change',linked);
 function persist(next){api.validate(next,hierarchy());root.localStorage.setItem(KEY,api.exportJson(next,hierarchy()));db=next;render()}
 function render(){const h=linked();api.validate(db,h);options(list,db.documents);output.textContent=db.documents.map(d=>d.id+' | '+d.type+' | '+d.state+' | '+d.title+' | PDF '+d.attachments.length).join('\n')||'Nessun documento TEST';}
 function run(fn){try{fn();message.textContent='Operazione TEST completata'}catch(e){message.textContent='Operazione rifiutata: '+e.message}}
 form.addEventListener('submit',e=>{e.preventDefault();run(()=>{const link={clientId:client.value,siteId:site.value};if(plant.value)link.plantId=plant.value;if(equipment.value)link.equipmentId=equipment.value;if(appointment.value)link.appointmentId=appointment.value;persist(api.create(db,hierarchy(),{id:docId.value.trim(),type:type.value,title:name.value.trim(),date:day.value,link},operator.value.trim()))})});
 attach.addEventListener('click',async()=>{try{const f=file.files&&file.files[0];if(!f||f.size<1||f.size>25000000||f.type&&f.type!=='application/pdf'||!f.name.toLowerCase().endsWith('.pdf'))throw Error('Selezionare un PDF valido, massimo 25 MB');if(!root.crypto||!root.crypto.subtle)throw Error('SHA-256 non disponibile su questa connessione');const bytes=new Uint8Array(await f.arrayBuffer());if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('Intestazione PDF non valida');const hash=await root.crypto.subtle.digest('SHA-256',bytes);const sha256=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');persist(api.attach(db,hierarchy(),list.value,{id:attachmentId.value.trim(),name:f.name,mime:'application/pdf',bytes:f.size,sha256},operator.value.trim(),day.value));file.value='';message.textContent='Impronta registrata; il PDF non è stato archiviato'}catch(e){message.textContent='PDF rifiutato: '+e.message}});
 for(const [label,target] of [['Invia in revisione','REVIEW'],['Approva','APPROVED'],['Archivia','ARCHIVED'],['Riapri bozza','DRAFT']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>run(()=>persist(api.transition(db,hierarchy(),list.value,target,operator.value.trim(),day.value))));transitions.append(button)}
 for(const el of [filterClient,filterType,filterState])el.addEventListener('change',()=>run(render));
 refresh.addEventListener('click',()=>run(render));
 exportButton.addEventListener('click',()=>run(()=>{const blob=new Blob([api.exportJson(db,hierarchy())],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ite-fascicolo-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}));
 restore.addEventListener('change',async()=>{try{const f=restore.files[0];if(!f||f.size>2000000)throw Error('File JSON troppo grande');persist(api.importJson(await f.text(),hierarchy()));message.textContent='Ripristino TEST validato'}catch(e){message.textContent='Ripristino rifiutato: '+e.message}finally{restore.value=''}});
 try{render()}catch(e){message.textContent='Prima sincronizzare la gerarchia TEST dal pannello appuntamenti: '+e.message}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
