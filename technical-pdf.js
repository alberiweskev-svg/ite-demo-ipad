/* I.T.E. 4.0 - PDF tecnici locali, bozze non ufficiali. Nessuna rete. */
(function(root){
'use strict';
const TYPES=new Set(['Di.Co. elettrica','Di.Co. idrica / termica','Di.Ri.','Allegato gas H40','Allegato gas I40','Allegato gas A12','Allegato gas B12','POS']);
const same=(a,b)=>String(a??'')===String(b??'');
const safe=v=>String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ').replace(/\r\n?/g,'\n');
const label=s=>safe(s).replace(/([a-zà-ÿ])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ').replace(/^./,c=>c.toUpperCase());
const find=(list,id)=>(Array.isArray(list)?list:[]).find(x=>same(x.id,id));
const value=v=>safe(v).trim()||'Da compilare / verificare';

const arr=v=>Array.isArray(v)?v:[];
const belongs=(d,r,clientId)=>!!d&&same(d.clientId||d.subjectId,clientId)&&
 (!d.propertyId||!r.propertyId||same(d.propertyId,r.propertyId))&&
 (!d.siteId||!r.siteId||same(d.siteId,r.siteId));
function context(r,clientId,base){
 const property=r.propertyId?find(base.immobili,r.propertyId):null;
 const site=r.siteId?find(base.cantieri,r.siteId):null;
 const plant=r.plantId?find(base.impianti,r.plantId):null;
 const device=r.deviceId?find(base.apparecchiature,r.deviceId):null;
 const job=r.interventionId?find(base.interventi,r.interventionId):null;
 const jobDevice=job?.apparecchiatura_id?find(base.apparecchiature,job.apparecchiatura_id):null;
 const jobPlant=jobDevice?find(base.impianti,jobDevice.impianto_id):null;
 const jobProperty=jobPlant?find(base.immobili,jobPlant.immobile_id):null;
 if(r.propertyId&&(!property||!same(property.client_id,clientId))||
    r.siteId&&(!site||!same(site.client_id,clientId))||
    r.plantId&&(!plant||!property||!same(plant.immobile_id,property.id))||
    r.deviceId&&(!device||!plant||!same(device.impianto_id,plant.id))||
    property&&site?.immobile_id&&!same(site.immobile_id,property.id)||
    r.interventionId&&(!job||job.client_id&&!same(job.client_id,clientId)||
      job.apparecchiatura_id&&(!jobDevice||!jobPlant||!jobProperty||!same(jobProperty.client_id,clientId)||
       property&&!same(jobProperty.id,property.id)||r.deviceId&&!same(job.apparecchiatura_id,r.deviceId))||
      !job.apparecchiatura_id&&!job.client_id))
  throw Error('Collegamenti cliente, sede, impianto o intervento incoerenti: PDF bloccato.');
 const desc=o=>o?.name||[o?.brand,o?.model,o?.serial].filter(Boolean).join(' ')||'Non collegato';
 return [
  ['Sede',property?[desc(property),property.city,property.province].filter(Boolean).join(' - '):'Non collegata'],
  ['Cantiere',desc(site)],['Impianto',desc(plant)],['Apparecchiatura',desc(device)],
  ['Intervento',job?[job.date,job.kind,job.description].filter(Boolean).join(' - '):'Non collegato']
 ];
}
function detailsForPdf(r,options){
 const out=[],seen=new Set(),groups=arr(options.groups?.[r.type]);
 for(const group of groups){
  out.push({text:'  '+safe(group.title||'Sezione tecnica').toUpperCase()});
  for(const field of arr(group.fields)){
   const [key,title,,required]=field;
   if(!key||seen.has(key))continue;
   seen.add(key);
   const current=r.structured?.[key];
   out.push({text:'  '+safe(title||label(key))+': '+value(current)+(required&&!String(current??'').trim()?' [OBBLIGATORIO DA VERIFICARE]':'')});
  }
 }
 const extra=Object.entries(r.structured||{}).filter(([k])=>!seen.has(k));
 if(!groups.length&&!extra.length)out.push({text:'Nessun campo strutturato compilato'});
 for(const [k,v] of extra)out.push({text:label(k)+': '+value(v)});
 return out;
}
function cadForPdf(r,clientId,options){
 const out=[],links=arr(options.links).filter(x=>same(x.practiceId,r.id));
 if(!links.length)return [{text:'Nessuna tavola CAD collegata'}];
 for(const link of links){
  const drawing=find(options.drawings,link.drawingId);
  if(!drawing||drawing.archived||!same(drawing.clientId,clientId)||
     !same(drawing.revision,link.drawingRevision)){
   out.push({text:'Tavola CAD non utilizzabile: mancante, archiviata o revisione superata'});
   continue;
  }
  out.push({text:'Schema '+value(drawing.title||drawing.id)+' - revisione '+value(drawing.revision)+' (da verificare)'});
 }
 if(typeof root.ITEStructuredDocuments?.materialTrace==='function'){
  const trace=root.ITEStructuredDocuments.materialTrace(r,clientId,options);
  for(const item of trace.rows)out.push({text:'  '+value(item.code||item.symbol)+' | '+value(item.description||item.symbol)+
   ' | '+value(item.quantity)+' '+value(item.unit||'pz')+' | '+value(item.status)});
  for(const warning of trace.warnings)out.push({text:'  VERIFICARE: '+safe(warning)});
 }
 return out;
}

function validate(rows,clientId,base){
 if(!clientId)throw Error('Seleziona esplicitamente un cliente per il PDF.');
 if(!find(base?.clienti,clientId))throw Error('Cliente non presente in anagrafica.');
 if(!Array.isArray(rows)||!rows.length)throw Error('Nessuna pratica selezionata.');
 if(rows.length>100)throw Error('Massimo 100 pratiche per PDF: restringi i filtri.');
 const ids=new Set();
 for(const r of rows){if(!r||!TYPES.has(r.type)||!r.id||ids.has(String(r.id))||!same(r.clientId,clientId))throw Error('Pratiche incompatibili, duplicate o di un altro cliente.');ids.add(String(r.id));}
 return rows;
}

function audit(rows,clientId,docs,base,options={}){
 validate(rows,clientId,base);
 return rows.map(r=>{
  context(r,clientId,base);
  const missing=[],seen=new Set();
  for(const group of arr(options.groups?.[r.type])){
   for(const field of arr(group.fields)){
    const [key,title,,required]=field;
    if(!key||!required||seen.has(key))continue;
    seen.add(key);
    if(!String(r.structured?.[key]??'').trim())missing.push(safe(group.title||'Sezione')+' - '+safe(title||label(key)));
   }
  }
  const linked=arr(r.linkedDocIds),verified=linked.filter(id=>belongs(find(docs,id),r,clientId));
  return {id:r.id,type:r.type,reference:safe(r.fields?.reference||r.id),status:safe(r.status||'Bozza'),
   missing,originals:verified.length,excluded:linked.length-verified.length};
 });
}

function compose(rows,clientId,docs,base,options={}){
 validate(rows,clientId,base);
 const client=find(base.clienti,clientId);
 const overview=audit(rows,clientId,docs,base,options);
 const out=[{text:'I.T.E. 4.0 - FASCICOLO TECNICO DI LAVORO'}, {text:'BOZZA - NON VALIDA - NON FIRMATA - NON SOSTITUISCE I MODELLI UFFICIALI'}, {text:'Cliente: '+value(client.name)+' | Pratiche: '+rows.length}, {text:'Esportazione locale. Il PDF non e cifrato: conservarlo in luogo sicuro.'}, {text:'Gli originali sono solo citati: nessun file o firma e incorporato.'}, {text:''}];
 out.push({text:'INDICE OPERATIVO E STATO DI COMPILAZIONE',kind:'section'});
 for(const [i,item] of overview.entries()){
  out.push({text:(i+1)+'. '+safe(item.type)+' | '+safe(item.reference)+' | '+safe(item.status),kind:'subsection'});
  out.push({text:'   Campi obbligatori da completare: '+item.missing.length+
   ' | Originali collegati verificabili: '+item.originals+
   ' | Riferimenti esclusi: '+item.excluded});
 }
 out.push({text:'Indice e verifiche sono indicativi; nessun documento e certificato o firmato.',kind:'warning'});
 out.push({pageBreak:true});
 for(const [i,r] of rows.entries()){
  if(i)out.push({pageBreak:true});
  out.push({text:'PRATICA '+(i+1)+' / '+rows.length+' - '+r.type});
  out.push({text:'Riferimento: '+value(r.fields?.reference)+' | Stato: '+value(r.status)+' | Revisione: '+value(r.revision)});
  out.push({text:'Data: '+value(r.date)+' | Sede ID: '+value(r.propertyId)+' | Impianto ID: '+value(r.plantId)});
  for(const [name,detail] of context(r,clientId,base))out.push({text:name+': '+value(detail)});
  out.push({text:'DATI GENERALI'});
  for(const [k,v] of Object.entries(r.fields||{}))out.push({text:label(k)+': '+value(v)});
  out.push({text:'COMPILAZIONE TECNICA PER SEZIONI - DATI DA VERIFICARE'});
  out.push(...detailsForPdf(r,options));
  out.push({text:'CHECKLIST ED EVIDENZE - NON SONO CERTIFICAZIONI'});
  const checks=Object.entries(r.checklistEvidence||{});
  if(!checks.length)out.push({text:'Checklist da verificare'});
  for(const [k,v] of checks){out.push({text:k+': '+value(v?.status||'Da verificare')});if(v?.evidence)out.push({text:'  Evidenza dichiarata: '+safe(v.evidence)});if(v?.documentId)out.push({text:'  Originale di riferimento ID: '+safe(v.documentId)});}
  out.push({text:'ORIGINALI COLLEGATI - SOLO RIFERIMENTI'});
  const originals=Array.isArray(r.linkedDocIds)?r.linkedDocIds:[];
  if(!originals.length)out.push({text:'Nessun originale collegato'});
  for(const id of originals){
   const d=find(docs,id);
   if(!belongs(d,r,clientId)){out.push({text:'Originale non verificabile: riferimento escluso'});continue;}
   out.push({text:[d.type,d.number,d.date,d.sourceName].filter(Boolean).map(safe).join(' | ')||'Originale '+safe(id)});
  }
  const provenance=Object.entries(r.originalPrefill||{});
  if(provenance.length){
   out.push({text:'PROVENIENZA DEI CAMPI PRECOMPILATI - CONFRONTO CON ORIGINALI'});
   for(const [k,v] of provenance){
    const d=find(docs,v?.documentId),linked=originals.some(id=>same(id,v?.documentId));
    const current=k.startsWith('detail:')?r.structured?.[k.slice(7)]:
     k.startsWith('field:')?r.fields?.[k.slice(6)]:r.structured?.[k];
    const valid=linked&&belongs(d,r,clientId)&&same(current,v?.value);
    out.push({text:valid?label(k)+' = '+safe(current)+' (originale '+safe(d.number||d.sourceName||d.id)+')':
     label(k)+': fonte non verificabile, valore escluso'});
   }
  }
  out.push({text:'TAVOLE CAD E DISTINTA PRELIMINARE - POSA NON INCLUSA'});
  out.push(...cadForPdf(r,clientId,options));
  const review=typeof options.review==='function'?options.review(r):null;
  if(review?.issues?.length){
   out.push({text:'CONTROLLI INTERNI APERTI - NON CERTIFICATIVI'});
   for(const issue of review.issues.slice(0,100))out.push({text:'  Da verificare: '+safe(issue.label||String(issue))});
  }
  out.push({text:'VERIFICHE APERTE: le voci non documentate richiedono controllo umano.'});
  const item=overview[i];
  out.push({text:'QUADRO CAMPI OBBLIGATORI E VERIFICA MANUALE',kind:'section'});
  if(item.missing.length)for(const field of item.missing)out.push({text:'[ DA COMPILARE ] '+field,kind:'warning'});
  else out.push({text:'Campi obbligatori presenti; contenuto, prove e allegati ancora da verificare.'});
  if(item.excluded)out.push({text:'ATTENZIONE: '+item.excluded+' riferimento/i a originali esclusi per mancanza o incoerenza.',kind:'warning'});
  out.push({text:'SPAZIO DI CONTROLLO INTERNO - NON E UNA FIRMA DI CONFORMITA',kind:'section'});
  out.push({text:'Verificato da: __________________________________    Data: ____ / ____ / ______',kind:'signature'});
  out.push({text:'Note di verifica: __________________________________________________________',kind:'signature'});
  out.push({text:'Firme, prove e attestazioni ufficiali devono essere predisposte sui modelli applicabili.',kind:'warning'});
  out.push({text:'Questo fascicolo non attesta prove, conformita, firme o invii.'});
 }
 if(out.reduce((n,x)=>n+(x.text?.length||0),0)>850000)throw Error('Contenuto troppo esteso per un PDF locale: restringi i filtri.');
 return out;
}
const cp1252={0x20ac:128,0x201a:130,0x0192:131,0x201e:132,0x2026:133,0x2020:134,0x2021:135,0x02c6:136,0x2030:137,0x0160:138,0x2039:139,0x0152:140,0x017d:142,0x2018:145,0x2019:146,0x201c:147,0x201d:148,0x2022:149,0x2013:150,0x2014:151,0x02dc:152,0x2122:153,0x0161:154,0x203a:155,0x0153:156,0x017e:158,0x0178:159};
function winAnsi(s){let result='';for(const ch of safe(s)){const code=ch.codePointAt(0);result+=String.fromCharCode(code<256?code:(cp1252[code]??63));}return result;}
const bytes=s=>Uint8Array.from(s,c=>c.charCodeAt(0)&255);
const escapePdf=s=>winAnsi(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\n\t]/g,' ');
function wrapText(value,width=86){
 const lines=[];
 for(const original of safe(value).split('\n')){let rest=original.trim();if(!rest){lines.push('');continue;}while(rest.length>width){let at=rest.lastIndexOf(' ',width);if(at<width/3)at=width;lines.push(rest.slice(0,at).trim());rest=rest.slice(at).trimStart();}lines.push(rest);}
 return lines;
}

function kindOf(entry){
 if(entry.kind)return entry.kind;
 const text=safe(entry.text);
 if(/^I\.T\.E\. 4\.0 - FASCICOLO|^PRATICA \d+ \/ /.test(text))return 'title';
 if(/^(BOZZA -|ATTENZIONE:|VERIFICHE APERTE:)/.test(text))return 'warning';
 if(/^(DATI GENERALI|COMPILAZIONE TECNICA|CHECKLIST ED EVIDENZE|ORIGINALI COLLEGATI|PROVENIENZA DEI CAMPI|TAVOLE CAD E DISTINTA|CONTROLLI INTERNI APERTI)/.test(text))return 'section';
 return 'body';
}
function paginate(entries){
 const pages=[[]];let current=pages[0],used=0;
 for(const entry of entries){
  if(entry.pageBreak){if(current.length){current=[];pages.push(current);used=0;}continue;}
  const kind=kindOf(entry),width=kind==='title'?64:kind==='section'?77:kind==='warning'?85:92;
  for(const [i,line] of wrapText(entry.text,width).entries()){
   const lineKind=i&&kind==='section'?'body':kind;
   const height=lineKind==='title'?25:lineKind==='section'?21:lineKind==='subsection'?17:
    lineKind==='warning'?17:lineKind==='signature'?19:13;
   if(used+height>690&&current.length){current=[];pages.push(current);used=0;}
   current.push({text:line,kind:lineKind,height});used+=height;
  }
 }
 if(pages.length>180)throw Error('PDF troppo lungo: restringi i filtri.');
 return pages;
}
function pdfBytes(entries){
 const pages=paginate(entries),objects=[null,null,null,null];
 objects[0]='<< /Type /Catalog /Pages 2 0 R >>';
 objects[2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
 objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
 const kids=[];
 for(const [i,lines] of pages.entries()){
  const pageNum=objects.length+1,contentNum=pageNum+1;kids.push(pageNum+' 0 R');
  const commands=[
   '0.15 g',
   'BT /F2 11 Tf 42 808 Td ('+escapePdf('I.T.E. di Merkaj Alban | GESTIONALE 4.0')+') Tj ET',
   '0.55 G 0.7 w 42 795 m 553 795 l S',
   '0.28 g',
   'BT /F1 8 Tf 42 782 Td ('+escapePdf('SCHEDA PREPARATORIA - BOZZA NON VALIDA - NON FIRMATA')+') Tj ET'
  ];
  let y=758;
  for(const line of lines){
   const k=line.kind,hasText=!!line.text;
   if(k==='section'){
    commands.push('0.93 g 40 '+(y-5)+' 515 18 re f','0.1 g');
   }else if(k==='warning')commands.push('0.37 g');
   else commands.push('0.13 g');
   const font=k==='title'?'/F2 14':k==='section'?'/F2 10.5':
    k==='subsection'?'/F2 10':k==='warning'?'/F2 9':'/F1 9.2';
   if(hasText)commands.push('BT '+font+' Tf 44 '+y+' Td ('+escapePdf(line.text)+') Tj ET');
   y-=line.height;
  }
  commands.push('0.55 G 0.7 w 42 49 m 553 49 l S');
  commands.push('0.35 g BT /F1 7.5 Tf 42 35 Td ('+
   escapePdf('Documento locale non cifrato - conservare in luogo protetto')+') Tj ET');
  commands.push('0.35 g BT /F2 8 Tf 478 35 Td ('+escapePdf('Pagina '+(i+1)+' / '+pages.length)+') Tj ET');
  const stream=commands.join('\n')+'\n';
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+contentNum+' 0 R >>');
  objects.push('<< /Length '+bytes(stream).length+' >>\nstream\n'+stream+'endstream');
 }
 objects[1]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>';
 const chunks=['%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'],offsets=[0];let position=bytes(chunks[0]).length;
 for(let i=0;i<objects.length;i++){offsets.push(position);const chunk=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';chunks.push(chunk);position+=bytes(chunk).length;}
 const startxref=position;let xref='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
 for(const off of offsets.slice(1))xref+=String(off).padStart(10,'0')+' 00000 n \n';
 chunks.push(xref+'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+startxref+'\n%%EOF\n');
 const total=chunks.reduce((n,c)=>n+bytes(c).length,0),result=new Uint8Array(total);let at=0;
 for(const chunk of chunks){const part=bytes(chunk);result.set(part,at);at+=part.length;}
 return result;
}
function build(rows,clientId,docs,base,options={}){return pdfBytes(compose(rows,clientId,docs,base,options));}
function download(data,name){const url=URL.createObjectURL(new Blob([data],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function install(){
 const panel=document.getElementById('technical-drafts-panel');if(!panel||panel.dataset.itePdfInstalled)return;
 panel.dataset.itePdfInstalled='true';
 const refresh=()=>{
  const dossier=panel.querySelector('#tech-dossier');
  if(dossier&&!panel.querySelector('#tech-dossier-pdf')){const b=document.createElement('button');b.id='tech-dossier-pdf';b.type='button';b.className='secondary';b.textContent='Fascicolo A4 impaginato (PDF bozza)';dossier.insertAdjacentElement('afterend',b);}
  for(const button of panel.querySelectorAll('[data-tech-print]')){if(button.nextElementSibling?.matches('[data-tech-pdf]'))continue;const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.techPdf=button.dataset.techPrint;b.textContent='Scheda A4 (PDF bozza)';button.insertAdjacentElement('afterend',b);}
 };
 refresh();new MutationObserver(refresh).observe(panel,{childList:true,subtree:true});
 panel.addEventListener('click',event=>{
  const button=event.target.closest('[data-tech-pdf],#tech-dossier-pdf');if(!button||!panel.contains(button))return;
  try{
   if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non pronto: attendi il completamento del salvataggio.');
   const core=root.ITE.snapshot(),state=root.ITECommerce.snapshot(),rows=state.settings?.technicalDrafts||[];
   let selected,clientId,filename;
   if(button.id==='tech-dossier-pdf'){
    clientId=panel.querySelector('#tech-filter-client')?.value;
    if(!clientId)throw Error('Seleziona un cliente specifico prima di esportare.');
    const ids=[...panel.querySelectorAll('#tech-list [data-tech-print]')].map(b=>b.dataset.techPrint);
    selected=ids.map(id=>find(rows,id)).filter(Boolean);
    filename='ITE_FASCICOLO_BOZZA_'+String(clientId).replace(/[^a-z0-9_-]/gi,'_')+'.pdf';
   }else{
    selected=[find(rows,button.dataset.techPdf)].filter(Boolean);clientId=selected[0]?.clientId;
    filename='ITE_PRATICA_BOZZA_'+String(button.dataset.techPdf).replace(/[^a-z0-9_-]/gi,'_')+'.pdf';
   }
   const draftApi=root.ITETechnicalDrafts;
   const options={groups:draftApi?.structuredGroups||{},review:draftApi?.qualityReport,
    drawings:state.settings?.cadDrawings,links:state.settings?.cadPracticeLinks,
    articles:state.articles,movements:state.movements};
   download(build(selected,clientId,state.documents||[],core,options),filename);
   const status=panel.querySelector('#tech-status');if(status)status.textContent='PDF bozza locale scaricato. Non firmato, non ufficiale e non cifrato: conservarlo in modo sicuro.';
  }catch(error){const status=panel.querySelector('#tech-status');if(status)status.textContent='PDF non generato: '+error.message;}
 });
}
if(root&&root.document){root.addEventListener('ite-vault-ready',install);if(root.ITEVault?.isUnlocked?.())install();}
root.ITETechnicalPDF=Object.freeze({build,compose,paginate,validate,audit});
})(typeof window!=='undefined'?window:globalThis);
