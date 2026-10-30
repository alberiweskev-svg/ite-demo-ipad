/* I.T.E. 4.0 — tavole documentali preparatorie, senza modelli ufficiali né rete. */
(function(root){
'use strict';
const TYPES=new Set(['Di.Co. elettrica','Di.Co. idrica / termica','Di.Ri.','Allegato gas H40','Allegato gas I40','Allegato gas A12','Allegato gas B12','POS']);
const same=(a,b)=>String(a??'')===String(b??'');
const arr=v=>Array.isArray(v)?v:[];
const find=(list,id)=>arr(list).find(x=>same(x.id,id));
const clean=v=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=v=>clean(v)||'Da compilare / verificare';
const display=(o)=>o?.name||[o?.brand,o?.model,o?.serial].filter(Boolean).join(' ')||'Non collegato';
const keyName=k=>String(k).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ').replace(/^./,c=>c.toUpperCase());
function validate(rows,clientId,docs,base){
 if(!clientId||!find(base?.clienti,clientId))throw Error('Seleziona un cliente presente in anagrafica.');
 if(!Array.isArray(rows)||!rows.length||rows.length>50)throw Error('Seleziona da 1 a 50 pratiche dello stesso cliente.');
 const seen=new Set(),docsById=new Map(arr(docs).map(d=>[String(d.id),d]));
 for(const p of rows){
  if(!p?.id||seen.has(String(p.id))||!TYPES.has(p.type)||!same(p.clientId,clientId))throw Error('Pratica duplicata, tipo non previsto o cliente diverso.');
  seen.add(String(p.id));
  const property=p.propertyId?find(base.immobili,p.propertyId):null;
  const site=p.siteId?find(base.cantieri,p.siteId):null;
  const plant=p.plantId?find(base.impianti,p.plantId):null;
  const device=p.deviceId?find(base.apparecchiature,p.deviceId):null;
  if(p.propertyId&&(!property||!same(property.client_id,clientId))||
     p.siteId&&(!site||!same(site.client_id,clientId))||
     p.plantId&&(!plant||!property||!same(plant.immobile_id,property.id))||
     p.deviceId&&(!device||!plant||!same(device.impianto_id,plant.id))||
     property&&site?.immobile_id&&!same(site.immobile_id,property.id))
   throw Error('Collegamenti anagrafici incoerenti: esportazione bloccata.');
  for(const id of arr(p.linkedDocIds)){
   const d=docsById.get(String(id));
   if(!d||!same(d.clientId||d.subjectId,clientId)||
      d.propertyId&&p.propertyId&&!same(d.propertyId,p.propertyId)||
      d.siteId&&p.siteId&&!same(d.siteId,p.siteId))
    throw Error('Originale mancante o collegato a un altro cliente/sede: esportazione bloccata.');
  }
 }
 return true;
}
function assess(p,docs,options={}){
 const issues=[],add=s=>{if(!issues.includes(s))issues.push(s)};
 if(p.status==='Annullata')add('Pratica annullata');
 if(!clean(p.fields?.reference))add('Riferimento pratica da completare');
 if(!clean(p.fields?.scope))add('Descrizione lavori da completare');
 if(!arr(p.linkedDocIds).length)add('Nessun originale tecnico collegato');
 const groups=options.groups?.[p.type]||[];
 for(const g of groups)for(const f of g.fields||[])if(f[3]&&!clean(p.structured?.[f[0]]))add(g.title+': '+f[1]+' da compilare');
 for(const [item,check] of Object.entries(p.checklistEvidence||{})){
  if(!['Documentato','Non applicabile'].includes(check?.status)||!clean(check?.evidence))add('Checklist: '+item+' da verificare');
  if(check?.documentId&&!arr(p.linkedDocIds).some(id=>same(id,check.documentId)))add('Checklist: fonte '+item+' non collegata');
 }
 if(p.type.startsWith('Allegato gas')&&!clean(p.structured?.pdrVerificato))add('PDR non attestato da documento verificato');
 if(p.type==='POS'&&!p.siteId)add('POS privo di cantiere');
 if(p.type==='POS'&&p.structured?.inizioLavori&&p.structured?.fineLavori&&p.structured.inizioLavori>p.structured.fineLavori)add('Date POS incoerenti');
 if(typeof options.review==='function')for(const issue of options.review(p)?.issues||[])add(issue.label||String(issue));
 return issues;
}
function table(rows){
 return '<table><tbody>'+rows.map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+esc(val(v))+'</td></tr>').join('')+'</tbody></table>';
}

/* Registro operativo di verifica: nessuna voce rappresenta attestazione normativa. */
function materialTrace(p,clientId,options={}){
 const rows=[],warnings=[];
 for(const link of arr(options.links).filter(l=>same(l.practiceId,p.id))){
  const drawing=find(options.drawings,link.drawingId);
  if(!drawing||drawing.archived||!same(drawing.clientId,clientId)||!same(drawing.revision,link.drawingRevision)){
   warnings.push('Tavola CAD assente, non autorizzata, archiviata o con revisione superata');
   continue;
  }
  const grouped=new Map();
  for(const e of arr(drawing.elements)){
   if(e?.kind!=='symbol')continue;
   const k=String(e.text||'')+'|'+String(e.articleId||'');
   if(!grouped.has(k))grouped.set(k,{symbol:clean(e.text),articleId:String(e.articleId||''),quantity:0});
   grouped.get(k).quantity++;
  }
  for(const item of grouped.values()){
   const article=item.articleId?find(options.articles,item.articleId):null;
   const valid=article?.kind==='Materiale';
   const unit=valid?clean(article.unit):'';
   const compatible=/^(pz|pza|pezzo|pezzi)$/i.test(unit);
   const moves=valid?arr(options.movements).filter(x=>same(x.articleId,article.id)):[];
   const numbers=moves.map(x=>typeof x.quantity==='number'?x.quantity:Number(x.quantity));
   const stock=moves.length&&numbers.every(Number.isFinite)?numbers.reduce((a,n)=>a+n,0):null;
   const status=!valid?'Articolo non associato':!compatible?'Unità da verificare':stock===null?'Giacenza non documentata':stock<item.quantity?'Giacenza insufficiente':'Da verificare sul campo';
   if(status!=='Da verificare sul campo')warnings.push('Distinta '+(valid?clean(article.code):item.symbol)+': '+status);
   rows.push({drawingId:String(drawing.id),drawingTitle:clean(drawing.title),revision:drawing.revision,symbol:item.symbol,
    code:valid?clean(article.code):'',description:valid?clean(article.description):'',quantity:item.quantity,
    unit,status,stock});
   if(rows.length>500)throw Error('Distinta troppo estesa: riduci le tavole selezionate.');
  }
 }
 return {rows,warnings:[...new Set(warnings)]};
}
function inspectionMatrix(p,docs,clientId,options={}){
 const checks=[],push=(section,item,status,note='')=>checks.push({section,item,status,note});
 push('Identificazione','Riferimento pratica',clean(p.fields?.reference)?'Presente':'Da verificare',p.fields?.reference||'Mancante');
 push('Identificazione','Descrizione dei lavori',clean(p.fields?.scope)?'Presente':'Da verificare',p.fields?.scope||'Mancante');
 push('Collegamenti','Sede',p.propertyId?'Collegata':'Da verificare',p.propertyId?'Riferimento anagrafico':'Sede non selezionata');
 push('Collegamenti','Impianto',p.plantId?'Collegato':'Da verificare',p.plantId?'Riferimento anagrafico':'Impianto non selezionato');
 for(const g of options.groups?.[p.type]||[]){
  for(const f of g.fields||[]){
   if(!f[3])continue;
   const value=clean(p.structured?.[f[0]]);
   push(g.title,f[1],value?'Compilato':'Da verificare',value?'Dato inserito dall’operatore':'Campo richiesto dalla scheda interna');
  }
 }
 const linked=arr(p.linkedDocIds);
 push('Originali','Documenti collegati',linked.length?'Riferiti':'Da verificare',linked.length?linked.length+' riferimento/i, non incorporati':'Nessun originale');
 for(const id of linked){
  const d=find(docs,id);
  if(d&&same(d.clientId||d.subjectId,clientId))push('Originali','Riferimento '+String(id),'Riferito',clean(d.type||'Documento')+' · '+clean(d.number||d.sourceName||d.id));
 }
 for(const [item,c] of Object.entries(p.checklistEvidence||{})){
  const ok=['Documentato','Non applicabile'].includes(c?.status)&&clean(c?.evidence);
  const attached=!c?.documentId||linked.some(id=>same(id,c.documentId));
  push('Evidenze',item,ok&&attached?(c.status==='Non applicabile'?'Non applicabile':'Riferita'):'Da verificare',
   clean(c?.evidence)||'Evidenza non indicata');
 }
 if(p.type.startsWith('Allegato gas'))push('GAS','PDR verificato da documento',clean(p.structured?.pdrVerificato)?'Dato inserito':'Da verificare',
  'Non equivale ad attestazione automatica del PDR');
 if(p.type==='POS'){
  push('POS','Cantiere',p.siteId?'Collegato':'Da verificare',p.siteId?'Cantiere associato':'Cantiere non selezionato');
  const start=clean(p.structured?.inizioLavori),end=clean(p.structured?.fineLavori);
  push('POS','Cronologia lavori',start&&end&&start<=end?'Date presenti':'Da verificare',
   start&&end&&start>end?'Fine lavori precedente all’inizio':'Verificare date e completezza');
 }
 for(const evidence of root.ITETechnicalEvidence?.summary?.(p,options.evidenceLinks,options.fieldChecks,clientId)||[]){
  push('Prove intervento',evidence.label,evidence.status==='Riferimento attivo - da verificare'?'Riferito':'Da verificare',
   [evidence.measuredAt,evidence.value?evidence.value+' '+evidence.unit:evidence.outcome,evidence.status,'Revisore: '+evidence.reviewer,'Nota: '+evidence.note].filter(Boolean).join(' · '));
 }
 const links=arr(options.links).filter(l=>same(l.practiceId,p.id));
 push('Disegni','Tavole CAD',links.length?'Riferite':'Da verificare',links.length?links.length+' collegamento/i':'Nessuna tavola collegata');
 const trace=materialTrace(p,clientId,options);
 for(const warning of trace.warnings)push('Distinta CAD','Controllo materiali','Da verificare',warning);
 for(const item of trace.rows)push('Distinta CAD',item.code||item.symbol,item.status==='Da verificare sul campo'?'Riferito':'Da verificare',
  item.quantity+' '+(item.unit||'pz')+' · '+(item.description||item.symbol)+' · '+item.status);
 return checks;
}
function csvCell(v){
 const raw=clean(v),safe=/^[=+\-@]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replace(/"/g,'""')+'"';
}
function csvReport(rows,clientId,docs,base,options={}){
 validate(rows,clientId,docs,base);
 const lines=[['Pratica','Tipo','Sezione','Controllo','Esito interno','Nota'].map(csvCell).join(';')];
 const counts={total:0,toVerify:0};
 for(const p of rows)for(const item of inspectionMatrix(p,docs,clientId,options)){
  counts.total++;if(item.status==='Da verificare')counts.toVerify++;
  lines.push([p.fields?.reference||p.id,p.type,item.section,item.item,item.status,item.note].map(csvCell).join(';'));
 }
 if(lines.join('').length>750000)throw Error('Registro troppo esteso: restringi la selezione.');
 return {csv:'\uFEFF'+lines.join('\r\n')+'\r\n',counts};
}


/* Piano di completamento del fascicolo: operativo, non certificativo.
   I controlli fra pratiche sono limitati al cliente esplicitamente selezionato. */
function dossierPlan(rows,clientId,docs,base,options={}){
 validate(rows,clientId,docs,base);
 const actions=[],seen=new Set(),references=new Map(),gasBySite=new Map();
 const push=(p,priority,section,task,reason)=>{
  const key=[p.id,section,task].join('|');
  if(seen.has(key))return;
  seen.add(key);
  actions.push({practiceId:String(p.id),type:p.type,reference:clean(p.fields?.reference)||String(p.id),
   priority,section,task,reason:clean(reason)});
  if(actions.length>4000)throw Error('Piano troppo esteso: restringi il fascicolo.');
 };
 for(const p of rows){
  for(const item of inspectionMatrix(p,docs,clientId,options)){
   if(item.status==='Da verificare')push(p,
    item.section==='Originali'||item.section==='Identificazione'?'Prioritaria':'Operativa',
    item.section,item.item,item.note);
  }
  for(const issue of assess(p,docs,options)){
   push(p,'Operativa','Controlli pratica',issue,'Completare o motivare il controllo nella scheda originale');
  }
  if(p.status==='Annullata')push(p,'Prioritaria','Stato','Pratica annullata','Escludere dal fascicolo da consegnare');
  const ref=clean(p.fields?.reference).toLocaleLowerCase('it');
  if(ref){
   const k=p.type+'|'+ref;
   if(references.has(k)){
    const prior=references.get(k);
    push(p,'Prioritaria','Numerazione','Riferimento duplicato','Coincide con un’altra pratica dello stesso tipo nel fascicolo');
    push(prior,'Prioritaria','Numerazione','Riferimento duplicato','Coincide con un’altra pratica dello stesso tipo nel fascicolo');
   }else references.set(k,p);
  }
  if(p.type.startsWith('Allegato gas')){
   const pdr=clean(p.structured?.pdrVerificato);
   const siteKey=p.siteId?'cantiere:'+p.siteId:p.propertyId?'sede:'+p.propertyId:'';
   if(siteKey&&pdr){
    const earlier=gasBySite.get(siteKey);
    if(earlier&&earlier.pdr!==pdr){
     push(p,'Prioritaria','Coerenza GAS','PDR discordante','PDR diversi su pratiche gas della stessa sede/cantiere: confrontare gli originali');
     push(earlier.practice,'Prioritaria','Coerenza GAS','PDR discordante','PDR diversi su pratiche gas della stessa sede/cantiere: confrontare gli originali');
    }else if(!earlier)gasBySite.set(siteKey,{pdr,practice:p});
   }
  }
  push(p,'Esterna','Modello e sottoscrizioni','Confronto modello originale e firme',
   'Verificare modello applicabile, allegati richiesti, prove e sottoscrizioni fuori dalla bozza: non attestati dal gestionale');
 }
 const rank={'Prioritaria':0,'Operativa':1,'Esterna':2};
 actions.sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9)||a.type.localeCompare(b.type,'it')||a.reference.localeCompare(b.reference,'it'));
 const summary={practices:rows.length,total:actions.length,priority:actions.filter(x=>x.priority==='Prioritaria').length,
  operational:actions.filter(x=>x.priority==='Operativa').length,external:actions.filter(x=>x.priority==='Esterna').length};
 return {actions,summary};
}
function dossierPlanCsv(rows,clientId,docs,base,options={}){
 const plan=dossierPlan(rows,clientId,docs,base,options);
 const lines=[['Priorità','Pratica','Tipo','Riferimento','Area','Attività','Motivo'].map(csvCell).join(';')];
 for(const item of plan.actions)lines.push([item.priority,item.practiceId,item.type,item.reference,item.section,item.task,item.reason].map(csvCell).join(';'));
 const csv='\uFEFF'+lines.join('\r\n')+'\r\n';
 if(csv.length>900000)throw Error('Piano CSV troppo esteso: restringi le pratiche.');
 return {csv,summary:plan.summary};
}
function dossierPlanHtml(rows,clientId,docs,base,options={}){
 const plan=dossierPlan(rows,clientId,docs,base,options),client=find(base.clienti,clientId);
 const rowsHtml=plan.actions.map(x=>'<tr><td>'+esc(x.priority)+'</td><td>'+esc(x.type)+' · '+esc(x.reference)+
  '</td><td>'+esc(x.section)+'</td><td>'+esc(x.task)+'</td><td>'+esc(x.reason)+'</td></tr>').join('');
 const html='<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">'+
  '<title>I.T.E. — piano completamento tecnico (bozza)</title><style>'+
  '@page{size:A4 landscape;margin:12mm}body{font:12px/1.4 Arial,sans-serif;color:#243c32}h1{color:#08653a}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #b9cbbf;padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf4ef}thead{display:table-header-group}tr{break-inside:avoid}p.warning{border:2px solid #a33;padding:9px;color:#822;font-weight:bold}</style></head><body>'+
  '<h1>Piano di completamento del fascicolo tecnico — I.T.E. 4.0</h1>'+
  '<p class="warning">BOZZA OPERATIVA NON VALIDA / NON FIRMATA. Non sostituisce i modelli ufficiali, prove o verifiche normative. Esportazione locale non cifrata.</p>'+
  table([['Cliente',display(client)],['Pratiche selezionate',plan.summary.practices],
   ['Attività prioritarie',plan.summary.priority],['Attività operative',plan.summary.operational],
   ['Verifiche esterne obbligatorie da svolgere',plan.summary.external]])+
  '<h2>Attività da esaminare</h2><table><thead><tr><th>Priorità</th><th>Pratica</th><th>Area</th><th>Attività</th><th>Motivo</th></tr></thead><tbody>'+rowsHtml+'</tbody></table>'+
  '<p>Nessuna attività viene chiusa automaticamente. Controllare gli originali prima di qualsiasi utilizzo ufficiale.</p></body></html>';
 if(html.length>900000)throw Error('Piano HTML troppo esteso: restringi le pratiche.');
 return {html,summary:plan.summary};
}

function build(rows,clientId,docs,base,options={}){
 validate(rows,clientId,docs,base);
 const client=find(base.clienti,clientId),docMap=new Map(arr(docs).map(d=>[String(d.id),d]));
 const annexes=[],sections=[],issuesByPractice=[];
 const plan=dossierPlan(rows,clientId,docs,base,options);
 const drawings=arr(options.drawings),links=arr(options.links);
 for(const [i,p] of rows.entries()){
  const issues=assess(p,docs,options),trace=materialTrace(p,clientId,options),matrix=inspectionMatrix(p,docs,clientId,options);
  for(const warning of trace.warnings)if(!issues.includes(warning))issues.push(warning);
  issuesByPractice.push({id:p.id,issues});
  const property=find(base.immobili,p.propertyId),plant=find(base.impianti,p.plantId);
  const device=find(base.apparecchiature,p.deviceId),site=find(base.cantieri,p.siteId);
  const intervention=find(base.interventi,p.interventionId);
  const details=(options.groups?.[p.type]||[]).map(g=>'<section class="group"><h3>'+esc(g.title)+'</h3>'+table((g.fields||[]).map(f=>[f[1],p.structured?.[f[0]]]))+'</section>').join('');
  const generic=table([['Riferimento',p.fields?.reference],['Data',p.date],['Oggetto lavori',p.fields?.scope],['Materiali (dichiarati)',p.fields?.materials],['Controlli (testo operatore)',p.fields?.checks],['PDR (da verificare)',p.fields?.pdr],['Note',p.fields?.notes]]);
  const checks=Object.entries(p.checklistEvidence||{}).map(([name,c])=>[name,(c?.status||'Da verificare')+' — '+(c?.evidence||'Evidenza assente')+(c?.documentId?' — documento '+c.documentId:'')]);
  const linked=arr(p.linkedDocIds).map(id=>docMap.get(String(id)));
  for(const d of linked)annexes.push({practiceId:p.id,documentId:d.id,type:d.type||'',name:d.sourceName||d.number||String(d.id),date:d.date||''});
  const sourceRows=Object.entries(p.originalPrefill||{}).map(([target,s])=>{
   const d=docMap.get(String(s?.documentId||'')),linkedOk=arr(p.linkedDocIds).some(id=>same(id,s?.documentId));
   const current=target.startsWith('detail:')?p.structured?.[target.slice(7)]:target.startsWith('field:')?p.fields?.[target.slice(6)]:undefined;
   return [target,d&&linkedOk&&same(d.clientId||d.subjectId,clientId)&&same(current,s?.value)?'Originale '+String(d.number||d.sourceName||d.id)+' — valore confermato nella bozza':'Fonte non verificabile: provenienza esclusa'];
  });
  const cadRows=links.filter(l=>same(l.practiceId,p.id)).map(l=>{
   const d=find(drawings,l.drawingId);
   if(!d||d.archived||!same(d.clientId,clientId)||!same(d.revision,l.drawingRevision)){
    issues.push('Tavola CAD assente, archiviata o con revisione superata');
    return ['Tavola CAD','Riferimento da aggiornare: non utilizzabile come schema verificato'];
   }
   return ['Tavola CAD',String(d.title||d.id)+' — revisione '+d.revision+' (riferimento, non prova)'];
  });
  const header='<div class="subhead">Pratica '+(i+1)+' / '+rows.length+' · '+esc(p.type)+' · revisione '+esc(p.revision||1)+' · stato '+esc(p.status||'Bozza')+'</div>';
  sections.push('<article class="practice">'+header+'<h2>'+esc(p.type)+' — scheda di lavoro</h2>'+
   '<p class="notice">BOZZA NON VALIDA, NON FIRMATA. Non sostituisce dichiarazioni, allegati o modelli ufficiali.</p>'+
   '<h3>Identificazione e collegamenti</h3>'+table([['Cliente',display(client)],['Sede',display(property)],['Impianto',display(plant)],['Apparecchiatura',display(device)],['Cantiere',display(site)],['Intervento',intervention?.description||p.interventionId||'Non collegato']])+
   '<h3>Dati della pratica</h3>'+generic+details+
   '<h3>Checklist e riferimenti alle evidenze</h3>'+(checks.length?table(checks):'<p>Nessuna evidenza registrata: verificare sul campo.</p>')+
   '<h3>Matrice di verifica interna (non certificativa)</h3>'+table(matrix.map(x=>[x.section+' · '+x.item+' — '+x.status,x.note]))+
   '<h3>Distinta materiali CAD (quantità da verificare, posa separata)</h3>'+(trace.rows.length?table(trace.rows.map(x=>[x.code||x.symbol,x.quantity+' '+(x.unit||'pz')+' · '+x.description+' · '+x.status+' · tavola rev. '+x.revision])):'<p>Nessun materiale CAD associato a una tavola valida.</p>')+
   '<h3>Schema e tavole collegate</h3>'+(cadRows.length?table(cadRows):'<p>Nessuna tavola CAD collegata.</p>')+
   '<h3>Originali collegati (solo indice, nessun file incorporato)</h3>'+(linked.length?table(linked.map(d=>[d.type||'Originale',String(d.number||d.sourceName||d.id)+(d.date?' · '+d.date:'')])):'<p>Nessun originale collegato.</p>')+
   '<h3>Provenienza delle proposte originali</h3>'+(sourceRows.length?table(sourceRows):'<p>Nessuna provenienza registrata.</p>')+
   '<h3>Verifiche aperte ('+issues.length+')</h3><ul>'+(issues.length?issues.map(x=>'<li>'+esc(x)+'</li>').join(''):'<li>Nessun punto aperto nella checklist interna; verifiche normative e firme restano obbligatorie.</li>')+'</ul></article>');
 }
 const uniqueAnnexes=annexes.filter((a,i)=>annexes.findIndex(b=>same(a.documentId,b.documentId)&&same(a.practiceId,b.practiceId))===i);
 const index=uniqueAnnexes.length?table(uniqueAnnexes.map(a=>[a.type||'Allegato',a.name+' · '+a.date+' · pratica '+a.practiceId])):'<p>Nessun originale indicizzato.</p>';
 const html='<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; base-uri \'none\'; form-action \'none\'">'+
  '<title>I.T.E. — schede tecniche preparatorie</title><style>'+
  '@page{size:A4;margin:16mm 13mm 17mm}*{box-sizing:border-box}body{font:12px/1.4 Arial,sans-serif;color:#233b31;margin:0 auto;max-width:920px;padding:20px}h1,h2{color:#08653a}h3{color:#17563b;margin:18px 0 7px}h1{font-size:23px}h2{font-size:18px}h3{font-size:13px}.notice{border:2px solid #a03c3c;color:#853232;padding:9px;font-weight:bold}.practice{page-break-before:always;break-before:page;padding-top:6px}.group{break-inside:avoid-page}table{border-collapse:collapse;width:100%;table-layout:fixed;margin:7px 0 12px}th,td{border:1px solid #c7d6cf;padding:6px;vertical-align:top;text-align:left;overflow-wrap:anywhere}th{width:34%;background:#eef5f0}.subhead{color:#537566;border-bottom:2px solid #08653a;padding-bottom:6px}.foot{margin-top:25px;border-top:1px solid #aaa;padding-top:8px;color:#666}.watermark{position:fixed;top:45%;left:20%;font-size:56px;transform:rotate(-30deg);opacity:.055;pointer-events:none;z-index:-1}.cover{padding-top:28px}li{margin:5px 0;overflow-wrap:anywhere}@media print{body{padding:0;max-width:none}.foot{position:relative}}'+
  '</style></head><body><div class="watermark">I.T.E. · BOZZA</div><section class="cover"><h1>I.T.E. — fascicolo di preparazione tecnica</h1>'+
  '<p class="notice">DOCUMENTAZIONE DI LAVORO — NON VALIDA / NON FIRMATA. Non riproduce i modelli ministeriali o del distributore. Non certifica prove, requisiti, conformità o invii.</p>'+
  table([['Cliente',display(client)],['Numero pratiche',rows.length],['Pratiche con verifiche aperte',issuesByPractice.filter(x=>x.issues.length).length],['Originali indicizzati',uniqueAnnexes.length],['Attività prioritarie del piano',plan.summary.priority],['Controlli operativi del piano',plan.summary.operational]])+
  '<h3>Indice delle pratiche</h3>'+table(rows.map((p,i)=>['Scheda '+(i+1),p.type+' — '+(p.fields?.reference||p.id)]))+
  '<h3>Piano di completamento (prime 20 attività; scaricare il piano per l’elenco completo)</h3>'+table(plan.actions.slice(0,20).map(a=>[a.priority+' · '+a.section,a.type+' · '+a.reference+' — '+a.task+' — '+a.reason]))+
  '<h3>Indice allegati originali (solo riferimenti)</h3>'+index+
  '<p>Esportazione locale HTML non cifrata. Custodire il file in luogo sicuro. Non sono inclusi file originali, immagini, firme o dati di altri clienti.</p></section>'+
  sections.join('')+'<div class="foot">I.T.E. 4.0 — bozza preparatoria, nessuna validità certificativa · Fine fascicolo</div></body></html>';
 if(html.length>900000)throw Error('Fascicolo troppo esteso: restringi le pratiche.');
 return {html,issuesByPractice,annexes:uniqueAnnexes};
}

/* Milestone 20: fascicolo locale con originali effettivi e impronte SHA-256.
   Mai inviare in rete: il file ZIP NON e' cifrato, la scelta e' esplicita. */
let zipLoader=null;
function ensureLocalZip(){
 if(root.JSZip)return Promise.resolve(root.JSZip);
 if(!root.document)throw Error('Motore ZIP non disponibile.');
 if(zipLoader)return zipLoader;
 zipLoader=new Promise((resolve,reject)=>{
  const script=root.document.createElement('script');
  script.src='./vendor/jszip.min.js';script.async=true;
  script.onload=()=>root.JSZip?resolve(root.JSZip):reject(Error('Libreria ZIP locale non inizializzata.'));
  script.onerror=()=>reject(Error('Libreria ZIP locale non caricata: nessun pacchetto creato.'));
  root.document.head.append(script);
 }).catch(e=>{zipLoader=null;throw e});
 return zipLoader;
}
function packageOriginalRefs(rows,clientId,docs,base){
 validate(rows,clientId,docs,base);
 const ids=new Map(),byId=new Map(arr(docs).map(d=>[String(d.id),d]));
 for(const p of rows)for(const id of arr(p.linkedDocIds)){
  const d=byId.get(String(id));
  if(!d||!same(d.clientId||d.subjectId,clientId))throw Error('Originale di un altro cliente: pacchetto bloccato.');
  if(!ids.has(String(id)))ids.set(String(id),{document:d,practices:[]});
  ids.get(String(id)).practices.push(String(p.id));
 }
 if(!ids.size)throw Error('Nessun originale collegato: importa e collega prima i documenti tecnici.');
 if(ids.size>30)throw Error('Massimo 30 originali per pacchetto: restringi le pratiche.');
 return [...ids.values()];
}
async function buildOriginalPackage(rows,clientId,docs,base,commerce,options={},deps={}){
 const refs=packageOriginalRefs(rows,clientId,docs,base),files=arr(commerce?.files);
 const ZIP=deps.JSZip||root.JSZip,subtle=deps.subtle||root.crypto?.subtle;
 if(typeof ZIP!=='function'||!subtle?.digest)throw Error('Motore ZIP o verifica SHA-256 non disponibile.');
 const verified=[],usedPaths=new Map(),manifestDocs=[];let totalBytes=0;
 const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
 for(const {document:d,practices} of refs){
  const f=files.find(x=>same(x.id,d.fileId));
  if(!f||typeof f.base64!=='string'||!Number.isSafeInteger(f.size)||f.size<1||
     typeof f.hash!=='string'||!/^[a-f0-9]{64}$/.test(f.hash)||f.id!=='file_'+f.hash)
   throw Error('Originale tecnico assente o metadati non validi: esportazione bloccata.');
  if(f.size>15000000||totalBytes+f.size>30000000)throw Error('Originali troppo grandi per iPad: limite complessivo 30 MB.');
  if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(f.base64))
   throw Error('Originale non leggibile: codifica non valida.');
  let bytes;
  try{bytes=Uint8Array.from((deps.atob||root.atob)(f.base64),c=>c.charCodeAt(0))}
  catch(_){throw Error('Originale non leggibile: esportazione bloccata.');}
  if(bytes.length!==f.size||hex(await subtle.digest('SHA-256',bytes))!==f.hash)
   throw Error('Integrità SHA-256 originale non valida: esportazione bloccata.');
  totalBytes+=f.size;
  const ext=(String(f.name||'').match(/\.([a-z0-9]{1,5})$/i)||[])[1]?.toLowerCase();
  const suffix=['pdf','xml','png','jpg','jpeg','webp','txt','csv'].includes(ext)?ext:'bin';
  if(suffix==='pdf'&&String.fromCharCode(...bytes.subarray(0,5))!=='%PDF-')
   throw Error('Originale indicato come PDF non valido: esportazione bloccata.');
  if(!usedPaths.has(f.hash)){
   const safePath='ORIGINALI/'+String(usedPaths.size+1).padStart(2,'0')+'_'+f.hash.slice(0,12)+'.'+suffix;
   usedPaths.set(f.hash,safePath);verified.push({path:safePath,bytes});
  }
  manifestDocs.push({documentId:String(d.id),type:clean(d.type),number:clean(d.number),originalName:clean(f.name),
   filePath:usedPaths.get(f.hash),size:f.size,sha256:f.hash,practiceIds:practices});
 }
 const structured=build(rows,clientId,docs,base,options);
 const register=csvReport(rows,clientId,docs,base,options);
 const plan=dossierPlanHtml(rows,clientId,docs,base,options);
 const tasks=dossierPlanCsv(rows,clientId,docs,base,options);
 const manifest={format:'ITE-4-TECHNICAL-EVIDENCE-1',status:'BOZZA_NON_FIRMATA',
  warning:'Archivio ZIP locale NON CIFRATO. Originali verificati SHA-256; nessuna conformita o firma attestata.',
  clientId:String(clientId),practices:rows.map(p=>({id:String(p.id),type:p.type,reference:clean(p.fields?.reference),
   revision:p.revision,status:p.status})),documents:manifestDocs,
  totalOriginalBytes:totalBytes,openChecks:register.counts.toVerify};
 const zip=new ZIP();
 zip.file('LEGGIMI_PRIMA.txt','I.T.E. 4.0 - PACCHETTO TECNICO PREPARATORIO\n'+
  'BOZZA NON VALIDA, NON FIRMATA. ZIP NON CIFRATO: custodire in luogo protetto.\n'+
  'Contiene copie byte-per-byte degli originali collegati, verificati SHA-256 prima della creazione.\n'+
  'Non sostituisce modelli ufficiali, prove, firme, allegati obbligatori o invio a enti.\n'+
  'Confrontare i documenti con il manifest.json e verificare ogni dato prima della consegna.\n');
 zip.file('manifest.json',JSON.stringify(manifest,null,2)+'\n');
 zip.file('FASCICOLO_BOZZA.html',structured.html);
 zip.file('REGISTRO_VERIFICHE.csv',register.csv);
 zip.file('PIANO_COMPLETAMENTO_BOZZA.html',plan.html);
 zip.file('ATTIVITA_DA_VERIFICARE.csv',tasks.csv);
 for(const f of verified)zip.file(f.path,f.bytes,{binary:true});
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}});
 if(blob.size>60000000)throw Error('ZIP oltre il limite di 60 MB: restringi la selezione.');
 return {blob,manifest,originals:manifestDocs.length,uniqueFiles:verified.length,checks:register.counts.toVerify};
}

function install(){
 const panel=root.document?.getElementById('technical-drafts-panel');
 if(!panel||panel.dataset.iteStructuredInstalled)return;
 panel.dataset.iteStructuredInstalled='true';
 const refresh=()=>{
  const anchor=panel.querySelector('#tech-dossier');
  if(anchor&&!panel.querySelector('#tech-dossier-structured')){
   const b=root.document.createElement('button');b.id='tech-dossier-structured';b.type='button';b.className='secondary';b.textContent='Fascicolo strutturato A4 (bozza)';anchor.insertAdjacentElement('afterend',b);
  }
  const structured=panel.querySelector('#tech-dossier-structured');
  if(structured&&!panel.querySelector('#tech-dossier-checklist')){
   const b=root.document.createElement('button');b.id='tech-dossier-checklist';b.type='button';b.className='secondary';b.textContent='Registro verifiche CSV (bozza)';structured.insertAdjacentElement('afterend',b);
  }
  const checklist=panel.querySelector('#tech-dossier-checklist');
  if(checklist&&!panel.querySelector('#tech-dossier-plan')){
   const b=root.document.createElement('button');b.id='tech-dossier-plan';b.type='button';b.className='secondary';b.textContent='Piano completamento A4 (bozza)';checklist.insertAdjacentElement('afterend',b);
   const c=root.document.createElement('button');c.id='tech-dossier-plan-csv';c.type='button';c.className='secondary';c.textContent='Attività da verificare CSV';b.insertAdjacentElement('afterend',c);
  }
  const planCsv=panel.querySelector('#tech-dossier-plan-csv');
  if(planCsv&&!panel.querySelector('#tech-dossier-originals')){
   const b=root.document.createElement('button');b.id='tech-dossier-originals';b.type='button';b.className='secondary';
   b.textContent='Pacchetto ZIP con originali verificati (non cifrato)';planCsv.insertAdjacentElement('afterend',b);
  }
  for(const original of panel.querySelectorAll('[data-tech-print]')){
   if(original.parentElement?.querySelector('[data-tech-structured="'+original.dataset.techPrint+'"]'))continue;
   const b=root.document.createElement('button');b.type='button';b.className='secondary';b.dataset.techStructured=original.dataset.techPrint;b.textContent='Scheda A4 (bozza)';original.insertAdjacentElement('afterend',b);
  }
 };
 refresh();new MutationObserver(refresh).observe(panel,{childList:true,subtree:true});
 panel.addEventListener('click',async event=>{
  const button=event.target.closest('[data-tech-structured],#tech-dossier-structured,#tech-dossier-checklist,#tech-dossier-plan,#tech-dossier-plan-csv,#tech-dossier-originals');if(!button||!panel.contains(button))return;
  const status=panel.querySelector('#tech-status');
  try{
   if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non sbloccato o salvataggio in corso.');
   const base=root.ITE.snapshot(),state=root.ITECommerce.snapshot(),rows=state.settings?.technicalDrafts||[];
   let selected,clientId;
   if(button.id==='tech-dossier-structured'||button.id==='tech-dossier-checklist'||button.id==='tech-dossier-plan'||button.id==='tech-dossier-plan-csv'||button.id==='tech-dossier-originals'){
    clientId=panel.querySelector('#tech-filter-client')?.value;
    if(!clientId)throw Error('Seleziona un cliente specifico per il fascicolo.');
    const ids=[...panel.querySelectorAll('#tech-list [data-tech-print]')].map(b=>b.dataset.techPrint);
    selected=ids.map(id=>rows.find(r=>same(r.id,id))).filter(Boolean);
   }else{
    selected=rows.filter(r=>same(r.id,button.dataset.techStructured));clientId=selected[0]?.clientId;
   }
   const api=root.ITETechnicalDrafts;
   const options={groups:api?.structuredGroups||{},review:api?.qualityReport,drawings:state.settings?.cadDrawings,links:state.settings?.cadPracticeLinks,articles:state.articles,movements:state.movements,evidenceLinks:state.settings?.technicalEvidenceLinks,fieldChecks:state.settings?.fieldChecks};
   if(button.id==='tech-dossier-originals'){
    if(!root.confirm('Il pacchetto ZIP includera copie reali dei documenti originali del cliente selezionato. NON e cifrato e NON e un documento ufficiale. Vuoi scaricarlo sul tuo dispositivo?'))return;
    button.disabled=true;
    try{
     const ZIP=await ensureLocalZip();
     const result=await buildOriginalPackage(selected,clientId,state.documents||[],base,state,options,{JSZip:ZIP});
     if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio bloccato o modificato: ripeti il download.');
     const url=URL.createObjectURL(result.blob),a=root.document.createElement('a');
     a.href=url;a.download='ITE_FASCICOLO_ORIGINALI_BOZZA_'+String(clientId).replace(/[^a-z0-9_-]/gi,'_')+'.zip';
     root.document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     if(status)status.textContent='Pacchetto ZIP locale NON cifrato scaricato: '+result.originals+' riferimenti originali, '+result.uniqueFiles+' file verificati SHA-256, '+result.checks+' controlli aperti. Nessuna conformita attestata.';
    }finally{button.disabled=false;}
    return;
   }
   const planMode=button.id==='tech-dossier-plan'||button.id==='tech-dossier-plan-csv',csv=button.id==='tech-dossier-checklist'||button.id==='tech-dossier-plan-csv';
   const result=planMode?(csv?dossierPlanCsv(selected,clientId,state.documents||[],base,options):dossierPlanHtml(selected,clientId,state.documents||[],base,options)):(csv?csvReport(selected,clientId,state.documents||[],base,options):build(selected,clientId,state.documents||[],base,options));
   const blob=new Blob([csv?result.csv:result.html],{type:csv?'text/csv;charset=utf-8':'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=root.document.createElement('a');
   a.href=url;a.download=(planMode?(csv?'ITE_PIANO_ATTIVITA_BOZZA_':'ITE_PIANO_COMPLETAMENTO_BOZZA_'):(csv?'ITE_REGISTRO_VERIFICHE_BOZZA_':'ITE_SCHEDE_TECNICHE_BOZZA_'))+String(clientId).replace(/[^a-z0-9_-]/gi,'_')+(csv?'.csv':'.html');root.document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   if(status)status.textContent=planMode?'Piano di completamento scaricato (file locale non cifrato): '+result.summary.total+' attività, di cui '+result.summary.priority+' prioritarie. Nessuna verifica attestata.':csv?'Registro CSV non cifrato scaricato: '+result.counts.toVerify+' controlli da verificare su '+result.counts.total+'. Non certificativo.':'Fascicolo strutturato A4 scaricato (HTML locale non cifrato). Verifiche aperte: '+result.issuesByPractice.reduce((n,x)=>n+x.issues.length,0)+'. Nessuna firma o conformità attestata.';
  }catch(e){if(status)status.textContent='Scheda A4 non generata: '+e.message;}
 });
}
if(root?.document){root.addEventListener('ite-vault-ready',install);if(root.ITEVault?.isUnlocked?.())install();}
root.ITEStructuredDocuments=Object.freeze({validate,assess,materialTrace,inspectionMatrix,csvReport,dossierPlan,dossierPlanCsv,dossierPlanHtml,build,packageOriginalRefs,buildOriginalPackage});
})(typeof window!=='undefined'?window:globalThis);
