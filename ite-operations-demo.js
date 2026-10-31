/* Standalone I.T.E. 4.0 demo: synthetic data only, in-memory, never vault access. */
(function(root){'use strict';
const ops=root.ITEOperationsWorkspace;
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node};
let state=ops.empty(),sequence=1;
const seed=[
 ['ADD_CLIENT',{id:'DEMO-C',name:'Cliente fittizio'}],
 ['ADD_SITE',{id:'DEMO-S',name:'Sede fittizia',clientId:'DEMO-C'}],
 ['ADD_SYSTEM',{id:'DEMO-P',name:'Impianto fittizio',siteId:'DEMO-S'}],
 ['ADD_DEVICE',{id:'DEMO-D',name:'Caldaia fittizia',systemId:'DEMO-P'}],
 ['ADD_OPERATOR',{id:'DEMO-T',name:'Tecnico demo'}]
];
state=ops.batch(state,seed).state;
const isoLocal=value=>{const date=new Date(value);if(!value||!Number.isFinite(date.getTime()))throw Error('Data non valida');return date.toISOString()};
const fmt=value=>new Date(value).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});
const localInput=value=>{const d=new Date(value),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
function apply(command){try{state=ops.execute(state,command).state;$('message').textContent='Operazione eseguita nella demo (non salvata).';render()}catch(error){$('message').textContent=error.message}}
function action(appointment,type){
 const at=new Date().toISOString(),base={type,appointmentId:appointment.id,operatorId:'DEMO-T',at};
 if(type==='RESCHEDULE_APPOINTMENT'){
  const start=prompt('Nuovo inizio (AAAA-MM-GGTHH:MM)',localInput(appointment.start));
  if(start===null)return;
  const end=prompt('Nuova fine (AAAA-MM-GGTHH:MM)',localInput(appointment.end));
  if(end===null)return;
  try{base.start=isoLocal(start);base.end=isoLocal(end)}catch(error){$('message').textContent=error.message;return}
 }
 if(type==='CANCEL_APPOINTMENT'){
  const notes=prompt('Motivo annullamento','Cliente indisponibile');if(notes===null)return;base.notes=notes;
 }
 apply(base);
}
function render(){
 const view=ops.dashboard(state),list=$('appointments'),audit=$('audit');
 list.replaceChildren();audit.replaceChildren();
 $('summary').textContent=state.appointments.length+' appuntamenti · '+state.interventions.length+' interventi · '+state.audit.length+' eventi storici';
 if(!view.validation.valid){list.append(el('p','Anomalie: '+view.validation.issues.map(x=>x.type).join(', ')));return}
 for(const appointment of [...state.appointments].sort((a,b)=>a.start.localeCompare(b.start))){
  const card=el('article',undefined,'appointment'),visit=state.interventions.find(x=>x.appointmentId===appointment.id);
  card.append(el('h3',appointment.type+' · '+appointment.id),el('p',fmt(appointment.start)+' – '+fmt(appointment.end)),el('p','Stato: '+appointment.status+(visit?' · Intervento: '+visit.status:''),'small'));
  const actions=el('div',undefined,'actions');
  const allowed=appointment.status==='PLANNED'?['ARRIVE','RESCHEDULE_APPOINTMENT','CANCEL_APPOINTMENT']:appointment.status==='OPEN'||appointment.status==='REOPENED'?['CLOSE']:appointment.status==='CLOSED'?['REOPEN']:[];
  const labels={ARRIVE:'Sono arrivato',CLOSE:'Chiudi intervento',REOPEN:'Revisiona intervento',RESCHEDULE_APPOINTMENT:'Sposta',CANCEL_APPOINTMENT:'Annulla'};
  for(const type of allowed){const button=el('button',labels[type]);button.type='button';if(type==='CANCEL_APPOINTMENT')button.className='danger';button.addEventListener('click',()=>action(appointment,type));actions.append(button)}
  card.append(actions);list.append(card);
 }
 if(!state.appointments.length)list.append(el('p','Nessun appuntamento. Inseriscine uno con il modulo.'));
 for(const event of [...state.audit].reverse()){const row=el('article');row.append(el('strong',event.action+' · '+event.appointmentId),el('p',fmt(event.at)+' · '+event.operatorId+(event.notes?' · '+event.notes:'')));if(event.previous)row.append(el('p','Da '+fmt(event.previous.start)+' a '+fmt(event.updated.start),'small'));audit.append(row)}
 if(!state.audit.length)audit.append(el('p','Nessuna operazione registrata.'));
}
$('new-appointment').addEventListener('submit',event=>{
 event.preventDefault();const data=new FormData(event.currentTarget);
 try{const start=isoLocal(data.get('start')),end=isoLocal(data.get('end'));
  apply({type:'SCHEDULE',item:{id:'DEMO-A-'+sequence++,deviceId:'DEMO-D',operatorId:'DEMO-T',start,end,type:String(data.get('type')||'Manutenzione')}});
 }catch(error){$('message').textContent=error.message}
});
render();
})(window);
