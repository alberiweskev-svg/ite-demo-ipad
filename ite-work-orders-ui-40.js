/* I.T.E. 4.0.30 — Ordini di lavoro: interfaccia integrata, solo dati TEST. */
(function(root){'use strict';
const engine=root.ITE40WorkOrders, workspace=root.ITEOperationsWorkspace40;
if(!engine||!workspace||typeof document==='undefined')return;
let ws;try{ws=workspace.create()}catch(_){return}
const section=document.createElement('section');section.id='ite40-work-orders';section.className='panel';
const title=document.createElement('h2');title.textContent='Ordini di lavoro — TEST';
const info=document.createElement('p');info.className='hint';info.textContent='Fascicolo collegato ad appuntamenti, interventi, preventivi ed Extra. Solo riferimenti documentali TEST: non caricare PDF reali.';
const status=document.createElement('p');status.setAttribute('role','status');
const actions=document.createElement('div');actions.className='actions';
const appointment=document.createElement('select');appointment.setAttribute('aria-label','Appuntamento TEST');
const createButton=document.createElement('button');createButton.textContent='Crea ordine da appuntamento';createButton.type='button';
const refresh=document.createElement('button');refresh.textContent='Aggiorna ordini';refresh.type='button';refresh.className='secondary';
actions.append(appointment,createButton,refresh);
const host=document.createElement('div');section.append(title,info,actions,status,host);
(document.querySelector('.wrap')||document.querySelector('main')||document.body).appendChild(section);
const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n};
const select=(items,placeholder)=>{const n=document.createElement('select');n.add(new Option(placeholder,''));for(const [value,label] of items)n.add(new Option(label,value));return n};
const btn=(text,fn)=>{const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b};
const actor='TEST-ORDINI';
const stamp=()=>new Date().toISOString();
const safe=(x)=>String(x||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,55);
const newid=prefix=>'TEST-'+prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
function run(fn){try{ws.transact(fn);status.textContent='Operazione salvata nell’archivio TEST';render()}catch(e){status.textContent='Operazione non salvata: '+e.message}}
function labelField(parent,name,node){const l=el('label',name);l.appendChild(node);parent.appendChild(l);return node}
function render(){
 const s=ws.read();host.replaceChildren();appointment.replaceChildren();
 appointment.add(new Option('Seleziona appuntamento TEST',''));
 for(const a of s.appointments){const c=s.clients.find(x=>x.id===a.clientId);appointment.add(new Option((c?.name||a.clientId)+' · '+a.start+' · '+a.id,a.id))}
 const orders=s.workOrders||[];
 host.appendChild(el('p','Ordini registrati: '+orders.length));
 for(const w of orders){
  const card=document.createElement('article');card.className='item';
  const a=s.appointments.find(x=>x.id===w.appointmentId),c=s.clients.find(x=>x.id===w.clientId),op=s.operators.find(x=>x.id===w.operatorId);
  card.appendChild(el('h3',(c?.name||w.clientId)+' — '+w.id));
  card.appendChild(el('p','Stato: '+w.status+' · Appuntamento: '+(a?.start||w.appointmentId)+' · Tecnico: '+(op?.name||w.operatorId)));
  let dossier;try{dossier=engine.dossier(s,w.id)}catch(e){card.appendChild(el('p','Fascicolo non leggibile: '+e.message));host.appendChild(card);continue}
  const money=n=>(n/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
  card.appendChild(el('p','Fornitura: '+money(dossier.totals.fornituraCents)+' · Posa: '+money(dossier.totals.posaCents)+' · Extra in attesa: '+money(dossier.totals.extraDaApprovareCents)));
  if(dossier.alerts.length)card.appendChild(el('p','Avvisi: '+dossier.alerts.join(', ')));
  const buttons=document.createElement('div');buttons.className='actions';
  buttons.append(btn('Sincronizza intervento',()=>run(x=>engine.synchronize(x,w.id,actor,stamp()))));
  buttons.append(btn('Archivia',()=>run(x=>engine.archive(x,w.id,actor,stamp()))));
  buttons.append(btn('Esporta fascicolo JSON',()=>{const payload=JSON.stringify(engine.dossier(ws.read(),w.id),null,2);const blob=new Blob([payload],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=safe(w.id)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}));
  card.appendChild(buttons);
  if(w.status!=='ARCHIVIATO'){
   const quotes=s.quotes.filter(q=>q.clientId===w.clientId&&!w.quoteIds.includes(q.id));
   if(quotes.length){const q=select(quotes.map(x=>[x.id,x.id+' · '+x.status]),'Seleziona preventivo');const wrap=document.createElement('div');wrap.className='actions';wrap.append(q,btn('Collega preventivo',()=>{if(q.value)run(x=>engine.attachQuote(x,w.id,q.value,actor,stamp()))}));card.appendChild(wrap)}
   const docWrap=document.createElement('div');docWrap.className='grid';
   const types=['DICO_ELETTRICA','DICO_IDRICA','DIRI','ALLEGATI_GAS','POS','CAD','RAPPORTO'];
   const type=labelField(docWrap,'Tipo documento',select(types.map(t=>[t,t]),'Seleziona tipo'));
   const docTitle=document.createElement('input');docTitle.maxLength=120;docTitle.placeholder='Titolo documento TEST';labelField(docWrap,'Descrizione',docTitle);
   docWrap.appendChild(btn('Collega documento TEST',()=>{if(type.value&&docTitle.value.trim())run(x=>engine.attachDocument(x,w.id,{id:newid('DOC'),type:type.value,title:docTitle.value},actor,stamp()))}));
   card.appendChild(docWrap);
   const note=document.createElement('textarea');note.rows=2;note.maxLength=500;note.placeholder='Nota operativa TEST';
   card.append(note,btn('Registra nota',()=>{if(note.value.trim())run(x=>engine.note(x,w.id,note.value,actor,stamp()))}));
  }
  if(w.documents.length){
   card.appendChild(el('h4','Documenti collegati'));
   for(const d of w.documents){const line=document.createElement('div');line.className='actions';line.appendChild(el('span',d.type+' · '+d.title+' · '+d.status));
    if(w.status!=='ARCHIVIATO'){const choice=select(['DA_COMPILARE','IN_REVISIONE','VERIFICATO'].map(v=>[v,v]),'Nuovo stato');choice.value=d.status;line.append(choice,btn('Aggiorna stato',()=>run(x=>engine.documentStatus(x,w.id,d.id,choice.value,actor,stamp()))))}
    card.appendChild(line)}
  }
  card.appendChild(el('p','Revisioni: '+w.history.length+' · Note: '+w.notes.length+' · Preventivi collegati: '+w.quoteIds.length));
  host.appendChild(card);
 }
}
createButton.addEventListener('click',()=>{if(!appointment.value){status.textContent='Selezionare un appuntamento';return}
 const id=appointment.value;run(s=>engine.create(s,{id:newid('ORD'),appointmentId:id},actor,stamp()))});
refresh.addEventListener('click',()=>{try{render();status.textContent='Ordini aggiornati'}catch(e){status.textContent=e.message}});
try{render()}catch(e){status.textContent='Archivio TEST non disponibile: '+e.message}
})(typeof window!=='undefined'?window:globalThis);
