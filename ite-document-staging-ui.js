/* I.T.E. 4.0 — local-only technical document intake UI.
 * Metadata only: PDF bytes and extracted text are NEVER persisted or uploaded.
 * This is a staging register, not the legacy Di.Co./Di.Ri./GAS/POS/CAD editor.
 */
(function(root){'use strict';
const D=root.ITEDocumentIntake,H=root.ITEHierarchyWorkspace,W=root.ITEAtomicWorkspace;
const KEY='ite40_document_staging_v1',PREVIOUS=KEY+'_previous',MAX_BYTES=15*1024*1024;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n};
function read(store){const raw=store.getItem(KEY);return raw===null?D.empty():D.importJSON(raw)}
function write(store,next){const validated=D.validate(next),old=store.getItem(KEY);
 // Backup must succeed before replacing current register.
 if(old!==null)store.setItem(PREVIOUS,old);
 store.setItem(KEY,D.exportJSON(validated));return validated;
}
function download(content,name){const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function mount(){
 if(!D||!H||!W||!root.document)return false;
 const host=document.getElementById('importazioni');if(!host||document.getElementById('ite40-document-staging'))return false;
 const panel=el('section');panel.id='ite40-document-staging';panel.className='panel';
 panel.append(el('h2','Registro documenti tecnici — collaudo 4.0'));
 panel.append(el('p','Solo metadati locali. Nessun PDF viene caricato, letto automaticamente o salvato. Le funzioni originali Di.Co., Di.Ri., GAS, POS e CAD rimangono indipendenti.'));
 const status=el('p');status.setAttribute('role','status');panel.append(status);
 const form=el('div');form.className='grid';panel.append(form);
 function field(title,kind='text'){const label=el('label',title),input=el('input');input.type=kind;label.append(input);form.append(label);return input}
 function select(title,values){const label=el('label',title),input=el('select');for(const [value,title] of values){const o=el('option',title);o.value=value;input.append(o)}label.append(input);form.append(label);return input}
 const file=field('Documento PDF (solo nome, non contenuto)','file');file.accept='.pdf,application/pdf';
 const type=select('Tipologia',D.TYPES.map(x=>[x,x]));
 const client=select('Cliente fittizio',[['','Nessun cliente']]),site=select('Sede fittizia',[['','Nessuna sede']]);
 const number=field('Numero documento'),date=field('Data documento','date'),operator=field('Operatore verifica');
 const notes=field('Note di classificazione');
 const filters=el('div');filters.className='grid';panel.append(filters);
 const filterStatus=el('select'),filterType=el('select'),filterSearch=el('input');
 for(const v of [['','Tutti gli stati'],...D.STATES.map(v=>[v,v])]){const o=el('option',v[1]);o.value=v[0];filterStatus.append(o)}
 for(const v of [['','Tutte le tipologie'],...D.TYPES.map(v=>[v,v])]){const o=el('option',v[1]);o.value=v[0];filterType.append(o)}
 filterSearch.placeholder='Cerca nome file, numero o note';filterSearch.setAttribute('aria-label','Cerca documenti');
 for(const [name,input] of [['Stato',filterStatus],['Tipologia',filterType],['Ricerca',filterSearch]]){const l=el('label',name);l.append(input);filters.append(l)}
 const list=el('div');panel.append(list);
 [filterStatus,filterType,filterSearch].forEach(x=>x.addEventListener('input',()=>render()));
 function button(label,fn,parent=panel){const b=el('button',label);b.type='button';b.addEventListener('click',()=>{try{fn()}catch(e){status.textContent='Operazione rifiutata: '+e.message}});parent.append(b);return b}
 function hierarchy(){return W.read(localStorage).data.hierarchy}
 function refreshOptions(){const h=hierarchy(),selected=client.value;client.replaceChildren();site.replaceChildren();
 const empty=el('option','Nessun cliente');empty.value='';client.append(empty);
 for(const c of h.clients){const o=el('option',c.name||c.id);o.value=c.id;client.append(o)}
 if([...client.options].some(o=>o.value===selected))client.value=selected;
 const siteEmpty=el('option','Nessuna sede');siteEmpty.value='';site.append(siteEmpty);
 for(const s of h.sites.filter(s=>s.clientId===client.value)){const o=el('option',s.address||s.id);o.value=s.id;site.append(o)}
 }
 client.addEventListener('change',refreshOptions);
 file.addEventListener('change',()=>{const f=file.files&&file.files[0];if(f)type.value=D.classify(f.name)});
 button('Leggi PDF localmente e proponi campi',async()=>{
  const f=file.files&&file.files[0];if(!f)throw Error('Selezionare un PDF');
  if(!root.ITEPDFLocalReader||!root.ITEStagingPDFReview)throw Error('LETTORE_NON_DISPONIBILE');
  status.textContent='Lettura PDF locale in corso…';
  try{
   const extracted=await root.ITEPDFLocalReader.extract(f);
   if(extracted.needsOCR){status.textContent='PDF senza testo selezionabile: serve verifica manuale, nessuna OCR automatica.';return}
   const proposal=root.ITEStagingPDFReview.inspect(f.name,extracted.text);
   if(proposal.type)type.value=proposal.type;
   if(proposal.number)number.value=proposal.number;
   if(proposal.date)date.value=proposal.date;
   status.textContent='Proposta da '+extracted.pages+' pagine: verificare tipo, numero e data sul PDF originale prima di registrare. Nessun testo o PDF conservato.';
  }catch(e){status.textContent='Lettura PDF non riuscita: '+e.message}
 });
 function save(next){D.linkCheck(next,hierarchy());write(localStorage,next);render()}
 button('Registra metadati PDF',()=>{
  const f=file.files&&file.files[0];if(!f)throw Error('Selezionare un PDF');
  if(!/\.pdf$/i.test(f.name)||f.type&&f.type!=='application/pdf'||f.size>MAX_BYTES||f.size===0)throw Error('PDF_NON_AMMESSO');
  const item={id:'DOC-'+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)),filename:f.name.slice(0,240),type:type.value,status:'DA_VERIFICARE',addedAt:new Date().toISOString().slice(0,10),clientId:client.value||null,siteId:site.value||null,number:number.value||null,documentDate:date.value||null,notes:notes.value.slice(0,2000),originalChecked:false};
  save(D.add(read(localStorage),item));file.value='';status.textContent='Metadati registrati. PDF non conservato.';
 });
 button('Esporta registro JSON',()=>download(D.exportJSON(read(localStorage)),'ITE40-documenti-demo.json'));
 button('Esporta elenco CSV (solo metadati)',()=>{
  const records=read(localStorage).items;
  const columns=['id','filename','type','status','number','documentDate','clientId','siteId','checkedBy'];
  const cell=v=>{const s=String(v==null?'':v);return '"'+(/^[=+@-]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"'};
  const csv='\uFEFF'+[columns.join(';'),...records.map(r=>columns.map(k=>cell(r[k])).join(';'))].join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='ITE40-documenti-demo.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 const backup=field('Importa registro JSON','file');backup.accept='.json,application/json';
 button('Importa registro con verifica',()=>{
  const f=backup.files&&backup.files[0];if(!f||f.size>1000000)throw Error('FILE_JSON_NON_VALIDO');
  const reader=new FileReader();reader.onload=()=>{try{const parsed=D.importJSON(String(reader.result));D.linkCheck(parsed,hierarchy());if(!confirm('Sostituire il registro locale dopo validazione?'))return;save(parsed);status.textContent='Registro importato.'}catch(e){status.textContent='Importazione rifiutata: '+e.message}};reader.onerror=()=>status.textContent='Lettura non riuscita';reader.readAsText(f);
 });
 button('Ripristina registro precedente',()=>{const raw=localStorage.getItem(PREVIOUS);if(!raw)throw Error('BACKUP_NON_DISPONIBILE');const prev=D.importJSON(raw);D.linkCheck(prev,hierarchy());if(!confirm('Ripristinare il registro precedente?'))return;save(prev)});
 function render(){
  refreshOptions();list.replaceChildren();const state=read(localStorage),sum=D.summary(state);
  list.append(el('h3','Documenti registrati: '+sum.total+' · da verificare: '+sum.awaitingReview+' · archiviati: '+sum.archived));
  const visible=state.items.filter(x=>(!filterStatus.value||x.status===filterStatus.value)&&(!filterType.value||x.type===filterType.value)&&(!filterSearch.value.trim()||[x.filename,x.number,x.notes].join(' ').toLocaleLowerCase('it').includes(filterSearch.value.trim().toLocaleLowerCase('it'))));
  list.append(el('p','Visualizzati '+visible.length+' di '+state.items.length+' documenti'));
  for(const item of visible){const line=el('div');line.className='item';line.append(el('strong',item.filename+' — '+item.type+' — '+item.status));line.append(el('p','Numero: '+(item.number||'—')+' · Data: '+(item.documentDate||'—')));
   if(item.status==='DA_VERIFICARE'||item.status==='DA_CLASSIFICARE'){
    const sel=el('select');for(const t of D.TYPES){const o=el('option',t);o.value=t;sel.append(o)}sel.value=item.type;line.append(sel);
    button('Aggiorna classificazione',()=>save(D.update(read(localStorage),item.id,{type:sel.value})),line);
    const edit=el('details'),summary=el('summary','Correggi metadati e collegamenti');edit.append(summary);
    const fields=el('div');fields.className='grid';edit.append(fields);
    function editable(label,value,kind='text'){const l=el('label',label),i=el('input');i.type=kind;i.value=value||'';l.append(i);fields.append(l);return i}
    const en=editable('Numero documento',item.number),ed=editable('Data documento',item.documentDate,'date'),et=editable('Note',item.notes);
    const ec=el('select'),es=el('select');
    function populateLinks(){const h=hierarchy();ec.replaceChildren();for(const [id,name] of [['','Nessun cliente'],...h.clients.map(c=>[c.id,c.name||c.id])]){const o=el('option',name);o.value=id;ec.append(o)}
     if([...ec.options].some(o=>o.value===(item.clientId||'')))ec.value=item.clientId||'';
     es.replaceChildren();for(const [id,name] of [['','Nessuna sede'],...h.sites.filter(s=>s.clientId===ec.value).map(s=>[s.id,s.address||s.id])]){const o=el('option',name);o.value=id;es.append(o)}
     if([...es.options].some(o=>o.value===(item.siteId||'')))es.value=item.siteId||'';
    }
    populateLinks();ec.addEventListener('change',()=>{const h=hierarchy();es.replaceChildren();for(const [id,name] of [['','Nessuna sede'],...h.sites.filter(s=>s.clientId===ec.value).map(s=>[s.id,s.address||s.id])]){const o=el('option',name);o.value=id;es.append(o)}});
    for(const [label,input] of [['Cliente',ec],['Sede',es]]){const l=el('label',label);l.append(input);fields.append(l)}
    button('Salva correzioni',()=>save(D.update(read(localStorage),item.id,{number:en.value.trim()||null,documentDate:ed.value||null,notes:et.value.trim(),clientId:ec.value||null,siteId:es.value||null})),edit);
    line.append(edit);
    button('Verifica originale',()=>{if(!operator.value.trim())throw Error('OPERATORE_OBBLIGATORIO');if(!confirm('Confermi di avere verificato il documento originale fuori dal registro?'))return;save(D.verify(read(localStorage),item.id,operator.value.trim()))},line);
   }else if(item.status==='VERIFICATO')button('Archivia metadati',()=>save(D.archive(read(localStorage),item.id)),line);
   list.append(line);
  }
 }
 host.prepend(panel);try{render()}catch(e){status.textContent='Archivio non leggibile: '+e.message}return true;
}
root.ITEDocumentStagingUI=Object.freeze({mount,read,write,KEY,PREVIOUS});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ITEDocumentStagingUI;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
