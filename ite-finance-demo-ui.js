/* ITE 4.0 finance collaudo: only synthetic records, no PDF uploads. */
(function(root){'use strict';
const F=root.ITEFinanceWorkflow,I=root.ITEFinanceImport,R=root.ITEFinanceReconciliation;
if(!F||!I||!R||typeof document==='undefined')return;
const KEY='ite40-finance-demo-v1',empty=()=>({documents:[],movements:[],reconciliationHistory:[]});
const synthetic=[{id:'TEST-F-001',type:'TD01',number:'TEST-001',date:'2026-11-04',issuerVat:'03857941201',netCents:10000,vatCents:1000,totalCents:11000},{id:'TEST-PR-001',type:'PR',number:'PR-TEST-001',date:'2026-11-04',issuerVat:'03857941201',netCents:20000,vatCents:2000,totalCents:22000},{id:'TEST-NC-001',type:'TD04',number:'NC-TEST-001',date:'2026-11-04',issuerVat:'01234567890',netCents:3000,vatCents:300,totalCents:3300}];
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=c=>(c/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const now=()=>new Date().toISOString(),today=()=>new Date().toISOString().slice(0,10);
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(!v)return empty();R.check(v);if(v.documents.some(d=>!String(d.id).startsWith('TEST-')))throw Error('SOLO_DATI_FITTIZI');return v}catch(e){return empty()}}
let state=read();
function save(next){R.check(next);if(next.documents.some(d=>!String(d.id).startsWith('TEST-')))throw Error('SOLO_DATI_FITTIZI');localStorage.setItem(KEY,JSON.stringify(next));state=next;render()}
function action(fn){try{fn();message('Operazione completata')}catch(e){message('Operazione respinta: '+e.message,true)}}
function message(t,error){const el=document.getElementById('ite-finance-message');if(el){el.textContent=t;el.style.color=error?'#a03132':'#17603b'}}
function render(){
 const rows=R.overview(state),sum=I.summary(state),box=document.getElementById('ite-finance-results');if(!box)return;
 box.innerHTML='<p><strong>Documenti:</strong> '+sum.total+' · Da verificare: '+sum.toReview+' · Confermati: '+sum.confirmed+' · Acquisti: '+euro(sum.acquistiCents)+' · Vendite: '+euro(sum.venditeCents)+' · Proforma: '+euro(sum.proformaCents)+'</p>'+
 '<h3>Documenti</h3>'+ (rows.length?rows.map(r=>{const d=state.documents.find(x=>x.id===r.id);return '<div class="item"><strong>'+escape(d.number)+'</strong><small>'+escape(d.kind)+' / '+escape(d.direction)+' · '+euro(d.totalCents)+' · '+(d.reviewed?'VERIFICATO':'DA VERIFICARE')+' · '+escape(r.status)+' · residuo '+euro(r.remainingCents)+'</small></div>'}).join(''):'<p>Nessun documento di prova.</p>')+
 '<h3>Movimenti</h3>'+(state.movements.length?state.movements.map(m=>'<div class="item">'+escape(m.reference)+' · '+euro(m.amountCents)+' · '+escape(m.direction)+' · '+escape(m.documentId||'NON COLLEGATO')+'</div>').join(''):'<p>Nessun movimento.</p>');
 const select=document.getElementById('ite-finance-doc');select.innerHTML=state.documents.map(d=>'<option value="'+escape(d.id)+'">'+escape(d.number)+'</option>').join('');
 const mov=document.getElementById('ite-finance-mov');mov.innerHTML=state.movements.filter(m=>!m.documentId).map(m=>'<option value="'+escape(m.id)+'">'+escape(m.reference)+'</option>').join('');
}
function build(){
 if(document.getElementById('ite-finance-demo'))return;
 const section=document.createElement('section');section.id='ite-finance-demo';section.className='panel';section.innerHTML=
 '<h2>Contabilità 4.0 — collaudo integrato</h2><p class="hint">Solo dati sintetici TEST-. Nessun PDF, XML reale o dato cliente viene acquisito. Archivio locale del browser, non sincronizzato.</p>'+
 '<div class="actions"><button id="ite-finance-seed">Carica esempi fittizi</button><button id="ite-finance-reset" class="secondary">Azzera archivio di prova</button><button id="ite-finance-export" class="secondary">Esporta JSON di prova</button></div>'+
 '<fieldset><legend>Importazione controllata JSON</legend><label>JSON con elenco documenti TEST- (massimo 200)<textarea id="ite-finance-json" rows="4" placeholder="[{...}]"></textarea></label><div class="actions"><button id="ite-finance-preview">Verifica lotto</button><button id="ite-finance-import">Importa lotto verificato</button></div><pre id="ite-finance-preview-result"></pre></fieldset>'+
 '<fieldset><legend>Revisione e riconciliazione</legend><div class="grid"><label>Documento<select id="ite-finance-doc"></select></label><label>Operatore fittizio<input id="ite-finance-operator" value="TECNICO TEST"></label><label>Motivo revisione / distacco<input id="ite-finance-reason" value="Verifica dimostrativa"></label></div><div class="actions"><button id="ite-finance-confirm">Conferma documento</button><button id="ite-finance-reject" class="secondary">Da verificare</button></div><div class="grid"><label>Riferimento movimento<input id="ite-finance-reference" value="TEST-BONIFICO-001"></label><label>Importo movimento in euro<input id="ite-finance-amount" type="number" min="0.01" step="0.01" value="50.00"></label><label>Direzione<select id="ite-finance-direction"><option>ENTRATA</option><option>USCITA</option></select></label><label>Movimento da collegare<select id="ite-finance-mov"></select></label></div><div class="actions"><button id="ite-finance-register">Registra movimento</button><button id="ite-finance-match">Collega movimento</button></div></fieldset>'+
 '<p id="ite-finance-message" role="status"></p><div id="ite-finance-results"></div>';
 const wrap=document.querySelector('.wrap')||document.querySelector('main')||document.body;wrap.appendChild(section);
 const $=id=>document.getElementById('ite-finance-'+id);
 const op=()=> $('operator').value.trim(),doc=()=> $('doc').value;
 $('seed').onclick=()=>action(()=>save(I.importBatch(empty(),synthetic,'MANUALE')));
 $('reset').onclick=()=>action(()=>save(empty()));
 const parse=()=>{const data=JSON.parse($('json').value);if(!Array.isArray(data)||data.some(x=>!String(x.id||'').startsWith('TEST-')))throw Error('SOLO_DOCUMENTI_TEST');return data};
 $('preview').onclick=()=>action(()=>{$('preview-result').textContent=JSON.stringify(I.preview(state,parse(),'MANUALE'),null,2)});
 $('import').onclick=()=>action(()=>save(I.importBatch(state,parse(),'MANUALE')));
 $('confirm').onclick=()=>action(()=>save(I.review(state,doc(),op(),now(),'CONFERMA','')));
 $('reject').onclick=()=>action(()=>save(I.review(state,doc(),op(),now(),'DA_VERIFICARE',$('reason').value)));
 $('register').onclick=()=>action(()=>{const val=Number($('amount').value),c=Math.round(val*100);if(!Number.isFinite(val)||val<=0||Math.abs(c/100-val)>0.000001)throw Error('IMPORTO_NON_VALIDO');save(R.register(state,{id:'TEST-M-'+Date.now(),date:today(),amountCents:c,reference:$('reference').value,direction:$('direction').value}))});
 $('match').onclick=()=>action(()=>save(R.match(state,$('mov').value,doc(),op(),now())));
 $('export').onclick=()=>action(()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ite40-finance-TEST.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 render();
}
root.ITEFinanceDemo={empty,synthetic,read};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})(typeof window!=='undefined'?window:globalThis);
