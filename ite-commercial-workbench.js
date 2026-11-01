/* I.T.E. 4.0 — independent demo-only commercial workbench, no automatic persistence. */
(function(root){'use strict';
const core=root.ITECommercial||(typeof require==='function'?require('./ite-commercial-domain.js'):null);
function mount(target){
 if(!target||!root.document||!core)return null;
 const wrap=document.createElement('section');wrap.className='panel';wrap.id='ite-commercial-workbench';
 const title=document.createElement('h3');title.textContent='Preventivi ed Extra — prova con dati fittizi';wrap.append(title);
 const note=document.createElement('p');note.className='hint';note.textContent='Fornitura e posa separate. Importi netti, IVA indicativa: verificare il regime fiscale prima di un preventivo reale. I dati non sono salvati.';wrap.append(note);
 const fields={};
 for(const [key,label,value] of [['description','Descrizione lavoro','lavabo con colonna'],['supply','Fornitura €','200'],['install','Posa €','120']]){
  const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.value=value;input.type=key==='description'?'text':'number';if(input.type==='number'){input.min='0';input.step='0.01'}l.append(input);wrap.append(l);fields[key]=input;
 }
 const add=document.createElement('button');add.type='button';add.textContent='Aggiungi fornitura e posa';const reset=document.createElement('button');reset.type='button';reset.className='secondary';reset.textContent='Svuota';const output=document.createElement('div');output.setAttribute('role','status');wrap.append(add,reset,output);target.append(wrap);
 let items=[],counter=0;
 function draw(){
  output.replaceChildren();
  if(!items.length){output.textContent='Nessuna voce inserita.';return}
  const quote=core.build({id:'DEMO',clientId:'CLIENTE-FITTIZIO',siteId:'SEDE-FITTIZIA',issuedAt:new Date().toISOString().slice(0,10),lines:items});
  const table=document.createElement('table');const head=document.createElement('tr');
  for(const label of ['Tipo','Descrizione','Netto €']){const th=document.createElement('th');th.textContent=label;head.append(th)}table.append(head);
  for(const item of quote.lines){const tr=document.createElement('tr');for(const value of [item.kind,item.description,item.net.toFixed(2)]){const td=document.createElement('td');td.textContent=value;tr.append(td)}table.append(tr)}
  output.append(table);const summary=document.createElement('p');summary.textContent='Imponibile € '+quote.totals.net.toFixed(2)+' — IVA € '+quote.totals.vat.toFixed(2)+' — Totale € '+quote.totals.gross.toFixed(2);output.append(summary);
 }
 add.addEventListener('click',()=>{try{const s=Number(fields.supply.value),p=Number(fields.install.value);if(!fields.supply.value||!fields.install.value)throw Error('PREZZI_OBBLIGATORI');items=core.addPair(items,{id:'demo-'+(++counter),description:fields.description.value.trim(),supplyPrice:s,installationPrice:p});draw()}catch(e){output.textContent='Voce non aggiunta: '+e.message}});
 reset.addEventListener('click',()=>{items=[];counter=0;draw()});draw();return {element:wrap};
}
root.ITECommercialWorkbench=Object.freeze({mount});if(typeof module!=='undefined'&&module.exports)module.exports={mount};
})(typeof window!=='undefined'?window:globalThis);
