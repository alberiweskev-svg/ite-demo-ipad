/* I.T.E. 4.0 — pannello commerciale unico, solo dati locali di collaudo. */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace,C=root.ITECommerce;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n};
function mount(){
 if(!H||!C||!root.localStorage||document.getElementById('ite40-commerce'))return;
 const host=document.querySelector('main')||document.querySelector('.wrap');if(!host)return;
 const panel=el('section');panel.id='ite40-commerce';panel.className='panel';
 panel.append(el('h2','Preventivi, Extra e fatture — collaudo 4.0'),el('p','Archivio locale del browser: utilizzare esclusivamente dati fittizi.'));
 const message=el('p');message.setAttribute('role','status');panel.append(message);
 const form=el('div');form.className='grid';panel.append(form);
 function field(name,type='text'){const label=el('label',name),input=el('input');input.type=type;label.append(input);form.append(label);return input}
 function select(name,values){const label=el('label',name),s=el('select');for(const [v,t] of values){const o=el('option',t);o.value=v;s.append(o)}label.append(s);form.append(label);return s}
 const client=select('Cliente',[]),quote=select('Preventivo',[]),description=field('Descrizione'),category=select('Categoria',[...['idrico','riscaldamento','elettrico','condizionamento','opere murarie','altro'].map(x=>[x,x])]),type=select('Tipo voce',[['FORNITURA','Fornitura'],['POSA','Posa'],['SMONTAGGIO','Smontaggio'],['SMALTIMENTO','Smaltimento']]),origin=select('Voce',[['BASE','Preventivo'],['EXTRA','Extra']]),quantity=field('Quantità','number'),price=field('Prezzo unitario €','number'),vat=select('IVA',[['10','10%'],['22','22%'],['0','0%'],['4','4%'],['5','5%']]),invoiceKind=select('Documento',[['FATTURA','Fattura'],['PROFORMA','Proforma'],['TD04','Nota credito TD04']]),direction=select('Direzione',[['ACQUISTO','Acquisto'],['VENDITA','Vendita']]),number=field('Numero documento'),net=field('Imponibile €','number'),tax=field('IVA €','number');
 quantity.value='1';price.value='0';net.value='0';tax.value='0';
 const buttons=el('div');buttons.className='actions';panel.append(buttons);const listing=el('div');panel.append(listing);
 const masters=()=>H.load(localStorage),data=()=>C.load(localStorage,masters());
 const euros=n=>(n/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
 const cents=x=>{if(!/^\d+(?:[.,]\d{1,2})?$/.test(String(x).trim()))throw Error('IMPORTO_NON_VALIDO');return Math.round(Number(String(x).replace(',','.'))*100)};
 function opts(node,items){const previous=node.value;node.replaceChildren();for(const [v,t] of items){const o=el('option',t);o.value=v;node.append(o)}if(items.some(x=>x[0]===previous))node.value=previous}
 function render(){const h=masters(),d=data();opts(client,h.clients.map(x=>[x.id,x.name||x.id]));opts(quote,d.quotes.map(x=>[x.id,x.id+' · '+x.status]));listing.replaceChildren(el('h3','Preventivi ('+d.quotes.length+')'));
  for(const q of d.quotes){const box=el('div');box.className='item',t=C.totals(q),approved=C.totals(q,{approvedOnly:true});box.append(el('strong',q.id+' · '+q.status+' · '+euros(t.totalCents)),el('p','Approvato: '+euros(approved.totalCents)));
   for(const l of q.lines){const row=el('p',l.type+' · '+l.description+' · '+euros(Math.round(l.quantityMilli*l.unitCents/1000))+' · '+l.origin+' / '+l.approval);box.append(row);
    if(l.origin==='EXTRA'&&l.approval==='PROPOSTO'){for(const [label,approval] of [['Approva','APPROVATO'],['Rifiuta','RIFIUTATO']]){const b=el('button',label);b.type='button';b.addEventListener('click',()=>act(()=>C.approveExtra(data(),masters(),q.id,[l.id],approval)));box.append(b)}}}
   listing.append(box)}
  listing.append(el('h3','Documenti contabili ('+d.invoices.length+')'));
  for(const f of d.invoices)listing.append(el('p',f.kind+' · '+f.direction+' · '+f.number+' · '+euros(f.totalCents)+' · '+f.status));
 }
 function act(fn){try{const next=fn();C.save(localStorage,next,masters());message.textContent='Operazione salvata nel browser';render()}catch(e){message.textContent='Operazione non eseguita: '+e.message}}
 function button(name,fn){const b=el('button',name);b.type='button';b.addEventListener('click',()=>act(fn));buttons.append(b)}
 const id=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e6).toString(36);
 button('Nuovo preventivo',()=>C.createQuote(data(),masters(),{id:id('PREV'),clientId:client.value}));
 button('Aggiungi voce separata',()=>C.addLine(data(),masters(),quote.value,{id:id('RIGA'),description:description.value,category:category.value,type:type.value,origin:origin.value,quantityMilli:Math.round(Number(quantity.value)*1000),unitCents:cents(price.value),vatRate:Number(vat.value)}));
 button('Accetta preventivo',()=>C.setQuoteStatus(data(),masters(),quote.value,'ACCETTATO'));
 button('Non accettato',()=>C.setQuoteStatus(data(),masters(),quote.value,'NON_ACCETTATO'));
 button('Registra documento contabile',()=>{const n=cents(net.value),v=cents(tax.value);return C.addInvoice(data(),masters(),{id:id('DOC'),kind:invoiceKind.value,direction:direction.value,number:number.value,netCents:n,vatCents:v,totalCents:n+v})});
 host.append(panel);try{render()}catch(e){message.textContent='Archivio commerciale non disponibile: '+e.message}
}
root.ITECommerceUI=Object.freeze({mount});
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
