/* I.T.E. 4.0 - Schede PDF AcroForm modificabili: SOLO bozze, non modelli ufficiali. */
(function(root){
'use strict';
const types=new Set(['Di.Co. elettrica','Di.Co. idrica / termica','Di.Ri.','Allegato gas H40','Allegato gas I40','Allegato gas A12','Allegato gas B12','POS']);
const same=(a,b)=>String(a??'')===String(b??'');
const find=(rows,id)=>(Array.isArray(rows)?rows:[]).find(r=>same(r.id,id));
const text=v=>String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ').slice(0,2000);
const winMap={8364:128,8216:145,8217:146,8220:147,8221:148,8211:150,8212:151,8230:133};
const ansi=s=>Array.from(String(s),c=>{const n=c.codePointAt(0);return String.fromCharCode(n<256?n:(winMap[n]??63))}).join('');
const escape=s=>ansi(text(s)).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\r/g,'').replace(/\n/g,'\\n');
const bytes=s=>Uint8Array.from(s,c=>c.charCodeAt(0)&255);
const arr=v=>Array.isArray(v)?v:[];
function fieldsFor(row,groups){
 if(!row||!types.has(row.type))throw Error('Tipo pratica non previsto.');
 const fields=[],names=new Set();
 const add=(name,label,value,kind='text',section='',readonly=false)=>{
  if(!/^[a-zA-Z0-9_.:-]{1,110}$/.test(name)||names.has(name))return;
  names.add(name);fields.push({name,label:text(label).slice(0,100),value:text(value),multiline:kind==='textarea',section:text(section).slice(0,100),readonly});
 };
 // Identificativi non modificabili: verificati prima di proporre qualsiasi importazione.
 for(const [key,value] of [['practiceId',row.id],['revision',row.revision],['clientId',row.clientId],
  ['type',row.type],['propertyId',row.propertyId],['siteId',row.siteId],['plantId',row.plantId],
  ['deviceId',row.deviceId],['interventionId',row.interventionId]])
  add('system.'+key,'Identificativo '+key,value,'text','Controllo origine PDF',true);
 add('general.reference','Numero / riferimento pratica',row.fields?.reference);
 add('general.date','Data pratica',row.date);
 add('general.scope','Descrizione lavori',row.fields?.scope,'textarea');
 add('general.materials','Materiali (riferimenti)',row.fields?.materials,'textarea');
 add('general.checks','Verifiche (solo riferimenti, non esiti)',row.fields?.checks,'textarea');
 add('general.notes','Note',row.fields?.notes,'textarea');
 for(const group of arr(groups?.[row.type]))for(const f of arr(group.fields)){
  if(!f[0])continue;
  add('detail.'+f[0],f[1]||f[0],row.structured?.[f[0]],f[2],group.title);
 }
 if(fields.length>160)throw Error('Troppi campi per una scheda PDF.');
 if(fields.reduce((n,f)=>n+f.value.length,0)>80000)throw Error('Contenuto eccessivo: riduci le descrizioni.');
 return fields;
}
function validate(row,clientId,base,docs,options={}){
 if(!row||!same(row.clientId,clientId))throw Error('Pratica di altro cliente: esportazione bloccata.');
 if(!find(base?.clienti,clientId))throw Error('Cliente non presente in anagrafica.');
 if(!root.ITETechnicalPDF?.compose)throw Error('Motore documentale non disponibile.');
 // La verifica esistente controlla anche sede, impianto, apparecchiatura e intervento.
 root.ITETechnicalPDF.compose([row],clientId,docs,base,options);
 return fieldsFor(row,options.groups||{});
}
function build(row,clientId,docs,base,options={}){
 const fields=validate(row,clientId,base,docs,options);
 const client=find(base.clienti,clientId);
 const audit=root.ITETechnicalPDF.audit([row],clientId,docs,base,options)[0];
 const pages=[];let page={entries:[],labels:[]},y=714,lastSection='';
 const push=()=>{if(page.entries.length){pages.push(page);page={entries:[],labels:[]};y=714;lastSection='';}};
 for(const f of fields){
  const h=f.multiline?55:27;
  if(y-h-33<104)push();
  if(f.section&&f.section!==lastSection){page.labels.push({text:f.section,y:y+18,bold:true});lastSection=f.section;}
  page.labels.push({text:f.label,y:y+5,bold:false});
  page.entries.push({field:f,x:44,y:y-h,w:505,h});
  y-=h+34;
 }
 push();
 if(pages.length>30)throw Error('Troppi fogli: riduci i campi.');
 const objects=[null,null,null,null,null],add=v=>(objects.push(v),objects.length);
 objects[0]='<< /Type /Catalog /Pages 2 0 R /AcroForm 5 0 R >>';
 objects[2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
 objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
 const kids=[],widgets=[];
 for(const [index,p] of pages.entries()){
  const pageId=add(null),contentId=add(null);kids.push(pageId+' 0 R');
  const annots=[],cmd=[
   '0.15 g BT /F2 12 Tf 44 810 Td (I.T.E. - SCHEDA TECNICA MODIFICABILE) Tj ET',
   '0.55 G 0.8 w 44 799 m 549 799 l S',
   '0.28 g BT /F2 10 Tf 44 780 Td ('+escape(row.type)+') Tj ET',
   'BT /F1 8 Tf 44 764 Td ('+escape('Cliente: '+text(client.name||client.id)) +') Tj ET',
   'BT /F1 8 Tf 44 749 Td ('+escape('Rif. '+text(row.fields?.reference||row.id)+' | Revisione '+text(row.revision||'—'))+') Tj ET',
   '0.45 g BT /F2 8 Tf 44 735 Td (BOZZA NON UFFICIALE - NON FIRMATA - NON VALIDA COME DICHIARAZIONE) Tj ET'
  ];
  for(const l of p.labels){
   const font=l.bold?'/F2 9':'/F1 8';
   cmd.push('0.18 g BT '+font+' Tf 44 '+l.y+' Td ('+escape(l.text)+') Tj ET');
  }
  for(const e of p.entries){
   const aId=add(null),widgetId=add(null);annots.push(widgetId+' 0 R');widgets.push(widgetId+' 0 R');
   const w=e.w,h=e.h;
   const shown=e.field.value.replace(/[\r\n]+/g,' ').slice(0,100);
   const appearance='q 1 g 0 0 '+w+' '+h+' re f 0.6 G 0.6 w 0.5 0.5 '+(w-1)+' '+(h-1)+' re S 0.1 g BT /Helv 9 Tf 6 '+(h-14)+' Td ('+escape(shown)+') Tj ET Q\n';
   objects[aId-1]='<< /Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 '+w+' '+h+'] /Resources << /Font << /Helv 3 0 R >> >> /Length '+bytes(appearance).length+' >>\nstream\n'+appearance+'endstream';
   objects[widgetId-1]='<< /Type /Annot /Subtype /Widget /FT /Tx /T ('+escape(e.field.name)+') /V ('+escape(e.field.value)+') /DA (/Helv 9 Tf 0 g) /F 4 /Ff '+((e.field.multiline?4096:0)|(e.field.readonly?1:0))+' /Rect ['+e.x+' '+e.y+' '+(e.x+w)+' '+(e.y+h)+'] /P '+pageId+' 0 R /AP << /N '+aId+' 0 R >> >>';
  }
  cmd.push('0.5 G 0.7 w 44 64 m 549 64 l S',
   '0.3 g BT /F1 7 Tf 44 51 Td ('+escape('Campi modificabili: '+fields.length+' | Mancanti (controllo interno): '+audit.missing.length+' | Originali verificabili: '+audit.originals)+') Tj ET',
   'BT /F1 7 Tf 44 38 Td (PDF non cifrato: non trasmettere come dichiarazione ufficiale.) Tj ET',
   'BT /F2 8 Tf 470 38 Td ('+escape('Pag. '+(index+1)+' / '+pages.length)+') Tj ET');
  const stream=cmd.join('\n')+'\n';
  objects[contentId-1]='<< /Length '+bytes(stream).length+' >>\nstream\n'+stream+'endstream';
  objects[pageId-1]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+contentId+' 0 R /Annots ['+annots.join(' ')+'] >>';
 }
 objects[1]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>';
 objects[4]='<< /Fields ['+widgets.join(' ')+'] /DR << /Font << /Helv 3 0 R >> >> /DA (/Helv 9 Tf 0 g) /NeedAppearances false >>';
 const chunks=['%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'],offsets=[0];let position=bytes(chunks[0]).length;
 for(let i=0;i<objects.length;i++){offsets.push(position);const part=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';chunks.push(part);position+=bytes(part).length;}
 const xrefAt=position;let xref='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
 for(const off of offsets.slice(1))xref+=String(off).padStart(10,'0')+' 00000 n \n';
 chunks.push(xref+'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xrefAt+'\n%%EOF\n');
 const output=new Uint8Array(chunks.reduce((n,s)=>n+bytes(s).length,0));let at=0;
 for(const part of chunks){const b=bytes(part);output.set(b,at);at+=b.length;}
 return output;
}
function download(data,name){
 const url=URL.createObjectURL(new Blob([data],{type:'application/pdf'})),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

/* Rientro controllato dei PDF AcroForm compilati: nessun originale e nessuna firma automatica. */
const metadataKeys=['practiceId','revision','clientId','type','propertyId','siteId','plantId','deviceId','interventionId'];
function previewImport(row,values,groups){
 if(!row||row.status==='Annullata')throw Error('Pratica annullata o non disponibile.');
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Campi PDF mancanti.');
 const expected=fieldsFor(row,groups),allowed=new Map(expected.map(f=>[f.name,f]));
 const incoming=Object.entries(values);
 if(incoming.length>180)throw Error('Troppi campi nel PDF.');
 for(const [name,value] of incoming){
  if(!allowed.has(name)||typeof value!=='string'||value.length>4000||/[\u0000-\u0008\u000e-\u001f\u007f]/.test(value))
   throw Error('Campo PDF non riconosciuto o non valido: '+name);
 }
 for(const key of metadataKeys){
  const name='system.'+key,expectedValue=text(row[key]);
  if(!Object.hasOwn(values,name)||values[name]!==expectedValue)
   throw Error('PDF di altra pratica, revisione superata o collegamenti non corrispondenti: '+key);
 }
 const changes=[];
 for(const f of expected){
  if(f.readonly)continue;
  if(!Object.hasOwn(values,f.name))throw Error('Campo PDF mancante: '+f.name);
  const proposed=values[f.name].replace(/\r\n?/g,'\n').trim();
  const current=text(f.value).replace(/\r\n?/g,'\n').trim();
  if(proposed===current)continue;
  if(proposed.length>2000)throw Error('Valore PDF troppo lungo: '+f.name);
  changes.push({name:f.name,label:f.label,from:current,to:proposed,section:f.section,
   overwrite:Boolean(current),suggested:!current&&Boolean(proposed)});
 }
 return changes;
}
function fieldObjectsToValues(objects){
 if(!objects||typeof objects!=='object')throw Error('Il PDF non contiene campi AcroForm leggibili.');
 const result=Object.create(null);
 for(const [name,widgets] of Object.entries(objects)){
  if(!Array.isArray(widgets)||widgets.length!==1||!widgets[0]||
   typeof widgets[0].value!=='string'||widgets[0].value.length>4000)
   throw Error('Campo PDF non testuale o ambiguo: '+name);
  result[name]=widgets[0].value;
 }
 return result;
}
function applyImport(row,changes,selected){
 const next=JSON.parse(JSON.stringify(row));
 const names=new Set(selected);
 if(names.size!==selected.length||names.size>160)throw Error('Selezione non valida.');
 for(const item of changes){
  if(!names.has(item.name))continue;
  const key=item.name.split('.').slice(1).join('.');
  if(item.name==='general.date')next.date=item.to;
  else if(item.name.startsWith('general.')){
   if(!['reference','scope','materials','checks','notes'].includes(key))throw Error('Campo generale non previsto.');
   next.fields=next.fields||{};next.fields[key]=item.to;
   if(next.originalPrefill)delete next.originalPrefill['field:'+key];
  }else if(item.name.startsWith('detail.')){
   if(!/^[a-zA-Z0-9_-]{1,100}$/.test(key))throw Error('Campo tecnico non previsto.');
   next.structured=next.structured||{};next.structured[key]=item.to;
   if(next.originalPrefill)delete next.originalPrefill['detail:'+key];
  }else throw Error('Campo di sistema non modificabile.');
 }
 if(changes.filter(x=>names.has(x.name)).length!==names.size)throw Error('Selezione non corrispondente alla pratica.');
 return next;
}
async function readEditedPdf(file){
 if(!file||file.size<100||file.size>6*1024*1024)throw Error('Seleziona un PDF compilato fino a 6 MB.');
 const data=new Uint8Array(await file.arrayBuffer());
 if(String.fromCharCode(...data.slice(0,5))!=='%PDF-')throw Error('Il file non è un PDF.');
 const pdfjs=await import('./vendor/pdf.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc='./vendor/pdf.worker.mjs';
 const task=pdfjs.getDocument({data,disableFontFace:true,isEvalSupported:false,stopAtErrors:true});
 try{
  const doc=await task.promise;
  if(doc.numPages<1||doc.numPages>30)throw Error('Numero pagine non consentito.');
  return fieldObjectsToValues(await doc.getFieldObjects());
 }finally{await task.destroy();}
}
function reviewImport(row,values){
 const groups=root.ITETechnicalDrafts?.structuredGroups||{},changes=previewImport(row,values,groups);
 const old=document.getElementById('ite-pdf-import-review');if(old)old.remove();
 const overlay=document.createElement('div');overlay.id='ite-pdf-import-review';
 overlay.style.cssText='position:fixed;inset:0;z-index:100000;background:#102a3ddd;display:flex;align-items:center;justify-content:center;padding:12px';
 const card=document.createElement('div');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
 card.setAttribute('aria-label','Revisione dati da PDF compilato');
 card.style.cssText='background:white;color:#172f3f;border-radius:12px;padding:20px;max-width:850px;width:100%;max-height:92vh;overflow:auto';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 card.innerHTML='<h3>Importa campi da PDF compilato — revisione '+esc(row.revision)+'</h3>'+
  '<p>Confronta ogni modifica. I campi già compilati non vengono sovrascritti senza selezione esplicita. Nessuna firma o prova viene importata.</p>'+
  (changes.length?changes.map((c,i)=>'<label style="display:block;padding:10px;border-bottom:1px solid #ddd"><input type="checkbox" data-pdf-change="'+i+'" '+(c.suggested?'checked':'')+'>'+
  '<strong>'+esc(c.label)+'</strong> '+(c.overwrite?'(sovrascrittura manuale)':'(campo vuoto)')+
  '<div style="font-size:13px">Attuale: '+esc(c.from||'—')+'</div><div>PDF: '+esc(c.to||'—')+'</div></label>').join(''):'<p>Nessuna modifica rispetto alla pratica archiviata.</p>')+
  '<p id="ite-pdf-import-status" role="status"></p><div class="actions"><button type="button" data-pdf-confirm '+(!changes.length?'disabled':'')+'>Salva selezione con backup e revisione</button> <button type="button" class="secondary" data-pdf-close>Chiudi senza salvare</button></div>';
 overlay.append(card);document.body.append(overlay);
 const status=card.querySelector('#ite-pdf-import-status');
 card.querySelector('[data-pdf-close]').addEventListener('click',()=>overlay.remove());
 card.querySelector('[data-pdf-confirm]').addEventListener('click',async event=>{
  const button=event.currentTarget,selected=[...card.querySelectorAll('[data-pdf-change]:checked')]
   .map(el=>changes[Number(el.dataset.pdfChange)]?.name).filter(Boolean);
  if(!selected.length){status.textContent='Seleziona almeno una modifica.';return;}
  button.disabled=true;
  try{
   if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non pronto.');
   const state=root.ITECommerce.snapshot(),base=root.ITE.snapshot();
   const live=find(state.settings?.technicalDrafts,row.id);
   if(!live||live.revision!==row.revision)throw Error('Pratica modificata dopo la lettura del PDF: riapri e ripeti.');
   previewImport(live,values,groups);
   const candidate=applyImport(live,changes,selected);
   const at=new Date().toISOString();
   candidate.revision=live.revision+1;candidate.updated=at;
   candidate.history=[...(live.history||[]),{at,action:'REVISIONE',
    before:JSON.parse(JSON.stringify({...live,history:undefined}))}];
   root.ITETechnicalDrafts.validate({settings:{technicalDrafts:[candidate]},documents:state.documents},base);
   if(!root.ITEHistory?.create)throw Error('Backup preventivo non disponibile.');
   await root.ITEHistory.create('Prima importazione campi PDF pratica tecnica');
   await root.ITECommerce.mutate(next=>{
    const list=next.settings?.technicalDrafts||[],index=list.findIndex(x=>same(x.id,row.id));
    if(index<0||list[index].revision!==row.revision)throw Error('Revisione cambiata: salvataggio bloccato.');
    list[index]=candidate;
    next.audit.push({id:'audit_'+crypto.randomUUID(),at,action:'IMPORTA_CAMPI_PDF_TECNICO',
     detail:{id:row.id,revision:candidate.revision,fields:selected}});
   });
   overlay.remove();root.ITETechnicalDrafts.render();
   const status=document.getElementById('tech-status');
   if(status)status.textContent='Campi PDF selezionati importati con backup e revisione '+candidate.revision+'. Verificare la pratica.';
  }catch(error){status.textContent='Importazione non eseguita: '+error.message;button.disabled=false;}
 });
}

function install(){
 const panel=document.getElementById('technical-drafts-panel');
 if(!panel||panel.dataset.iteAcroformInstalled)return;
 panel.dataset.iteAcroformInstalled='true';
 const refresh=()=>{for(const b of panel.querySelectorAll('[data-tech-print]')){
  if(b.parentElement?.querySelector('[data-tech-fillable="'+b.dataset.techPrint+'"]'))continue;
  const button=document.createElement('button');button.type='button';button.className='secondary';
  button.dataset.techFillable=b.dataset.techPrint;button.textContent='PDF compilabile (bozza)';
  b.insertAdjacentElement('afterend',button);
  const upload=document.createElement('button');upload.type='button';upload.className='secondary';
  upload.dataset.techUpload=b.dataset.techPrint;upload.textContent='Importa PDF compilato';
  const input=document.createElement('input');input.type='file';input.accept='.pdf,application/pdf';
  input.hidden=true;input.dataset.techFile=b.dataset.techPrint;
  button.insertAdjacentElement('afterend',upload);upload.insertAdjacentElement('afterend',input);
 }};
 refresh();new MutationObserver(refresh).observe(panel,{childList:true,subtree:true});
 panel.addEventListener('change',async event=>{
  const input=event.target.closest('input[data-tech-file]');if(!input||!panel.contains(input)||!input.files?.[0])return;
  const status=panel.querySelector('#tech-status');
  try{
   if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non pronto.');
   const row=find(root.ITECommerce.snapshot().settings?.technicalDrafts,input.dataset.techFile);
   if(!row)throw Error('Pratica non trovata.');
   reviewImport(row,await readEditedPdf(input.files[0]));
  }catch(e){if(status)status.textContent='PDF non importato: '+e.message;}
  finally{input.value='';}
 });
 panel.addEventListener('click',event=>{
  const upload=event.target.closest('[data-tech-upload]');
  if(upload&&panel.contains(upload)){
   const input=upload.parentElement?.querySelector('input[data-tech-file]');
   if(input)input.click();return;
  }
  const button=event.target.closest('[data-tech-fillable]');if(!button||!panel.contains(button))return;
  const status=panel.querySelector('#tech-status');
  try{
   if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non pronto.');
   const state=root.ITECommerce.snapshot(),base=root.ITE.snapshot();
   const row=find(state.settings?.technicalDrafts,button.dataset.techFillable);
   if(!row)throw Error('Pratica non trovata.');
   const options={groups:root.ITETechnicalDrafts?.structuredGroups||{},review:root.ITETechnicalDrafts?.qualityReport,
    drawings:state.settings?.cadDrawings,links:state.settings?.cadPracticeLinks,
    articles:state.articles,movements:state.movements};
   download(build(row,row.clientId,state.documents||[],base,options),'ITE_COMPILABILE_BOZZA_'+String(row.id).replace(/[^a-z0-9_-]/gi,'_')+'.pdf');
   if(status)status.textContent='PDF compilabile esportato. Le modifiche al PDF non aggiornano il gestionale; documento non ufficiale e non cifrato.';
  }catch(e){if(status)status.textContent='PDF compilabile non generato: '+e.message;}
 });
}
if(root?.document){root.addEventListener('ite-vault-ready',install);if(root.ITEVault?.isUnlocked?.())install();}
root.ITETechnicalAcroform=Object.freeze({build,validate,fieldsFor,previewImport,fieldObjectsToValues,applyImport});
})(typeof window!=='undefined'?window:globalThis);
