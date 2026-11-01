/* I.T.E. 4.0 — local read-only field workspace. No vault writes, network or persistence. */
(function(root){'use strict';
if(!root.document)return;
function start(){
 const byId=id=>document.getElementById(id);
 const show=byId('field-report-demo'),upload=byId('field-report-import'),filter=byId('field-report-operator'),clear=byId('field-report-clear'),print=byId('field-report-print'),status=byId('field-report-status'),target=byId('field-report-result');
 if(!show||!upload||!filter||!clear||!print||!status||!target)return;
 const calendarControls=document.createElement('div');calendarControls.className='actions';
 const calendarMode=document.createElement('select');calendarMode.setAttribute('aria-label','Vista calendario');
 for(const [value,label] of [['day','Giorno'],['week','Settimana'],['month','Mese']])calendarMode.add(new Option(label,value));
 calendarMode.value='week';
 const calendarDate=document.createElement('input');calendarDate.type='date';calendarDate.setAttribute('aria-label','Data calendario');
 const now=new Date();calendarDate.value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const calendarPrevious=document.createElement('button');calendarPrevious.type='button';calendarPrevious.textContent='Periodo precedente';
 const calendarNext=document.createElement('button');calendarNext.type='button';calendarNext.textContent='Periodo successivo';
 const calendarStatus=document.createElement('select');calendarStatus.setAttribute('aria-label','Filtra stato appuntamenti');
 for(const [value,label] of [['','Tutti gli stati'],['scheduled','Programmato'],['in_progress','In corso'],['closed','Chiuso'],['revision','In revisione'],['cancelled','Annullato']])calendarStatus.add(new Option(label,value));
 const calendarPrint=document.createElement('button');calendarPrint.type='button';calendarPrint.textContent='Stampa calendario';
 const calendarQuickAdd=document.createElement('button');calendarQuickAdd.type='button';calendarQuickAdd.textContent='Nuovo appuntamento nel giorno selezionato';
 const slotPicker=document.createElement('select');slotPicker.setAttribute('aria-label','Fascia oraria disponibile');
 const capacityTarget=document.createElement('div');capacityTarget.setAttribute('aria-label','Carico tecnici nel giorno');
 const calendarTarget=document.createElement('div');calendarTarget.className='ite-field-calendar';calendarTarget.setAttribute('aria-label','Calendario interventi');
 calendarControls.append(calendarMode,calendarDate,calendarPrevious,calendarNext,calendarStatus,calendarPrint,calendarQuickAdd,slotPicker);
 target.parentElement.insertBefore(calendarControls,target);calendarControls.after(capacityTarget,calendarTarget);
 const demoCatalog={clients:[{id:'DEMO-C',name:'Cliente dimostrativo'}],sites:[{id:'DEMO-S',clientId:'DEMO-C',address:'Via Esempio 1'}],systems:[{id:'DEMO-I',siteId:'DEMO-S'}],equipment:[{id:'DEMO-E',systemId:'DEMO-I',name:'Caldaia demo'}],operators:[{id:'DEMO-O',name:'Tecnico demo',active:true}]};
 const demoItem={id:'DEMO-A',clientId:'DEMO-C',siteId:'DEMO-S',systemId:'DEMO-I',equipmentId:'DEMO-E',operatorId:'DEMO-O',kind:'Manutenzione',startsAt:'2026-11-02T09:00:00+01:00',endsAt:'2026-11-02T10:00:00+01:00'};
 let current=null,html='';
 const dirtyGuard=root.ITEFieldDirtyGuard.create();
 const confirmDiscard=()=>!current||!dirtyGuard.isDirty(current)||root.confirm('Ci sono modifiche non salvate. Vuoi continuare e perderle?');
 const controls=document.createElement('div');controls.className='actions';
 const appointmentId=document.createElement('input');appointmentId.placeholder='ID appuntamento';appointmentId.setAttribute('aria-label','ID appuntamento');
 const action=document.createElement('select');action.setAttribute('aria-label','Azione intervento');
 for(const [value,label] of [['arrive','Sono arrivato'],['close','Uscita e chiusura'],['reopen','Riapri per revisione'],['finishRevision','Concludi revisione']])action.add(new Option(label,value));
 const operator=document.createElement('input');operator.placeholder='ID operatore';operator.setAttribute('aria-label','ID operatore');
 const at=document.createElement('input');at.type='datetime-local';at.setAttribute('aria-label','Data e ora azione');
 const apply=document.createElement('button');apply.type='button';apply.textContent='Applica in anteprima';
 const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='Esporta workspace JSON';
 const secureExport=document.createElement('button');secureExport.type='button';secureExport.textContent='Esporta backup cifrato';
 for(const element of [appointmentId,operator,at,action,apply,exportButton,secureExport])controls.append(element);
 target.parentElement.insertBefore(controls,target);
 const editor=document.createElement('div');editor.className='grid';
 const field=(name,label,type='text')=>{const wrap=document.createElement('label');wrap.textContent=label;const el=document.createElement('input');el.type=type;el.dataset.field=name;wrap.append(el);editor.append(wrap);return el};
 const scheduleId=field('id','Nuovo appuntamento — ID');
 const clientId=field('clientId','Cliente — ID');
 const siteId=field('siteId','Sede — ID');
 const systemId=field('systemId','Impianto — ID');
 const equipmentId=field('equipmentId','Apparecchiatura — ID');
 const scheduleOperator=field('operatorId','Tecnico — ID');
 const kind=field('kind','Tipologia');
 const startsAt=field('startsAt','Inizio','datetime-local');
 const endsAt=field('endsAt','Fine','datetime-local');
 const scheduleButton=document.createElement('button');scheduleButton.type='button';scheduleButton.textContent='Programma appuntamento in anteprima';
 const batchPanel=document.createElement('section');batchPanel.className='ite-field-batch';
 const batchHeading=document.createElement('h3');batchHeading.textContent='Pianificazione multipla — collaudo locale';
 const batchHelp=document.createElement('p');batchHelp.textContent='Inserire un array JSON di appuntamenti con ID, riferimenti cliente/sede/impianto/apparecchiatura, tecnico, tipologia e date ISO. Anteprima e applicazione sono atomiche; nessun salvataggio automatico.';
 const batchInput=document.createElement('textarea');batchInput.rows=7;batchInput.setAttribute('aria-label','Appuntamenti multipli JSON');batchInput.placeholder='[{"id":"DEMO-2","clientId":"DEMO-C","siteId":"DEMO-S","systemId":"DEMO-I","equipmentId":"DEMO-E","operatorId":"DEMO-O","kind":"Manutenzione","startsAt":"2026-11-02T11:00:00+01:00","endsAt":"2026-11-02T12:00:00+01:00"}]';
 const batchPreviewButton=document.createElement('button');batchPreviewButton.type='button';batchPreviewButton.textContent='Verifica gruppo';
 const batchApplyButton=document.createElement('button');batchApplyButton.type='button';batchApplyButton.textContent='Applica gruppo in anteprima';batchApplyButton.disabled=true;
 const batchResult=document.createElement('div');batchResult.setAttribute('role','status');
 batchPanel.append(batchHeading,batchHelp,batchInput,batchPreviewButton,batchApplyButton,batchResult);
 editor.append(batchPanel);
 let pendingBatch=null;
 const invalidateBatch=()=>{pendingBatch=null;batchApplyButton.disabled=true;batchResult.textContent='Gruppo modificato: ripetere la verifica.'};
 batchInput.addEventListener('input',invalidateBatch);
 batchPreviewButton.addEventListener('click',()=>{try{
  if(!current)throw Error('CARICARE_PRIMA_UN_ARCHIVIO');
  if(batchInput.value.length>100000)throw Error('GRUPPO_TROPPO_GRANDE');
  const proposals=JSON.parse(batchInput.value);
  if(!Array.isArray(proposals)||!proposals.length||proposals.length>100)throw Error('INSERIRE_DA_1_A_100_APPUNTAMENTI');
  const check=root.ITEFieldScheduleBatch.preview(current.catalog,current.appointments,proposals);
  const operations=proposals.map(appointment=>({type:'schedule',appointment}));
  const validation=root.ITEFieldWorkspace.preview(current,operations);
  if(!check.ok||!validation.valid){pendingBatch=null;batchApplyButton.disabled=true;batchResult.textContent='Gruppo rifiutato: '+check.results.filter(x=>!x.accepted).map(x=>'riga '+(x.index+1)+': '+x.reason).join('; ')+' '+(validation.reason||'');return}
  pendingBatch={operations,baseline:JSON.stringify(current),input:batchInput.value};batchApplyButton.disabled=false;
  batchResult.textContent='Verifica superata: '+proposals.length+' appuntamenti validi. Applicazione solo nella memoria locale.';
 }catch(e){pendingBatch=null;batchApplyButton.disabled=true;batchResult.textContent='Verifica rifiutata: '+String(e.message)}});
 batchApplyButton.addEventListener('click',()=>{try{
  if(!pendingBatch||!current||JSON.stringify(current)!==pendingBatch.baseline||batchInput.value!==pendingBatch.input)throw Error('DATI_MODIFICATI_RIPETERE_VERIFICA');
  const next=root.ITEFieldWorkspace.batch(current,pendingBatch.operations);
  current=next;pendingBatch=null;batchApplyButton.disabled=true;render();batchResult.textContent='Gruppo applicato in memoria. Usare Salva archivio locale per conservarlo.';
 }catch(e){pendingBatch=null;batchApplyButton.disabled=true;batchResult.textContent='Applicazione rifiutata: '+String(e.message)}});
 const extraId=field('extraId','Extra — ID');
 const extraDescription=field('extraDescription','Descrizione Extra');
 const extraCategory=field('extraCategory','Categoria Extra');
 const supplyDescription=field('supplyDescription','Descrizione fornitura');
 const supplyAmount=field('supplyAmount','Fornitura €','number');supplyAmount.min='0';supplyAmount.step='0.01';
 const laborDescription=field('laborDescription','Descrizione posa');
 const laborAmount=field('laborAmount','Posa €','number');laborAmount.min='0';laborAmount.step='0.01';
 const addExtraButton=document.createElement('button');addExtraButton.type='button';addExtraButton.textContent='Aggiungi Extra in anteprima';
 const decisionId=field('decisionId','ID Extra da approvare');
 const decision=document.createElement('select');for(const [value,label] of [['accettato','Accettato'],['non_accettato','Non accettato'],['parzialmente_accettato','Parzialmente accettato']])decision.add(new Option(label,value));
 const quantities=field('approvedQuantities','Quantita approvate per voce (es. 1,0.5)');
 const decideButton=document.createElement('button');decideButton.type='button';decideButton.textContent='Registra decisione Extra';
 for(const element of [scheduleButton,addExtraButton,decision,decideButton])editor.append(element);
 controls.after(editor);
 const masterPanel=document.createElement('div');masterPanel.className='actions';
 const masterType=document.createElement('select');
 for(const [key,label] of [['clients','Cliente'],['sites','Sede'],['systems','Impianto'],['equipment','Apparecchiatura'],['operators','Operatore']])masterType.add(new Option(label,key));
 const masterAction=document.createElement('select');
 for(const [key,label] of [['create','Nuovo'],['update','Modifica'],['delete','Elimina']])masterAction.add(new Option(label,key));
 const masterId=document.createElement('input');masterId.placeholder='ID anagrafica';masterId.setAttribute('aria-label','ID anagrafica');
 const masterJson=document.createElement('textarea');masterJson.placeholder='Dati record JSON (es. {"name":"Cliente demo"})';masterJson.setAttribute('aria-label','Dati anagrafica JSON');
 const masterApply=document.createElement('button');masterApply.type='button';masterApply.textContent='Applica modifica anagrafica';
 masterPanel.append(masterType,masterAction,masterId,masterJson,masterApply);editor.after(masterPanel);
 masterApply.addEventListener('click',()=>{try{
  if(!current)throw Error('CARICARE_PRIMA_UN_ARCHIVIO');
  const record=masterAction.value==='delete'?undefined:JSON.parse(masterJson.value);
  current=root.ITEFieldMasterRecords.apply(current,{action:masterAction.value,collection:masterType.value,id:masterId.value,record});
  refreshGuided();render();
 }catch(e){status.textContent='Anagrafica non aggiornata: '+String(e.message)}});
 const choose=(label)=>{const wrap=document.createElement('label');wrap.textContent=label;const select=document.createElement('select');wrap.append(select);return {wrap,select}};
 const guidedClient=choose('Cliente'),guidedSite=choose('Sede'),guidedSystem=choose('Impianto'),guidedEquipment=choose('Apparecchiatura'),guidedOperator=choose('Operatore');
 const guided=document.createElement('div');guided.className='grid';
 for(const item of [guidedClient,guidedSite,guidedSystem,guidedEquipment,guidedOperator])guided.append(item.wrap);
 editor.prepend(guided);
 const populate=(select,rows,label)=>{const old=select.value;select.replaceChildren(new Option('Seleziona '+label,''));
  for(const row of rows)select.add(new Option(row.name||row.address||row.model||row.id,row.id));
  if([...select.options].some(option=>option.value===old))select.value=old;
 };
 function refreshGuided(){
  if(!current)return;
  const catalog=current.catalog;
  populate(guidedClient.select,catalog.clients,'cliente');
  populate(guidedSite.select,catalog.sites.filter(x=>x.clientId===guidedClient.select.value),'sede');
  populate(guidedSystem.select,catalog.systems.filter(x=>x.siteId===guidedSite.select.value),'impianto');
  populate(guidedEquipment.select,catalog.equipment.filter(x=>x.systemId===guidedSystem.select.value),'apparecchiatura');
  populate(guidedOperator.select,catalog.operators.filter(x=>x.active!==false),'operatore');
 }
 const syncGuided=()=>{clientId.value=guidedClient.select.value;siteId.value=guidedSite.select.value;systemId.value=guidedSystem.select.value;equipmentId.value=guidedEquipment.select.value;scheduleOperator.value=guidedOperator.select.value};
 for(const item of [guidedClient,guidedSite,guidedSystem,guidedEquipment,guidedOperator])item.select.addEventListener('change',()=>{refreshGuided();syncGuided();refreshCapacity()});
 const dashboardPanel=document.createElement('section');dashboardPanel.className='ite-field-dashboard';
 const dashboardTitle=document.createElement('h3');dashboardTitle.textContent='Riepilogo interventi e storico';
 const dashboardTotals=document.createElement('p');
 const historySelect=document.createElement('select');historySelect.setAttribute('aria-label','Filtra storico per apparecchiatura');
 const historyList=document.createElement('ul');
 dashboardPanel.append(dashboardTitle,dashboardTotals,historySelect,historyList);
 masterPanel.after(dashboardPanel);
 historySelect.addEventListener('change',()=>renderDashboard());
 function renderDashboard(){
  dashboardTotals.textContent='';historyList.replaceChildren();
  if(!current){historySelect.replaceChildren();return}
  const summary=root.ITEFieldDashboard.build(current);
  const money=c=>(c/100).toFixed(2)+' €';
  dashboardTotals.textContent='Appuntamenti: '+summary.totals.appointments+' | Minuti intervento: '+summary.totals.minutes+' | Fornitura: '+money(summary.totals.FORNITURA)+' | Posa: '+money(summary.totals.POSA)+' | Smontaggio: '+money(summary.totals.SMONTAGGIO)+' | Smaltimento: '+money(summary.totals.SMALTIMENTO)+' | Extra accettati: '+money(summary.totals.totalCents);
  const selected=historySelect.value;
  historySelect.replaceChildren(new Option('Tutte le apparecchiature',''));
  for(const item of current.catalog.equipment)historySelect.add(new Option(item.name||item.model||item.id,item.id));
  if([...historySelect.options].some(x=>x.value===selected))historySelect.value=selected;
  const records=historySelect.value?summary.byEquipment[historySelect.value]||[]:Object.values(summary.byEquipment).flat().sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt));
  for(const entry of records.slice(0,100)){const li=document.createElement('li');li.textContent=entry.startsAt+' | '+entry.id+' | '+entry.kind+' | '+entry.status+' | '+entry.minutes+' min | Extra '+money(entry.extraCents);historyList.append(li)}
 }
 const localISO=value=>{if(!value)throw Error('DATA_ORA_OBBLIGATORIA');const d=new Date(value);if(!Number.isFinite(d.getTime()))throw Error('DATA_ORA_NON_VALIDA');return d.toISOString()};
 const cents=value=>{const v=Number(value);if(!Number.isFinite(v)||v<0||!Number.isSafeInteger(Math.round(v*100))||Math.abs(v*100-Math.round(v*100))>1e-6)throw Error('PREZZO_NON_VALIDO');return Math.round(v*100)};
 const applyOperation=op=>{if(!current)throw Error('CARICARE_PRIMA_UN_ARCHIVIO');current=root.ITEFieldWorkspace.apply(current,op);render()};
 scheduleButton.addEventListener('click',()=>{try{applyOperation({type:'schedule',appointment:{id:scheduleId.value,clientId:clientId.value,siteId:siteId.value,systemId:systemId.value,equipmentId:equipmentId.value,operatorId:scheduleOperator.value,kind:kind.value,startsAt:localISO(startsAt.value),endsAt:localISO(endsAt.value)}})}catch(e){status.textContent='Programmazione rifiutata: '+String(e.message)}});
 addExtraButton.addEventListener('click',()=>{try{
  const lines=[];if(supplyDescription.value.trim())lines.push({type:'FORNITURA',description:supplyDescription.value,quantity:1,unitCents:cents(supplyAmount.value)});
  if(laborDescription.value.trim())lines.push({type:'POSA',description:laborDescription.value,quantity:1,unitCents:cents(laborAmount.value)});
  if(!lines.length)throw Error('FORNITURA_O_POSA_OBBLIGATORIA');
  applyOperation({type:'addExtra',id:appointmentId.value,operatorId:operator.value,at:localISO(at.value),payload:{extra:{id:extraId.value,description:extraDescription.value,category:extraCategory.value,lines}}});
 }catch(e){status.textContent='Extra rifiutato: '+String(e.message)}});
 decideButton.addEventListener('click',()=>{try{const partial=decision.value==='parzialmente_accettato';applyOperation({type:partial?'approveLines':'decideExtra',id:appointmentId.value,operatorId:operator.value,at:localISO(at.value),payload:{id:decisionId.value,status:decision.value,quantities:partial?quantities.value.split(',').map(v=>v.trim()):undefined}})}catch(e){status.textContent='Decisione rifiutata: '+String(e.message)}});

 apply.addEventListener('click',()=>{
  try{
   if(!current)throw Error('CARICARE_PRIMA_UN_ARCHIVIO');
   const value=at.value;if(!value)throw Error('DATA_ORA_OBBLIGATORIA');
   const iso=new Date(value).toISOString();if(!Number.isFinite(Date.parse(iso)))throw Error('DATA_ORA_NON_VALIDA');
   const payload=action.value==='reopen'?{reason:'Revisione manuale'}:{notes:'Intervento registrato in anteprima'};
   current=root.ITEFieldWorkspace.apply(current,{type:action.value,id:appointmentId.value,operatorId:operator.value,at:iso,payload});
   render();
  }catch(e){status.textContent='Operazione rifiutata: '+String(e.message)}
 });
 exportButton.addEventListener('click',()=>{
  try{
   if(!current)throw Error('NESSUN_ARCHIVIO_DA_ESPORTARE');
   const payload=JSON.stringify(root.ITEFieldWorkspace.snapshot(current),null,2);
   const blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='ite-4-workspace-locale.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   status.textContent='Workspace esportato localmente. Il file può contenere dati personali: conservarlo in luogo protetto.';
  }catch(e){status.textContent='Esportazione rifiutata: '+String(e.message)}
 });
 secureExport.addEventListener('click',()=>{try{
  if(!current)throw Error('NESSUN_ARCHIVIO_DA_ESPORTARE');
  const encrypted=root.ITEFieldEncryptedTransfer.exportEncrypted(current,root.ITEVault);
  root.ITEVault.downloadRaw(encrypted,'ite-4-workspace-cifrato.json');
  status.textContent='Backup cifrato esportato: conservarne la password.';
 }catch(e){status.textContent='Esportazione cifrata rifiutata: '+String(e.message)}});
 const saveLocal=document.createElement('button'),loadLocal=document.createElement('button'),clearLocal=document.createElement('button');
 saveLocal.type=loadLocal.type=clearLocal.type='button';
 saveLocal.textContent='Salva archivio locale cifrato';loadLocal.textContent='Carica archivio locale';clearLocal.textContent='Elimina archivio locale';
 controls.append(saveLocal,loadLocal,clearLocal);
 saveLocal.addEventListener('click',()=>{try{
  if(!current)throw Error('NESSUN_WORKSPACE');
  const result=root.ITEFieldPersistence.save(current,root.ITEVault);
  dirtyGuard.markSaved(current);
  status.textContent='Archivio locale cifrato salvato: '+result.appointments+' appuntamenti.';
 }catch(e){status.textContent='Salvataggio rifiutato: '+String(e.message)}});
 loadLocal.addEventListener('click',()=>{try{
  if(!confirmDiscard())return;
  const data=root.ITEFieldPersistence.load(root.ITEVault);
  if(!data)throw Error('NESSUN_ARCHIVIO_LOCALE');
  setData(data);dirtyGuard.markSaved(current);status.textContent='Archivio locale cifrato caricato.';
 }catch(e){status.textContent='Caricamento rifiutato: '+String(e.message)}});
 clearLocal.addEventListener('click',()=>{try{
  if(!root.confirm('Eliminare la copia locale cifrata del workspace?'))return;
  root.ITEFieldPersistence.clear(root.ITEVault);
  status.textContent='Copia locale eliminata; anteprima corrente invariata.';
 }catch(e){status.textContent='Eliminazione rifiutata: '+String(e.message)}});
 const reset=()=>{current=null;dirtyGuard.reset();html='';target.textContent='';filter.replaceChildren(new Option('Tutti gli operatori',''));upload.value='';status.textContent='Anteprima cancellata dalla memoria della pagina.';};
 calendarQuickAdd.addEventListener('click',()=>{
  const day=calendarDate.value;if(!day)return;
  startsAt.value=day+'T09:00';endsAt.value=day+'T10:00';
  scheduleId.focus();status.textContent='Compila il nuovo appuntamento per '+day+'; cliente, sede, impianto e tecnico devono essere selezionati.';
 });
 calendarPrint.addEventListener('click',()=>{
  if(!current){status.textContent='Caricare prima un archivio.';return}
  const period=root.ITEFieldCalendarViews.view(current.appointments,{mode:calendarMode.value,anchor:calendarDate.value,operatorId:filter.value||undefined,status:calendarStatus.value||undefined});
  const printable=document.createElement('div');
  const heading=document.createElement('h2');heading.textContent='Agenda I.T.E. — '+period.startDay+' / '+period.endExclusive;printable.append(heading);
  const table=document.createElement('table');const header=document.createElement('tr');
  for(const name of ['Giorno','Ora','Cliente','Indirizzo','Apparecchiatura','Tecnico','Stato']){const th=document.createElement('th');th.textContent=name;header.append(th)}table.append(header);
  const lookup=(key,id)=>current.catalog[key].find(x=>x.id===id)||{};
  for(const day of period.days)for(const appointment of day.appointments){
   const client=lookup('clients',appointment.clientId),site=lookup('sites',appointment.siteId),equipment=lookup('equipment',appointment.equipmentId),technician=lookup('operators',appointment.operatorId);
   const tr=document.createElement('tr');
   for(const value of [day.date,new Date(appointment.startsAt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}),client.name||appointment.clientId,site.address||site.name||appointment.siteId,equipment.name||equipment.model||appointment.equipmentId,technician.name||appointment.operatorId,appointment.status]){const td=document.createElement('td');td.textContent=value;tr.append(td)}
   table.append(tr);
  }
  printable.append(table);
  const popup=root.open('','_blank');if(!popup){status.textContent='Finestra di stampa bloccata.';return}
  popup.document.title='Calendario I.T.E. — stampa';
  const style=popup.document.createElement('style');style.textContent='body{font:12px sans-serif;margin:16px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:5px;text-align:left}';popup.document.head.append(style);
  popup.document.body.append(popup.document.importNode(printable,true));popup.focus();popup.print();
 });
 const refreshCapacity=()=>{
  slotPicker.replaceChildren(new Option('Seleziona fascia disponibile',''));
  capacityTarget.replaceChildren();if(!current)return;
  const technicianId=guidedOperator.select.value||filter.value;
  const load=root.ITEFieldScheduleBatch.utilization(current.catalog,current.appointments,calendarDate.value);
  const heading=document.createElement('strong');heading.textContent='Carico tecnici '+calendarDate.value;capacityTarget.append(heading);
  const summary=document.createElement('div');summary.style.display='flex';summary.style.flexWrap='wrap';summary.style.gap='8px';
  for(const tech of load){const item=document.createElement('span');item.textContent=tech.name+': '+tech.count+' interventi / '+tech.busyMinutes+' min ('+tech.loadPercent+'% su 8 ore)'+(tech.overbooked?' — carico oltre 8 ore':'');item.style.padding='5px';item.style.border='1px solid #aaa';if(/^#[0-9a-fA-F]{6}$/.test(tech.color||''))item.style.borderLeft='5px solid '+tech.color;summary.append(item)}capacityTarget.append(summary);const overlaps=root.ITEFieldScheduleBatch.conflicts(current.appointments);if(overlaps.length){const warning=document.createElement('p');warning.textContent='Attenzione: '+overlaps.length+' sovrapposizioni operatore rilevate nell’archivio.';capacityTarget.append(warning)}
  if(technicianId){for(const slot of root.ITEFieldTechnicianCapacity.slots(current.appointments,{day:calendarDate.value,operatorId:technicianId}))slotPicker.add(new Option(slot.label,JSON.stringify(slot)))}
 };
 slotPicker.addEventListener('change',()=>{if(!slotPicker.value)return;const slot=JSON.parse(slotPicker.value);const local=value=>{const d=new Date(value);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};startsAt.value=local(slot.startsAt);endsAt.value=local(slot.endsAt);scheduleOperator.value=guidedOperator.select.value||filter.value;status.textContent='Fascia disponibile selezionata: '+slot.label});
 const renderCalendar=()=>{
  calendarTarget.replaceChildren();
  if(!current)return;
  const result=root.ITEFieldCalendarViews.view(current.appointments,{mode:calendarMode.value,anchor:calendarDate.value,operatorId:filter.value||undefined,status:calendarStatus.value||undefined});
  const title=document.createElement('h3');title.textContent='Calendario '+result.startDay+' — '+result.endExclusive+' ('+result.total+' appuntamenti)';
  calendarTarget.append(title);
  const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(auto-fit,minmax(145px,1fr))';grid.style.gap='8px';
  for(const day of result.days){
   const cell=document.createElement('section');cell.style.border='1px solid #aaa';cell.style.padding='8px';
   const heading=document.createElement('strong');heading.textContent=day.date;cell.append(heading);
   for(const appointment of day.appointments){
    const item=document.createElement('button');item.type='button';item.style.display='block';item.style.width='100%';item.style.textAlign='left';
    const technician=current.catalog.operators.find(x=>x.id===appointment.operatorId);
    const client=current.catalog.clients.find(x=>x.id===appointment.clientId);
    item.textContent=new Date(appointment.startsAt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})+' '+(client?.name||appointment.clientId)+' — '+(technician?.name||appointment.operatorId);
    if(technician?.color&&/^#[0-9a-fA-F]{6}$/.test(technician.color))item.style.borderLeft='5px solid '+technician.color;
    item.addEventListener('click',()=>{appointmentId.value=appointment.id;operator.value=appointment.operatorId;const d=new Date(appointment.startsAt);at.value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')});
    cell.append(item);
   }
   cell.addEventListener('dblclick',event=>{
    if(event.target.closest('button'))return;
    calendarDate.value=day.date;startsAt.value=day.date+'T09:00';endsAt.value=day.date+'T10:00';
    scheduleId.focus();status.textContent='Nuovo appuntamento predisposto per '+day.date;
   });
   grid.append(cell);
  }
  calendarTarget.append(grid);refreshCapacity();
 };
 for(const el of [calendarMode,calendarDate,calendarStatus])el.addEventListener('change',renderCalendar);
 calendarPrevious.addEventListener('click',()=>{calendarDate.value=root.ITEFieldCalendarViews.shift(calendarMode.value,calendarDate.value,-1);renderCalendar()});
 calendarNext.addEventListener('click',()=>{calendarDate.value=root.ITEFieldCalendarViews.shift(calendarMode.value,calendarDate.value,1);renderCalendar()});
 function render(){
  if(!current){status.textContent='Caricare un JSON locale oppure utilizzare la dimostrazione.';return}
  const result=root.ITEFieldOperationsReport.report(current.catalog,current.appointments,{operatorId:filter.value||undefined});
  html=result.printReady?result.html:'';target.innerHTML=result.html;renderCalendar();
  renderDashboard();
  const skipped=current.skippedLegacyAppointments||0;
  status.textContent='Appuntamenti: '+result.entries.length+'; anomalie: '+result.issues.length+'; record incompatibili esclusi: '+skipped+'. '+(result.printReady?'Stampa disponibile.':'Stampa disabilitata: verificare i dati.');
 }
 function setData(data){
  current=root.ITEFieldWorkspace.open(data.catalog,data.appointments);filter.replaceChildren(new Option('Tutti gli operatori',''));
  for(const op of data.catalog.operators){const option=new Option(op.name||op.id,op.id);filter.add(option)}
  refreshGuided();render();
 }
 show.addEventListener('click',()=>{
  if(!confirmDiscard())return;
  try{setData({catalog:demoCatalog,appointments:root.ITEFieldPlanning.schedule(demoCatalog,[],demoItem),skippedLegacyAppointments:0})}
  catch(e){reset();status.textContent='Errore dimostrazione: '+String(e.message)}
 });
 upload.addEventListener('change',async()=>{
  const file=upload.files&&upload.files[0];if(!file)return;
  if(!confirmDiscard()){upload.value='';return}
  reset();
  try{
   if(file.size>5*1024*1024)throw Error('FILE_TROPPO_GRANDE_5_MB');
   const raw=JSON.parse(await file.text());
   const result=raw&&raw.format==='ITE-encrypted-backup'?await root.ITEFieldEncryptedTransfer.importEncrypted(raw,root.ITEVault):raw&&raw.schema==='ITE_FIELD_WORKSPACE_V1'?root.ITEFieldWorkspace.restore(raw):root.ITEFieldLegacyAdapter.adapt(raw);
   if(result.issues&&result.issues.length){status.textContent='Importazione non attivata: '+result.issues.length+' anomalie. Verificare formato, gerarchie e appuntamenti; nessun dato salvato.';return}
   setData(result);
  }catch(e){status.textContent='Importazione rifiutata: '+String(e.message)}
 });
 filter.addEventListener('change',render);clear.addEventListener('click',()=>{if(confirmDiscard())reset()});
 root.addEventListener('beforeunload',event=>{if(current&&dirtyGuard.isDirty(current)){event.preventDefault();event.returnValue=''}});
 print.addEventListener('click',()=>{
  if(!html){status.textContent='Stampa non disponibile: generare un report valido.';return}
  const popup=root.open('','_blank');if(!popup){status.textContent='Finestra di stampa bloccata dal browser.';return}
  popup.document.write('<!doctype html><html lang="it"><meta charset="utf-8"><title>Agenda I.T.E. — anteprima locale</title><style>body{font:14px sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:6px;text-align:left}@media print{body{margin:8mm}}</style>'+html+'</html>');popup.document.close();popup.focus();popup.print();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
