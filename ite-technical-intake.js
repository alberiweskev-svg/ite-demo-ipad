/* I.T.E. 4.0 — technical document intake: metadata only, no PDF bytes stored. */
(function(root){'use strict';
const KEY='ite40_technical_documents_demo_v1',KINDS=['DICO','DIRI','GAS','POS'];
const clean=v=>String(v??'').trim().slice(0,180);
function validate(x){if(!x||!KINDS.includes(x.kind))throw Error('TIPO_TECNICO_NON_VALIDO');
for(const k of ['id','clientId','siteId','operator','number','issued'])if(!clean(x[k]))throw Error('CAMPO_OBBLIGATORIO_'+k);
if(!/^\d{4}-\d{2}-\d{2}$/.test(x.issued)||Number.isNaN(Date.parse(x.issued+'T00:00:00Z')))throw Error('DATA_NON_VALIDA');
if(!x.confirmed)throw Error('VERIFICA_UMANA_OBBLIGATORIA');
return {id:clean(x.id),kind:x.kind,clientId:clean(x.clientId),siteId:clean(x.siteId),plantId:clean(x.plantId),deviceId:clean(x.deviceId),number:clean(x.number),issued:x.issued,operator:clean(x.operator),filename:clean(x.filename),status:'DA_VERIFICARE',createdAt:new Date().toISOString()}}
function append(records,input){const doc=validate(input);if(records.some(x=>x.id===doc.id||x.kind===doc.kind&&x.number===doc.number&&x.clientId===doc.clientId))throw Error('DOCUMENTO_DUPLICATO');return [...records,doc]}
function parse(raw){if(!raw)return [];let data;try{data=JSON.parse(raw)}catch(_){throw Error('ARCHIVIO_DANNEGGIATO')}if(!Array.isArray(data)||data.length>5000)throw Error('ARCHIVIO_NON_VALIDO');return data}
function mount(){if(typeof document==='undefined')return false;const host=document.getElementById('importazioni');if(!host||document.getElementById('ite-technical-intake'))return false;
const box=document.createElement('section');box.id='ite-technical-intake';box.className='panel';
const heading=document.createElement('h2');heading.textContent='Archivio documenti tecnici — Di.Co., Di.Ri., GAS, POS';
const note=document.createElement('p');note.textContent='Collaudo con dati fittizi: conserva solo riferimenti e metadati nel browser, non PDF. Non sostituisce i moduli 2.7.5.';
const form=document.createElement('form');const fields={};
const labels={kind:'Tipo documento',id:'ID documento',clientId:'ID cliente',siteId:'ID sede',plantId:'ID impianto (facoltativo)',deviceId:'ID apparecchiatura (facoltativo)',number:'Numero documento',issued:'Data emissione',operator:'Operatore',filename:'Nome file PDF (solo riferimento)'};
for(const [k,label] of Object.entries(labels)){const wrap=document.createElement('label');wrap.textContent=label;const inp=document.createElement(k==='kind'?'select':'input');inp.name=k;if(k==='kind'){for(const value of KINDS){const o=document.createElement('option');o.value=value;o.textContent=value;inp.append(o)}}else{inp.type=k==='issued'?'date':'text';inp.required=!['plantId','deviceId','filename'].includes(k)}wrap.append(inp);form.append(wrap);fields[k]=inp}
const confirmation=document.createElement('label');const check=document.createElement('input');check.type='checkbox';confirmation.append(check,document.createTextNode(' Confermo verifica dei dati sul documento originale fittizio'));form.append(confirmation);
const submit=document.createElement('button');submit.type='submit';submit.textContent='Archivia riferimento tecnico';const status=document.createElement('p');status.setAttribute('role','status');const list=document.createElement('div');form.append(submit,status);box.append(heading,note,form,list);host.append(box);
function render(){list.replaceChildren();try{for(const d of parse(localStorage.getItem(KEY))){const p=document.createElement('p');p.textContent=d.kind+' '+d.number+' — cliente '+d.clientId+' / sede '+d.siteId+' — '+d.status;list.append(p)}}catch(e){status.textContent=e.message}}
form.addEventListener('submit',e=>{e.preventDefault();try{const records=parse(localStorage.getItem(KEY));const input=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value]));input.confirmed=check.checked;const next=append(records,input);localStorage.setItem(KEY,JSON.stringify(next));status.textContent='Riferimento tecnico registrato, DA VERIFICARE';form.reset();render()}catch(err){status.textContent='Registrazione bloccata: '+err.message}});render();return true}
const api=Object.freeze({KEY,KINDS,validate,append,parse,mount});root.ITETechnicalIntake=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
