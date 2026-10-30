/* I.T.E. 4.0 — consuntivo consumi materiali e attribuzioni a Forniture approvate.
   Non genera fatture, scarichi o margini. */
(function(root){'use strict';
const eq=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>(n/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const fmt=n=>Number(n).toLocaleString('it-IT',{maximumFractionDigits:3});
const makeId=()=> 'cost_'+(root.crypto?.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));
const allocations=s=>{const r=s?.settings?.jobMaterialAllocations||[];if(!Array.isArray(r))throw Error('Registro attribuzioni non valido.');return r};
const usages=s=>{const r=s?.settings?.jobMaterialUsage||[];if(!Array.isArray(r))throw Error('Registro consumi non valido.');return r};
function qty(v){if(typeof v!=='number'&&!(typeof v==='string'&&/^\d+(?:\.\d{1,3})?$/.test(v.trim())))throw Error('Quantità non valida.');const n=Number(v);if(!Number.isFinite(n)||n<=0||n>10000||Math.abs(n*1000-Math.round(n*1000))>1e-8)throw Error('Quantità non valida.');return n}
function supplies(site){
 const result=[];
 for(const [field,type] of [['ite_quotes','quote'],['ite_extras','extra']]){
  let list;try{list=JSON.parse(site?.[field]||'[]')}catch{list=[]}
  if(!Array.isArray(list))continue;
  for(const source of list){
   if(!source||!Array.isArray(source.lines)||type==='quote'&&source.status!=='Accettato'||type==='extra'&&!['Approvato','Parzialmente approvato'].includes(source.status))continue;
   const partial=type==='extra'&&source.status==='Parzialmente approvato';
   const selected=partial?source.approved_line_indices:null;
   if(partial&&(!Array.isArray(selected)||!selected.length||selected.some(i=>!Number.isSafeInteger(i)||i<0||i>=source.lines.length)||new Set(selected).size!==selected.length))continue;
   if(!root.ITEContractBilling?.sourceValue?.({...source,sourceType:type}))continue;
   source.lines.forEach((line,index)=>{
    if(line.line_type!=='Fornitura'||partial&&!selected.includes(index))return;
    const count=Number(line.qty),price=Number(line.price),discount=Number(line.discount||0);
    const groupDiscount=type==='extra'?Number((source.category_discounts||{})[line.category||'Altri lavori']||0):0;
    if(!Number.isFinite(count)||count<=0||!Number.isFinite(price)||price<0)return;
    result.push({type,sourceId:String(source.id),sourceLabel:String(source.number||source.description||source.id),index,label:String(line.description||''),unit:String(line.unit||line.um||'').trim(),planned:count,saleCents:Math.round(count*price*(1-discount/100)*(1-groupDiscount/100)*100),key:type+':'+source.id+':'+index,linked:0,knownCost:0,unknownQty:0});
   });
  }
 }
 return result;
}
function validate(state,core){
 const list=allocations(state);if(list.length>20000)throw Error('Registro attribuzioni troppo grande.');
 const ids=new Set();
 for(const a of list){
  if(!a||typeof a.id!=='string'||!/^cost_[A-Za-z0-9_-]{5,100}$/.test(a.id)||ids.has(a.id)||!['quote','extra'].includes(a.type)||!a.sourceId||!Number.isSafeInteger(a.index)||a.index<0||!a.siteId||!a.clientId||!a.usageId||!a.articleId||!a.unit||!Number.isFinite(Date.parse(a.createdAt)))throw Error('Attribuzione incompleta o duplicata.');
  ids.add(a.id);qty(a.quantity);
  const site=(core?.cantieri||[]).find(x=>eq(x.id,a.siteId)),u=usages(state).find(x=>eq(x.id,a.usageId));
  if(!site||!u||!eq(site.client_id,a.clientId)||!eq(u.clientId,a.clientId)||!eq(u.siteId,a.siteId)||!eq(u.articleId,a.articleId)||!eq(u.unit,a.unit))throw Error('Attribuzione con cliente, cantiere o consumo incoerente.');
  if(a.voidedAt!==undefined&&(!Number.isFinite(Date.parse(a.voidedAt))||typeof a.voidReason!=='string'||a.voidReason.trim().length<5||a.voidReason.length>200))throw Error('Storno incompleto.');
 }
 return true;
}
function analyze(site,core,state){
 if(!site||!(core?.cantieri||[]).some(x=>eq(x.id,site.id))||!(core.clienti||[]).some(x=>eq(x.id,site.client_id)))throw Error('Cantiere o cliente non disponibile.');
 const all=usages(state).filter(u=>eq(u.siteId,site.id));
 if(all.some(u=>!eq(u.clientId,site.client_id)))throw Error('Consumo di altro cliente nel cantiere.');
 const active=all.filter(u=>!u.reversedAt),planned=supplies(site),history=allocations(state).filter(a=>eq(a.siteId,site.id)),warnings=[],byUsage=new Map(),matched=new Set();
 let matchedKnown=0;
 for(const a of history){
  if(a.voidedAt)continue;
  const u=all.find(x=>eq(x.id,a.usageId)),p=planned.find(x=>x.type===a.type&&eq(x.sourceId,a.sourceId)&&x.index===a.index);
  if(!u||u.reversedAt||!p||!eq(u.unit,a.unit)||!eq(u.articleId,a.articleId)){warnings.push('Attribuzione '+a.id+' non utilizzabile: consumo stornato o Fornitura modificata.');continue}
  if(p.unit&&p.unit!==a.unit){warnings.push('Unità non coerente: '+p.label);continue}
  p.linked=Number((p.linked+a.quantity).toFixed(3));byUsage.set(u.id,Number(((byUsage.get(u.id)||0)+a.quantity).toFixed(3)));matched.add(a.id);
  if(u.unitCostCents===null)p.unknownQty=Number((p.unknownQty+a.quantity).toFixed(3));
  else{const cost=Math.round(a.quantity*u.unitCostCents);p.knownCost+=cost;matchedKnown+=cost}
 }
 for(const p of planned){
  if(!p.unit)warnings.push('Unità non indicata per '+p.label+': confronto quantità non disponibile.');
  else if(p.linked>p.planned+0.00001)warnings.push('Quantità attribuita oltre il previsto: '+p.label);
 }
 for(const u of active)if((byUsage.get(u.id)||0)>u.quantity+0.00001)warnings.push('Consumo attribuito oltre la quantità: '+u.id);
 const known=active.filter(u=>u.unitCostCents!==null),unknown=active.filter(u=>u.unitCostCents===null);
 const totalKnown=known.reduce((n,u)=>n+Math.round(u.quantity*u.unitCostCents),0);
 const unassigned=active.map(u=>({...u,remaining:Number((u.quantity-(byUsage.get(u.id)||0)).toFixed(3))})).filter(u=>u.remaining>0.00001);
 const billing=root.ITEContractBilling?.calculate?.(site,state);
 return {planned,history,warnings,matched,unassigned,knownCount:known.length,unknownCount:unknown.length,totalKnown,matchedKnown,unmatchedKnown:totalKnown-matchedKnown,approvedNet:billing?.approvedCents??null,supplySale:planned.reduce((n,p)=>n+p.saleCents,0)};
}
function add(state,core,req){
 validate(state,core);
 const site=(core.cantieri||[]).find(x=>eq(x.id,req.siteId));if(!site||!site.client_id)throw Error('Cantiere non valido.');
 const u=usages(state).find(x=>eq(x.id,req.usageId));
 if(!u||u.reversedAt||!eq(u.siteId,site.id)||!eq(u.clientId,site.client_id))throw Error('Consumo attivo dello stesso cliente e cantiere richiesto.');
 const p=supplies(site).find(x=>x.type===req.type&&eq(x.sourceId,req.sourceId)&&x.index===Number(req.index));
 if(!p)throw Error('Fornitura approvata non disponibile.');
 if(p.unit&&p.unit!==u.unit)throw Error('Unità non coerente.');
 const count=qty(req.quantity),links=allocations(state).filter(x=>!x.voidedAt);
 const used=links.filter(x=>eq(x.usageId,u.id)).reduce((n,x)=>n+x.quantity,0);
 if(used+count>u.quantity+0.000001)throw Error('Quantità superiore al consumo disponibile.');
 if(p.unit){
  const onLine=links.filter(x=>eq(x.siteId,site.id)&&x.type===p.type&&eq(x.sourceId,p.sourceId)&&x.index===p.index).reduce((n,x)=>n+x.quantity,0);
  if(onLine+count>p.planned+0.000001)throw Error('Quantità superiore alla Fornitura prevista.');
 }
 const entry={id:makeId(),siteId:String(site.id),clientId:String(site.client_id),usageId:String(u.id),articleId:String(u.articleId),type:p.type,sourceId:p.sourceId,index:p.index,quantity:count,unit:String(u.unit),createdAt:new Date().toISOString()};
 state.settings.jobMaterialAllocations=[...allocations(state),entry];
 state.audit.push({id:'audit_'+makeId(),at:entry.createdAt,action:'ATTRIBUZIONE_CONSUMO_FORNITURA',detail:{siteId:entry.siteId,usageId:entry.usageId,sourceId:entry.sourceId,index:entry.index,quantity:count}});
 validate(state,core);return entry;
}
function reverse(state,core,siteId,linkId,reason){
 const why=String(reason||'').trim();if(why.length<5||why.length>200)throw Error('Motivazione storno obbligatoria (5–200 caratteri).');
 const a=allocations(state).find(x=>eq(x.id,linkId)&&eq(x.siteId,siteId));if(!a||a.voidedAt)throw Error('Attribuzione mancante o già stornata.');
 if(!(core.cantieri||[]).some(x=>eq(x.id,siteId)&&eq(x.client_id,a.clientId)))throw Error('Cantiere non coerente.');
 a.voidedAt=new Date().toISOString();a.voidReason=why;
 state.audit.push({id:'audit_'+makeId(),at:a.voidedAt,action:'STORNO_ATTRIBUZIONE_FORNITURA',detail:{siteId:a.siteId,linkId:a.id,reason:why}});return a;
}
function csv(site,core,state){
 const a=analyze(site,core,state),data=[['Cantiere','Documento','Fornitura','Quantità prevista','Unità preventivo','Quantità attribuita','Costo noto EUR','Quantità senza costo','Imponibile vendita EUR']];
 for(const p of a.planned)data.push([site.name||site.id,p.sourceLabel,p.label,p.planned,p.unit||'DA VERIFICARE',p.linked,(p.knownCost/100).toFixed(2),p.unknownQty,(p.saleCents/100).toFixed(2)]);
 data.push(['COSTI NON ATTRIBUITI','','','','','',(a.unmatchedKnown/100).toFixed(2),'','']);
 const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+@\-\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 return '\uFEFF'+data.map(r=>r.map(cell).join(';')).join('\r\n')+'\r\n';
}
function render(site,core,state){
 const a=analyze(site,core,state);
 return '<section class="panel" id="ite-site-costing" data-site-costing="'+esc(site.id)+'"><h3>Consuntivo materiali e Forniture approvate</h3><p class="hint">Attribuzione manuale dei consumi reali a preventivi accettati ed Extra approvati. Posa separata; nessuna fattura, scarico o incasso automatico.</p>'+
 '<dl class="data-pairs"><div><dt>Lavori approvati, Fornitura + Posa (imponibile)</dt><dd>'+(a.approvedNet===null?'Non disponibile':money(a.approvedNet))+'</dd></div><div><dt>Forniture approvate (imponibile vendita)</dt><dd>'+money(a.supplySale)+'</dd></div><div><dt>Costi acquisto noti dei consumi</dt><dd>'+money(a.totalKnown)+'</dd></div><div><dt>Costi noti attribuiti</dt><dd>'+money(a.matchedKnown)+'</dd></div><div><dt>Costi noti non attribuiti</dt><dd>'+money(a.unmatchedKnown)+'</dd></div><div><dt>Consumi senza costo verificato</dt><dd>'+a.unknownCount+'</dd></div></dl>'+
 '<p class="hint">Non è un margine di cantiere: mancano manodopera, spese generali e costi non rilevati. Non sommare fatture acquisto ai consumi.</p>'+
 (a.warnings.length?'<div class="alert-amber"><b>Verifiche richieste</b>'+a.warnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'</div>':'')+
 '<div class="actions"><button type="button" data-site-cost-add="'+esc(site.id)+'"'+(!a.unassigned.length||!a.planned.length?' disabled':'')+'>+ Attribuisci consumo a Fornitura</button><button type="button" class="secondary" data-site-cost-csv="'+esc(site.id)+'">Esporta CSV</button></div>'+
 '<h4>Forniture approvate</h4>'+a.planned.map(p=>'<div class="item"><strong>'+esc(p.sourceLabel)+' · '+esc(p.label)+'</strong><p>Previsto '+fmt(p.planned)+' '+esc(p.unit||'(unità mancante)')+' · attribuito '+fmt(p.linked)+' · costo noto '+money(p.knownCost)+' · vendita '+money(p.saleCents)+'</p></div>').join('')+
 '<h4>Consumi non attribuiti</h4>'+a.unassigned.map(u=>'<p>'+esc(u.articleLabel)+' · '+fmt(u.remaining)+' '+esc(u.unit)+' · intervento '+esc(u.jobId)+'</p>').join('')+
 '<h4>Storico attribuzioni</h4>'+a.history.map(l=>'<div class="item"><strong>'+fmt(l.quantity)+' '+esc(l.unit)+' · '+esc(l.voidedAt?'STORNATA':a.matched.has(l.id)?'ATTIVA':'DA VERIFICARE')+'</strong><p>'+esc(l.usageId)+' · '+esc(l.type)+' '+esc(l.sourceId)+' / riga '+(l.index+1)+'</p>'+(l.voidedAt?'<p>'+esc(l.voidReason)+'</p>':'<button type="button" class="secondary" data-site-cost-void="'+esc(l.id)+'" data-site-cost-site="'+esc(site.id)+'">Storna</button>')+'</div>').join('')+
 '<p class="hint">Se manca l’unità nel preventivo, il confronto quantitativo non è verificabile. I costi sono quelli storicizzati al momento del consumo.</p></section>';
}
let busy=false;
async function save(label,fn){
 if(busy)throw Error('Salvataggio in corso.');busy=true;
 try{if(!root.ITEHistory?.create||!root.ITECommerce?.mutate)throw Error('Archivio o backup non disponibili.');await root.ITEHistory.create(label);await root.ITECommerce.mutate((next,core)=>fn(next,core))}
 finally{busy=false}
}
function mount(force=false){
 if(!root.document||!root.ITECommerce||!root.ITE||root.ITERouter?.current?.()!=='scheda-cantiere')return;
 const host=root.document.getElementById('worksite-detail'),siteId=host?.querySelector('[data-work-edit]')?.dataset.workEdit;
 if(!siteId)return;const core=root.ITE.snapshot(),site=core.cantieri.find(x=>eq(x.id,siteId));if(!site)return;
 const existing=host.querySelector('#ite-site-costing');
 if(existing&&force)existing.outerHTML=render(site,core,root.ITECommerce.snapshot());
 else if(!existing)host.insertAdjacentHTML('beforeend',render(site,core,root.ITECommerce.snapshot()));
}
function form(siteId){
 const core=root.ITE.snapshot(),state=root.ITECommerce.snapshot(),site=core.cantieri.find(x=>eq(x.id,siteId));if(!site)throw Error('Cantiere non trovato.');
 const a=analyze(site,core,state);if(!a.unassigned.length||!a.planned.length)throw Error('Nessuna Fornitura o consumo disponibile.');
 const cover=root.document.createElement('div');cover.id='ite-site-cost-form';cover.style.cssText='position:fixed;inset:0;background:#15283bbb;z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px';
 cover.innerHTML='<form class="panel" style="background:white;color:#173451;width:min(100%,700px);max-height:90dvh;overflow:auto;padding:22px"><h3>Attribuisci consumo a Fornitura</h3><label>Consumo<select name="usage" required>'+a.unassigned.map(u=>'<option value="'+esc(u.id)+'">'+esc(u.articleLabel)+' · '+fmt(u.remaining)+' '+esc(u.unit)+'</option>').join('')+'</select></label><label>Fornitura approvata<select name="supply" required>'+a.planned.map(p=>'<option value="'+esc(p.key)+'">'+esc(p.sourceLabel+' · '+p.label+' · '+(p.unit||'unità non indicata'))+'</option>').join('')+'</select></label><label>Quantità<input name="quantity" type="number" step="0.001" min="0.001" required></label><p id="ite-site-cost-limit"></p><p id="ite-site-cost-error" role="alert"></p><div class="actions"><button type="submit">Conferma</button><button type="button" class="secondary" data-site-cost-cancel>Annulla</button></div></form>';
 root.document.body.append(cover);const f=cover.querySelector('form');
 const refresh=()=>{const u=a.unassigned.find(x=>eq(x.id,f.elements.usage.value)),p=a.planned.find(x=>x.key===f.elements.supply.value),compatible=!!u&&!!p&&(!p.unit||p.unit===u.unit);
  const max=compatible?Math.min(u.remaining,p.unit?Math.max(0,Number((p.planned-p.linked).toFixed(3))):u.remaining):0;
  f.querySelector('#ite-site-cost-limit').textContent=!compatible?'Unità incompatibili.':'Massimo '+fmt(max)+' '+u.unit+(p.unit?'':' — unità preventivo da verificare');
  f.elements.quantity.max=String(max);f.elements.quantity.value=max>0?String(max):'';f.querySelector('[type=submit]').disabled=max<=0};
 f.elements.usage.onchange=refresh;f.elements.supply.onchange=refresh;refresh();
 cover.querySelector('[data-site-cost-cancel]').onclick=()=>cover.remove();
 f.onsubmit=async e=>{e.preventDefault();const p=a.planned.find(x=>x.key===f.elements.supply.value);
  try{if(!p)throw Error('Fornitura non selezionata.');if(!root.confirm('Confermare attribuzione? Non modifica magazzino né fatture.'))return;
   await save('ATTRIBUZIONE_CONSUMO_FORNITURA',(next,core)=>add(next,core,{siteId,usageId:f.elements.usage.value,type:p.type,sourceId:p.sourceId,index:p.index,quantity:f.elements.quantity.value}));
   cover.remove();mount(true);
  }catch(error){f.querySelector('#ite-site-cost-error').textContent=error.message}};
}
function download(content,name){const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})),a=root.document.createElement('a');a.href=url;a.download=name;root.document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function initialize(){
 const host=root.document.getElementById('worksite-detail');if(host)new MutationObserver(()=>mount()).observe(host,{childList:true});
 root.addEventListener('ite-pagechange',()=>mount());
 root.document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  try{
   if(b.dataset.siteCostAdd)form(b.dataset.siteCostAdd);
   else if(b.dataset.siteCostVoid){const why=root.prompt('Motivazione storno (minimo 5 caratteri):');if(why===null)return;if(!root.confirm('Stornare conservando lo storico?'))return;b.disabled=true;await save('STORNO_ATTRIBUZIONE_FORNITURA',(next,core)=>reverse(next,core,b.dataset.siteCostSite,b.dataset.siteCostVoid,why));mount(true)}
   else if(b.dataset.siteCostCsv){if(!root.confirm('Il CSV contiene dati del cliente e NON è cifrato. Esportare?'))return;const core=root.ITE.snapshot(),site=core.cantieri.find(x=>eq(x.id,b.dataset.siteCostCsv));if(!site)throw Error('Cantiere non trovato.');download(csv(site,core,root.ITECommerce.snapshot()),'ITE_consuntivo_materiali_'+String(site.id).replace(/[^A-Za-z0-9_-]/g,'')+'.csv')}
  }catch(error){root.alert('Consuntivo: '+error.message);b.disabled=false}
 });
 mount();
}
const api=Object.freeze({qty,supplies,validate,analyze,add,reverse,csv,render});
root.ITESiteCosting=api;
if(root.document&&root.addEventListener)root.addEventListener('ite-vault-ready',initialize);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
