/* I.T.E. 4.0.27 — Agenda operativa TEST integrata con archivio 4.0. */
(function(root){'use strict';
const dispatch=root.ITE40Dispatch,workspace=root.ITEOperationsWorkspace40;
if(!dispatch||!workspace||typeof document==='undefined')return;
let ws;try{ws=workspace.create()}catch(_){return}
const section=document.createElement('section');section.id='ite40-dispatch';section.className='panel';
section.innerHTML='<h2>Agenda interventi 4.0 — TEST</h2><p class="hint">Appuntamenti, tecnici, carichi, riprogrammazioni e annullamenti nello stesso archivio operativo TEST. Nessun dato reale.</p><div class="grid"><label>Dal giorno<input type="date" id="dispatch-from"></label><label>Al giorno<input type="date" id="dispatch-to"></label><label>Tecnico<select id="dispatch-operator"><option value="">Tutti i tecnici</option></select></label></div><div class="actions"><button type="button" id="dispatch-refresh">Aggiorna agenda</button></div><p role="status" id="dispatch-message"></p><div id="dispatch-summary"></div><div id="dispatch-rows"></div><div id="dispatch-audit"></div>';
(document.querySelector('.wrap')||document.querySelector('main')||document.body).appendChild(section);
const $=s=>section.querySelector(s),from=$('#dispatch-from'),to=$('#dispatch-to'),operator=$('#dispatch-operator');
const localDay=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day};
const now=new Date();from.value=localDay(now);to.value=localDay(new Date(now.getTime()+6*86400000));
const message=(s,bad)=>{const n=$('#dispatch-message');n.textContent=s;n.style.color=bad?'#a03132':'#17603b'};
const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n};
const isoLocal=v=>{const d=new Date(v);if(!Number.isFinite(d.getTime()))throw Error('DATA_NON_VALIDA');return d.toISOString()};
function bounds(){if(!from.value||!to.value)throw Error('PERIODO_OBBLIGATORIO');const a=new Date(from.value+'T00:00:00'),b=new Date(to.value+'T00:00:00');b.setDate(b.getDate()+1);if(!(b>a)||b-a>93*86400000)throw Error('PERIODO_NON_VALIDO_MAX_92_GIORNI');return [a.toISOString(),b.toISOString()]}
function render(){
 const state=ws.read(),previous=operator.value;
 operator.replaceChildren(new Option('Tutti i tecnici',''));
 for(const o of state.operators)operator.add(new Option(o.name+' ('+o.id+')',o.id));
 if([...operator.options].some(o=>o.value===previous))operator.value=previous;
 const [a,b]=bounds(),rows=dispatch.calendar(state,a,b,operator.value||undefined),load=dispatch.workload(state,a,b),issues=dispatch.audit(state);
 const summary=$('#dispatch-summary');summary.replaceChildren(el('h3','Carico tecnici'));
 for(const [id,x] of Object.entries(load)){if(operator.value&&id!==operator.value)continue;summary.appendChild(el('p',x.operatorName+': '+x.appointments+' appuntamenti, '+x.scheduledMinutes+' min programmati, '+x.workedMinutes+' min lavorati'))}
 const host=$('#dispatch-rows');host.replaceChildren(el('h3','Appuntamenti ('+rows.length+')'));
 for(const r of rows){
  const card=el('article','');card.className='item';
  card.appendChild(el('strong',r.clientName+' — '+r.id));
  card.appendChild(el('p',new Date(r.start).toLocaleString('it-IT')+' / '+new Date(r.end).toLocaleString('it-IT')+' | '+r.operatorName+' | '+r.status));
  card.appendChild(el('p',(r.siteAddress||'Sede non disponibile')+' | '+(r.device||'Impianto senza apparecchiatura')));
  if(r.status==='PROGRAMMATO'){
   const form=document.createElement('form');form.dataset.id=r.id;
   const start=el('label','Nuovo inizio'),end=el('label','Nuova fine'),tech=el('label','Tecnico');
   const startInput=document.createElement('input'),endInput=document.createElement('input'),select=document.createElement('select');
   for(const [input,value] of [[startInput,r.start],[endInput,r.end]]){input.type='datetime-local';const d=new Date(value);input.value=localDay(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');input.required=true}
   startInput.name='start';endInput.name='end';select.name='operatorId';
   for(const o of state.operators)select.add(new Option(o.name,o.id));select.value=r.operatorId;
   start.appendChild(startInput);end.appendChild(endInput);tech.appendChild(select);
   const reason=el('label','Motivo annullamento'),reasonInput=document.createElement('input');reasonInput.name='reason';reasonInput.maxLength=300;reason.appendChild(reasonInput);
   const save=el('button','Riprogramma'),cancel=el('button','Annulla appuntamento');save.type='submit';cancel.type='button';cancel.className='secondary';cancel.dataset.cancel=r.id;
   form.append(start,end,tech,save,reason,cancel);card.appendChild(form);
  }
  host.appendChild(card);
 }
 const audit=$('#dispatch-audit');audit.replaceChildren(el('h3','Verifica pianificazione: '+issues.length+' anomalie'));
 for(const issue of issues)audit.appendChild(el('p',issue.code+' — '+issue.appointmentId));
}
section.addEventListener('submit',e=>{const form=e.target.closest('form[data-id]');if(!form)return;e.preventDefault();try{const d=Object.fromEntries(new FormData(form).entries());ws.transact(s=>dispatch.reschedule(s,form.dataset.id,{start:isoLocal(d.start),end:isoLocal(d.end),operatorId:d.operatorId},'TEST-AGENDA',new Date().toISOString()));message('Appuntamento riprogrammato e storico aggiornato');render()}catch(err){message('Non salvato: '+err.message,true)}});
section.addEventListener('click',e=>{const b=e.target.closest('[data-cancel]');if(!b)return;try{const reason=b.closest('form').querySelector('[name=reason]').value;ws.transact(s=>dispatch.cancel(s,b.dataset.cancel,'TEST-AGENDA',new Date().toISOString(),reason));message('Appuntamento annullato e storico aggiornato');render()}catch(err){message('Non salvato: '+err.message,true)}});
$('#dispatch-refresh').addEventListener('click',()=>{try{render();message('Agenda aggiornata')}catch(err){message(err.message,true)}});
for(const n of [from,to,operator])n.addEventListener('change',()=>{try{render()}catch(err){message(err.message,true)}});
try{render()}catch(err){message('Archivio TEST non disponibile: '+err.message,true)}
})(typeof window!=='undefined'?window:globalThis);
