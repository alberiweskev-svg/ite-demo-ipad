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
function build(rows,clientId,docs,base,options={}){
 validate(rows,clientId,docs,base);
 const client=find(base.clienti,clientId),docMap=new Map(arr(docs).map(d=>[String(d.id),d]));
 const annexes=[],sections=[],issuesByPractice=[];
 const drawings=arr(options.drawings),links=arr(options.links);
 for(const [i,p] of rows.entries()){
  const issues=assess(p,docs,options);issuesByPractice.push({id:p.id,issues});
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
  table([['Cliente',display(client)],['Numero pratiche',rows.length],['Pratiche con verifiche aperte',issuesByPractice.filter(x=>x.issues.length).length],['Originali indicizzati',uniqueAnnexes.length]])+
  '<h3>Indice delle pratiche</h3>'+table(rows.map((p,i)=>['Scheda '+(i+1),p.type+' — '+(p.fields?.reference||p.id)]))+
  '<h3>Indice allegati originali (solo riferimenti)</h3>'+index+
  '<p>Esportazione locale HTML non cifrata. Custodire il file in luogo sicuro. Non sono inclusi file originali, immagini, firme o dati di altri clienti.</p></section>'+
  sections.join('')+'<div class="foot">I.T.E. 4.0 — bozza preparatoria, nessuna validità certificativa · Fine fascicolo</div></body></html>';
 if(html.length>900000)throw Error('Fascicolo troppo esteso: restringi le pratiche.');
 return {html,issuesByPractice,annexes:uniqueAnnexes};
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
  for(const original of panel.querySelectorAll('[data-tech-print]')){
   if(original.parentElement?.querySelector('[data-tech-structured="'+original.dataset.techPrint+'"]'))continue;
   const b=root.document.createElement('button');b.type='button';b.className='secondary';b.dataset.techStructured=original.dataset.techPrint;b.textContent='Scheda A4 (bozza)';original.insertAdjacentElement('afterend',b);
  }
 };
 refresh();new MutationObserver(refresh).observe(panel,{childList:true,subtree:true});
 panel.addEventListener('click',event=>{
  const button=event.target.closest('[data-tech-structured],#tech-dossier-structured');if(!button||!panel.contains(button))return;
  const status=panel.querySelector('#tech-status');
  try{
   if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non sbloccato o salvataggio in corso.');
   const base=root.ITE.snapshot(),state=root.ITECommerce.snapshot(),rows=state.settings?.technicalDrafts||[];
   let selected,clientId;
   if(button.id==='tech-dossier-structured'){
    clientId=panel.querySelector('#tech-filter-client')?.value;
    if(!clientId)throw Error('Seleziona un cliente specifico per il fascicolo.');
    const ids=[...panel.querySelectorAll('#tech-list [data-tech-print]')].map(b=>b.dataset.techPrint);
    selected=ids.map(id=>rows.find(r=>same(r.id,id))).filter(Boolean);
   }else{
    selected=rows.filter(r=>same(r.id,button.dataset.techStructured));clientId=selected[0]?.clientId;
   }
   const api=root.ITETechnicalDrafts;
   const result=build(selected,clientId,state.documents||[],base,{groups:api?.structuredGroups||{},review:api?.qualityReport,drawings:state.settings?.cadDrawings,links:state.settings?.cadPracticeLinks});
   const blob=new Blob([result.html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=root.document.createElement('a');
   a.href=url;a.download='ITE_SCHEDE_TECNICHE_BOZZA_'+String(clientId).replace(/[^a-z0-9_-]/gi,'_')+'.html';root.document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   if(status)status.textContent='Fascicolo strutturato A4 scaricato (HTML locale non cifrato). Verifiche aperte: '+result.issuesByPractice.reduce((n,x)=>n+x.issues.length,0)+'. Nessuna firma o conformità attestata.';
  }catch(e){if(status)status.textContent='Scheda A4 non generata: '+e.message;}
 });
}
if(root?.document){root.addEventListener('ite-vault-ready',install);if(root.ITEVault?.isUnlocked?.())install();}
root.ITEStructuredDocuments=Object.freeze({validate,assess,build});
})(typeof window!=='undefined'?window:globalThis);
