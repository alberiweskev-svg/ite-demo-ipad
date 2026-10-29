/* I.T.E. 4.0 - attribuzione documentale tra lavori approvati e fatture importate.
   Importi contrattuali IMPONIBILI, incassi fatture LORDI: mai sommarli. */
(function(root){'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>(c/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const stamp=()=>new Date().toISOString();
function cents(v){if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'&&!(typeof v==='string'&&/^-?\d+(?:\.\d{1,2})?$/.test(v.trim())))return null;const n=Number(v);return Number.isFinite(n)&&Math.abs(n)<=1e10?Math.round(n*100):null}
function inputCents(v){const c=cents(v);if(c===null||c<=0||c>1e10)throw Error('Importo non valido: usa euro e massimo due decimali.');return c}
function rows(site,key){try{const v=JSON.parse(site?.[key]||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function sourceRows(site){return [...rows(site,'ite_quotes').map(x=>({...x,sourceType:'quote'})),...rows(site,'ite_extras').map(x=>({...x,sourceType:'extra'}))]}
function amount(line,discount=0){
 if(!line||!['Fornitura','Posa'].includes(line.line_type)||!String(line.description||'').trim())return null;
 const qty=Number(line.qty),price=Number(line.price),rebate=Number(line.discount||0),categoryDiscount=Number(discount||0),vat=Number(line.vat||0);
 if(![qty,price,rebate,categoryDiscount,vat].every(Number.isFinite)||qty<=0||price<0||rebate<0||rebate>100||categoryDiscount<0||categoryDiscount>100||vat<0||vat>100)return null;
 const net=qty*price*(1-rebate/100)*(1-categoryDiscount/100);
 return Number.isFinite(net)&&net<=1e8?{net,vat:net*vat/100}:null;
}
function sourceValue(source){
 if(!source||!['quote','extra'].includes(source.sourceType))return null;
 if(source.sourceType==='quote'&&source.status!=='Accettato')return null;
 if(source.sourceType==='extra'&&!['Approvato','Parzialmente approvato'].includes(source.status))return null;
 if(!Array.isArray(source.lines)||!source.lines.length)return null;
 const selected=source.sourceType==='extra'&&source.status==='Parzialmente approvato'?source.approved_line_indices:null;
 if(selected!==null&&(!Array.isArray(selected)||!selected.length||selected.some(i=>!Number.isSafeInteger(i)||i<0||i>=source.lines.length)||new Set(selected).size!==selected.length))return null;
 let net=0,vat=0;
 for(let i=0;i<source.lines.length;i++){
  if(selected!==null&&!selected.includes(i))continue;
  const l=source.lines[i],rate=source.sourceType==='extra'?(source.category_discounts||{})[l.category||'Altri lavori']:0;
  const a=amount(l,rate);if(!a)return null;net+=a.net;vat+=a.vat;
 }
 const n=Math.round(net*100),v=Math.round(vat*100);
 return n>0&&n<=1e10?{netCents:n,vatCents:v,grossCents:n+v}:null;
}
function invoiceValue(doc,site){
 if(!doc||doc.type!=='Fattura vendita'||doc.status!=='Registrato'||!same(doc.siteId,site.id)||!same(doc.clientId||doc.subjectId,site.client_id)||doc.clientId&&doc.subjectId&&!same(doc.clientId,doc.subjectId)||doc.fiscal?.currency&&doc.fiscal.currency!=='EUR')return null;
 const net=cents(doc.net),gross=cents(doc.total);
 return net!==null&&gross!==null&&net>0&&gross>=net?{netCents:net,grossCents:gross}:null;
}
function validate(value){
 const links=value?.settings?.contractBillingLinks;
 if(links===undefined)return true;
 if(!Array.isArray(links)||links.length>5000)throw Error('Attribuzioni fatture non valide.');
 const ids=new Set();
 for(const l of links){
  if(!l||typeof l.id!=='string'||!/^bill_[a-zA-Z0-9_-]{5,100}$/.test(l.id)||ids.has(l.id)||!['quote','extra'].includes(l.sourceType)||typeof l.siteId!=='string'||!l.siteId||typeof l.sourceId!=='string'||!l.sourceId||typeof l.documentId!=='string'||!l.documentId||!Number.isSafeInteger(l.amountCents)||l.amountCents<=0||l.amountCents>1e10||!Number.isSafeInteger(l.sourceNetCents)||l.sourceNetCents<=0||typeof l.createdAt!=='string'||!/^20\d\d-\d\d-\d\dT/.test(l.createdAt))throw Error('Attribuzione fattura non valida.');
  if(l.voidedAt!==undefined&&(!/^20\d\d-\d\d-\d\dT/.test(l.voidedAt)||typeof l.voidReason!=='string'||!l.voidReason.trim()||l.voidReason.length>160))throw Error('Storno attribuzione non valido.');
  ids.add(l.id);
 }
 return true;
}
function calculate(site,commerce){
 const sources=sourceRows(site).map(x=>({...x,value:sourceValue(x),allocatedCents:0}));
 const docs=(commerce.documents||[]).filter(d=>same(d.siteId,site.id)&&d.type==='Fattura vendita').map(d=>({...d,value:invoiceValue(d,site),allocatedCents:0}));
 const warnings=[],validLinks=[],allLinks=(commerce.settings?.contractBillingLinks||[]).filter(l=>same(l.siteId,site.id));
 for(const l of allLinks){
  if(l.voidedAt)continue;
  const s=sources.find(x=>x.sourceType===l.sourceType&&same(x.id,l.sourceId)),d=docs.find(x=>same(x.id,l.documentId));
  if(!s||!d||!s.value||!d.value){warnings.push('Attribuzione '+l.id+': riferimento non disponibile, non approvato o fattura non verificata.');continue}
  s.allocatedCents+=l.amountCents;d.allocatedCents+=l.amountCents;
  validLinks.push({...l,source:s,document:d});
  if(l.sourceNetCents!==s.value.netCents)warnings.push('Attribuzione '+l.id+': imponibile del lavoro modificato dopo il collegamento.');
 }
 for(const s of sources)if(s.value&&s.allocatedCents>s.value.netCents)warnings.push('Lavoro '+(s.number||s.description||s.id)+': attribuzioni superiori all’approvato.');
 for(const d of docs)if(d.value&&d.allocatedCents>d.value.netCents)warnings.push('Fattura '+(d.number||d.id)+': attribuzioni superiori all’imponibile.');
 const approved=sources.reduce((n,s)=>n+(s.value?.netCents||0),0),attributed=validLinks.reduce((n,l)=>n+l.amountCents,0);
 const invoices=docs.reduce((n,d)=>n+(d.value?.netCents||0),0);
 let settledGross=0,remainingGross=0,settlementWarning='';
 try{
  if(root.ITEFinancialDesk){
   const report=root.ITEFinancialDesk.analyze(commerce.documents||[],commerce.settings?.financialSettlements||[]);
   for(const d of docs){const row=report.rows.find(r=>same(r.id,d.id));if(row?.eligible){settledGross+=row.applied;remainingGross+=row.remaining??0;}}
  }
 }catch(e){settlementWarning='Movimenti contabili da verificare: '+e.message}
 return {sources,docs,links:validLinks,history:allLinks,approvedCents:approved,attributedCents:attributed,invoicedCents:invoices,settledGrossCents:settledGross,remainingGrossCents:remainingGross,warnings,settlementWarning};
}
function addLink(next,core,details){
 validate(next);
 const site=(core.cantieri||[]).find(s=>same(s.id,details.siteId));if(!site||!site.client_id)throw Error('Cantiere senza cliente valido.');
 const source=sourceRows(site).find(s=>s.sourceType===details.sourceType&&same(s.id,details.sourceId));
 const doc=(next.documents||[]).find(d=>same(d.id,details.documentId));
 const cap=sourceValue(source),invoice=invoiceValue(doc,site),sum=inputCents(details.amount);
 if(!cap)throw Error('Preventivo o Extra non approvato, oppure voci fornitura/posa incomplete.');
 if(!invoice)throw Error('Serve una fattura vendita registrata, collegata allo stesso cliente e cantiere, con imponibile e totale verificati. Proforme e TD04 escluse.');
 const links=next.settings.contractBillingLinks||[];
 const usedSource=links.filter(l=>!l.voidedAt&&same(l.siteId,site.id)&&l.sourceType===details.sourceType&&same(l.sourceId,details.sourceId)).reduce((n,l)=>n+l.amountCents,0);
 const usedInvoice=links.filter(l=>!l.voidedAt&&same(l.documentId,doc.id)).reduce((n,l)=>n+l.amountCents,0);
 if(usedSource+sum>cap.netCents||usedInvoice+sum>invoice.netCents)throw Error('Attribuzione superiore al residuo approvato o all’imponibile della fattura.');
 const entry={id:'bill_'+(root.crypto?.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2)),siteId:String(site.id),sourceType:details.sourceType,sourceId:String(source.id),documentId:String(doc.id),amountCents:sum,sourceNetCents:cap.netCents,createdAt:stamp()};
 next.settings.contractBillingLinks=[...links,entry];
 validate(next);
 return entry;
}
function voidLink(next,siteId,linkId,reason){
 const why=String(reason||'').trim();if(!why||why.length>160)throw Error('Motivazione dello storno obbligatoria (massimo 160 caratteri).');
 const l=(next.settings.contractBillingLinks||[]).find(x=>same(x.id,linkId)&&same(x.siteId,siteId));
 if(!l||l.voidedAt)throw Error('Attribuzione mancante o già stornata.');
 l.voidedAt=stamp();l.voidReason=why;return l;
}
function salHtml(source){
 if(source.sourceType!=='extra'||!source.value||!Array.isArray(source.sal)||!source.sal.length)return '';
 const total=source.sal.reduce((n,x)=>n+Number(x.percent||0),0);
 if(source.sal.some(x=>!String(x.label||'').trim()||!Number.isFinite(Number(x.percent))||Number(x.percent)<=0)||Math.abs(total-100)>.000001)return '<p class="hint">Piano SAL da verificare.</p>';
 let assigned=0;
 return '<details><summary>Quote SAL contrattuali (previsione, non fatture)</summary>'+source.sal.map((x,i)=>{
  const part=i===source.sal.length-1?source.value.grossCents-assigned:Math.round(source.value.grossCents*Number(x.percent)/100);
  assigned+=part;
  return '<p>'+esc(x.label)+' · '+esc(x.percent)+'% · '+money(part)+' IVA compresa, indicativo</p>';
 }).join('')+'</details>';
}
function renderForSite(site,commerce){
 const r=calculate(site,commerce),activeSources=r.sources.filter(s=>s.value),availableDocs=r.docs.filter(d=>d.value);
 return '<section class="panel" id="ite-contract-billing" data-contract-site="'+esc(site.id)+'"><h3>Fatturazione lavori approvati e SAL</h3><p class="hint">Collega le fatture già importate ai preventivi accettati e agli Extra approvati. L’attribuzione è manuale, in imponibile; non emette fatture, non registra incassi e non modifica magazzino. Le somme del registro incassi manuale del cantiere non sono aggiunte agli incassi delle fatture.</p>'+
 '<dl class="data-pairs"><div><dt>Lavori approvati, imponibile</dt><dd>'+money(r.approvedCents)+'</dd></div><div><dt>Attribuito a fatture, imponibile</dt><dd>'+money(r.attributedCents)+'</dd></div><div><dt>Da attribuire, imponibile teorico</dt><dd>'+money(r.approvedCents-r.attributedCents)+'</dd></div><div><dt>Fatture vendita importate, imponibile</dt><dd>'+money(r.invoicedCents)+'</dd></div><div><dt>Incassi/compensazioni documentali, lordo</dt><dd>'+money(r.settledGrossCents)+'</dd></div><div><dt>Residuo fatture documentali, lordo</dt><dd>'+money(r.remainingGrossCents)+'</dd></div></dl>'+
 (r.settlementWarning?'<p class="alert-amber">'+esc(r.settlementWarning)+'</p>':'')+
 (r.warnings.length?'<div class="alert-amber"><b>Collegamenti da verificare</b>'+r.warnings.map(x=>'<p>'+esc(x)+'</p>').join('')+'</div>':'')+
 '<div class="actions"><button type="button" data-contract-add="'+esc(site.id)+'"'+(!activeSources.length||!availableDocs.length?' disabled':'')+'>+ Collega fattura ai lavori</button><button type="button" class="secondary" data-contract-csv="'+esc(site.id)+'">Esporta registro CSV</button><a class="btn" href="#importazioni">Importa / verifica fatture</a></div>'+
 (!availableDocs.length?'<p class="hint">Nessuna fattura vendita registrata con imponibile, totale, cliente e cantiere coerenti. Prima completa i collegamenti nell’archivio importazioni.</p>':'')+
 '<h4>Preventivi e lavori Extra</h4>'+r.sources.map(s=>'<div class="item"><strong>'+esc(s.sourceType==='quote'?'Preventivo ':'Extra ')+esc(s.number||s.description||s.id)+'</strong><p>'+esc(s.status)+' · '+(s.value?'Approvato '+money(s.value.netCents)+' · attribuito '+money(s.allocatedCents)+' · residuo '+money(s.value.netCents-s.allocatedCents):'Non attribuibile: approvazione o voci da verificare')+'</p>'+salHtml(s)+'</div>').join('')+
 '<h4>Attribuzioni e storni ('+r.history.length+')</h4>'+(r.history.map(l=>{const s=r.sources.find(x=>x.sourceType===l.sourceType&&same(x.id,l.sourceId)),d=r.docs.find(x=>same(x.id,l.documentId));return '<div class="item"><strong>'+money(l.amountCents)+' · '+esc(l.voidedAt?'STORNATA':'ATTIVA')+'</strong><p>'+esc(s?.number||s?.description||'Lavoro non disponibile')+' · '+esc(d?.number||'Fattura non disponibile')+' · '+esc(l.createdAt.slice(0,10))+'</p>'+(l.voidedAt?'<p>Motivo: '+esc(l.voidReason)+'</p>':'<button type="button" class="secondary" data-contract-void="'+esc(l.id)+'" data-contract-site-id="'+esc(site.id)+'">Storna attribuzione</button>')+'</div>'}).join('')||'<p class="hint">Nessuna attribuzione: i documenti importati non sono considerati automaticamente fatturazione dei lavori.</p>')+
 '<p class="hint">Gli importi dei lavori sono al netto IVA; gli incassi e i residui delle fatture sono al lordo IVA. Le note credito TD04 e le proforme restano nel registro contabile e non sono attribuite automaticamente ai lavori. Il SAL è solo un piano contrattuale.</p></section>';
}
function csv(site,commerce){
 const r=calculate(site,commerce);
 const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const data=[['Cantiere','Lavoro','Tipo','Fattura','Data collegamento','Imponibile attribuito EUR','Stato','Motivo storno']];
 for(const l of r.history){const s=r.sources.find(x=>x.sourceType===l.sourceType&&same(x.id,l.sourceId)),d=r.docs.find(x=>same(x.id,l.documentId));data.push([site.name||site.id,s?.number||s?.description||'Da verificare',l.sourceType,d?.number||'Da verificare',l.createdAt.slice(0,10),(l.amountCents/100).toFixed(2),l.voidedAt?'Stornato':'Attivo',l.voidReason||''])}
 return '\uFEFF'+data.map(x=>x.map(cell).join(';')).join('\r\n')+'\r\n';
}
let busy=false;
async function mutateWithBackup(label,fn){
 if(busy)throw Error('Salvataggio già in corso.');
 busy=true;
 try{
  if(!root.ITEHistory?.create||!root.ITECommerce?.mutate)throw Error('Backup o archivio economico non disponibili.');
  await root.ITEHistory.create(label);
  await root.ITECommerce.mutate((next,core)=>{const entry=fn(next,core);next.audit.push({id:'audit_'+(root.crypto?.randomUUID?.()||Date.now()),at:stamp(),action:label,detail:{siteId:entry.siteId,linkId:entry.id,documentId:entry.documentId,sourceId:entry.sourceId,amountCents:entry.amountCents,voidReason:entry.voidReason||''}})});
 }finally{busy=false}
}
async function openForm(siteId){
 if(busy)return;
 const state=await root.ITECommerce.exportState(),site=root.ITE.snapshot().cantieri.find(s=>same(s.id,siteId));
 if(!site)throw Error('Cantiere non disponibile.');
 const r=calculate(site,state),sources=r.sources.filter(s=>s.value&&s.value.netCents>s.allocatedCents),docs=r.docs.filter(d=>d.value&&d.value.netCents>d.allocatedCents);
 if(!sources.length||!docs.length)throw Error('Non ci sono lavori approvati o fatture con residuo attribuibile.');
 const cover=document.createElement('div');cover.id='ite-contract-billing-form';cover.style.cssText='position:fixed;inset:0;background:#15283bbb;z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px';
 cover.innerHTML='<form class="panel" style="background:white;color:#173451;width:min(100%,680px);max-height:90dvh;overflow:auto;padding:22px"><h3>Collega fattura a preventivo / Extra</h3><p class="hint">Solo fatture vendita registrate del medesimo cantiere e cliente. Inserisci l’imponibile effettivamente riferito a questi lavori, non il totale IVA inclusa.</p><label>Lavoro approvato<select name="source" required>'+sources.map(s=>'<option value="'+esc(s.sourceType+':'+s.id)+'">'+esc((s.sourceType==='quote'?'Preventivo ':'Extra ')+(s.number||s.description||s.id))+' · residuo '+money(s.value.netCents-s.allocatedCents)+'</option>').join('')+'</select></label><label>Fattura importata<select name="document" required>'+docs.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.number||d.id)+' · residuo imponibile '+money(d.value.netCents-d.allocatedCents)+'</option>').join('')+'</select></label><label>Imponibile da attribuire (€)<input name="amount" type="number" min="0.01" step="0.01" required></label><p class="hint" id="ite-contract-limit"></p><p id="ite-contract-error" role="alert"></p><div class="actions"><button type="submit">Conferma collegamento</button><button type="button" class="secondary" data-contract-cancel>Annulla</button></div></form>';
 document.body.append(cover);const form=cover.querySelector('form'),close=()=>cover.remove();
 const update=()=>{const [kind,id]=form.elements.source.value.split(':'),s=sources.find(x=>x.sourceType===kind&&same(x.id,id)),d=docs.find(x=>same(x.id,form.elements.document.value));const cap=Math.min(s.value.netCents-s.allocatedCents,d.value.netCents-d.allocatedCents);form.querySelector('#ite-contract-limit').textContent='Massimo attribuibile: '+money(cap);form.elements.amount.max=(cap/100).toFixed(2);if(!form.elements.amount.value||Number(form.elements.amount.value)*100>cap)form.elements.amount.value=(cap/100).toFixed(2)};
 form.elements.source.onchange=update;form.elements.document.onchange=update;update();
 cover.querySelector('[data-contract-cancel]').onclick=close;
 form.onsubmit=async e=>{e.preventDefault();const [sourceType,sourceId]=form.elements.source.value.split(':'),documentId=form.elements.document.value,amount=form.elements.amount.value;try{if(!confirm('Confermi il collegamento documentale? Non registra alcun incasso né emette fatture.'))return;await mutateWithBackup('COLLEGAMENTO_FATTURA_LAVORI', (next,core)=>addLink(next,core,{siteId,sourceType,sourceId,documentId,amount}));close();}catch(err){form.querySelector('#ite-contract-error').textContent=err.message}};
}
async function removeLink(siteId,id){
 const reason=prompt('Motivo dello storno (obbligatorio, massimo 160 caratteri):');if(reason===null)return;
 if(!confirm('Stornare il collegamento? Rimarrà nello storico, senza cancellare la fattura.'))return;
 await mutateWithBackup('STORNO_COLLEGAMENTO_FATTURA',(next)=>voidLink(next,siteId,id,reason));
}
async function download(siteId){
 if(!confirm('Il CSV contiene dati economici e NON è cifrato. Esportare su un dispositivo protetto?'))return;
 const state=await root.ITECommerce.exportState(),site=root.ITE.snapshot().cantieri.find(s=>same(s.id,siteId));if(!site)throw Error('Cantiere non trovato.');
 const blob=new Blob([csv(site,state)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ITE_FATTURAZIONE_CANTIERE_'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
if(typeof document!=='undefined')document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;const run=d.contractAdd?openForm(d.contractAdd):d.contractVoid?removeLink(d.contractSiteId,d.contractVoid):d.contractCsv?download(d.contractCsv):null;if(run)run.catch(err=>alert('Fatturazione lavori: '+err.message))});
root.ITEContractBilling=Object.freeze({cents,sourceValue,invoiceValue,validate,calculate,addLink,voidLink,renderForSite,csv});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ITEContractBilling;
})(typeof window!=='undefined'?window:globalThis);
