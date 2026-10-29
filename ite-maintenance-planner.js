/* I.T.E. 4.0 — Scadenziario tecnico-operativo. Nessuna scadenza normativa presunta. */
(function(root){
'use strict';
function day(value){
 const match=/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(String(value||''));
 if(!match)return '';
 const y=+match[1],m=+match[2],d=+match[3];
 const date=new Date(Date.UTC(y,m-1,d));
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?match[1]+'-'+match[2]+'-'+match[3]:'';
}
function plusMonths(iso,months){
 const valid=day(iso);if(!valid||!Number.isInteger(months)||months<1||months>36)return '';
 const [y,m,d]=valid.split('-').map(Number);
 const first=new Date(Date.UTC(y,m-1+months,1));
 const end=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 return [first.getUTCFullYear(),String(first.getUTCMonth()+1).padStart(2,'0'),String(Math.min(d,end)).padStart(2,'0')].join('-');
}
function daysBetween(from,to){
 const a=day(from),b=day(to);
 return a&&b?Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000):null;
}
const same=(a,b)=>String(a??'')===String(b??'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function derive(data,options={}){
 const today=day(options.today||new Date().toISOString())||'2026-01-01';
 const months=Number(options.months??12),horizon=Number(options.horizon??60);
 if(!Number.isInteger(months)||months<1||months>36||!Number.isInteger(horizon)||horizon<1||horizon>365)throw Error('Intervallo o orizzonte non valido');
 const clients=new Map((data.clienti||[]).map(x=>[String(x.id),x]));
 const sites=new Map((data.immobili||[]).map(x=>[String(x.id),x]));
 const plants=new Map((data.impianti||[]).map(x=>[String(x.id),x]));
 const rows=[],issues=[];
 for(const device of data.apparecchiature||[]){
  const plant=plants.get(String(device.impianto_id||'')),site=plant&&sites.get(String(plant.immobile_id||'')),client=site&&clients.get(String(site.client_id||''));
  if(!plant||!site||!client){issues.push({deviceId:String(device.id),reason:'Catena cliente / sede / impianto incompleta'});continue;}
  const jobs=(data.interventi||[]).filter(x=>same(x.apparecchiatura_id,device.id));
  const completed=jobs.filter(x=>x.kind==='Manutenzione'&&(x.outcome==='Completato'||(x.workflow_status==='Chiuso'&&(!x.outcome||x.outcome==='Completato'))))
   .map(x=>day(x.finished_at)||day(x.date)).filter(x=>x&&x<=today).sort();
  const futureEntries=jobs.filter(x=>x.kind==='Manutenzione'&&x.appointment==='1'&&['Programmato','In corso'].includes(x.workflow_status))
   .map(x=>day(x.scheduled_start)).filter(Boolean).sort();
  const last=completed.at(-1)||'',due=last?plusMonths(last,months):'';
  const scheduled=futureEntries.find(x=>x>=today)||'';
  const days=due?daysBetween(today,due):null;
  let status='Storico assente';
  if(due)status=days<0?'Scaduta':days<=horizon?'In scadenza':'Regolare';
  if(scheduled)status='Programmata';
  if(!last&&jobs.some(x=>x.kind==='Manutenzione'&&x.outcome==='Completato'))status=scheduled?'Programmata':'Dati da verificare';
  const row={deviceId:String(device.id),clientId:String(client.id),siteId:String(site.id),plantId:String(plant.id),
   client:String(client.name||''),site:String(site.name||''),city:String(site.city||''),plant:String(plant.name||''),
   category:String(device.category||''),device:[device.brand,device.model].filter(Boolean).join(' '),
   serial:String(device.serial||''),last,due,scheduled,days,status};
  rows.push(row);
 }
 const priority={'Scaduta':0,'In scadenza':1,'Dati da verificare':2,'Storico assente':3,'Programmata':4,'Regolare':5};
 rows.sort((a,b)=>(priority[a.status]-priority[b.status])||(a.due||'9999').localeCompare(b.due||'9999')||a.client.localeCompare(b.client,'it')||a.deviceId.localeCompare(b.deviceId));
 return {rows,issues,today,months,horizon,counts:Object.fromEntries(['Scaduta','In scadenza','Programmata','Regolare','Storico assente','Dati da verificare'].map(x=>[x,rows.filter(r=>r.status===x).length]))};
}
function filtered(rows,filters={}){
 const q=String(filters.query||'').trim().toLocaleLowerCase('it'),status=String(filters.status||'');
 return rows.filter(r=>(!status||r.status===status)&&(!q||[r.client,r.site,r.city,r.plant,r.category,r.device,r.serial].join(' ').toLocaleLowerCase('it').includes(q)));
}
function safeCell(value){
 let text=String(value??'');
 if(/^[\s\uFEFF]*[=+\-@]/.test(text)||/^[\t\r\n]/.test(text))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
}
function csv(rows){
 const headings=['Cliente','Sede','Comune','Impianto','Categoria','Apparecchiatura','Matricola','Ultima manutenzione registrata','Prossima data indicativa','Appuntamento previsto','Stato','Giorni alla data indicativa'];
 const body=rows.map(r=>[r.client,r.site,r.city,r.plant,r.category,r.device,r.serial,r.last,r.due,r.scheduled,r.status,r.days===null?'':r.days].map(safeCell).join(';'));
 return '\uFEFF'+[headings.map(safeCell).join(';'),...body].join('\r\n')+'\r\n';
}
function current(){
 const el=id=>document.getElementById(id);
 return {months:Number(el('plan-months')?.value||12),horizon:Number(el('plan-horizon')?.value||60),query:el('plan-search')?.value||'',status:el('plan-status')?.value||''};
}
function snapshot(){
 if(!root.ITE||!root.ITERouter||root.ITERouter.current()!=='scadenziario')return null;
 return derive(root.ITE.snapshot(),current());
}
function render(){
 const host=document.getElementById('plan-results');if(!host)return;
 const result=snapshot();if(!result)return;
 const f=current(),rows=filtered(result.rows,f);
 const counts=result.counts;
 document.getElementById('plan-summary').textContent='Apparecchiature '+result.rows.length+' · scadute '+counts['Scaduta']+' · in scadenza '+counts['In scadenza']+' · programmate '+counts['Programmata']+' · senza storico '+counts['Storico assente']+' · collegamenti da verificare '+result.issues.length;
 const note='Le date sono indicative: '+result.months+' mesi dall’ultima manutenzione completata registrata, non una scadenza normativa. Controllare libretto, prescrizioni e contratto.';
 host.innerHTML='<p class="hint">'+esc(note)+'</p><p class="hint">Risultati: '+rows.length+'. Nessuna manutenzione viene creata o considerata eseguita automaticamente.</p>'+
 (rows.slice(0,400).map(r=>'<article class="item"><strong>'+esc(r.client)+' · '+esc(r.device||r.category)+'</strong>'+
 '<p>'+esc(r.site)+' · '+esc(r.city)+' · '+esc(r.plant)+' · matricola '+esc(r.serial||'—')+'</p>'+
 '<p><b>'+esc(r.status)+'</b> · ultima manutenzione: '+esc(r.last||'non registrata')+
 ' · prossima indicativa: '+esc(r.due||'non calcolabile')+
 (r.scheduled?' · appuntamento: '+esc(r.scheduled):'')+'</p>'+
 '<div class="actions"><button type="button" data-plan-device="'+esc(r.deviceId)+'">Programma manutenzione</button>'+
 '<button type="button" class="secondary" data-plan-client="'+esc(r.clientId)+'">Apri cliente</button></div></article>').join('')||'<p class="hint">Nessuna apparecchiatura corrisponde ai filtri.</p>')+
 (rows.length>400?'<p class="hint">Visualizzati i primi 400 risultati. Il CSV comprende tutti i risultati filtrati.</p>':'');
}
function exportCsv(){
 const result=snapshot();if(!result)return;
 const rows=filtered(result.rows,current());
 if(!rows.length)return alert('Nessuna riga da esportare.');
 if(!confirm('Il CSV contiene dati di clienti e apparecchiature e non è cifrato. Esportarlo sul dispositivo protetto?'))return;
 const blob=new Blob([csv(rows)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ITE_SCADENZIARIO_INDICATIVO_'+result.today+'.csv';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function schedule(id){
 const result=snapshot();if(!result)return;
 const row=result.rows.find(x=>x.deviceId===String(id));if(!row)throw Error('Apparecchiatura non collegata al cliente.');
 if(!root.ITEAgenda?.newAppointment)throw Error('Calendario non disponibile.');
 root.ITEAgenda.newAppointment('apparecchiature',id);
}
root.ITEMaintenancePlanner={day,plusMonths,daysBetween,derive,filtered,csv,render,schedule};
if(typeof document!=='undefined'&&typeof root.addEventListener==='function'){
 root.addEventListener('ite-pagechange',event=>{if(event.detail?.id==='scadenziario')render();});
 document.addEventListener('input',event=>{if(['plan-months','plan-horizon','plan-search','plan-status'].includes(event.target?.id))render();});
 document.addEventListener('change',event=>{if(['plan-months','plan-horizon','plan-status'].includes(event.target?.id))render();});
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('button');if(!button)return;
  try{
   if(button.id==='plan-export')exportCsv();
   if(button.dataset.planDevice)schedule(button.dataset.planDevice);
   if(button.dataset.planClient){
    const result=snapshot();if(!result||!result.rows.some(r=>r.clientId===button.dataset.planClient))throw Error('Cliente non collegato.');
    root.ITEProfile.open(Number(button.dataset.planClient));
   }
  }catch(error){alert(error.message||String(error));}
 });
}
})(typeof window==='undefined'?globalThis:window);
