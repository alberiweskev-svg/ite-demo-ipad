/* I.T.E. 4.0 — registro misure e verifiche tecniche di intervento.
   Registrazioni descrittive: NON attestano conformita, collaudo o obblighi normativi. */
(function(root){'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=['Idraulico','Termico','Elettrico','Climatizzazione','Gas','Altro'];
const kinds=['Misura strumentale','Prova funzionale','Verifica visiva'];
const outcomes=['Rilevato','Da verificare','Non eseguito'];
const units=['—','bar','mbar','kPa','°C','V','A','Ω','MΩ','Hz','l/min','m³/h','%','ppm'];
const templates={
 Idraulico:['Pressione impianto','Portata rilevata','Tenuta da verificare'],
 Termico:['Temperatura mandata','Temperatura ritorno','Circolazione da verificare'],
 Elettrico:['Tensione rilevata','Corrente rilevata','Continuità da verificare'],
 Climatizzazione:['Temperatura aria ingresso','Temperatura aria uscita','Funzionamento da verificare'],
 Gas:['Pressione rilevata','Tenuta da verificare','Combustione da verificare'],
 Altro:['Valore rilevato','Funzionamento da verificare']
};
const ledger=state=>{const rows=state?.settings?.fieldChecks??[];if(!Array.isArray(rows)||rows.length>20000)throw Error('Registro prove tecniche non valido.');return rows;};
const id=prefix=>prefix+'_'+(root.crypto?.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));
function assigned(job){let rows;try{rows=JSON.parse(job?.assigned_operators||'[]')}catch{throw Error('Operatori assegnati non leggibili.');}if(!Array.isArray(rows)||rows.length>40)throw Error('Operatori assegnati non validi.');return rows.map(x=>String(x?.operator_id||'')).filter(Boolean);}
function context(core,jobId,actorId,active){
 const job=(core.interventi||[]).find(x=>same(x.id,jobId));
 if(!job||job.appointment!=='1'||!job.client_id)throw Error('Intervento da calendario non disponibile.');
 const client=(core.clienti||[]).find(x=>same(x.id,job.client_id));
 if(!client)throw Error('Cliente intervento mancante.');
 const site=job.cantiere_id?(core.cantieri||[]).find(x=>same(x.id,job.cantiere_id)):null;
 if(job.cantiere_id&&(!site||!same(site.client_id,client.id)))throw Error('Cantiere di altro cliente.');
 const device=job.apparecchiatura_id?(core.apparecchiature||[]).find(x=>same(x.id,job.apparecchiatura_id)):null;
 if(job.apparecchiatura_id&&!device)throw Error('Apparecchiatura mancante.');
 const plant=device?(core.impianti||[]).find(x=>same(x.id,device.impianto_id)):job.impianto_id?(core.impianti||[]).find(x=>same(x.id,job.impianto_id)):null;
 if((device&&!plant)||(job.impianto_id&&!plant))throw Error('Impianto mancante.');
 if(job.impianto_id&&plant&&!same(job.impianto_id,plant.id))throw Error('Impianto discordante.');
 const property=plant?(core.immobili||[]).find(x=>same(x.id,plant.immobile_id)):job.immobile_id?(core.immobili||[]).find(x=>same(x.id,job.immobile_id)):null;
 if((plant&&!property)||(job.immobile_id&&!property))throw Error('Sede mancante.');
 if(property&&!same(property.client_id,client.id))throw Error('Sede di altro cliente.');
 if(job.immobile_id&&property&&!same(job.immobile_id,property.id))throw Error('Sede discordante.');
 if(site?.immobile_id&&property&&!same(site.immobile_id,property.id))throw Error('Cantiere e sede discordanti.');
 if(active&&job.workflow_status!=='In corso')throw Error('Per modificare le prove riapri l’intervento con Revisiona intervento.');
 if(actorId&&(!assigned(job).includes(String(actorId))||!(core.clienti||[]).some(x=>same(x.id,actorId))))throw Error('Operatore non assegnato all’intervento.');
 return {job,client,site,plant,device};
}
function reading(value){
 const text=String(value??'').trim().replace(',','.');
 if(!/^-?\d{1,6}(?:\.\d{1,3})?$/.test(text)||Math.abs(Number(text))>100000)throw Error('Valore numerico non valido: massimo tre decimali.');
 return text;
}
function fields(req){
 const category=String(req.category||''),kind=String(req.kind||''),outcome=String(req.outcome||'');
 if(!categories.includes(category)||!kinds.includes(kind)||!outcomes.includes(outcome))throw Error('Tipo, settore o esito non valido.');
 const label=String(req.label||'').trim(),note=String(req.note||'').trim(),instrument=String(req.instrument||'').trim();
 if(label.length<4||label.length>120||note.length>500||instrument.length>120)throw Error('Descrizione o nota fuori limite.');
 if(kind!=='Misura strumentale'&&String(req.value||'').trim())throw Error('Solo le misure strumentali ammettono un valore numerico.');
 if(kind==='Misura strumentale'&&outcome==='Rilevato'&&!String(req.value??'').trim())throw Error('Inserisci il valore misurato.');
 if(outcome==='Non eseguito'&&String(req.value??'').trim())throw Error('Una prova non eseguita non può avere una misura.');
 const value=kind==='Misura strumentale'&&outcome!=='Non eseguito'&&String(req.value??'').trim()?reading(req.value):'';
 const unit=kind==='Misura strumentale'?String(req.unit||'—'):'—';
 if(!units.includes(unit))throw Error('Unità di misura non riconosciuta.');
 if(kind!=='Misura strumentale'&&!note)throw Error('Descrivi la verifica o la prova nelle note.');
 return {category,kind,outcome,label,value,unit,instrument,note};
}
function validate(state,core){
 const rows=ledger(state),ids=new Set();
 for(const row of rows){
  if(!row||typeof row.id!=='string'||!/^fc_[A-Za-z0-9_-]{5,120}$/.test(row.id)||ids.has(row.id))throw Error('Prova tecnica duplicata o incompleta.');
  ids.add(row.id);
  const ctx=context(core,row.jobId,row.actorId,false);
  if(!row.actorId||!assigned(ctx.job).includes(String(row.actorId))||!same(row.clientId,ctx.client.id)||!same(row.siteId,ctx.site?.id||'')||!same(row.plantId,ctx.plant?.id||'')||!same(row.deviceId,ctx.device?.id||''))throw Error('Prova collegata a cliente, impianto o apparecchiatura incoerente.');
  fields(row);
  if(!Number.isFinite(Date.parse(row.createdAt)))throw Error('Data prova non valida.');
  if(row.voidedAt){
   if(!Number.isFinite(Date.parse(row.voidedAt))||!assigned(ctx.job).includes(String(row.voidActorId))||typeof row.voidReason!=='string'||row.voidReason.trim().length<5||row.voidReason.length>250)throw Error('Storno prova incompleto.');
  }else if(row.voidReason||row.voidActorId)throw Error('Storno prova incoerente.');
 }
 return true;
}
function add(state,core,request){
 validate(state,core);
 const ctx=context(core,request.jobId,request.actorId,true);
 if(!request.actorId)throw Error('Seleziona l’operatore assegnato.');
 context(core,request.jobId,request.actorId,true);
 const f=fields(request),at=new Date().toISOString();
 const row={id:id('fc'),jobId:String(ctx.job.id),clientId:String(ctx.client.id),siteId:String(ctx.site?.id||''),plantId:String(ctx.plant?.id||''),deviceId:String(ctx.device?.id||''),actorId:String(request.actorId),...f,createdAt:at,voidedAt:'',voidActorId:'',voidReason:''};
 if(!state.settings||!Array.isArray(state.audit))throw Error('Archivio economico non pronto.');
 state.settings.fieldChecks=[...ledger(state),row];
 state.audit.push({id:id('audit'),at,action:'PROVA_TECNICA_INTERVENTO',detail:{checkId:row.id,jobId:row.jobId,actorId:row.actorId}});
 return row;
}
function voidCheck(state,core,request){
 validate(state,core);
 const row=ledger(state).find(x=>same(x.id,request.id));
 if(!row)throw Error('Prova tecnica non trovata.');
 if(row.voidedAt)throw Error('Prova già stornata.');
 context(core,row.jobId,request.actorId,true);
 if(!request.actorId)throw Error('Operatore obbligatorio.');
 const reason=String(request.reason||'').trim();
 if(reason.length<5||reason.length>250)throw Error('Motivazione obbligatoria (5–250 caratteri).');
 const at=new Date().toISOString();
 row.voidedAt=at;row.voidActorId=String(request.actorId);row.voidReason=reason;
 state.audit.push({id:id('audit'),at,action:'STORNO_PROVA_TECNICA',detail:{checkId:row.id,jobId:row.jobId,actorId:String(request.actorId),reason}});
 return row;
}
function forIntervention(state,core,jobId){
 const ctx=context(core,jobId,'',false);
 validate(state,core);
 const all=ledger(state).filter(x=>same(x.jobId,jobId)),active=all.filter(x=>!x.voidedAt);
 return {all,active,voided:all.length-active.length,flagged:active.filter(x=>x.outcome!=='Rilevato').length,deviceId:String(ctx.device?.id||'')};
}
function forDevice(state,core,deviceId){
 const device=(core.apparecchiature||[]).find(x=>same(x.id,deviceId));
 if(!device)throw Error('Apparecchiatura non disponibile.');
 const plant=(core.impianti||[]).find(x=>same(x.id,device.impianto_id)),property=plant&&(core.immobili||[]).find(x=>same(x.id,plant.immobile_id));
 if(!plant||!property||(core.clienti||[]).every(x=>!same(x.id,property.client_id)))throw Error('Gerarchia apparecchiatura incompleta.');
 validate(state,core);
 return ledger(state).filter(x=>same(x.deviceId,deviceId)&&!x.voidedAt).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF\u0000-\u001f]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
function csv(rows,core){
 const data=[['Intervento','Cliente','Data','Operatore','Settore','Tipo','Descrizione','Valore','Unità','Esito','Strumento','Note','Stato','Motivo storno']];
 for(const x of rows){
  const client=(core.clienti||[]).find(c=>same(c.id,x.clientId)),actor=(core.clienti||[]).find(c=>same(c.id,x.actorId));
  data.push([x.jobId,client?.name||'',x.createdAt,actor?.name||'',x.category,x.kind,x.label,x.value,x.unit,x.outcome,x.instrument,x.note,x.voidedAt?'Stornato':'Registrato',x.voidReason]);
 }
 return '\uFEFF'+data.map(r=>r.map(cell).join(';')).join('\r\n')+'\r\n';
}
function render(job,core,state){
 const report=forIntervention(state,core,job.id),actor=root.document?.getElementById('agenda-actor')?.value||'';
 const canWrite=job.workflow_status==='In corso'&&assigned(job).includes(String(actor));
 const active=report.active,history=report.deviceId?forDevice(state,core,report.deviceId):[];
 const opts=(values)=>values.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
 return '<section class="panel" id="ite-field-checks" data-field-job="'+esc(job.id)+'"><h3>Prove e misure tecniche — registro operativo</h3><p class="hint">Misure rilevate, verifiche visive e prove funzionali: nessun esito automatico di conformità. Per certificazioni usare i modelli ufficiali e le verifiche previste.</p>'+
 '<p>'+active.length+' registrazioni attive · '+report.voided+' storni · '+report.flagged+' da verificare / non eseguite</p>'+
 (canWrite?'<form id="ite-field-checks-form"><div class="grid"><label>Settore<select name="category">'+opts(categories)+'</select></label><label>Tipo<select name="kind">'+opts(kinds)+'</select></label><label>Esito descrittivo<select name="outcome">'+opts(outcomes)+'</select></label><label>Descrizione prova<input name="label" required minlength="4" maxlength="120" placeholder="Es. Temperatura mandata"></label><label>Valore numerico (solo misura)<input name="value" inputmode="decimal" placeholder="Es. 45,5"></label><label>Unità<select name="unit">'+opts(units)+'</select></label><label>Strumento (facoltativo)<input name="instrument" maxlength="120"></label><label class="form-wide">Osservazioni / prova eseguita<input name="note" maxlength="500" placeholder="Descrivere condizioni e risultato"></label></div><button type="submit">Registra prova tecnica</button></form>':'<p class="hint">Per registrare o stornare seleziona un operatore assegnato e apri l’intervento. Se chiuso, utilizza Revisiona intervento.</p>')+
 active.slice(-50).reverse().map(x=>'<article class="item"><strong>'+esc(x.category)+' · '+esc(x.label)+'</strong><p>'+esc(x.kind)+' · '+esc(x.outcome)+(x.value?' · '+esc(x.value)+' '+esc(x.unit):'')+' · '+esc(x.createdAt.slice(0,16))+'</p><p>'+esc(x.note||'')+'</p>'+(canWrite?'<button type="button" class="secondary" data-field-void="'+esc(x.id)+'">Storna con motivazione</button>':'')+'</article>').join('')+
 (active.length>50?'<p class="hint">Visualizzate le ultime 50 prove; esportazione completa.</p>':'')+
 (history.length?'<details><summary>Storico della stessa apparecchiatura ('+history.length+')</summary>'+history.slice(0,20).map(x=>'<p>Intervento #'+esc(x.jobId)+' · '+esc(x.label)+' · '+esc(x.outcome)+(x.value?' · '+esc(x.value)+' '+esc(x.unit):'')+'</p>').join('')+'</details>':'')+
 '<button type="button" class="secondary" data-field-csv="'+esc(job.id)+'">Esporta prove CSV</button><p role="status" id="ite-field-checks-status"></p></section>';
}
function download(content,name){const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})),a=root.document.createElement('a');a.href=url;a.download=name;root.document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function mount(force=false){
 if(!root.document||!root.ITE||!root.ITECommerce||root.ITERouter?.current?.()!=='scheda-intervento')return;
 const host=root.document.getElementById('appointment-detail'),job=root.ITEAgenda?.currentIntervention?.();
 if(!host||!job)return;
 const existing=host.querySelector('#ite-field-checks');
 if(existing&&!force)return;
 try{const html=render(job,root.ITE.snapshot(),root.ITECommerce.snapshot());if(existing)existing.outerHTML=html;else host.insertAdjacentHTML('beforeend',html);}
 catch(e){if(existing)existing.textContent='Registro prove non disponibile: '+e.message;}
}
function initialize(){
 const host=root.document.getElementById('appointment-detail');
 if(host)new MutationObserver(()=>mount()).observe(host,{childList:true});
 root.addEventListener('ite-pagechange',()=>mount());
 root.document.addEventListener('change',e=>{if(['agenda-actor','agenda-detail-actor'].includes(e.target?.id))mount(true);});
 root.document.addEventListener('submit',async e=>{
  if(e.target?.id!=='ite-field-checks-form')return;e.preventDefault();
  const button=e.target.querySelector('[type=submit]');button.disabled=true;
  try{
   const job=root.ITEAgenda?.currentIntervention?.();if(!job)throw Error('Intervento non selezionato.');
   const f=new FormData(e.target),req=Object.fromEntries(f.entries());
   req.jobId=job.id;req.actorId=root.document.getElementById('agenda-actor')?.value;
   fields(req);context(root.ITE.snapshot(),req.jobId,req.actorId,true);
   await root.ITEHistory.create('Prima registrazione prova tecnica');
   await root.ITECommerce.mutate((next,core)=>add(next,core,req));
   mount(true);
  }catch(err){const out=root.document.getElementById('ite-field-checks-status');if(out)out.textContent=err.message;button.disabled=false;}
 });
 root.document.addEventListener('click',async e=>{
  const b=e.target.closest?.('button');if(!b)return;
  if(b.dataset.fieldVoid){
   const reason=root.prompt('Motivo storno prova (minimo 5 caratteri):');if(reason===null)return;
   b.disabled=true;
   try{
    const actorId=root.document.getElementById('agenda-actor')?.value,req={id:b.dataset.fieldVoid,actorId,reason};
    const state=root.ITECommerce.snapshot(),core=root.ITE.snapshot();
    const row=ledger(state).find(x=>same(x.id,req.id));
    if(!row)throw Error('Prova non trovata.');
    context(core,row.jobId,actorId,true);
    await root.ITEHistory.create('Prima storno prova tecnica');
    await root.ITECommerce.mutate((next,c)=>voidCheck(next,c,req));mount(true);
   }catch(err){root.alert(err.message);b.disabled=false;}
  }
  if(b.dataset.fieldCsv){
   try{
    const state=root.ITECommerce.snapshot(),core=root.ITE.snapshot(),report=forIntervention(state,core,b.dataset.fieldCsv);
    if(!root.confirm('Il CSV contiene dati tecnici e cliente NON cifrati. Confermare esportazione locale?'))return;
    download(csv(report.all,core),'ITE_prove_intervento_'+String(b.dataset.fieldCsv).replace(/[^A-Za-z0-9_-]/g,'')+'.csv');
   }catch(err){root.alert(err.message);}
  }
 });
 mount();
}
const api=Object.freeze({categories,kinds,outcomes,units,templates,fields,context,validate,add,voidCheck,forIntervention,forDevice,csv,render});
root.ITEFieldChecks=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document&&root.addEventListener)root.addEventListener('ite-vault-ready',initialize);
})(typeof window!=='undefined'?window:globalThis);
