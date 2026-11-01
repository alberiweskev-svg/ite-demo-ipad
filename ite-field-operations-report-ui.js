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
 const controls=document.createElement('div');controls.className='actions';
 const appointmentId=document.createElement('input');appointmentId.placeholder='ID appuntamento';appointmentId.setAttribute('aria-label','ID appuntamento');
 const action=document.createElement('select');action.setAttribute('aria-label','Azione intervento');
 for(const [value,label] of [['arrive','Sono arrivato'],['close','Uscita e chiusura'],['reopen','Riapri per revisione'],['finishRevision','Concludi revisione']])action.add(new Option(label,value));
 const operator=document.createElement('input');operator.placeholder='ID operatore';operator.setAttribute('aria-label','ID operatore');
 const at=document.createElement('input');at.type='datetime-local';at.setAttribute('aria-label','Data e ora azione');
 const apply=document.createElement('button');apply.type='button';apply.textContent='Applica in anteprima';
 const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='Esporta workspace JSON';
 for(const element of [appointmentId,operator,at,action,apply,exportButton])controls.append(element);
 target.parentElement.insertBefore(controls,target);
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
 const reset=()=>{current=null;html='';target.textContent='';filter.replaceChildren(new Option('Tutti gli operatori',''));upload.value='';status.textContent='Anteprima cancellata dalla memoria della pagina.';};
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
  try{setData({catalog:demoCatalog,appointments:root.ITEFieldPlanning.schedule(demoCatalog,[],demoItem),skippedLegacyAppointments:0})}
  catch(e){reset();status.textContent='Errore dimostrazione: '+String(e.message)}
 });
 upload.addEventListener('change',async()=>{
  const file=upload.files&&upload.files[0];if(!file)return;
  reset();
  try{
   if(file.size>5*1024*1024)throw Error('FILE_TROPPO_GRANDE_5_MB');
   const raw=JSON.parse(await file.text());
   const result=root.ITEFieldLegacyAdapter.adapt(raw);
   if(result.issues.length){status.textContent='Importazione non attivata: '+result.issues.length+' anomalie. Verificare formato, gerarchie e appuntamenti; nessun dato salvato.';return}
   setData(result);
  }catch(e){status.textContent='Importazione rifiutata: '+String(e.message)}
 });
 filter.addEventListener('change',render);clear.addEventListener('click',reset);
 print.addEventListener('click',()=>{
  if(!html){status.textContent='Stampa non disponibile: generare un report valido.';return}
  const popup=root.open('','_blank');if(!popup){status.textContent='Finestra di stampa bloccata dal browser.';return}
  popup.document.write('<!doctype html><html lang="it"><meta charset="utf-8"><title>Agenda I.T.E. — anteprima locale</title><style>body{font:14px sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:6px;text-align:left}@media print{body{margin:8mm}}</style>'+html+'</html>');popup.document.close();popup.focus();popup.print();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
