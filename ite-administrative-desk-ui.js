/* I.T.E. 4.0 - Banco amministrativo integrato, dati locali di collaudo. */
(function(root){'use strict';
const R=root.ITEAdministrativeRegister,I=root.ITEAdministrativeIntake;
if(!R||!I||typeof document==='undefined')return;
const el=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e};
const field=(form,name,type='text')=>{const label=el('label',name);const input=el('input');input.name=name;input.type=type;input.required=true;label.append(input);form.append(label);return input};
function mount(){
 const host=document.getElementById('importazioni');if(!host||document.getElementById('ite-admin-desk'))return false;
 const panel=el('div');panel.id='ite-admin-desk';panel.className='panel';panel.append(el('h2','Registro amministrativo 4.0 — collaudo'));
 panel.append(el('p','Archivio locale di prova: non inserire dati reali. Le importazioni richiedono conferma e i documenti rimangono da verificare.'));
 const status=el('p');status.setAttribute('role','status');panel.append(status);
 const form=el('form');form.className='grid';const inputs={};for(const [name,type] of [['id','text'],['number','text'],['issued','date'],['party','text'],['taxable','number'],['vat','number']])inputs[name]=field(form,name,type);
 const typeLabel=el('label','Tipo');const type=el('select');type.name='type';for(const t of R.TYPES){const o=el('option',t);o.value=t;type.append(o)}typeLabel.append(type);form.prepend(typeLabel);
 const operator=field(form,'Operatore');const reviewed=el('label');const checkbox=el('input');checkbox.type='checkbox';checkbox.required=true;reviewed.append(checkbox,document.createTextNode(' Confermo dati fittizi e verifica manuale'));form.append(reviewed);
 const add=el('button','Registra documento di prova');add.type='submit';form.append(add);panel.append(form);
 const actions=el('div');actions.className='actions';const backup=el('button','Esporta JSON');backup.type='button';const importButton=el('button','Importa JSON revisionato');importButton.type='button';actions.append(backup,importButton);panel.append(actions);
 const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;panel.append(file);
 const summary=el('p'),listing=el('div');panel.append(summary,listing);host.append(panel);
 const showError=e=>{status.textContent='Operazione non eseguita: '+String(e.message||e)};
 function refresh(){try{const s=I.open(localStorage),a=I.reconcile(s.state);summary.textContent='Revisione '+s.state.revision+' | Documenti '+s.state.documents.length+' | Da verificare '+a.unverified.length+' | TD04 residue € '+a.summary.creditOutstanding.toFixed(2)+(s.recovered?' | Backup precedente recuperabile':'');listing.replaceChildren();for(const d of s.state.documents){const row=el('div',d.type+' · '+d.number+' · '+d.party+' · € '+d.total.toFixed(2)+' · '+(d.verified?'VERIFICATO':'DA VERIFICARE'));row.className='item';if(!d.verified){const btn=el('button','Conferma verifica');btn.type='button';btn.addEventListener('click',()=>{try{const actor=operator.value.trim();if(!actor)throw Error('OPERATORE_OBBLIGATORIO');const current=I.open(localStorage);I.save(localStorage,R.verify(current.state,current.state.revision,d.id,actor),current.state.revision);refresh()}catch(e){showError(e)}});row.append(btn)}listing.append(row)}}catch(e){showError(e)}}
 form.addEventListener('submit',event=>{event.preventDefault();try{if(!checkbox.checked)throw Error('CONFERMA_OBBLIGATORIA');const current=I.open(localStorage);const taxable=Number(inputs.taxable.value),vat=Number(inputs.vat.value);const candidate={id:inputs.id.value,type:type.value,number:inputs.number.value,issued:inputs.issued.value,party:inputs.party.value,taxable,vat,total:Math.round((taxable+vat)*100)/100};const next=R.add(current.state,current.state.revision,{...candidate,source:'MANUALE',verified:false},operator.value);I.save(localStorage,next,current.state.revision);status.textContent='Documento registrato, in attesa di verifica';refresh()}catch(e){showError(e)}});
 backup.addEventListener('click',()=>{try{const json=I.exportBackup(I.open(localStorage).state);const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=el('a');a.href=url;a.download='ite4-admin-backup-collaudo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){showError(e)}});
 importButton.addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{try{const f=file.files&&file.files[0];if(!f)return;if(f.size>5000000)throw Error('FILE_TROPPO_GRANDE');const json=await f.text();const current=I.open(localStorage),preview=I.previewImport(json,current.state);if(preview.duplicates.length||preview.duplicateDocuments.length)throw Error('DOCUMENTI_DUPLICATI');if(!root.confirm('Importare '+preview.documentCount+' documenti NON VERIFICATI nell’archivio locale di prova?'))return;I.importReviewed(localStorage,json,current.state.revision,operator.value,true);refresh()}catch(e){showError(e)}finally{file.value=''}});
 refresh();return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
root.ITEAdministrativeDesk={mount};
})(typeof window!=='undefined'?window:globalThis);
