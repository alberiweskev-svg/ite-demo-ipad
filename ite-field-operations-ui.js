/* I.T.E. 4.0 — integrated appointment and field service panel. Synthetic demo data only. */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace,F=root.ITEFieldOperations;
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x};
const stamp=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function mount(){
 if(!root.document||!H||!F||!root.localStorage)return false;
 if(document.getElementById('ite40-field-operations'))return true;
 const host=document.querySelector('main')||document.querySelector('.wrap');if(!host)return false;
 const panel=el('section');panel.id='ite40-field-operations';panel.className='panel';
 panel.append(el('h2','Calendario, appuntamenti e interventi — collaudo 4.0'));
 panel.append(el('p','Dati salvati soltanto nel browser. Non utilizzare dati reali nella demo pubblica.'));
 const status=el('p');status.setAttribute('role','status');panel.append(status);
 const form=el('div');form.className='grid';panel.append(form);
 function field(label,type='text'){const l=el('label',label),i=el('input');i.type=type;l.append(i);form.append(l);return i}
 function select(label){const l=el('label',label),s=el('select');l.append(s);form.append(l);return s}
 const client=select('Cliente'),site=select('Sede'),device=select('Apparecchiatura (facoltativa)'),operator=field('Operatore'),start=field('Inizio appuntamento','datetime-local'),end=field('Fine appuntamento','datetime-local');
 const filter=field('Filtra agenda per operatore'),from=field('Agenda da','datetime-local'),to=field('Agenda fino a','datetime-local');
 const appointment=select('Appuntamento da riprogrammare'),job=select('Intervento'),when=field('Data e ora operazione','datetime-local'),extra=field('Altri lavori eseguiti (facoltativo)'),reason=field('Motivo revisione');
 const result=el('div');panel.append(result);
 const buttons=el('div');buttons.className='actions';panel.append(buttons);
 const state=()=>H.load(localStorage);
 function opts(s,items,placeholder){const old=s.value;s.replaceChildren();const first=el('option',placeholder);first.value='';s.append(first);for(const [id,name] of items){const o=el('option',name);o.value=id;s.append(o)}if(items.some(x=>x[0]===old))s.value=old}
 function refresh(){
  const s=state();
  opts(client,s.clients.map(x=>[x.id,x.name||x.id]),'Seleziona cliente');
  opts(site,s.sites.filter(x=>x.clientId===client.value).map(x=>[x.id,x.address||x.id]),'Seleziona sede');
  opts(device,s.devices.filter(x=>{const p=s.plants.find(p=>p.id===x.plantId);return p&&p.siteId===site.value}).map(x=>[x.id,x.description||x.id]),'Nessuna apparecchiatura');
  opts(appointment,s.appointments.map(x=>[x.id,x.start+' · '+x.operator+' · '+x.id]),'Seleziona appuntamento');
  opts(job,s.interventions.map(x=>[x.id,x.id+' — '+x.status]),'Seleziona intervento');
  result.replaceChildren();
  let rows;
  try{rows=F.agenda(s,filter.value.trim(),from.value,to.value)}catch(e){result.append(el('p','Impostare un intervallo agenda valido.'));return}
  result.append(el('h3','Appuntamenti ('+rows.length+')'));
  const load=F.operatorLoad(s,from.value,to.value);
  result.append(el('p','Carico operatori: '+(load.map(x=>x.operator+' — '+x.appointments+' appuntamenti / '+x.minutes+' minuti').join('; ')||'nessun appuntamento')));
  for(const a of rows){
   const c=s.clients.find(x=>x.id===a.clientId),location=s.sites.find(x=>x.id===a.siteId);
   const jobs=s.interventions.filter(x=>x.appointmentId===a.id);
   const box=el('div');box.className='item';
   box.append(el('strong',a.start+' — '+a.end+' · '+a.operator));
   box.append(el('p',(c?.name||a.clientId)+' · '+(location?.address||a.siteId)+' · '+(jobs.length?jobs.map(x=>x.id+' '+x.status).join(', '):'Da eseguire')));
   const b=el('button','Sono arrivato');b.type='button';b.disabled=jobs.length>0;
   b.addEventListener('click',()=>act(()=>{const now=when.value||stamp();const next=F.start(state(),a.id,a.operator,'INT-'+Date.now().toString(36),now);H.save(localStorage,next);return 'Arrivo registrato'}));
   box.append(b);result.append(box);
  }
 }
 function act(fn){try{status.textContent=fn();refresh()}catch(e){status.textContent='Operazione non eseguita: '+e.message}}
 function button(label,fn){const b=el('button',label);b.type='button';b.addEventListener('click',()=>act(fn));buttons.append(b)}
 button('Registra appuntamento',()=>{
  const id='APP-'+Date.now().toString(36);
  H.save(localStorage,F.schedule(state(),{id,clientId:client.value,siteId:site.value,...(device.value?{deviceId:device.value}:{}),operator:operator.value.trim(),start:start.value,end:end.value}));
  return 'Appuntamento registrato: '+id;
 });
 button('Riprogramma appuntamento',()=>{
  if(!appointment.value)throw Error('SELEZIONARE_APPUNTAMENTO');
  const next=F.reschedule(state(),appointment.value,{start:start.value,end:end.value,operator:operator.value.trim()},operator.value.trim(),when.value||stamp());
  H.save(localStorage,next);return 'Appuntamento riprogrammato con storico';
 });
 button('Chiudi intervento',()=>{
  if(!job.value)throw Error('SELEZIONARE_INTERVENTO');
  H.save(localStorage,F.close(state(),job.value,when.value||stamp(),extra.value.trim()?[{description:extra.value.trim()}]:[]));return 'Intervento chiuso';
 });
 button('Riapri per revisione',()=>{
  if(!job.value)throw Error('SELEZIONARE_INTERVENTO');
  H.save(localStorage,F.reopen(state(),job.value,operator.value.trim(),when.value||stamp(),reason.value));return 'Intervento riaperto con storico';
 });
 button('Concludi revisione',()=>{
  if(!job.value)throw Error('SELEZIONARE_INTERVENTO');
  H.save(localStorage,F.revise(state(),job.value,operator.value.trim(),{},when.value||stamp()));return 'Revisione conclusa';
 });
 button('Aggiorna agenda',()=>{refresh();return 'Agenda aggiornata'});
 client.addEventListener('change',()=>{site.value='';device.value='';refresh()});
 site.addEventListener('change',()=>{device.value='';refresh()});
 filter.addEventListener('change',refresh);from.addEventListener('change',refresh);to.addEventListener('change',refresh);
 const day=stamp().slice(0,10);from.value=day+'T00:00';to.value=day+'T23:59';when.value=stamp();
 host.append(panel);try{refresh()}catch(e){status.textContent='Archivio non disponibile: '+e.message}
 return true;
}
const api=Object.freeze({mount});root.ITEFieldOperationsUI=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
