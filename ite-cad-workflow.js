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
 host.append(panel);refresh();mountTechnicalAssist();
 root.addEventListener('ite-pagechange',()=>{if(root.ITEVault?.isUnlocked?.())refresh()});
}

/* Milestone 16: incrocio guidato anagrafica -> intervento -> CAD -> pratica.
 * Tutti i valori sono proposte, mai attestazioni di posa, prove o conformità.
 */
function technicalSources(practice,db,commerce){
 if(!practice||!practice.clientId)throw Error('Seleziona un cliente per la verifica incrociata');
 const client=find(db.clienti,practice.clientId);
 if(!client)throw Error('Cliente non presente in anagrafica');
 const property=practice.propertyId?find(db.immobili,practice.propertyId):null;
 const plant=practice.plantId?find(db.impianti,practice.plantId):null;
 const device=practice.deviceId?find(db.apparecchiature,practice.deviceId):null;
 const site=practice.siteId?find(db.cantieri,practice.siteId):null;
 if(practice.propertyId&&(!property||!same(property.client_id,client.id))||
    practice.plantId&&(!plant||!property||!same(plant.immobile_id,property.id))||
    practice.deviceId&&(!device||!plant||!same(device.impianto_id,plant.id))||
    practice.siteId&&(!site||!same(site.client_id,client.id)||site.immobile_id&&property&&!same(site.immobile_id,property.id)))
  throw Error('Collegamenti cliente, sede, impianto o apparecchiatura incoerenti');
 const type=String(practice.type||'');
 const isDico=type==='Di.Co. elettrica'||type==='Di.Co. idrica / termica';
 const isGas=type.startsWith('Allegato gas ');
 const warnings=[],candidates=[];
 const add=(target,value,source)=>{
  const v=String(value??'').trim();
  if(!v)return;
  if(v.length>(target.startsWith('detail:')?2000:4000)){warnings.push('Dato troppo lungo per '+target+': inserimento manuale necessario');return}
  candidates.push({target,value:v,source});
 };
 const address=[property?.address||property?.name,property?.city,property?.province].filter(Boolean).join(', ');
 if(type==='POS'||isDico||type==='Di.Ri.')add('detail:committente',client.name,'Anagrafica cliente '+client.id);
 if(isDico||type==='Di.Ri.')add('detail:indirizzoImpianto',address,'Sede '+(property?.id||''));
 if(isGas)add('detail:indirizzoUtenza',address,'Sede '+(property?.id||''));
 if(type==='POS')add('detail:cantiere',[site?.name,site?.address].filter(Boolean).join(' — '),'Cantiere '+(site?.id||''));
 if(type==='Di.Co. idrica / termica'){
  const equipment=[plant?.name,device?.category,device?.brand,device?.model,device?.serial?'matricola '+device.serial:''].filter(Boolean).join(' · ');
  add('detail:tipoRete',equipment,'Impianto e apparecchiatura (da verificare)');
 }
 if(isGas&&device){
  const equipment=[device.brand,device.model,device.serial?'matricola '+device.serial:'',device.power?'potenza in anagrafica '+device.power:''].filter(Boolean).join(' · ');
  add('detail:potenza',equipment?'Dati apparecchiatura da verificare: '+equipment:'','Scheda apparecchiatura '+device.id);
 }
 const job=practice.interventionId?find(db.interventi,practice.interventionId):null;
 if(practice.interventionId&&!job)throw Error('Intervento collegato non presente');
 if(job){
  const ctx=root.ITETechnicalDrafts?.contextForIntervention?.(job,db);
  if(!ctx||!same(ctx.clientId,practice.clientId)||['propertyId','plantId','deviceId','siteId'].some(k=>practice[k]&&ctx[k]&&!same(practice[k],ctx[k])))
   throw Error('Intervento non coerente con cliente, sede o apparecchiatura');
  if(job.appointment==='1'&&job.workflow_status!=='Chiuso')warnings.push('Appuntamento non chiuso: descrizione lavori non ripresa come eseguita');
  else{
   add('field:scope',job.description,'Intervento '+job.id+' (verificare lavorazioni)');
   if(isDico)add('detail:descrizioneImpianto',job.description,'Intervento '+job.id+' (verificare consistenza)');
  }
 }
 const links=(commerce.settings?.cadPracticeLinks||[]).filter(l=>same(l.practiceId,practice.id));
 if(links.length>1)warnings.push('Più tavole CAD collegate: selezionare manualmente lo schema corretto');
 if(links.length===0)warnings.push('Nessuna tavola CAD collegata alla pratica: materiali e schema non precompilati');
 if(links.length===1){
  const link=links[0],drawing=find(commerce.settings?.cadDrawings,link.drawingId);
  if(!drawing||!compatible(drawing,practice))throw Error('Collegamento CAD non valido o appartenente ad altro cliente');
  if(drawing.archived)warnings.push('Tavola CAD archiviata: nessuna proposta di materiali');
  else if(drawing.revision!==link.drawingRevision)warnings.push('Tavola CAD modificata dopo il collegamento: ricollegare la revisione prima di usarla');
  else if(isDico||isGas){
   const schedule=root.ITECad.catalogSchedule(drawing.elements,drawing.scaleCmPerUnit,commerce.articles,commerce.movements);
   if(!schedule.calibrated)warnings.push('Scala CAD non calibrata: quote e lunghezze non utilizzabili');
   if(!schedule.items.length)warnings.push('Tavola CAD senza simboli materiali');
   const valid=schedule.items.filter(r=>r.articleId&&r.articleCode&&/^(pz|pza|pezzo|pezzi)$/i.test(r.unit));
   for(const row of schedule.items)if(!valid.includes(row))warnings.push('Articolo CAD da associare/verificare: '+row.label);
   const ref='Tavola CAD '+drawing.title+' ('+drawing.id+', revisione '+drawing.revision+')';
   const items=valid.map(r=>r.count+' pz · '+r.articleCode+' · '+r.description).join('\n');
   if(items){
    const material='Distinta PRELIMINARE da '+ref+'; quantità e posa da verificare sul posto:\n'+items;
    add('field:materials',material,'Catalogo e simboli '+ref);
    if(isDico)add('detail:materialiRiferimento',material,'Catalogo e simboli '+ref);
    if(isGas)warnings.push('Materiali CAD preliminari: tubazioni gas e posa da verificare su schema e originali');
   }
   if(isDico)add('detail:schemaRiferimento',ref+' — disegno in bozza, verificare versione e allegati','CAD '+drawing.id);
   for(const row of schedule.items)if(row.warning)warnings.push((row.articleCode||row.label)+': '+row.warning);
  }
 }
 if(!practice.propertyId&&!practice.siteId)warnings.push('Manca la sede o il cantiere della pratica');
 if(!practice.interventionId)warnings.push('Nessun intervento associato: descrizione lavori da verificare');
 return {candidates,warnings:[...new Set(warnings)],clientId:String(client.id),practiceId:String(practice.id||'')};
}
function technicalAudit(rows,db,commerce,clientId){
 if(!clientId||!find(db.clienti,clientId))throw Error('Seleziona un cliente valido per il controllo del fascicolo');
 const selected=(rows||[]).filter(r=>same(r.clientId,clientId));
 if(selected.length>100)throw Error('Fascicolo troppo esteso: seleziona un insieme più piccolo');
 return selected.map(p=>{
  const cross=technicalSources(p,db,commerce);
  const quality=root.ITETechnicalDrafts?.qualityReport?.(p);
  return {id:p.id,type:p.type,reference:String(p.fields?.reference||''),revision:p.revision,open:quality?.open??null,originals:p.linkedDocIds?.length||0,warnings:cross.warnings};
 });
}
function mountTechnicalAssist(){
 const editor=document.getElementById('tech-editor'),list=document.getElementById('tech-list');
 if(!editor||!list||editor.dataset.crosscheckMounted)return;
 editor.dataset.crosscheckMounted='1';
 const readForm=form=>Object.fromEntries(['type','clientId','propertyId','plantId','deviceId','siteId','interventionId'].map(k=>[k,form.elements[k]?.value||'']));
 const field=(form,target)=>target.startsWith('field:')?form.elements[target.slice(6)]:form.querySelector('[data-tech-detail="'+target.slice(7)+'"]');
 const inject=()=>{
  const form=editor.querySelector('#tech-form');
  if(!form||form.querySelector('#tech-crosscheck'))return;
  const panel=document.createElement('div');panel.id='tech-crosscheck';panel.className='panel';
  const title=document.createElement('h4');title.textContent='Verifica incrociata — anagrafiche, intervento e CAD';panel.append(title);
  const note=document.createElement('p');note.className='hint';note.textContent='Proposte solo da fonti locali collegate. I campi compilati non vengono sovrascritti. Nessuna firma, PDR verificato o esito di prova viene creato. Il salvataggio della pratica resta manuale e con backup.';panel.append(note);
  const check=document.createElement('button');check.type='button';check.className='secondary';check.textContent='Analizza fonti collegate';panel.append(check);
  const preview=document.createElement('div');preview.setAttribute('aria-live','polite');panel.append(preview);
  form.querySelector('#tech-checklist')?.before(panel);
  check.onclick=()=>{
   preview.replaceChildren();
   try{
    const context={...readForm(form),id:editor.dataset.id||''};
    const result=technicalSources(context,root.ITE.snapshot(),root.ITECommerce.snapshot());
    const header=document.createElement('p');header.textContent=result.candidates.length+' proposte, '+result.warnings.length+' avvisi. Seleziona solo dati verificati.';preview.append(header);
    if(result.warnings.length){const ul=document.createElement('ul');for(const w of result.warnings){const li=document.createElement('li');li.textContent=w;ul.append(li)}preview.append(ul)}
    const available=result.candidates.filter(c=>field(form,c.target)&&!String(field(form,c.target).value||'').trim());
    if(!available.length){const p=document.createElement('p');p.textContent='Nessun campo vuoto con proposta disponibile.';preview.append(p);return}
    const controls=[];
    for(const candidate of available){
     const label=document.createElement('label');label.className='item';
     const cb=document.createElement('input');cb.type='checkbox';cb.style.width='auto';label.append(cb);
     const span=document.createElement('span');span.textContent=' '+candidate.target+' · '+candidate.source+' — '+candidate.value.slice(0,180);label.append(span);preview.append(label);
     controls.push({cb,candidate});
    }
    const apply=document.createElement('button');apply.type='button';apply.textContent='Applica solo le proposte selezionate';preview.append(apply);
    apply.onclick=()=>{
     try{
      const now={...readForm(form),id:editor.dataset.id||''};
      const latest=technicalSources(now,root.ITE.snapshot(),root.ITECommerce.snapshot());
      if(JSON.stringify(now)!==JSON.stringify(context)||JSON.stringify(latest.candidates)!==JSON.stringify(result.candidates))throw Error('Fonti o collegamenti cambiati: ripeti l’analisi');
      let count=0;
      for(const {cb,candidate} of controls){
       const el=field(form,candidate.target);
       if(cb.checked&&el&&!String(el.value||'').trim()){el.value=candidate.value;el.dispatchEvent(new Event('input',{bubbles:true}));count++}
      }
      preview.replaceChildren();
      const p=document.createElement('p');p.textContent=count+' campi proposti inseriti. Verifica gli originali, poi salva manualmente la pratica con backup.';preview.append(p);
     }catch(e){const p=document.createElement('p');p.textContent='Applicazione bloccata: '+e.message;preview.append(p)}
    };
   }catch(e){const p=document.createElement('p');p.textContent='Analisi bloccata: '+e.message;preview.append(p)}
  };
 };
 new MutationObserver(inject).observe(editor,{childList:true});
 inject();
 const panel=document.getElementById('technical-drafts-panel');
 if(panel&&!panel.querySelector('#tech-crosscheck-audit')){
  const audit=document.createElement('button');audit.id='tech-crosscheck-audit';audit.type='button';audit.className='secondary';audit.textContent='Controllo incrociato fascicolo cliente';panel.querySelector('#tech-dossier')?.after(audit);
  const status=document.createElement('div');status.id='tech-crosscheck-report';status.setAttribute('role','status');audit.after(status);
  audit.onclick=()=>{
   status.replaceChildren();
   try{
    const clientId=document.getElementById('tech-filter-client')?.value;
    const data=root.ITECommerce.snapshot(),db=root.ITE.snapshot();
    const rows=technicalAudit(data.settings.technicalDrafts||[],db,data,clientId);
    const p=document.createElement('p');p.textContent=rows.length+' pratiche analizzate; controllo documentale interno, non certificazione.';status.append(p);
    for(const row of rows){
     const d=document.createElement('details');d.className='item';
     const s=document.createElement('summary');s.textContent=row.type+' · '+(row.reference||row.id)+' · rev. '+row.revision+' · originali '+row.originals+' · '+row.warnings.length+' avvisi';d.append(s);
     const ul=document.createElement('ul');for(const w of row.warnings){const li=document.createElement('li');li.textContent=w;ul.append(li)}d.append(ul);status.append(d);
    }
   }catch(e){const p=document.createElement('p');p.textContent='Controllo non eseguito: '+e.message;status.append(p)}
  };
 }
}

const api=Object.freeze({markup,compatible,validateLinks,eligibleSites,proposal,parseQuotes,ensureNewQuote,addLink,technicalSources,technicalAudit,mountTechnicalAssist,mount});
root.ITECadWorkflow=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined')root.addEventListener('ite-vault-ready',mount);
})(typeof globalThis!=='undefined'?globalThis:this);
