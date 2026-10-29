/* I.T.E. 4.0 — CAD -> pratiche tecniche e preventivi di cantiere.
 * Bozze locali; non certifica impianti, non accetta preventivi e non movimenta magazzino.
 */
(function(root){
'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const copy=x=>JSON.parse(JSON.stringify(x));
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
const category={presa:'Elettrico',interruttore:'Elettrico',quadro:'Elettrico',lavabo:'Idrico',wc:'Idrico',valvola:'Idrico',radiatore:'Termico',caldaia:'Termico',split:'Condizionamento'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const find=(rows,id)=>(rows||[]).find(r=>same(r.id,id));
function markup(cost){
 if(typeof cost!=='number'||!Number.isFinite(cost)||cost<=0)throw Error('Costo articolo non valido');
 return cost<=100?30:cost<=500?25:cost<=1000?20:cost<=5000?15:5;
}
function compatible(d,p){
 return same(d.clientId,p.clientId)&&(!d.propertyId||!p.propertyId||same(d.propertyId,p.propertyId))&&(!d.siteId||!p.siteId||same(d.siteId,p.siteId))&&(!d.plantId||!p.plantId||same(d.plantId,p.plantId));
}
function validateLinks(state,core){
 const links=state?.settings?.cadPracticeLinks;
 if(links===undefined)return true;
 if(!Array.isArray(links)||links.length>2000)throw Error('Collegamenti CAD-pratiche non validi');
 const drawings=state.settings.cadDrawings||[],practices=state.settings.technicalDrafts||[],seen=new Set();
 for(const l of links){
  if(!l||!/^cpl_[a-f0-9-]{36}$/.test(l.id)||!/^cad_[a-zA-Z0-9-]{8,70}$/.test(l.drawingId)||!/^td_[a-f0-9-]{36}$/.test(l.practiceId)||!Number.isSafeInteger(l.drawingRevision)||l.drawingRevision<1||!Number.isSafeInteger(l.practiceRevision)||l.practiceRevision<1||typeof l.updated!=='string'||!Number.isFinite(Date.parse(l.updated)))throw Error('Riferimento CAD-pratica non valido');
  const key=l.drawingId+'|'+l.practiceId;if(seen.has(key))throw Error('Collegamento CAD-pratica duplicato');seen.add(key);
  const d=find(drawings,l.drawingId),p=find(practices,l.practiceId);
  if(!d||!p||!find(core?.clienti,d.clientId)||!compatible(d,p)||!same(l.clientId,d.clientId)||l.drawingRevision>d.revision||l.practiceRevision>p.revision)throw Error('Collegamento CAD-pratica incompatibile o orfano');
 }
 return true;
}
function eligibleSites(d,core){
 return (core.cantieri||[]).filter(s=>same(s.client_id,d.clientId)&&(!d.siteId||same(d.siteId,s.id))&&(!d.propertyId||!s.immobile_id||same(d.propertyId,s.immobile_id)));
}
function proposal(d,site,core,commerce,posePrice,vat=10){
 if(!d||!site||!find(core.clienti,d.clientId)||!eligibleSites(d,core).some(s=>same(s.id,site.id)))throw Error('Disegno e cantiere non appartengono allo stesso cliente/sede');
 if(d.archived)throw Error('Disegno archiviato: riaprilo prima di creare il preventivo');
 if(!Number.isSafeInteger(d.revision)||d.revision<1)throw Error('Revisione CAD non valida');
 if(!Number.isFinite(posePrice)||posePrice<=0||posePrice>1000000)throw Error('Indica un importo positivo per la posa, da verificare');
 if(![10,22].includes(vat))throw Error('IVA da verificare: scegliere 10% o 22%');
 const schedule=root.ITECad.catalogSchedule(d.elements,d.scaleCmPerUnit,commerce.articles,commerce.movements);
 if(!schedule.items.length)throw Error('Nessun simbolo impiantistico nel disegno CAD');
 if(schedule.items.length>100)throw Error('Troppi articoli: suddividi il disegno');
 const lines=[];
 for(const row of schedule.items){
  const a=find(commerce.articles,row.articleId);
  if(!a||a.kind!=='Materiale'||!row.articleId)throw Error('Associa ogni simbolo CAD a un materiale di catalogo');
  if(!/^(pz|pza|pezzo|pezzi)$/i.test(String(a.unit||'').trim()))throw Error('Unità di misura non compatibile per '+String(a.code||'articolo'));
  if(a.priceRole!=='cost'||typeof a.price!=='number'||!Number.isFinite(a.price)||a.price<=0)throw Error('Verifica il costo di acquisto (priceRole=cost) di '+String(a.code||'articolo'));
  if(!Number.isSafeInteger(row.count)||row.count<1)throw Error('Quantità CAD non valida');
  lines.push({line_type:'Fornitura',category:category[row.symbol]||'Altro',description:(String(a.code||'').slice(0,80)+' — '+String(a.description||'').slice(0,220)+' [CAD: '+(root.ITECad.SYMBOLS[row.symbol]||row.symbol)+']'),qty:row.count,price:money(a.price*(1+markup(a.price)/100)),discount:0,vat});
 }
 lines.push({line_type:'Posa',category:'Altro',description:'Posa in opera dei materiali dello schema CAD — quantità e lavorazioni da verificare',qty:1,price:money(posePrice),discount:0,vat});
 const number='CAD-'+d.id.slice(-8)+'-R'+d.revision;
 const amount=money(lines.reduce((total,l)=>total+l.qty*l.price,0));
 const warnings=schedule.items.filter(r=>r.warning).map(r=>String(r.articleCode||r.symbol)+': '+r.warning);
 if(!schedule.calibrated)warnings.push('Scala metrica non calibrata; lunghezze escluse dal preventivo');
 return {id:'p'+Date.now()+'-'+root.crypto.randomUUID().slice(0,8),number,description:'Bozza da disegno '+d.title+' (revisione '+d.revision+'). Verificare quantità, prezzi, posa, IVA e giacenze prima dell’invio.',lines,amount,status:'Da accettare',created_at:new Date().toISOString(),cadSource:{drawingId:d.id,revision:d.revision,generatedAt:new Date().toISOString(),warnings}};
}
function parseQuotes(site){
 let rows;try{rows=JSON.parse(site.ite_quotes||'[]')}catch{throw Error('Preventivi del cantiere non leggibili: nessuna modifica effettuata')}
 if(!Array.isArray(rows))throw Error('Archivio preventivi del cantiere non valido');
 return rows;
}
function ensureNewQuote(rows,q){
 if(rows.some(r=>r.cadSource?.drawingId===q.cadSource.drawingId&&r.cadSource?.revision===q.cadSource.revision))throw Error('Questa revisione CAD ha già un preventivo nel cantiere: apri quello esistente');
 if(rows.some(r=>String(r.number||'').toLowerCase()===q.number.toLowerCase()))throw Error('Numero preventivo già presente nel cantiere');
 return true;
}
function addLink(links,d,p,uuid,now){
 if(!compatible(d,p))throw Error('Disegno e pratica non compatibili per cliente/sede/impianto');
 const old=(links||[]).find(l=>same(l.drawingId,d.id)&&same(l.practiceId,p.id));
 const next={id:old?.id||'cpl_'+uuid,clientId:String(d.clientId),drawingId:d.id,practiceId:p.id,drawingRevision:d.revision,practiceRevision:p.revision,updated:now};
 return old?(links||[]).map(l=>l===old?next:l):[...(links||[]),next];
}
function mount(){
 const host=root.document?.getElementById('ite-cad');if(!host||host.querySelector('#cad-workflow'))return;
 const panel=document.createElement('div');panel.id='cad-workflow';panel.className='panel';
 const heading=document.createElement('h3');heading.textContent='CAD → pratiche tecniche e preventivi';panel.append(heading);
 const note=document.createElement('p');note.className='hint';note.textContent='Collega una tavola salvata alla pratica dello stesso cliente. Genera preventivi da materiali verificati, con fornitura e posa separate. Nessun documento viene firmato o approvato e nessuna giacenza viene scaricata.';panel.append(note);
 const grid=document.createElement('div');grid.className='grid';panel.append(grid);
 const select=(title)=>{const label=document.createElement('label');label.textContent=title;const el=document.createElement('select');label.append(el);grid.append(label);return el};
 const drawing=select('Disegno CAD salvato'),practice=select('Pratica tecnica compatibile'),site=select('Cantiere per preventivo');
 const laborLabel=document.createElement('label');laborLabel.textContent='Prezzo posa complessiva (€), da quantificare';const labor=document.createElement('input');labor.type='text';labor.inputMode='decimal';labor.maxLength=12;labor.placeholder='Inserire importo';laborLabel.append(labor);grid.append(laborLabel);
 const vat=select('IVA da verificare');for(const v of [10,22])vat.append(new Option(v+'%',String(v)));
 const buttons=document.createElement('div');buttons.className='actions';panel.append(buttons);
 const button=(label,handler)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=handler;buttons.append(b);return b};
 const status=document.createElement('p');status.setAttribute('aria-live','polite');status.className='hint';panel.append(status);
 const info=document.createElement('div');panel.append(info);
 const say=s=>{status.textContent=s};
 const fill=(el,rows,placeholder)=>{const prev=el.value;el.replaceChildren(new Option(placeholder,''));for(const [id,name] of rows)el.append(new Option(name,String(id)));if([...el.options].some(o=>o.value===prev))el.value=prev};
 function refresh(){
  const core=root.ITE?.snapshot?.(),commerce=root.ITECommerce?.snapshot?.();
  if(!core||!commerce)return;
  fill(drawing,(commerce.settings.cadDrawings||[]).filter(d=>!d.archived).map(d=>[d.id,d.title+' · rev. '+d.revision]),'— Seleziona disegno —');
  const d=find(commerce.settings.cadDrawings,drawing.value);
  fill(practice,d?(commerce.settings.technicalDrafts||[]).filter(p=>p.status!=='Annullata'&&compatible(d,p)).map(p=>[p.id,p.type+' · '+(p.fields?.reference||p.id.slice(-8))]):[],'— Seleziona pratica —');
  fill(site,d?eligibleSites(d,core).map(s=>[s.id,s.name||'Cantiere '+s.id]):[],'— Seleziona cantiere —');
  info.replaceChildren();
  if(d){const links=(commerce.settings.cadPracticeLinks||[]).filter(l=>same(l.drawingId,d.id));const p=document.createElement('p');p.className='hint';p.textContent='Disegno '+d.title+' · '+d.elements.length+' elementi · '+links.length+' pratiche collegate · '+(d.siteId?'cantiere associato':'scegli un cantiere compatibile per il preventivo');info.append(p);}
 }
 drawing.onchange=refresh;
 let saving=false;
 async function guarded(action){
  if(saving)return say('Operazione già in corso');saving=true;
  try{
   if(!root.ITEVault?.isUnlocked?.()||!root.ITEHistory?.create||!root.ITECommerce?.mutate)throw Error('Archivio protetto o backup non disponibili');
   if(root.ITECommerce.busy()||root.ITEBackup?.busy?.())throw Error('Attendi il completamento di backup o importazione');
   await action();
  }catch(e){say('Operazione non completata: '+e.message)}
  finally{saving=false}
 }
 button('Aggiorna disegni, pratiche e cantieri',refresh);
 button('Collega CAD alla pratica con backup',()=>guarded(async()=>{
  const state=root.ITECommerce.snapshot(),d=find(state.settings.cadDrawings,drawing.value),p=find(state.settings.technicalDrafts,practice.value);
  if(!d||!p||!compatible(d,p))throw Error('Seleziona disegno e pratica compatibili');
  await root.ITEHistory.create('Prima collegamento CAD a pratica');
  await root.ITECommerce.mutate(next=>{
   const current=find(next.settings.cadDrawings,d.id),target=find(next.settings.technicalDrafts,p.id);
   if(!current||!target||current.revision!==d.revision||target.revision!==p.revision)throw Error('Disegno o pratica cambiati: aggiorna la selezione');
   next.settings.cadPracticeLinks=addLink(next.settings.cadPracticeLinks,current,target,root.crypto.randomUUID(),new Date().toISOString());
   validateLinks(next,root.ITE.snapshot());
  });
  refresh();say('Collegamento salvato nell’archivio cifrato con backup precedente. Nessuna certificazione automatica.');
 }));
 button('Crea preventivo CAD con fornitura e posa',()=>guarded(async()=>{
  const core=root.ITE.snapshot(),state=root.ITECommerce.snapshot(),d=find(state.settings.cadDrawings,drawing.value),s=find(core.cantieri,site.value);
  const q=proposal(d,s,core,state,Number(String(labor.value).trim().replace(',','.')),Number(vat.value));
  ensureNewQuote(parseQuotes(s),q);
  await root.ITEHistory.create('Prima preventivo CAD '+q.number);
  const latest=root.ITECommerce.snapshot(),current=find(latest.settings.cadDrawings,d.id);
  if(!current||current.revision!==d.revision)throw Error('Disegno modificato: aggiorna la selezione');
  root.ITE.commit(next=>{
   const dest=find(next.cantieri,s.id);if(!dest||!same(dest.client_id,d.clientId))throw Error('Cantiere cambiato');
   const rows=parseQuotes(dest);ensureNewQuote(rows,q);rows.push(q);dest.ite_quotes=JSON.stringify(rows);
  });
  refresh();say('Preventivo '+q.number+' creato nel cantiere come DA ACCETTARE. Apri il cantiere per revisionare prezzi, IVA e posa. Nessun prelievo di magazzino.');
 }));
 button('Esporta fascicolo CAD + pratica (bozza HTML)',()=>guarded(async()=>{
  const core=root.ITE.snapshot(),state=root.ITECommerce.snapshot(),d=find(state.settings.cadDrawings,drawing.value),p=find(state.settings.technicalDrafts,practice.value);
  if(!d||!p||!compatible(d,p))throw Error('Seleziona disegno e pratica compatibili');
  const link=(state.settings.cadPracticeLinks||[]).find(l=>same(l.drawingId,d.id)&&same(l.practiceId,p.id));
  if(!link)throw Error('Salva prima il collegamento CAD-pratica');
  const svg=new XMLSerializer().serializeToString(root.ITECad.renderSvg(d.elements,'',true,d.scaleCmPerUnit));
  const schedule=root.ITECad.catalogSchedule(d.elements,d.scaleCmPerUnit,state.articles,state.movements);
  const rows=schedule.items.map(r=>'<tr><td>'+esc(r.label)+'</td><td>'+esc(r.articleCode||'Non associato')+'</td><td>'+r.count+'</td><td>'+esc(r.warning||'Da verificare sul posto')+'</td></tr>').join('');
  const html='<!doctype html><html lang="it"><meta charset="utf-8"><title>Fascicolo CAD - BOZZA</title><style>@page{size:A4 landscape;margin:12mm}body{font:13px Arial,sans-serif;color:#173451}svg{max-width:100%;max-height:130mm}table{border-collapse:collapse;width:100%}td,th{border:1px solid #9ab;padding:6px;text-align:left}h1{color:#16834b}</style><h1>I.T.E. — Fascicolo CAD e pratica (BOZZA NON CERTIFICATA)</h1><p>Cliente: '+esc(find(core.clienti,d.clientId)?.name)+' · Disegno: '+esc(d.title)+' rev. '+d.revision+' · Pratica: '+esc(p.type)+' rev. '+p.revision+'</p><p>Riferimento pratica: '+esc(p.fields?.reference||'Da compilare')+' · Scala: '+esc(d.scaleCmPerUnit==null?'non calibrata':d.scaleCmPerUnit+' cm/unità')+'</p>'+svg+'<h2>Distinta preliminare</h2><table><tr><th>Simbolo</th><th>Articolo</th><th>Quantità</th><th>Controlli</th></tr>'+rows+'</table><p>Originali non incorporati. Prove, misure, materiali, firme e conformità da verificare. Documento locale non cifrato: custodire con attenzione.</p></html>';
  const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='ITE_CAD_PRATICA_BOZZA_'+d.id.slice(-8)+'.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  say('Fascicolo HTML preparato. È una bozza locale non cifrata, non un modello ufficiale.');
 }));
 host.append(panel);refresh();
 root.addEventListener('ite-pagechange',()=>{if(root.ITEVault?.isUnlocked?.())refresh()});
}
const api=Object.freeze({markup,compatible,validateLinks,eligibleSites,proposal,parseQuotes,ensureNewQuote,addLink,mount});
root.ITECadWorkflow=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined')root.addEventListener('ite-vault-ready',mount);
})(typeof globalThis!=='undefined'?globalThis:this);
