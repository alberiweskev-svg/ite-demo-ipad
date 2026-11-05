/* I.T.E. 4.0.28 — Riepilogo operativo TEST, integrato nella demo. */
(function(root){'use strict';
if(typeof document==='undefined'||!root.ITE40FieldDashboard||!root.ITEOperationsWorkspace40)return;
let ws;try{ws=root.ITEOperationsWorkspace40.create()}catch(_){return}
const panel=document.createElement('section');panel.className='panel';panel.id='ite40-field-dashboard';
const h=document.createElement('h2');h.textContent='Cruscotto operativo integrato — TEST';
const hint=document.createElement('p');hint.className='hint';hint.textContent='Appuntamenti, ore e preventivi per cliente, senza duplicare importi tra interventi. Dati esclusivamente TEST.';
const controls=document.createElement('div');controls.className='grid';
function field(title,type){const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.type=type;label.appendChild(input);controls.appendChild(label);return input}
const from=field('Dal giorno','date'),to=field('Al giorno','date'),refresh=document.createElement('button');refresh.type='button';refresh.textContent='Aggiorna cruscotto';
const status=document.createElement('p');status.setAttribute('role','status');const content=document.createElement('div');
panel.append(h,hint,controls,refresh,status,content);
(document.querySelector('.wrap')||document.querySelector('main')||document.body).appendChild(panel);
const day=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
from.value=day(new Date());to.value=day(new Date(Date.now()+6*86400000));
function line(parent,text,tag='p'){const n=document.createElement(tag);n.textContent=text;parent.appendChild(n);return n}
const euro=n=>(n/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
function render(){
 const a=new Date(from.value+'T00:00:00'),b=new Date(to.value+'T00:00:00');b.setDate(b.getDate()+1);
 const report=root.ITE40FieldDashboard.build(ws.read(),a.toISOString(),b.toISOString());
 content.replaceChildren();line(content,'Totale appuntamenti: '+report.summary.appointments+' · Minuti programmati: '+report.summary.scheduledMinutes+' · Minuti lavorati: '+report.summary.workedMinutes,'h3');
 line(content,'Preventivi dei clienti nel periodo: '+euro(report.summary.approvedCents)+' · Extra da approvare: '+euro(report.summary.pendingExtraCents));
 line(content,'Tecnici','h3');
 for(const o of report.operators)line(content,o.name+': '+o.appointments+' appuntamenti, '+o.scheduledMinutes+' min programmati, '+o.workedMinutes+' min lavorati');
 line(content,'Clienti e preventivi','h3');
 for(const c of report.clients)line(content,c.name+': '+c.appointments+' appuntamenti, '+c.quotes+' preventivi, '+euro(c.approvedCents)+' approvati, '+euro(c.pendingExtraCents)+' extra in attesa');
 if(report.warnings.length){line(content,'Anomalie: '+report.warnings.length,'h3');for(const w of report.warnings)line(content,w.code+' — '+w.id)}
 status.textContent='Riepilogo aggiornato (sola lettura)';
}
refresh.addEventListener('click',()=>{try{render()}catch(e){status.textContent='Errore: '+e.message}});
for(const n of [from,to])n.addEventListener('change',()=>{try{render()}catch(e){status.textContent='Errore: '+e.message}});
try{render()}catch(e){status.textContent='Archivio TEST non disponibile: '+e.message}
})(typeof window!=='undefined'?window:globalThis);
