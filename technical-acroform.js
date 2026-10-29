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
 const add=(name,label,value,kind='text',section='')=>{
  if(!/^[a-zA-Z0-9_.:-]{1,110}$/.test(name)||names.has(name))return;
  names.add(name);fields.push({name,label:text(label).slice(0,100),value:text(value),multiline:kind==='textarea',section:text(section).slice(0,100)});
 };
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
   objects[widgetId-1]='<< /Type /Annot /Subtype /Widget /FT /Tx /T ('+escape(e.field.name)+') /V ('+escape(e.field.value)+') /DA (/Helv 9 Tf 0 g) /F 4 /Ff '+(e.field.multiline?4096:0)+' /Rect ['+e.x+' '+e.y+' '+(e.x+w)+' '+(e.y+h)+'] /P '+pageId+' 0 R /AP << /N '+aId+' 0 R >> >>';
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
function install(){
 const panel=document.getElementById('technical-drafts-panel');
 if(!panel||panel.dataset.iteAcroformInstalled)return;
 panel.dataset.iteAcroformInstalled='true';
 const refresh=()=>{for(const b of panel.querySelectorAll('[data-tech-print]')){
  if(b.parentElement?.querySelector('[data-tech-fillable="'+b.dataset.techPrint+'"]'))continue;
  const button=document.createElement('button');button.type='button';button.className='secondary';
  button.dataset.techFillable=b.dataset.techPrint;button.textContent='PDF compilabile (bozza)';
  b.insertAdjacentElement('afterend',button);
 }};
 refresh();new MutationObserver(refresh).observe(panel,{childList:true,subtree:true});
 panel.addEventListener('click',event=>{
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
root.ITETechnicalAcroform=Object.freeze({build,validate,fieldsFor});
})(typeof window!=='undefined'?window:globalThis);
