/* I.T.E. 4.0 — Incassi, pagamenti, note TD04 e collegamenti preventivi. Solo dati locali. */
(function(root){'use strict';
const C=root.ITECommerce,L=root.ITECommerceLedger,H=root.ITEHierarchyWorkspace;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n};
const euros=n=>(n/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const cents=value=>{const s=String(value).trim();if(!/^\\d+(?:[.,]\\d{1,2})?$/.test(s))throw Error('IMPORTO_NON_VALIDO');const [a,b='']=s.replace(',','.').split('.');const n=Number(a)*100+Number((b+'00').slice(0,2));if(!Number.isSafeInteger(n)||n>1e11)throw Error('IMPORTO_NON_VALIDO');return n};
const makeId=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e6).toString(36);
function mount(){
 if(!C||!L||!H||!root.localStorage||document.getElementById('ite40-ledger'))return;
 const host=document.getElementById('ite40-commerce')||document.querySelector('main')||document.querySelector('.wrap');if(!host)return;
 const panel=el('section');panel.id='ite40-ledger';panel.className='panel';
 panel.append(el('h2','Incassi, pagamenti e note di credito — collaudo 4.0'),el('p','Dati memorizzati esclusivamente su questo dispositivo. Inserire solo dati fittizi; non utilizzare per la contabilità operativa.'));
 const message=el('p');message.setAttribute('role','status');panel.append(message);
 const form=el('div');form.className='grid';panel.append(form);
 function field(label,type='text'){const l=el('label',label),n=el('input');n.type=type;l.append(n);form.append(l);return n}
 function select(label,options=[]){const l=el('label',label),n=el('select');for(const [v,t] of options){const o=el('option',t);o.value=v;n.append(o)}l.append(n);form.append(l);return n}
 const invoice=select('Fattura / proforma / TD04'),quote=select('Preventivo accettato'),amount=field('Importo incassato / pagato / recuperato (€)','text'),date=field('Data movimento','date'),method=select('Modalità',[['BONIFICO','Bonifico'],['CONTANTI','Contanti'],['POS','POS'],['ALTRO','Altro']]),note=field('Riferimento o nota'),asOf=field('Riepilogo alla data','date');
 amount.value='0';date.value=new Date().toISOString().slice(0,10);
 const actions=el('div');actions.className='actions';panel.append(actions);
 const listing=el('div');panel.append(listing);
 const master=()=>H.load(localStorage),commerce=()=>C.load(localStorage,master()),ledger=()=>L.load(localStorage,commerce());
 function options(node,items){const previous=node.value;node.replaceChildren();for(const [v,t] of items){const o=el('option',t);o.value=v;node.append(o)}if(items.some(x=>x[0]===previous))node.value=previous}
 function render(){
  const c=commerce(),l=ledger(),rows=L.summary(l,c,{asOf:asOf.value||undefined});
  options(invoice,c.invoices.map(f=>[f.id,(f.number||f.id)+' · '+f.kind+' · '+f.direction]));
  options(quote,c.quotes.filter(q=>q.status==='ACCETTATO').map(q=>[q.id,q.id]));
  listing.replaceChildren(el('h3','Situazione documenti ('+rows.length+')'));
  const table=el('div');table.className='commerce-table';const t=el('table'),head=el('tr');
  for(const title of ['Documento','Tipo','Totale','Regolato','Residuo','Stato','Preventivo'])head.append(el('th',title));
  const thead=el('thead');thead.append(head);t.append(thead);const body=el('tbody');
  for(const row of rows){const tr=el('tr'),f=c.invoices.find(x=>x.id===row.invoiceId);
   for(const value of [f.number||f.id,row.kind+' / '+row.direction,euros(row.totalCents),euros(row.settledCents),euros(row.remainingCents),row.status,row.quoteId||'—'])tr.append(el('td',value));
   body.append(tr);
  }t.append(body);table.append(t);listing.append(table);
  listing.append(el('h3','Movimenti registrati ('+l.entries.length+')'));
  for(const entry of [...l.entries].sort((a,b)=>b.date.localeCompare(a.date)))listing.append(el('p',entry.date+' · '+(c.invoices.find(f=>f.id===entry.invoiceId)?.number||entry.invoiceId)+' · '+euros(entry.amountCents)+' · '+entry.method+(entry.note?' · '+entry.note:'')));
 }
 function act(fn){try{const c=commerce(),current=ledger(),next=fn(current,c);L.save(localStorage,next,c);message.textContent='Operazione salvata localmente';render()}catch(e){message.textContent='Operazione non eseguita: '+e.message}}
 function button(label,fn){const b=el('button',label);b.type='button';b.addEventListener('click',fn);actions.append(b)}
 button('Registra movimento',()=>act((l,c)=>L.record(l,c,{id:makeId('MOV'),invoiceId:invoice.value,amountCents:cents(amount.value),date:date.value,method:method.value,note:note.value}).ledger));
 button('Collega preventivo accettato',()=>act((l,c)=>L.link(l,c,invoice.value,quote.value)));
 button('Aggiorna riepilogo',()=>{try{render();message.textContent='Riepilogo aggiornato'}catch(e){message.textContent=e.message}});
 host.append(panel);try{render()}catch(e){message.textContent='Registro non disponibile: '+e.message}
}
root.ITECommerceLedgerUI=Object.freeze({mount});
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
