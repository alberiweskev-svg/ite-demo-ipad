/* I.T.E. 4.0 - registro documenti tecnici integrato, esclusivamente dati sintetici. */
(function(root){'use strict';
const M=root.ITETechnicalRegister, Intake=root.ITEPdfIntake;
if(!M||typeof document==='undefined')return;
const KEY='ite40-technical-demo-v1';
const hierarchy={clients:[{id:'TEST-CLIENTE',sites:[{id:'TEST-SEDE',plants:[{id:'TEST-IMPIANTO',devices:[{id:'TEST-APPARECCHIO'}]}]}]}]};
const types=['DICO_ELETTRICA','DICO_IDRICA','DIRI','ALLEGATI_GAS','POS','CAD'];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const empty=()=>({records:[]});
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(!v||!Array.isArray(v.records)||v.records.some(r=>!String(r.id).startsWith('TEST-')))return empty();return v}catch{return empty()}}
let state=read();
const $=id=>document.getElementById('ite-tech-'+id);
function message(s,error=false){$('message').textContent=s;$('message').style.color=error?'#a03132':'#17603b'}
function save(next){if(next.records.some(r=>!String(r.id).startsWith('TEST-')))throw Error('SOLO_DATI_FITTIZI');localStorage.setItem(KEY,JSON.stringify(next));state=next;render()}
function act(fn){try{fn();message('Operazione registrata')}catch(e){message('Operazione respinta: '+e.message,true)}}
function render(){const rows=M.overview(state);$('count').textContent=rows.length+' documenti · '+rows.filter(x=>x.status==='VERIFICATO').length+' verificati';
$('records').innerHTML=rows.length?rows.map(r=>'<div class="item"><strong>'+escape(r.number)+'</strong><small>'+escape(r.kind)+' · '+escape(r.status)+' · '+escape(r.clientId)+' / '+escape(r.siteId)+' · Allegati: '+r.attachments+' · Revisione: '+r.revision+'</small></div>').join(''):'<p>Nessun documento di collaudo.</p>';
$('record').innerHTML=rows.map(r=>'<option value="'+escape(r.id)+'">'+escape(r.number)+' · '+escape(r.status)+'</option>').join('');
}
function build(){if($('panel'))return;
const el=document.createElement('section');el.id='ite-tech-panel';el.className='panel';el.innerHTML=
'<h2>Registro tecnico 4.0 — Di.Co., Di.Ri., GAS, POS e CAD</h2>'+
'<p class="hint">Ambiente di prova: solo metadati e anagrafiche TEST-. Non caricare PDF o dati reali. Questo registro non sostituisce i moduli 2.7.5.</p>'+
'<fieldset><legend>Importazione testo PDF simulato (solo TEST)</legend><p class="hint">Incolla esclusivamente testo sintetico. Nessun PDF viene letto, trasmesso o archiviato. La verifica umana resta obbligatoria.</p><label>Testo estratto simulato<textarea id="ite-tech-pdf-text" rows="5">DICHIARAZIONE TEST-DEMO\nNumero: TEST-999\nData: 04/11/2026\nCommittente: TEST Cliente\nIndirizzo: TEST Via Fittizia 1\nImpianto: TEST idrico</textarea></label><div class="actions"><button id="ite-tech-pdf-preview">Anteprima campi</button><button id="ite-tech-pdf-import" class="secondary">Importa in bozza</button></div><pre id="ite-tech-pdf-result" style="white-space:pre-wrap"></pre></fieldset>'+
'<div class="actions"><button id="ite-tech-example">Inserisci lotto dimostrativo</button><button id="ite-tech-reset" class="secondary">Azzera registro TEST</button></div>'+
'<fieldset><legend>Nuovo documento collegato all’anagrafica fittizia</legend><div class="grid">'+
'<label>Identificativo TEST-<input id="ite-tech-id" value="TEST-DOC-001"></label>'+
'<label>Tipologia<select id="ite-tech-kind">'+types.map(t=>'<option>'+t+'</option>').join('')+'</select></label>'+
'<label>Numero<input id="ite-tech-number" value="TEST-001"></label>'+
'<label>Data<input id="ite-tech-date" type="date" value="2026-11-04"></label></div>'+
'<p class="hint">Collegamento: TEST-CLIENTE → TEST-SEDE → TEST-IMPIANTO → TEST-APPARECCHIO</p>'+
'<button id="ite-tech-add">Registra documento</button></fieldset>'+
'<fieldset><legend>Verifica, revisioni e allegati (solo descrizioni)</legend><div class="grid">'+
'<label>Documento<select id="ite-tech-record"></select></label>'+
'<label>Operatore<input id="ite-tech-operator" value="TECNICO TEST"></label>'+
'<label>Motivazione<input id="ite-tech-reason" value="Revisione dimostrativa"></label>'+
'<label>Tipo allegato<select id="ite-tech-attachment-kind"><option>SCHEMA</option><option>MATERIALI</option><option>PROVE</option><option>ALLEGATO_OBBLIGATORIO</option><option>ALTRO</option></select></label>'+
'<label>Etichetta allegato<input id="ite-tech-attachment-label" value="Schema di prova"></label></div>'+
'<div class="actions"><button id="ite-tech-confirm">Conferma</button><button id="ite-tech-reject" class="secondary">Da correggere</button><button id="ite-tech-resubmit" class="secondary">Ripresenta</button><button id="ite-tech-reopen" class="secondary">Riapri</button><button id="ite-tech-attach" class="secondary">Aggiungi metadati allegato</button></div></fieldset>'+
'<p id="ite-tech-message" role="status"></p><p id="ite-tech-count"></p><div id="ite-tech-records"></div>';
(document.querySelector('.wrap')||document.querySelector('main')||document.body).appendChild(el);
const raw=()=>({id:$('id').value,kind:$('kind').value,number:$('number').value,date:$('date').value,clientId:'TEST-CLIENTE',siteId:'TEST-SEDE',plantId:'TEST-IMPIANTO',deviceId:'TEST-APPARECCHIO'});
$('add').onclick=()=>act(()=>save(M.addBatch(state,[raw()],hierarchy)));
$('example').onclick=()=>act(()=>save(M.addBatch(state,types.map((kind,i)=>({...raw(),id:'TEST-BATCH-'+kind,kind,number:'TEST-'+String(i+1).padStart(3,'0')})),hierarchy)));
$('reset').onclick=()=>act(()=>save(empty()));
const transition=action=>act(()=>save(M.transition(state,$('record').value,action,$('operator').value,new Date().toISOString(),$('reason').value)));
$('confirm').onclick=()=>transition('CONFERMA');$('reject').onclick=()=>transition('RESPINGI');$('resubmit').onclick=()=>transition('RIPRESENTA');$('reopen').onclick=()=>transition('RIAPRI');
$('attach').onclick=()=>act(()=>save(M.attachMetadata(state,$('record').value,{id:'TEST-ATT-'+Date.now(),kind:$('attachment-kind').value,label:$('attachment-label').value})));
if(Intake){const intakeItem=()=>({...raw(),id:'TEST-PDF-'+$('id').value.replace(/[^A-Z0-9-]/gi,'').slice(0,30),text:$('pdf-text').value});
$('pdf-preview').onclick=()=>act(()=>{$('pdf-result').textContent=JSON.stringify(Intake.parse($('pdf-text').value,$('kind').value),null,2)});
$('pdf-import').onclick=()=>act(()=>save(Intake.register(state,[intakeItem()],hierarchy,M,'TECNICO TEST',new Date().toISOString())));
}else{$('pdf-preview').disabled=true;$('pdf-import').disabled=true;}
render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})(typeof window!=='undefined'?window:globalThis);
