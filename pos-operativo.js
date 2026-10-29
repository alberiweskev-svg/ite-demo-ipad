/* I.T.E. 4.0 - Registri operativi POS, bozza locale; nessuna attestazione di conformita'.
 * Le righe sono conservate nei campi POS esistenti: backup, revisioni e PDF
 * seguono quindi gli stessi controlli della pratica tecnica.
 */
(function(root){
'use strict';
const LIMIT=2000, MAX_ROWS=15, MAX_PART=160;
const CONFIG=Object.freeze([
 {key:'personale',title:'Personale e mansioni',labels:['Nominativo','Mansione','Formazione / abilitazione da verificare']},
 {key:'attrezzature',title:'Attrezzature e macchine',labels:['Attrezzatura','Utilizzo previsto','Controlli da verificare']},
 {key:'rischi',title:'Rischi per lavorazione',labels:['Fase di lavoro','Rischio individuato','Misura preventiva proposta']},
 {key:'dpi',title:'DPI e protezioni',labels:['Mansione / fase','DPI previsti','Protezione collettiva prevista']},
 {key:'emergenze',title:'Emergenze e primo soccorso',labels:['Scenario','Procedura prevista','Referente / presidio da verificare']}
]);
const LINE=/^• ([^|\n]*) \| ([^|\n]*) \| ([^|\n]*)$/;
function parse(value){
 if(typeof value!=='string')throw Error('Il campo POS deve essere testuale');
 const rows=[],legacy=[];
 for(const line of value.replace(/\r\n?/g,'\n').split('\n')){
  const m=LINE.exec(line);
  if(m&&m.slice(1).every(x=>x.length<=MAX_PART))rows.push(m.slice(1));
  else if(line!==''||legacy.length||value.length)legacy.push(line);
 }
 if(value==='')legacy.length=0;
 return {rows,legacy};
}
function clean(value){
 const s=String(value??'').trim();
 if(s.length>MAX_PART||/[\r\n|]/.test(s)||/[\u0000-\u001f\u007f]/.test(s))throw Error('Ogni dato deve avere massimo 160 caratteri, senza barre verticali o ritorni a capo');
 return s;
}
function serialize(parsed){
 if(!parsed||!Array.isArray(parsed.rows)||!Array.isArray(parsed.legacy)||parsed.rows.length>MAX_ROWS)throw Error('Registro POS non valido o troppo lungo');
 const rows=parsed.rows.map(row=>{
  if(!Array.isArray(row)||row.length!==3)throw Error('Riga POS non valida');
  const values=row.map(clean);
  if(!values[0]||!values[1])throw Error('Compila i primi due campi della riga');
  return '• '+values.join(' | ');
 });
 const result=[...parsed.legacy,...rows].join('\n');
 if(result.length>LIMIT)throw Error('Il campo supera 2000 caratteri: riduci le righe o usa gli allegati');
 return result;
}
function apply(value,action,index,values){
 const parsed=parse(value);
 if(action==='delete'){
  if(!Number.isInteger(index)||index<0||index>=parsed.rows.length)throw Error('Riga non trovata');
  parsed.rows.splice(index,1);
 }else if(action==='add'||action==='update'){
  const row=(Array.isArray(values)?values:[]).map(clean);
  if(row.length!==3||!row[0]||!row[1])throw Error('Compila almeno i primi due campi');
  if(action==='add'){
   if(parsed.rows.length>=MAX_ROWS)throw Error('Massimo 15 righe per registro');
   parsed.rows.push(row);
  }else{
   if(!Number.isInteger(index)||index<0||index>=parsed.rows.length)throw Error('Riga da modificare non trovata');
   parsed.rows[index]=row;
  }
  const normalized=parsed.rows.map(x=>x.slice(0,2).join('|').toLocaleLowerCase('it'));
  if(new Set(normalized).size!==normalized.length)throw Error('Riga duplicata per i primi due campi');
 }else throw Error('Azione registro POS non valida');
 return serialize(parsed);
}
function review(values){
 const counts={};for(const config of CONFIG)counts[config.key]=parse(String(values?.[config.key]||'')).rows.length;
 const warnings=[];
 if(!counts.personale)warnings.push('Nessun nominativo nel registro guidato: controllare anche il testo libero');
 if(!counts.rischi)warnings.push('Nessuna riga rischio nel registro guidato');
 if(counts.rischi&&!counts.dpi)warnings.push('Rischi presenti senza righe DPI nel registro guidato');
 if(!counts.emergenze)warnings.push('Nessuna procedura di emergenza nel registro guidato');
 return {counts,warnings};
}
function element(tag,text,className){
 const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;
}
function mount(){
 const form=document.getElementById('tech-form'),host=document.getElementById('tech-structured');
 if(!form||!host||form.elements.type?.value!=='POS'||host.querySelector('#ite-pos-registers'))return;
 const section=element('section');section.id='ite-pos-registers';section.className='panel';
 section.append(element('h4','Registri operativi POS — compilazione assistita'));
 section.append(element('p','Inserisci più lavoratori, attrezzature, rischi, DPI ed emergenze. Le righe sono aggiunte ai campi già esistenti delle 12 sezioni, e saranno salvate soltanto con «Salva con backup e storico». Il testo manuale preesistente rimane intatto. Non sono attestazioni di formazione, verifica, sicurezza o firma.','hint'));
 const refreshers=[];
 for(const cfg of CONFIG){
  const textarea=host.querySelector('[data-tech-detail="'+cfg.key+'"]');
  if(!textarea)continue;
  const details=element('details');details.className='panel';details.dataset.posRegister=cfg.key;
  const summary=element('summary',cfg.title);details.append(summary);
  const list=element('ul');list.style.paddingLeft='22px';
  const status=element('p','','hint');status.setAttribute('role','status');
  const grid=element('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:8px;margin:8px 0';
  const inputs=cfg.labels.map(label=>{
   const wrapper=element('label');wrapper.append(element('span',label));
   const input=element('input');input.type='text';input.maxLength=MAX_PART;input.style.width='100%';
   wrapper.append(input);grid.append(wrapper);return input;
  });
  const controls=element('div');controls.className='actions';
  const add=element('button','Aggiungi riga');add.type='button';
  const reset=element('button','Annulla modifica','secondary');reset.type='button';reset.hidden=true;
  controls.append(add,reset);
  let editing=-1;
  const refresh=()=>{
   const parsed=parse(textarea.value);list.replaceChildren();
   parsed.rows.forEach((row,index)=>{
    const item=element('li');item.style.margin='7px 0';
    const description=element('span',row.filter(Boolean).join(' — ')+' ');
    const edit=element('button','Modifica','secondary');edit.type='button';edit.style.margin='3px';
    const del=element('button','Rimuovi','secondary');del.type='button';del.style.margin='3px';
    edit.addEventListener('click',()=>{
     editing=index;inputs.forEach((input,i)=>input.value=row[i]);add.textContent='Aggiorna riga';reset.hidden=false;inputs[0].focus();
    });
    del.addEventListener('click',()=>{
     if(!root.confirm('Rimuovere questa riga dalla bozza POS?'))return;
     try{textarea.value=apply(textarea.value,'delete',index);textarea.dispatchEvent(new Event('input',{bubbles:true}));editing=-1;add.textContent='Aggiungi riga';reset.hidden=true;status.textContent='Riga rimossa dalla bozza; salva la pratica per confermare.';refresh();}
     catch(err){status.textContent=err.message;}
    });
    item.append(description,edit,del);list.append(item);
   });
   const count=element('small',parsed.rows.length+'/'+MAX_ROWS+' righe guidate');
   const legacy=parsed.legacy.some(x=>x.trim());
   if(legacy)count.textContent+=' · testo manuale conservato nel campo della sezione POS';
   if(!parsed.rows.length)list.append(element('li','Nessuna riga guidata.'));
   list.append(count);
  };
  add.addEventListener('click',()=>{
   try{
    const values=inputs.map(x=>x.value);
    textarea.value=apply(textarea.value,editing<0?'add':'update',editing,values);
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
    editing=-1;inputs.forEach(x=>x.value='');add.textContent='Aggiungi riga';reset.hidden=true;
    status.textContent='Riga aggiornata nella bozza. Il salvataggio avviene con la pratica tecnica.';
    refresh();
   }catch(err){status.textContent=err.message;}
  });
  reset.addEventListener('click',()=>{editing=-1;inputs.forEach(x=>x.value='');add.textContent='Aggiungi riga';reset.hidden=true;});
  textarea.addEventListener('input',()=>{if(editing<0)refresh();});
  details.append(list,grid,controls,status);section.append(details);refreshers.push(refresh);
 }
 const check=element('button','Verifica collegamenti tra registri','secondary');check.type='button';
 const report=element('p','','hint');report.setAttribute('role','status');
 check.addEventListener('click',()=>{
  const values={};for(const cfg of CONFIG)values[cfg.key]=host.querySelector('[data-tech-detail="'+cfg.key+'"]')?.value||'';
  const result=review(values);report.textContent=result.warnings.length?result.warnings.join(' · '):'Nessuna incongruenza di presenza tra i registri guidati. Restano obbligatorie le verifiche tecniche, gli allegati e le firme.';
 });
 section.append(check,report);
 host.insertBefore(section,host.firstChild);
}
function boot(){
 mount();
 const observer=new MutationObserver(()=>mount());
 observer.observe(document.body,{childList:true,subtree:true});
}
const api=Object.freeze({CONFIG,parse,serialize,apply,review});
root.ITEPosRegisters=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
}
})(typeof globalThis!=='undefined'?globalThis:this);
