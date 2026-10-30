/* I.T.E. 4.0 — costi di commessa: ore operatore, spese e differenza parziale.
   Solo uso interno. Non determina utile fiscale, non registra fatture o movimenti di magazzino. */
(function(root){'use strict';
const eq=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>(n/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const uid=()=> 'exp_'+(root.crypto?.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));
const categories=['Trasferta','Noleggio','Smaltimento','Subappalto','Altro'];
const defaults={worker:4400,professional:5800};
const expenses=s=>{const v=s?.settings?.jobSiteExpenses||[];if(!Array.isArray(v))throw Error('Registro spese non valido.');return v};
const overrides=s=>{const v=s?.settings?.jobLaborRates||{};if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Tariffe interne non valide.');return v};
function euroCents(v){
 if(typeof v!=='string'&&typeof v!=='number')throw Error('Importo non valido.');
 const t=String(v).trim().replace(',','.');
 if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(t))throw Error('Importo non valido: usa euro e due decimali.');
 const n=Math.round(Number(t)*100);if(n<=0||n>100000000)throw Error('Importo fuori limite.');
 return n;
}
function rateCents(v){const n=euroCents(v);if(n>50000)throw Error('Tariffa oraria superiore al limite di 500 euro.');return n}
function validate(state,core){
 const list=expenses(state),rates=overrides(state),ids=new Set();
 if(list.length>20000||Object.keys(rates).length>2000)throw Error('Registro commessa troppo grande.');
 for(const [id,rate] of Object.entries(rates)){
  if(!/^\d+$/.test(id)||!Number.isSafeInteger(rate)||rate<=0||rate>50000||!(core.clienti||[]).some(p=>eq(p.id,id)))throw Error('Tariffa interna incoerente.');
 }
 for(const x of list){
  if(!x||typeof x.id!=='string'||!/^exp_[A-Za-z0-9_-]{5,100}$/.test(x.id)||ids.has(x.id)||!x.siteId||!x.clientId||!categories.includes(x.category)||typeof x.description!=='string'||x.description.trim().length<5||x.description.length>200||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||new Date(x.date+'T00:00:00Z').toISOString().slice(0,10)!==x.date||!Number.isSafeInteger(x.amountCents)||x.amountCents<=0||x.amountCents>100000000||!Number.isFinite(Date.parse(x.createdAt)))throw Error('Spesa incompleta o duplicata.');
  ids.add(x.id);
  if(!(core.cantieri||[]).some(site=>eq(site.id,x.siteId)&&eq(site.client_id,x.clientId)))throw Error('Spesa con cantiere o cliente incoerente.');
  if(x.voidedAt!==undefined&&(!Number.isFinite(Date.parse(x.voidedAt))||typeof x.voidReason!=='string'||x.voidReason.trim().length<5||x.voidReason.length>200))throw Error('Storno spesa incompleto.');
 }
 return true;
}
function rateFor(person,state){
 const key=String(person.id),override=overrides(state)[key];
 if(override!==undefined)return override;
 const roles=Array.isArray(person.roles)?person.roles:[person.kind];
 return roles.some(r=>['Professionista','Collaboratore esterno'].includes(r))?defaults.professional:defaults.worker;
}
function labor(site,core,state){
 const rows=[],warnings=[];let seconds=0,costCents=0,unclosed=0;
 const jobs=(core.interventi||[]).filter(j=>eq(j.cantiere_id,site.id));
 for(const job of jobs){
  if(job.client_id&&!eq(job.client_id,site.client_id))throw Error('Intervento di altro cliente collegato al cantiere.');
  let entries=[];
  if(job.time_tracking==='automatic'){
   let sessions;try{sessions=JSON.parse(job.work_sessions||'[]')}catch{warnings.push('Intervento '+job.id+': sessioni non leggibili.');continue}
   if(!Array.isArray(sessions)){warnings.push('Intervento '+job.id+': sessioni non valide.');continue}
   for(const s of sessions){
    if(!s||!s.operator_id||!s.arrived_at){warnings.push('Intervento '+job.id+': sessione incompleta.');continue}
    if(!s.departed_at){unclosed++;continue}
    const start=Date.parse(s.arrived_at),end=Date.parse(s.departed_at);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>86400000){warnings.push('Intervento '+job.id+': durata da verificare.');continue}
    entries.push({operatorId:String(s.operator_id),seconds:Math.floor((end-start)/1000)});
   }
  }else{
   let logs;try{logs=JSON.parse(job.work_logs||'[]')}catch{warnings.push('Intervento '+job.id+': ore non leggibili.');continue}
   if(!Array.isArray(logs)){warnings.push('Intervento '+job.id+': ore non valide.');continue}
   for(const l of logs){
    if(!l||!l.operator_id||!Number.isSafeInteger(l.duration_minutes)||l.duration_minutes<=0||l.duration_minutes>1440){warnings.push('Intervento '+job.id+': registrazione da verificare.');continue}
    entries.push({operatorId:String(l.operator_id),seconds:l.duration_minutes*60});
   }
  }
  if(!entries.length){if(!job.work_logs&&!job.work_sessions)warnings.push('Intervento '+job.id+': tempi non registrati.');continue}
  for(const entry of entries){
   const person=(core.clienti||[]).find(p=>eq(p.id,entry.operatorId));
   if(!person){warnings.push('Intervento '+job.id+': operatore non presente.');continue}
   const rate=rateFor(person,state),cost=Math.round(entry.seconds*rate/3600);
   rows.push({jobId:String(job.id),operatorId:entry.operatorId,operator:String(person.name||person.id),seconds:entry.seconds,rateCents:rate,costCents:cost});
   seconds+=entry.seconds;costCents+=cost;
  }
 }
 if(unclosed)warnings.push(unclosed+' sessioni aperte escluse dai costi.');
 return {rows,warnings,seconds,costCents,unclosed,jobs:jobs.length};
}
function analyze(site,core,state){
 if(!site||!(core.cantieri||[]).some(x=>eq(x.id,site.id))||!(core.clienti||[]).some(x=>eq(x.id,site.client_id)))throw Error('Cantiere o cliente non disponibile.');
 validate(state,core);
 const material=root.ITESiteCosting?.analyze?.(site,core,state);
 const work=labor(site,core,state);
 const history=expenses(state).filter(x=>eq(x.siteId,site.id));
 const active=history.filter(x=>!x.voidedAt);
 const expenseCents=active.reduce((n,x)=>n+x.amountCents,0);
 const materialCents=material?.totalKnown??0,approvedNet=material?.approvedNet??null;
 const knownCost=materialCents+work.costCents+expenseCents;
 const warnings=[...(material?.warnings||[]),...work.warnings];
 if(material?.unknownCount)warnings.push(material.unknownCount+' consumi senza costo di acquisto verificato.');
 if(approvedNet===null)warnings.push('Valore lavori approvati non disponibile.');
 return {material,work,history,expenseCents,materialCents,approvedNet,knownCost,partialDifference:approvedNet===null?null:approvedNet-knownCost,warnings,complete:false};
}
function addExpense(state,core,req){
 validate(state,core);
 const site=(core.cantieri||[]).find(x=>eq(x.id,req.siteId));
 if(!site||!site.client_id||!categories.includes(req.category))throw Error('Cantiere o categoria non validi.');
 const description=String(req.description||'').trim(),date=String(req.date||'');
 if(description.length<5||description.length>200)throw Error('Descrizione richiesta (5–200 caratteri).');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Data non valida.');
 const entry={id:uid(),siteId:String(site.id),clientId:String(site.client_id),category:req.category,description,date,amountCents:euroCents(req.amount),createdAt:new Date().toISOString()};
 state.settings.jobSiteExpenses=[...expenses(state),entry];
 state.audit.push({id:'audit_'+uid(),at:entry.createdAt,action:'COSTO_COMMESSA_REGISTRATO',detail:{siteId:entry.siteId,expenseId:entry.id,amountCents:entry.amountCents,category:entry.category}});
 validate(state,core);return entry;
}
function reverseExpense(state,core,siteId,id,reason){
 const why=String(reason||'').trim();if(why.length<5||why.length>200)throw Error('Motivazione storno obbligatoria (5–200 caratteri).');
 const entry=expenses(state).find(x=>eq(x.id,id)&&eq(x.siteId,siteId));
 if(!entry||entry.voidedAt)throw Error('Spesa assente o già stornata.');
 if(!(core.cantieri||[]).some(x=>eq(x.id,siteId)&&eq(x.client_id,entry.clientId)))throw Error('Cantiere non coerente.');
 entry.voidedAt=new Date().toISOString();entry.voidReason=why;
 state.audit.push({id:'audit_'+uid(),at:entry.voidedAt,action:'STORNO_COSTO_COMMESSA',detail:{siteId:entry.siteId,expenseId:entry.id,reason:why}});return entry;
}
function setRate(state,core,operatorId,value){
 const person=(core.clienti||[]).find(p=>eq(p.id,operatorId));
 if(!person)throw Error('Operatore non presente.');
 const rate=rateCents(value),id=String(person.id);
 state.settings.jobLaborRates={...overrides(state),[id]:rate};
 state.audit.push({id:'audit_'+uid(),at:new Date().toISOString(),action:'TARIFFA_INTERNA_OPERATORE',detail:{operatorId:id,rateCents:rate}});
 validate(state,core);return rate;
}
function csv(site,core,state){
 const a=analyze(site,core,state),data=[['Tipo','Cantiere','Riferimento','Descrizione','Ore','Tariffa EUR/h','Costo EUR','Stato']];
 for(const r of a.work.rows)data.push(['Manodopera',site.name||site.id,r.jobId,r.operator,(r.seconds/3600).toFixed(3),(r.rateCents/100).toFixed(2),(r.costCents/100).toFixed(2),'Registrata']);
 for(const x of a.history)data.push(['Spesa',site.name||site.id,x.date,x.category+' · '+x.description,'','',(x.amountCents/100).toFixed(2),x.voidedAt?'STORNATA':'ATTIVA']);
 data.push(['Riepilogo',site.name||site.id,'','Materiali costo noto','','',(a.materialCents/100).toFixed(2),'']);
 data.push(['Riepilogo',site.name||site.id,'','Totale costi noti','','',(a.knownCost/100).toFixed(2),'']);
 data.push(['Riepilogo',site.name||site.id,'','Differenza parziale su lavori approvati','','',a.partialDifference===null?'DA VERIFICARE':(a.partialDifference/100).toFixed(2),'NON MARGINE DEFINITIVO']);
 const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+@\-\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+data.map(r=>r.map(cell).join(';')).join('\r\n')+'\r\n';
}
function render(site,core,state){
 const a=analyze(site,core,state);
 const people=[...new Map(a.work.rows.map(r=>[r.operatorId,r.operator])).entries()];
 return '<section class="panel" id="ite-job-economics" data-econ-site="'+esc(site.id)+'"><h3>Costi di commessa · manodopera e spese</h3><p class="hint">Solo uso interno: ore-operatore da interventi, costo materiali già scaricati e spese registrate. Non somma le fatture di acquisto ai consumi.</p>'+
 '<dl class="data-pairs"><div><dt>Materiali, costo noto</dt><dd>'+money(a.materialCents)+'</dd></div><div><dt>Manodopera registrata</dt><dd>'+money(a.work.costCents)+'</dd></div><div><dt>Altre spese attive</dt><dd>'+money(a.expenseCents)+'</dd></div><div><dt>Totale costi noti</dt><dd>'+money(a.knownCost)+'</dd></div><div><dt>Lavori approvati, imponibile previsto</dt><dd>'+(a.approvedNet===null?'Da verificare':money(a.approvedNet))+'</dd></div><div><dt>Differenza parziale (non utile)</dt><dd>'+(a.partialDifference===null?'Non disponibile':money(a.partialDifference))+'</dd></div></dl>'+
 '<p class="hint">Tariffe interne indicative: operaio 44 €/h, professionista 58 €/h, modificabili per operatore. Non sono prezzi di vendita e non vengono mostrati nei preventivi cliente. Mancano costi indiretti, imposte, spese non registrate e riconciliazione contabile: NON è un margine definitivo.</p>'+
 (a.warnings.length?'<div class="alert-amber"><b>Costi o dati da verificare</b>'+a.warnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'</div>':'')+
 '<div class="actions"><button type="button" data-econ-add="'+esc(site.id)+'">+ Registra spesa</button><button type="button" class="secondary" data-econ-csv="'+esc(site.id)+'">Esporta CSV interno</button></div>'+
 '<details><summary>Ore per operatore ('+a.work.rows.length+' registrazioni)</summary>'+a.work.rows.map(r=>'<div class="item">'+esc(r.operator)+' · intervento '+esc(r.jobId)+' · '+(r.seconds/3600).toFixed(2)+' h · '+money(r.rateCents)+'/h · costo '+money(r.costCents)+'</div>').join('')+
 people.map(([id,name])=>'<button type="button" class="secondary" data-econ-rate="'+esc(id)+'" data-econ-site="'+esc(site.id)+'">Tariffa interna · '+esc(name)+'</button>').join('')+'</details>'+
 '<h4>Spese aggiuntive</h4>'+(a.history.map(x=>'<div class="item"><strong>'+esc(x.category)+' · '+money(x.amountCents)+(x.voidedAt?' · STORNATA':'')+'</strong><p>'+esc(x.date)+' · '+esc(x.description)+'</p>'+(x.voidedAt?'<p>'+esc(x.voidReason)+'</p>':'<button type="button" class="secondary" data-econ-void="'+esc(x.id)+'" data-econ-site="'+esc(site.id)+'">Storna spesa</button>')+'</div>').join('')||'<p class="hint">Nessuna spesa aggiuntiva registrata.</p>')+'</section>';
}
let busy=false;
async function save(label,fn){
 if(busy)throw Error('Salvataggio in corso.');busy=true;
 try{if(!root.ITEHistory?.create||!root.ITECommerce?.mutate)throw Error('Archivio o backup non disponibili.');await root.ITEHistory.create(label);await root.ITECommerce.mutate((next,core)=>fn(next,core))}
 finally{busy=false}
}
function mount(force=false){
 if(!root.document||!root.ITECommerce||!root.ITE||root.ITERouter?.current?.()!=='scheda-cantiere')return;
 const host=root.document.getElementById('worksite-detail'),id=host?.querySelector('[data-work-edit]')?.dataset.workEdit;
 if(!id)return;const core=root.ITE.snapshot(),site=core.cantieri.find(x=>eq(x.id,id));if(!site)return;
 const current=host.querySelector('#ite-job-economics');
 if(current&&force)current.outerHTML=render(site,core,root.ITECommerce.snapshot());
 else if(!current)host.insertAdjacentHTML('beforeend',render(site,core,root.ITECommerce.snapshot()));
}
function form(siteId){
 const cover=root.document.createElement('div');cover.id='ite-econ-form';cover.style.cssText='position:fixed;inset:0;background:#15283bbb;z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px';
 const today=new Date().toISOString().slice(0,10);
 cover.innerHTML='<form class="panel" style="background:white;color:#173451;width:min(100%,650px);max-height:90dvh;overflow:auto;padding:22px"><h3>Registra spesa di commessa</h3><label>Categoria<select name="category">'+categories.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select></label><label>Data<input type="date" name="date" value="'+today+'" required></label><label>Importo netto (€)<input type="number" name="amount" step="0.01" min="0.01" required></label><label>Descrizione<textarea name="description" minlength="5" maxlength="200" required></textarea></label><p id="ite-econ-error" role="alert"></p><div class="actions"><button type="submit">Registra</button><button type="button" class="secondary" data-econ-cancel>Annulla</button></div></form>';
 root.document.body.append(cover);const f=cover.querySelector('form');cover.querySelector('[data-econ-cancel]').onclick=()=>cover.remove();
 f.onsubmit=async e=>{e.preventDefault();try{if(!root.confirm('Registrare il costo interno? Non genera fatture o movimenti di magazzino.'))return;
 await save('COSTO_COMMESSA_REGISTRATO',(next,core)=>addExpense(next,core,{siteId,category:f.elements.category.value,date:f.elements.date.value,amount:f.elements.amount.value,description:f.elements.description.value}));
 cover.remove();mount(true)}catch(error){f.querySelector('#ite-econ-error').textContent=error.message}};
}
function download(content,name){const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})),a=root.document.createElement('a');a.href=url;a.download=name;root.document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function initialize(){
 const host=root.document.getElementById('worksite-detail');if(host)new MutationObserver(()=>mount()).observe(host,{childList:true});
 root.addEventListener('ite-pagechange',()=>mount());
 root.document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  try{
   if(b.dataset.econAdd)form(b.dataset.econAdd);
   else if(b.dataset.econVoid){const why=root.prompt('Motivazione storno (minimo 5 caratteri):');if(why===null)return;if(!root.confirm('Stornare la spesa conservando lo storico?'))return;b.disabled=true;await save('STORNO_COSTO_COMMESSA',(next,core)=>reverseExpense(next,core,b.dataset.econSite,b.dataset.econVoid,why));mount(true)}
   else if(b.dataset.econRate){const core=root.ITE.snapshot(),person=core.clienti.find(x=>eq(x.id,b.dataset.econRate));if(!person)throw Error('Operatore non presente.');const current=rateFor(person,root.ITECommerce.snapshot())/100;const value=root.prompt('Tariffa interna €/h per '+person.name+' (non prezzo cliente):',String(current));if(value===null)return;if(!root.confirm('Salvare tariffa interna con backup e audit?'))return;await save('TARIFFA_INTERNA_OPERATORE',(next,core)=>setRate(next,core,b.dataset.econRate,value));mount(true)}
   else if(b.dataset.econCsv){if(!root.confirm('Il CSV contiene dati e tariffe interne NON cifrati. Esportare?'))return;const core=root.ITE.snapshot(),site=core.cantieri.find(x=>eq(x.id,b.dataset.econCsv));if(!site)throw Error('Cantiere non trovato.');download(csv(site,core,root.ITECommerce.snapshot()),'ITE_costi_commessa_'+String(site.id).replace(/[^A-Za-z0-9_-]/g,'')+'.csv')}
  }catch(error){root.alert('Costi commessa: '+error.message);b.disabled=false}
 });
 mount();
}
const api=Object.freeze({euroCents,rateCents,rateFor,validate,labor,analyze,addExpense,reverseExpense,setRate,csv,render});
root.ITEJobEconomics=api;
if(root.document&&root.addEventListener)root.addEventListener('ite-vault-ready',initialize);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
