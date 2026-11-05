/* I.T.E. 4.0 — pannello operativo TEST; non importa archivi della versione operativa. */
(function(root){'use strict';
const op=root.ITEOperations40, wsApi=root.ITEOperationsWorkspace40;
if(!op||!wsApi||typeof document==='undefined')return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=()=>new Date().toISOString(),newId=p=>'TEST-'+p+'-'+Date.now().toString(36);
let ws;try{ws=wsApi.create()}catch(e){return}
const panel=document.createElement('section');panel.id='ite40-operations';panel.className='panel';
panel.innerHTML='<h2>Operatività 4.0 — collaudo TEST</h2><p class="hint">Archivio locale separato: solo dati fittizi TEST. Nessuna sincronizzazione con clienti operativi.</p><div class="actions"><button type="button" data-act="seed">Carica esempio completo</button><button type="button" data-act="backup">Esporta backup JSON</button><button type="button" data-act="reset">Azzera dati TEST</button></div><div id="ite40-feedback" role="status"></div><div id="ite40-summary"></div><div class="grid" id="ite40-forms"></div><div id="ite40-lists"></div>';
(document.querySelector('.wrap')||document.querySelector('main')||document.body).appendChild(panel);
const form=(name,title,fields)=>'<form data-form="'+name+'" class="item"><strong>'+title+'</strong>'+fields.map(f=>'<label>'+f[1]+'<input name="'+f[0]+'" '+(f[2]||'required')+'></label>').join('')+'<button type="submit">Salva</button></form>';
panel.querySelector('#ite40-forms').innerHTML=[
form('client','Nuovo cliente',[['name','Nome fittizio']]),
form('site','Nuova sede',[['clientId','ID cliente'],['address','Indirizzo TEST']]),
form('plant','Nuovo impianto',[['clientId','ID cliente'],['siteId','ID sede'],['type','Tipologia']]),
form('device','Nuova apparecchiatura',[['clientId','ID cliente'],['siteId','ID sede'],['plantId','ID impianto'],['brand','Marca'],['model','Modello'],['serial','Matricola fittizia']]),
form('operator','Nuovo operatore',[['name','Nome tecnico fittizio']]),
form('appointment','Nuovo appuntamento',[['clientId','ID cliente'],['siteId','ID sede'],['plantId','ID impianto'],['deviceId','ID apparecchiatura',''],['operatorId','ID operatore'],['start','Inizio','type="datetime-local" required'],['end','Fine','type="datetime-local" required'],['kind','Tipo intervento']]),
form('arrival','Arrivo tecnico',[['appointmentId','ID appuntamento'],['operatorId','ID operatore']]),
form('finish','Chiusura intervento',[['interventionId','ID intervento'],['operatorId','ID operatore'],['description','Lavori eseguiti']]),
form('quote','Preventivo: fornitura e posa',[['clientId','ID cliente'],['category','Categoria'],['supply','Descrizione fornitura'],['supplyPrice','Prezzo fornitura','type="number" min="0" step="0.01" required'],['installation','Descrizione posa'],['installationPrice','Prezzo posa','type="number" min="0" step="0.01" required']]),
form('extra','Extra preventivo (approvazione)',[['quoteId','ID preventivo'],['lineId','ID riga Extra']])
].join('');
function localDate(v){const d=new Date(v);if(!Number.isFinite(d.getTime()))throw Error('DATA_NON_VALIDA');return d.toISOString()}
function show(message,error){const node=panel.querySelector('#ite40-feedback');node.textContent=message;node.style.color=error?'#a03132':'#17603b'}
function render(){const s=ws.read(),report=ws.inspect(s);
panel.querySelector('#ite40-summary').textContent='Clienti: '+s.clients.length+' | Tecnici: '+s.operators.length+' | Appuntamenti: '+s.appointments.length+' | Interventi: '+s.interventions.length+' | Preventivi: '+s.quotes.length+' | Integrità: '+(report.valid?'OK':'ERRORE');
const lines=[];
for(const c of s.clients){lines.push('<div class="item"><strong>'+esc(c.name)+' ('+esc(c.id)+')</strong>'+c.sites.map(site=>'<p>'+esc(site.address)+' ('+esc(site.id)+') — '+site.plants.map(p=>esc(p.type)+' ('+esc(p.id)+') '+p.devices.map(d=>esc(d.brand+' '+d.model+' '+d.id)).join(', ')).join('; ')+'</p>').join('')+'</div>')}
for(const a of s.appointments){const i=s.interventions.find(x=>x.appointmentId===a.id);lines.push('<div class="item"><strong>Appuntamento '+esc(a.id)+'</strong><small>'+esc(a.start)+' — '+esc(a.end)+' | '+esc(a.operatorId)+' | '+esc(a.status)+'</small>'+(i?'<p>Intervento '+esc(i.id)+' — '+esc(i.status)+'</p>':'')+'</div>')}
for(const q of s.quotes){const t=op.totals(q);lines.push('<div class="item"><strong>Preventivo '+esc(q.id)+'</strong><p>Approvato: € '+esc(t.approved.toFixed(2))+' | Extra da approvare: € '+esc(t.pendingExtra.toFixed(2))+'</p>'+q.lines.map(l=>'<p>'+esc(l.kind)+' — '+esc(l.description)+' | € '+esc(l.unitPrice.toFixed(2))+(l.extra?' | EXTRA '+(l.approved?'APPROVATO':'IN ATTESA'):'')+' ('+esc(l.id)+')</p>').join('')+'</div>')}
panel.querySelector('#ite40-lists').innerHTML=lines.join('')||'<p>Nessun dato TEST presente.</p>';
}
function seed(){let s=ws.read();if(s.clients.length||s.operators.length||s.appointments.length||s.quotes.length)throw Error('ESEMPIO_SOLO_SU_ARCHIVIO_VUOTO');const t=stamp();
s=op.addClient(s,{id:'TEST-C-DEMO',name:'Cliente dimostrativo'},'DEMO',t);
s=op.addSite(s,'TEST-C-DEMO',{id:'TEST-S-DEMO',address:'Via Esempio 10, Bologna'},'DEMO',t);
s=op.addPlant(s,'TEST-C-DEMO','TEST-S-DEMO',{id:'TEST-P-DEMO',type:'Riscaldamento'},'DEMO',t);
s=op.addDevice(s,{clientId:'TEST-C-DEMO',siteId:'TEST-S-DEMO',plantId:'TEST-P-DEMO'},{id:'TEST-D-DEMO',brand:'Marca TEST',model:'Modello TEST',serial:'TEST-0001'},'DEMO',t);
s=op.addOperator(s,{id:'TEST-O-DEMO',name:'Tecnico dimostrativo',color:'#008800'},'DEMO',t);
const start=new Date(Date.now()+3600000).toISOString(),end=new Date(Date.now()+7200000).toISOString();
s=op.appointment(s,{id:'TEST-A-DEMO',clientId:'TEST-C-DEMO',siteId:'TEST-S-DEMO',plantId:'TEST-P-DEMO',deviceId:'TEST-D-DEMO',operatorId:'TEST-O-DEMO',start,end,kind:'Manutenzione'},'DEMO',t);
s=op.quote(s,{id:'TEST-Q-DEMO',clientId:'TEST-C-DEMO',lines:[{id:'TEST-L-F',category:'IDRICO',kind:'FORNITURA',description:'Materiale dimostrativo',quantity:1,unitPrice:80},{id:'TEST-L-P',category:'IDRICO',kind:'POSA',description:'Installazione dimostrativa',quantity:1,unitPrice:60},{id:'TEST-L-E',category:'IDRICO',kind:'POSA',description:'Extra dimostrativo',quantity:1,unitPrice:20,extra:true}]},'DEMO',t);ws.save(s)}
panel.addEventListener('submit',e=>{const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();const d=Object.fromEntries(new FormData(f).entries()),t=stamp(),id=newId(f.dataset.form.toUpperCase());try{
ws.transact(s=>{switch(f.dataset.form){
case 'client':return op.addClient(s,{id,name:d.name},'DEMO',t);
case 'site':return op.addSite(s,d.clientId,{id,address:d.address},'DEMO',t);
case 'plant':return op.addPlant(s,d.clientId,d.siteId,{id,type:d.type},'DEMO',t);
case 'device':return op.addDevice(s,d,{id,brand:d.brand,model:d.model,serial:d.serial},'DEMO',t);
case 'operator':return op.addOperator(s,{id,name:d.name,color:'#285b84'},'DEMO',t);
case 'appointment':return op.appointment(s,{...d,id,deviceId:d.deviceId||null,start:localDate(d.start),end:localDate(d.end)},'DEMO',t);
case 'arrival':return op.arrive(s,d.appointmentId,d.operatorId,t);
case 'finish':return op.finish(s,d.interventionId,d.operatorId,t,{description:d.description});
case 'quote':return op.quote(s,{id,clientId:d.clientId,lines:[{id:id+'-F',category:d.category,kind:'FORNITURA',description:d.supply,quantity:1,unitPrice:Number(d.supplyPrice)},{id:id+'-P',category:d.category,kind:'POSA',description:d.installation,quantity:1,unitPrice:Number(d.installationPrice)}]},'DEMO',t);
case 'extra':return op.approveExtra(s,d.quoteId,[d.lineId],'DEMO',t);
default:throw Error('AZIONE_NON_VALIDA')}});show('Operazione salvata: '+id);f.reset();render()}catch(err){show('Non salvato: '+err.message,true)}});
panel.addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b)return;try{if(b.dataset.act==='seed'){seed();show('Esempio integrato caricato')}else if(b.dataset.act==='reset'){ws.save(op.empty());show('Archivio TEST azzerato')}else if(b.dataset.act==='backup'){const blob=new Blob([ws.backup()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ite40-operazioni-TEST.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);show('Backup JSON generato')}render()}catch(err){show(err.message,true)}});
try{render()}catch(err){show('Archivio non leggibile: '+err.message,true)}
})(typeof window!=='undefined'?window:globalThis);
