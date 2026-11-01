/* I.T.E. 4.0 — local read-only field workspace. No vault writes, network or persistence. */
(function(root){'use strict';
if(!root.document)return;
function start(){
 const byId=id=>document.getElementById(id);
 const show=byId('field-report-demo'),upload=byId('field-report-import'),filter=byId('field-report-operator'),clear=byId('field-report-clear'),print=byId('field-report-print'),status=byId('field-report-status'),target=byId('field-report-result');
 if(!show||!upload||!filter||!clear||!print||!status||!target)return;
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
  render();
 }catch(e){status.textContent='Anagrafica non aggiornata: '+String(e.message)}});
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
 function render(){
  if(!current){status.textContent='Caricare un JSON locale oppure utilizzare la dimostrazione.';return}
  const result=root.ITEFieldOperationsReport.report(current.catalog,current.appointments,{operatorId:filter.value||undefined});
  html=result.printReady?result.html:'';target.innerHTML=result.html;
  const skipped=current.skippedLegacyAppointments||0;
  status.textContent='Appuntamenti: '+result.entries.length+'; anomalie: '+result.issues.length+'; record incompatibili esclusi: '+skipped+'. '+(result.printReady?'Stampa disponibile.':'Stampa disabilitata: verificare i dati.');
 }
 function setData(data){
  current=root.ITEFieldWorkspace.open(data.catalog,data.appointments);filter.replaceChildren(new Option('Tutti gli operatori',''));
  for(const op of data.catalog.operators){const option=new Option(op.name||op.id,op.id);filter.add(option)}
  render();
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
