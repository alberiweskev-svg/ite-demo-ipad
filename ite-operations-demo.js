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
 ['ADD_OPERATOR',{id:'DEMO-T',name:'Tecnico demo 1'}],
 ['ADD_OPERATOR',{id:'DEMO-T2',name:'Tecnico demo 2'}]
];
function fresh(){return ops.batch(ops.empty(),seed.map(([type,item])=>({type,item}))).state}
state=fresh();
const isoLocal=value=>{const date=new Date(value);if(!value||!Number.isFinite(date.getTime()))throw Error('Data non valida');return date.toISOString()};
const fmt=value=>new Date(value).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});
const localInput=value=>{const d=new Date(value),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
function apply(command){try{state=ops.execute(state,command).state;$('message').textContent='Operazione eseguita nella demo (non salvata).';render()}catch(error){$('message').textContent=error.message}}
function action(appointment,type){
 const at=new Date().toISOString(),base={type,appointmentId:appointment.id,operatorId:appointment.operatorId,at};
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
 const view=ops.dashboard(state),list=$('appointments'),audit=$('audit'),filter=$('operator-filter').value,day=$('day-filter').value;
 const visible=state.appointments.filter(x=>{if(filter&&x.operatorId!==filter)return false;if(!day)return true;const start=new Date(day+'T00:00:00'),end=new Date(start);end.setDate(end.getDate()+1);return Date.parse(x.start)<end.getTime()&&Date.parse(x.end)>start.getTime()});
 list.replaceChildren();audit.replaceChildren();
 $('summary').textContent=visible.length+' appuntamenti visualizzati su '+state.appointments.length+' totali · '+state.interventions.length+' interventi · '+state.audit.length+' eventi storici';
 if(!view.validation.valid){list.append(el('p','Anomalie: '+view.validation.issues.map(x=>x.type).join(', ')));return}
 for(const appointment of [...visible].sort((a,b)=>a.start.localeCompare(b.start))){
  const card=el('article',undefined,'appointment'),visit=state.interventions.find(x=>x.appointmentId===appointment.id);
  card.append(el('h3',appointment.type+' · '+appointment.id),el('p','Tecnico: '+(appointment.operatorId==='DEMO-T'?'Tecnico demo 1':'Tecnico demo 2'),'small'),el('p',fmt(appointment.start)+' – '+fmt(appointment.end)),el('p','Stato: '+appointment.status+(visit?' · Intervento: '+visit.status:''),'small'));
  const actions=el('div',undefined,'actions');
  const allowed=appointment.status==='PLANNED'?['ARRIVE','RESCHEDULE_APPOINTMENT','CANCEL_APPOINTMENT']:appointment.status==='OPEN'||appointment.status==='REOPENED'?['CLOSE']:appointment.status==='CLOSED'?['REOPEN']:[];
  const labels={ARRIVE:'Sono arrivato',CLOSE:'Chiudi intervento',REOPEN:'Revisiona intervento',RESCHEDULE_APPOINTMENT:'Sposta',CANCEL_APPOINTMENT:'Annulla'};
  for(const type of allowed){const button=el('button',labels[type]);button.type='button';if(type==='CANCEL_APPOINTMENT')button.className='danger';button.addEventListener('click',()=>action(appointment,type));actions.append(button)}
  card.append(actions);list.append(card);
 }
 if(!visible.length)list.append(el('p','Nessun appuntamento. Inseriscine uno con il modulo.'));
 for(const event of [...state.audit].reverse()){const row=el('article');row.append(el('strong',event.action+' · '+event.appointmentId),el('p',fmt(event.at)+' · '+event.operatorId+(event.notes?' · '+event.notes:'')));if(event.previous)row.append(el('p','Da '+fmt(event.previous.start)+' a '+fmt(event.updated.start),'small'));audit.append(row)}
 if(!state.audit.length)audit.append(el('p','Nessuna operazione registrata.'));
}
$('new-appointment').addEventListener('submit',event=>{
 event.preventDefault();const data=new FormData(event.currentTarget);
 try{const start=isoLocal(data.get('start')),end=isoLocal(data.get('end'));
  apply({type:'SCHEDULE',item:{id:'DEMO-A-'+sequence,deviceId:'DEMO-D',operatorId:String(data.get('operatorId')),start,end,type:String(data.get('type')||'Manutenzione')}});
  if(state.appointments.some(x=>x.id==='DEMO-A-'+sequence))sequence++;
 }catch(error){$('message').textContent=error.message}
});
$('load-samples').addEventListener('click',()=>{
 try{
  const day=new Date();day.setDate(day.getDate()+1);day.setHours(9,0,0,0);
  const slot=(hour,minutes)=>{const d=new Date(day);d.setHours(hour,minutes,0,0);return d.toISOString()};
  const commands=[
   {type:'SCHEDULE',item:{id:'DEMO-A-'+sequence,deviceId:'DEMO-D',operatorId:'DEMO-T',start:slot(9,0),end:slot(10,0),type:'Manutenzione caldaia'}},
   {type:'SCHEDULE',item:{id:'DEMO-A-'+(sequence+1),deviceId:'DEMO-D',operatorId:'DEMO-T2',start:slot(9,0),end:slot(10,30),type:'Riparazione climatizzatore'}},
   {type:'SCHEDULE',item:{id:'DEMO-A-'+(sequence+2),deviceId:'DEMO-D',operatorId:'DEMO-T',start:slot(11,0),end:slot(12,0),type:'Controllo impianto'}}
  ];
  const result=ops.batch(state,commands);
  state=result.state;sequence+=3;
  $('message').textContent='Tre appuntamenti fittizi aggiunti. Nessun dato salvato.';
  render();
 }catch(error){$('message').textContent=error.message}
});
$('reset-demo').addEventListener('click',()=>{state=fresh();sequence=1;$('message').textContent='Demo azzerata: nessun dato salvato.';render()});
$('operator-filter').addEventListener('change',render);
$('day-filter').addEventListener('change',render);
$('clear-day').addEventListener('click',()=>{$('day-filter').value='';render()});
$('print-agenda').addEventListener('click',()=>window.print());
const startField=document.querySelector('[name="start"]'),endField=document.querySelector('[name="end"]');
if(startField&&endField){
 const next=new Date();next.setDate(next.getDate()+1);next.setHours(9,0,0,0);
 startField.value=localInput(next);
 next.setHours(10,0,0,0);endField.value=localInput(next);
}
render();
})(window);
