/* I.T.E. 4.0 - integrated synthetic workspace. No production records or network calls. */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace,C=root.ITECalendarService,Q=root.ITECommercialWorkspace,A=root.ITEAccountingWorkspace,W=root.ITEAtomicWorkspace,M=root.ITEAtomicMigration;
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);return e};
const option=(select,value,label)=>{const o=node('option',label);o.value=value;select.append(o)};
const field=(parent,label,type='text')=>{const l=node('label',label),i=node('input');i.type=type;l.append(i);parent.append(l);return i};
const selectField=(parent,label,options)=>{const l=node('label',label),s=node('select');for(const [v,t] of options)option(s,v,t);l.append(s);parent.append(l);return s};
const action=(parent,label,fn)=>{const b=node('button',label);b.type='button';b.addEventListener('click',()=>{try{fn();render();message.textContent='Operazione completata nel solo archivio dimostrativo locale.'}catch(e){restore();render();message.textContent='Controllo: '+e.message}});parent.append(b)};
let hierarchy,commercial,accounting,message,calendar,history,quotes,docs,revision=0;
function persist(){const saved=W.save(localStorage,{hierarchy,commercial,accounting},revision);revision=saved.revision;restore()}
function restore(){const snap=W.read(localStorage);revision=snap.revision;hierarchy=snap.data.hierarchy;commercial=snap.data.commercial;accounting=snap.data.accounting}
function download(text,name){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
function atomicControls(panel){
 const tools=node('section');tools.append(node('h3','Archivio unico 4.0 — migrazione e sicurezza'));
 const status=node('p');status.setAttribute('role','status');tools.append(status);
 const update=()=>{const p=M.preview(localStorage);status.textContent='Revisione '+W.read(localStorage).revision+' · Origine: '+JSON.stringify(p.source)+' · Destinazione: '+JSON.stringify(p.target)};
 action(tools,'Verifica archivi precedenti',update);
 action(tools,'Migra archivi demo precedenti (solo se destinazione vuota)',()=>{const p=M.preview(localStorage);if(!p.hasSource)throw Error('Nessun archivio demo precedente');if(p.occupied)throw Error('Archivio unico già popolato: migrazione bloccata');if(!confirm('Migrare i soli archivi dimostrativi? Gli originali rimangono invariati.'))return;M.migrate(localStorage,p.revision,true);restore();update()});
 action(tools,'Esporta backup JSON',()=>download(W.exportJSON(W.read(localStorage)),'ITE40-demo-backup.json'));
 const input=node('input');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','Seleziona backup JSON ITE 4.0');tools.append(input);
 action(tools,'Importa backup selezionato',()=>{const file=input.files&&input.files[0];if(!file)throw Error('Selezionare un file JSON');if(file.size>5000000)throw Error('File troppo grande');const reader=new FileReader();reader.onload=()=>{try{const raw=String(reader.result),parsed=W.parse(raw);if(!confirm('Sostituire i dati demo correnti con il backup validato, revisione '+parsed.revision+'?'))return;W.importJSON(localStorage,raw,W.read(localStorage).revision);restore();render();update();message.textContent='Backup importato.'}catch(e){restore();message.textContent='Importazione rifiutata: '+e.message}};reader.onerror=()=>message.textContent='Lettura file non riuscita';reader.readAsText(file)});
 action(tools,'Ripristina versione precedente',()=>{if(!confirm('Ripristinare il precedente archivio demo?'))return;W.restorePrevious(localStorage,W.read(localStorage).revision);restore();update()});
 panel.append(tools);update()
}
function mount(){
 if(!H||!C||!Q||!A||!W||!M)return;
 const target=$('importazioni');if(!target||$('ite40-workspace'))return;
 const panel=node('div');panel.id='ite40-workspace';panel.className='panel';
 panel.append(node('h2','I.T.E. 4.0 — Area integrata di collaudo'));
 panel.append(node('p','Ambiente separato con dati fittizi. Nessun collegamento automatico ai clienti reali, nessun invio al server. Backup del browser prima di ogni salvataggio.'));
 message=node('p');message.setAttribute('role','status');panel.append(message);
 const master=node('div');master.className='grid';panel.append(node('h3','Anagrafiche e appuntamenti'));panel.append(master);
 const name=field(master,'Cliente fittizio'),address=field(master,'Indirizzo sede fittizia'),operator=field(master,'Operatore');
 const start=field(master,'Inizio appuntamento','datetime-local'),end=field(master,'Fine appuntamento','datetime-local');
 action(panel,'Crea cliente, sede, impianto, apparecchiatura e appuntamento',()=>{
 const n=hierarchy.clients.length+1,tag='DEMO-'+Date.now()+'-'+n;
 if(!name.value.trim()||!address.value.trim()||!operator.value.trim())throw Error('Compilare cliente, sede e operatore');
 let next=H.add(hierarchy,'clients',{id:tag+'-C',name:name.value.trim()});
 next=H.add(next,'sites',{id:tag+'-S',clientId:tag+'-C',address:address.value.trim()});
 next=H.add(next,'plants',{id:tag+'-P',siteId:tag+'-S',description:'Impianto dimostrativo'});
 next=H.add(next,'devices',{id:tag+'-D',plantId:tag+'-P',description:'Apparecchiatura dimostrativa'});
 next=H.add(next,'appointments',{id:tag+'-A',clientId:tag+'-C',siteId:tag+'-S',deviceId:tag+'-D',operator:operator.value.trim(),start:start.value,end:end.value});
 if(C.conflicts(next).length)throw Error('Sovrapposizione appuntamenti operatore');
 hierarchy=next;persist();
 });
 calendar=node('div');panel.append(node('h3','Calendario e interventi'));panel.append(calendar);
 const commercialForm=node('div');commercialForm.className='grid';panel.append(node('h3','Preventivi — fornitura e posa distinte'));panel.append(commercialForm);
 const clientSelect=selectField(commercialForm,'Cliente e sede',[]),description=field(commercialForm,'Descrizione'),supply=field(commercialForm,'Fornitura €','number'),installation=field(commercialForm,'Posa €','number');
 action(panel,'Crea preventivo con due voci separate',()=>{
 const [clientId,siteId]=clientSelect.value.split('|'),id='DEMO-Q-'+Date.now();
 if(!clientId||!description.value.trim())throw Error('Cliente e descrizione obbligatori');
 const money=v=>{const n=Number(v);if(!Number.isFinite(n)||n<0||Math.round(n*100)!==n*100)throw Error('Prezzo non valido');return n};
 const desc=description.value.trim(),lines=[{id:id+'-F',groupId:id,kind:'FORNITURA',description:desc+' — fornitura',quantity:1,unitPrice:money(supply.value)},{id:id+'-P',groupId:id,kind:'POSA',description:desc+' — posa',quantity:1,unitPrice:money(installation.value)}];
 commercial=Q.addQuote(commercial,hierarchy,{id,clientId,siteId,status:'BOZZA',lines});persist();
 });
 const extras=node('div');extras.className='grid';panel.append(node('h3','Extra e magazzino — collaudo commerciale'));panel.append(extras);
 const quoteSelect=selectField(extras,'Preventivo in bozza',[]);
 const extraDescription=field(extras,'Descrizione Extra'),extraPrice=field(extras,'Prezzo Extra €','number');
 const stockDescription=field(extras,'Articolo magazzino'),stockQuantity=field(extras,'Giacenza','number'),stockCost=field(extras,'Costo unitario €','number');
 const stockSelect=selectField(extras,'Articolo da associare',[]),stockQuote=selectField(extras,'Preventivo per materiale',[]);
 const stockUnits=field(extras,'Quantità da fornire','number'),stockSell=field(extras,'Prezzo unitario vendita €','number');
 const positiveMoney=v=>{const n=Number(v);if(v===''||!Number.isFinite(n)||n<0||Math.round(n*100)!==n*100)throw Error('Importo non valido');return n};
 action(panel,'Aggiungi voce EXTRA al preventivo',()=>{
  if(!quoteSelect.value||!extraDescription.value.trim())throw Error('Selezionare preventivo e descrizione');
  const id='DEMO-X-'+Date.now();
  commercial=Q.addLine(commercial,hierarchy,quoteSelect.value,{id,groupId:id,kind:'EXTRA',description:extraDescription.value.trim(),quantity:1,unitPrice:positiveMoney(extraPrice.value)});persist();
 });
 action(panel,'Carica articolo nel magazzino demo',()=>{
  const qty=Number(stockQuantity.value);
  if(!stockDescription.value.trim()||!Number.isSafeInteger(qty)||qty<0)throw Error('Articolo o giacenza non valida');
  commercial=Q.validate({...commercial,stock:[...commercial.stock,{id:'DEMO-STOCK-'+Date.now(),description:stockDescription.value.trim(),unitCost:positiveMoney(stockCost.value),onHand:qty}]},hierarchy);persist();
 });
 action(panel,'Associa materiale come FORNITURA',()=>{
  const qty=Number(stockUnits.value),q=commercial.quotes.find(q=>q.id===stockQuote.value);
  if(!q||!stockSelect.value||!Number.isSafeInteger(qty)||qty<=0)throw Error('Preventivo, articolo o quantità non validi');
  const id='DEMO-M-'+Date.now(),article=commercial.stock.find(x=>x.id===stockSelect.value);
  commercial=Q.addLine(commercial,hierarchy,q.id,{id,groupId:id,kind:'FORNITURA',description:article.description,quantity:qty,unitPrice:positiveMoney(stockSell.value),stockId:article.id});persist();
 });
 quotes=node('div');panel.append(quotes);
 const inventory=node('div');panel.append(node('h3','Disponibilità magazzino'));panel.append(inventory);
 panel.append(node('h3','Registro fatture e note di credito TD04'));
 const finance=node('div');finance.className='grid';panel.append(finance);
 const kind=selectField(finance,'Tipo',[['ACQUISTO','Acquisto'],['VENDITA','Vendita'],['PROFORMA','Proforma'],['TD04','Nota credito TD04']]);
 const number=field(finance,'Numero'),date=field(finance,'Data','date'),party=field(finance,'Controparte fittizia'),taxable=field(finance,'Imponibile €','number'),vat=field(finance,'IVA €','number');
 action(panel,'Registra documento da verificare',()=>{
 const base=Number(taxable.value),tax=Number(vat.value);
 accounting=A.add(accounting,{id:'DEMO-DOC-'+Date.now(),kind:kind.value,number:number.value,date:date.value,counterparty:party.value,taxable:base,vat:tax,total:Math.round((base+tax)*100)/100,vatCategory:'ALTRO'});persist();
 });
 docs=node('div');panel.append(docs);
 target.prepend(panel);
 restore();atomicControls(panel);
 function render(){
 calendar.replaceChildren();quotes.replaceChildren();docs.replaceChildren();inventory.replaceChildren();clientSelect.replaceChildren();quoteSelect.replaceChildren();stockQuote.replaceChildren();stockSelect.replaceChildren();
 for(const s of hierarchy.sites){const c=hierarchy.clients.find(x=>x.id===s.clientId);option(clientSelect,c.id+'|'+s.id,(c.name||c.id)+' — '+(s.address||s.id))}
 for(const a of C.schedule(hierarchy)){const line=node('div',a.start+' — '+a.clientName+' — '+a.operator+' — '+a.status);line.className='item';
 if(!a.interventionId)action(line,'Apri intervento',()=>{hierarchy=H.createIntervention(hierarchy,a.id,a.operator,'DEMO-J-'+Date.now());persist()});
 else if(a.status==='APERTO')action(line,'Sono arrivato',()=>{hierarchy=H.clock(hierarchy,a.interventionId,'ARRIVO',localNow());persist()});
 else if(a.status==='IN_CORSO')action(line,'Uscita',()=>{hierarchy=H.clock(hierarchy,a.interventionId,'USCITA',localNow());persist()});
 calendar.append(line)}
 for(const q of commercial.quotes){
  const total=Q.totals(commercial,hierarchy,q.id),line=node('div');line.className='item';
  line.append(node('strong',q.id+' — '+q.status+' — totale € '+total.subtotal.toFixed(2)));
  for(const l of q.lines)line.append(node('p',l.kind+' · '+l.description+' · '+l.quantity+' × € '+l.unitPrice.toFixed(2)));
  if(['BOZZA','INVIATO'].includes(q.status)){
   option(quoteSelect,q.id,q.id);
   option(stockQuote,q.id,q.id);
   action(line,'Accetta preventivo',()=>{commercial=Q.accept(commercial,hierarchy,q.id);persist()});
  }else if(q.status==='ACCETTATO'){
   const rs=commercial.reservations.filter(r=>r.quoteId===q.id);
   if(!rs.length&&q.lines.some(l=>l.stockId))action(line,'Prenota materiali',()=>{commercial=Q.reserve(commercial,hierarchy,q.id);persist()});
   else if(rs.some(r=>r.status==='RISERVATO'))action(line,'Scarica materiali',()=>{commercial=Q.discharge(commercial,hierarchy,q.id);persist()});
  }
  quotes.append(line);
 }
 for(const s of Q.availability(commercial,hierarchy)){option(stockSelect,s.id,s.description+' ('+s.available+' disponibili)');inventory.append(node('p',s.description+' — giacenza '+s.onHand+' · riservati '+s.reserved+' · disponibili '+s.available))}
 for(const d of accounting.documents)docs.append(node('p',d.kind+' '+d.number+' — € '+d.total.toFixed(2)+' — '+d.status));
 }
 function localNow(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())}
 render();
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{try{mount()}catch(e){console.warn('Demo workspace:',e.message)}});else try{mount()}catch(e){console.warn('Demo workspace:',e.message)}}
root.ITEIntegratedWorkspace={mount};
})(typeof window!=='undefined'?window:globalThis);
