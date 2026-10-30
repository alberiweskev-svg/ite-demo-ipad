/* I.T.E. 4.0 — consumi materiali per intervento e movimenti magazzino reversibili.
   Nessun consumo viene dedotto automaticamente da preventivi, CAD o fatture. */
(function(root){
'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('it-IT',{maximumFractionDigits:3});
const iso=()=>new Date().toISOString();
const day=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const newId=prefix=>prefix+'_'+root.crypto.randomUUID();
function quantity(value){
 if(typeof value!=='number'&&!(typeof value==='string'&&/^\d+(?:\.\d{1,3})?$/.test(value.trim())))throw Error('Quantità non valida: massimo tre decimali.');
 const n=Number(value);
 if(!Number.isFinite(n)||n<=0||n>10000||Number(n.toFixed(3))!==n)throw Error('Quantità non valida: deve essere positiva, massimo 10000.');
 return n;
}
function ledger(state){const rows=state?.settings?.jobMaterialUsage??[];if(!Array.isArray(rows))throw Error('Registro materiali interventi non valido.');return rows;}
function assignments(job){
 try{const rows=JSON.parse(job?.assigned_operators||'[]');return Array.isArray(rows)?rows.filter(x=>x&&x.operator_id).map(x=>String(x.operator_id)):[]}catch{return []}
}
function context(core,jobId,actorId='',requireActive=false){
 const job=(core.interventi||[]).find(x=>same(x.id,jobId));
 if(!job||job.appointment!=='1'||!job.client_id)throw Error('Intervento da calendario non disponibile.');
 const client=(core.clienti||[]).find(x=>same(x.id,job.client_id));
 if(!client)throw Error('Cliente dell’intervento non presente.');
 const site=job.cantiere_id?(core.cantieri||[]).find(x=>same(x.id,job.cantiere_id)):null;
 if(job.cantiere_id&&(!site||!same(site.client_id,client.id)))throw Error('Cantiere e cliente dell’intervento non coerenti.');
 if(requireActive&&job.workflow_status!=='In corso')throw Error('Registra prima l’arrivo; per interventi chiusi usa Revisiona intervento.');
 if(actorId&&!assignments(job).includes(String(actorId)))throw Error('Operatore non assegnato all’intervento.');
 return {job,client,site};
}
function stock(state,articleId){
 let balance=0;
 for(const m of state.movements||[]){
  if(!same(m.articleId,articleId))continue;
  if(m.quantity===null||m.quantity===undefined||String(m.quantity).trim()===''||!Number.isFinite(Number(m.quantity)))throw Error('Giacenza non verificabile: movimento non valido.');
  balance+=Number(m.quantity);
 }
 if(!Number.isFinite(balance))throw Error('Giacenza non verificabile.');
 return Number(balance.toFixed(3));
}
function articleOf(state,articleId){
 const article=(state.articles||[]).find(x=>same(x.id,articleId));
 if(!article||article.kind!=='Materiale')throw Error('Seleziona un articolo classificato Materiale.');
 return article;
}
function addUsage(state,core,request){
 const {job,client,site}=context(core,request.jobId,request.actorId,true);
 const article=articleOf(state,request.articleId),q=quantity(request.quantity);
 if(stock(state,article.id)+1e-9<q)throw Error('Giacenza insufficiente: registra prima il carico verificato.');
 const note=String(request.note||'').trim();
 if(note.length>250)throw Error('Nota troppo lunga.');
 if(!state.settings||!Array.isArray(state.movements))throw Error('Archivio magazzino incompleto.');
 const cost=article.costPrice!==null&&article.costPrice!==undefined&&String(article.costPrice).trim()!==''&&Number.isFinite(Number(article.costPrice))&&Number(article.costPrice)>=0&&Number(article.costPrice)<=1e8?Math.round(Number(article.costPrice)*100):null;
 const entry={id:newId('usage'),jobId:String(job.id),clientId:String(client.id),siteId:String(site?.id||''),articleId:String(article.id),actorId:String(request.actorId),quantity:q,unit:String(article.unit||'pz'),articleLabel:String(article.description||article.code||''),unitCostCents:cost,date:day(),createdAt:iso(),note,movementId:newId('mov'),reversedAt:'',reversalMovementId:'',reversalReason:''};
 const rows=ledger(state);if(rows.length>=20000)throw Error('Registro materiali pieno: esporta e archivia prima di proseguire.');
 state.settings.jobMaterialUsage=[...rows,entry];
 state.movements.push({id:entry.movementId,articleId:entry.articleId,quantity:-q,date:entry.date,reason:'Scarico intervento #'+entry.jobId+(note?' — '+note:''),siteId:entry.siteId,jobId:entry.jobId,documentId:'',created:entry.createdAt});
 state.audit.push({id:newId('audit'),at:entry.createdAt,action:'CONSUMO_MATERIALE_INTERVENTO',detail:{usageId:entry.id,jobId:entry.jobId,articleId:entry.articleId,quantity:q,actorId:entry.actorId}});
 return entry;
}
function reverseUsage(state,core,request){
 const rows=ledger(state),entry=rows.find(x=>same(x.id,request.usageId));
 if(!entry)throw Error('Consumo non trovato.');
 if(entry.reversedAt)throw Error('Consumo già stornato.');
 context(core,entry.jobId,request.actorId);
 const reason=String(request.reason||'').trim();
 if(reason.length<5||reason.length>250)throw Error('Motivazione dello storno obbligatoria (5–250 caratteri).');
 const movement=(state.movements||[]).find(x=>same(x.id,entry.movementId));
 if(!movement||!same(movement.articleId,entry.articleId)||Math.abs(Number(movement.quantity)+entry.quantity)>1e-9)throw Error('Movimento originario non coerente: storno bloccato.');
 entry.reversedAt=iso();entry.reversalReason=reason;entry.reversalActorId=String(request.actorId);entry.reversalMovementId=newId('mov');
 state.movements.push({id:entry.reversalMovementId,articleId:entry.articleId,quantity:entry.quantity,date:day(),reason:'Storno consumo #'+entry.id+' — '+reason,siteId:entry.siteId,jobId:entry.jobId,documentId:'',created:entry.reversedAt});
 state.audit.push({id:newId('audit'),at:entry.reversedAt,action:'STORNO_CONSUMO_MATERIALE',detail:{usageId:entry.id,jobId:entry.jobId,actorId:request.actorId,reason}});
 return entry;
}
function validate(state,core){
 const rows=ledger(state),ids=new Set(),movements=new Map((state.movements||[]).map(x=>[String(x.id),x]));
 if(rows.length>20000)throw Error('Registro consumi troppo grande.');
 for(const r of rows){
  if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||!r.movementId||!r.jobId||!r.clientId||!r.articleId||!r.actorId)throw Error('Identificativo consumo duplicato o incompleto.');
  ids.add(r.id);
  const {job,client,site}=context(core,r.jobId,r.actorId);
  if(!same(r.clientId,client.id)||!same(r.siteId,site?.id||''))throw Error('Consumo collegato a cliente o cantiere diverso.');
  articleOf(state,r.articleId);quantity(r.quantity);
  if(typeof r.unit!=='string'||typeof r.articleLabel!=='string'||typeof r.note!=='string'||r.note.length>250||!Number.isFinite(Date.parse(r.createdAt))||!Number.isFinite(Date.parse(r.date+'T00:00:00Z'))||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))throw Error('Dati consumo non validi.');
  if(r.unitCostCents!==null&&(!Number.isSafeInteger(r.unitCostCents)||r.unitCostCents<0))throw Error('Costo storico consumo non valido.');
  const m=movements.get(String(r.movementId));
  if(!m||!same(m.articleId,r.articleId)||!same(m.siteId,r.siteId)||!same(m.jobId,job.id)||Math.abs(Number(m.quantity)+r.quantity)>1e-9)throw Error('Scarico materiale non corrispondente al consumo.');
  if(r.reversedAt){
   if(!Number.isFinite(Date.parse(r.reversedAt))||!r.reversalMovementId||!r.reversalActorId||!assignments(job).includes(String(r.reversalActorId))||typeof r.reversalReason!=='string'||r.reversalReason.trim().length<5)throw Error('Storno consumo incompleto.');
   const reversal=movements.get(String(r.reversalMovementId));
   if(!reversal||!same(reversal.articleId,r.articleId)||!same(reversal.siteId,r.siteId)||!same(reversal.jobId,job.id)||Math.abs(Number(reversal.quantity)-r.quantity)>1e-9)throw Error('Movimento di storno non corrispondente.');
  }else if(r.reversalMovementId||r.reversalReason)throw Error('Storno incompleto.');
 }
 return true;
}
function summarize(rows){
 const active=rows.filter(x=>!x.reversedAt),known=active.filter(x=>x.unitCostCents!==null);
 const estimatedCents=known.reduce((n,x)=>n+Math.round(x.quantity*x.unitCostCents),0);
 return {rows:active.length,reversed:rows.length-active.length,known:known.length,unknown:active.length-known.length,estimatedCents};
}
function csv(rows,core,state){
 const header=['Data','Intervento','Cliente','Cantiere','Articolo','Codice','Quantità','Unità','Operatore','Stato','Costo storico unitario EUR','Nota','Motivo storno'];
 const table=[header];
 for(const r of rows){
  const job=(core.interventi||[]).find(x=>same(x.id,r.jobId)),client=(core.clienti||[]).find(x=>same(x.id,r.clientId)),site=(core.cantieri||[]).find(x=>same(x.id,r.siteId)),article=(state.articles||[]).find(x=>same(x.id,r.articleId)),actor=(core.clienti||[]).find(x=>same(x.id,r.actorId));
  table.push([r.date,job?.id||r.jobId,client?.name||'',site?.name||'',r.articleLabel,article?.code||'',r.quantity,r.unit,actor?.name||'',r.reversedAt?'Stornato':'Registrato',r.unitCostCents===null?'':(r.unitCostCents/100).toFixed(2),r.note,r.reversalReason]);
 }
 const cell=value=>{let s=String(value??'');if(/^[\s\uFEFF]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+table.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
function renderForJob(job,core,state){
 if(!job||job.appointment!=='1')return '';
 const rows=ledger(state).filter(x=>same(x.jobId,job.id)),sum=summarize(rows),actor=root.document?.getElementById('agenda-actor')?.value||'';
 const assigned=assignments(job),canWrite=job.workflow_status==='In corso'&&assigned.includes(actor);
 const materials=(state.articles||[]).filter(x=>x.kind==='Materiale').map(a=>({a,available:stock(state,a.id)})).filter(x=>x.available>0);
 return '<section class="panel" id="ite-job-materials" data-job-id="'+esc(job.id)+'"><h3>Materiali utilizzati nell’intervento</h3><p>'+sum.rows+' consumi attivi · '+sum.reversed+' stornati · '+sum.unknown+' senza costo di acquisto verificato</p><p class="hint">Lo scarico modifica la giacenza soltanto dopo conferma. Preventivi, fatture e CAD non scaricano automaticamente materiali. Il costo storico è mostrato solo quando il prezzo di acquisto è presente nell’articolo.</p>'+
 (canWrite?'<form id="ite-job-materials-form"><div class="grid"><label>Articolo disponibile<select name="articleId" required>'+materials.map(x=>'<option value="'+esc(x.a.id)+'">'+esc(x.a.code+' · '+x.a.description+' · '+fmt(x.available)+' '+(x.a.unit||'pz'))+'</option>').join('')+'</select></label><label>Quantità utilizzata<input name="quantity" required type="number" min="0.001" max="10000" step="0.001" value="1"></label><label class="form-wide">Nota tecnica (facoltativa)<input name="note" maxlength="250" placeholder="Dove è stato installato"></label></div><button type="submit" '+(!materials.length?'disabled':'')+'>Registra utilizzo e scarico</button></form>':'<p class="hint">Per registrare materiali seleziona un tecnico assegnato, registra «Sono arrivato» e mantieni l’intervento in corso. Per un intervento chiuso usa «Revisiona intervento».</p>')+
 rows.map(r=>'<div class="item"><strong>'+esc(r.articleLabel)+' · '+fmt(r.quantity)+' '+esc(r.unit)+'</strong><p>'+esc(r.date)+' · '+(r.reversedAt?'STORNATO':'Registrato')+(r.unitCostCents!==null?' · costo acquisto storico '+(r.unitCostCents/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'})+'/'+esc(r.unit):' · costo acquisto non disponibile')+'</p>'+(r.note?'<p>'+esc(r.note)+'</p>':'')+(r.reversedAt?'<p>Storno: '+esc(r.reversalReason)+'</p>':assigned.includes(actor)?'<button type="button" class="secondary" data-job-material-void="'+esc(r.id)+'">Storna con motivazione</button>':'')+'</div>').join('')+
 '<div class="actions"><button type="button" class="secondary" data-job-material-csv="'+esc(job.id)+'">Esporta registro CSV</button><a class="btn" href="#magazzino">Apri magazzino</a></div><p id="ite-job-materials-status" role="status"></p></section>';
}
function renderForSite(site,core,state){
 if(!site)return '';
 const rows=ledger(state).filter(x=>same(x.siteId,site.id)),sum=summarize(rows);
 return '<section class="panel" id="ite-site-materials" data-site-id="'+esc(site.id)+'"><h4>Consumi materiali degli interventi</h4><p>'+sum.rows+' consumi attivi · '+sum.reversed+' storni · '+sum.unknown+' righe senza costo acquisto verificato</p>'+
 (sum.known?'<p>Costo storico documentato (solo '+sum.known+' righe): <strong>'+(sum.estimatedCents/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'})+'</strong></p>':'')+
 '<p class="hint">Costi di acquisto storici parziali: non rappresentano il margine, non vanno sommati alle fatture di acquisto. Nessuna doppia contabilizzazione automatica.</p>'+
 rows.map(r=>'<div class="item"><strong>'+esc(r.articleLabel)+' · '+fmt(r.quantity)+' '+esc(r.unit)+'</strong><p>Intervento #'+esc(r.jobId)+' · '+esc(r.date)+' · '+(r.reversedAt?'Stornato':'Registrato')+'</p></div>').join('')+
 '<button type="button" class="secondary" data-site-material-csv="'+esc(site.id)+'">Esporta CSV consumi cantiere</button></section>';
}
function download(text,name){
 const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=root.document.createElement('a');
 a.href=url;a.download=name;root.document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function mount(force=false){
 if(!root.ITECommerce||!root.ITE||!root.document)return;
 const core=root.ITE.snapshot(),state=root.ITECommerce.snapshot(),job=root.ITEAgenda?.currentIntervention?.(),jobBox=root.document.getElementById('appointment-detail');
 if(jobBox&&job&&root.ITERouter?.current?.()==='scheda-intervento'){
  const existing=jobBox.querySelector('#ite-job-materials');
  if(!existing){jobBox.insertAdjacentHTML('beforeend',renderForJob(job,core,state));}
  else if(force)existing.outerHTML=renderForJob(job,core,state);
 }
 const siteBox=root.document.getElementById('worksite-detail'),id=siteBox?.querySelector('[data-work-edit]')?.dataset.workEdit;
 if(siteBox&&id&&root.ITERouter?.current?.()==='scheda-cantiere'){
  const site=(core.cantieri||[]).find(x=>same(x.id,id)),existing=siteBox.querySelector('#ite-site-materials');
  if(site&&!existing)siteBox.insertAdjacentHTML('beforeend',renderForSite(site,core,state));
  else if(site&&force&&existing)existing.outerHTML=renderForSite(site,core,state);
 }
}
function initialize(){
 if(!root.document||!root.ITECommerce)return;
 const refresh=()=>mount();
 for(const id of ['appointment-detail','worksite-detail']){
  const node=root.document.getElementById(id);if(node)new MutationObserver(refresh).observe(node,{childList:true});
 }
 root.addEventListener('ite-pagechange',refresh);
 root.document.addEventListener('change',e=>{if(e.target?.id==='agenda-detail-actor'||e.target?.id==='agenda-actor')mount(true);});
 root.document.addEventListener('submit',async e=>{
  if(e.target?.id!=='ite-job-materials-form')return;e.preventDefault();
  const form=e.target,job=root.ITEAgenda?.currentIntervention?.(),actor=root.document.getElementById('agenda-actor')?.value;
  const data=new FormData(form),button=form.querySelector('[type=submit]');button.disabled=true;
  try{
   if(!job)throw Error('Intervento non selezionato.');
   const request={jobId:job.id,actorId:actor,articleId:data.get('articleId'),quantity:data.get('quantity'),note:data.get('note')};
   await root.ITEHistory.create('Prima scarico materiali intervento');
   await root.ITECommerce.mutate((next,core)=>addUsage(next,core,request));
   mount(true);
  }catch(error){const message=root.document.getElementById('ite-job-materials-status');if(message)message.textContent=error.message;button.disabled=false;}
 });
 root.document.addEventListener('click',async e=>{
  const button=e.target.closest('button');if(!button)return;
  const usageId=button.dataset.jobMaterialVoid,jobCsv=button.dataset.jobMaterialCsv,siteCsv=button.dataset.siteMaterialCsv;
  if(usageId){
   const reason=root.prompt('Motivazione dello storno del materiale (minimo 5 caratteri):');
   if(reason===null)return;const actor=root.document.getElementById('agenda-actor')?.value;
   button.disabled=true;
   try{await root.ITEHistory.create('Prima storno consumo materiali');await root.ITECommerce.mutate((next,core)=>reverseUsage(next,core,{usageId,actorId:actor,reason}));mount(true)}
   catch(error){root.alert(error.message);button.disabled=false;}
  }else if(jobCsv||siteCsv){
   if(!root.confirm('Il CSV contiene dati del cliente e non è cifrato. Esportare?'))return;
   const state=root.ITECommerce.snapshot(),core=root.ITE.snapshot(),rows=ledger(state).filter(x=>jobCsv?same(x.jobId,jobCsv):same(x.siteId,siteCsv));
   download(csv(rows,core,state),'ITE_materiali_'+(jobCsv?'intervento_':'cantiere_')+String(jobCsv||siteCsv).replace(/[^A-Za-z0-9_-]/g,'')+'.csv');
  }
 });
 mount();
}
const api={quantity,assignments,context,stock,addUsage,reverseUsage,validate,summarize,csv,renderForJob,renderForSite};
root.ITEJobMaterials=api;
if(root.document&&root.addEventListener)root.addEventListener('ite-vault-ready',initialize);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
