/* Local TEST-only batch interface, uses existing finance archive. */
(function(root){'use strict';
if(!root.document||!root.ITEFinance40||!root.ITEFinanceBatch40)return;
const f=root.ITEFinance40,b=root.ITEFinanceBatch40,KEY='ite40-finance-test-v1';
function init(){
 const target=document.getElementById('ite40-finance');if(!target||document.getElementById('ite40-finance-batch'))return;
 const el=document.createElement('section');el.id='ite40-finance-batch';el.className='panel';
 const title=document.createElement('h3');title.textContent='Importazione multipla fatture TEST — anteprima e controllo duplicati';
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Solo JSON sintetico con identificativi, numeri e controparti TEST. Nessun PDF, XML o dato cliente reale.';
 const area=document.createElement('textarea');area.rows=7;area.setAttribute('aria-label','Documenti TEST in formato JSON');
 area.value=JSON.stringify([{id:'TEST-BATCH-1',number:'TEST-100',date:'2026-11-05',party:'TEST Fornitore',issuer:'ESTERNO',kind:'FATTURA',net:100,vat:22,total:122},{id:'TEST-BATCH-2',number:'TEST-101',date:'2026-11-05',party:'TEST Fornitore',issuer:'INCERTO',kind:'TD04',net:50,vat:11,total:61}],null,2);
 const preview=document.createElement('button');preview.type='button';preview.textContent='Verifica lotto';
 const commit=document.createElement('button');commit.type='button';commit.textContent='Importa lotto verificato';commit.disabled=true;
 const output=document.createElement('pre');output.style.whiteSpace='pre-wrap';output.setAttribute('role','status');
 el.append(title,hint,area,preview,commit,output);target.appendChild(el);
 let approved=null;
 function read(){return f.validate(JSON.parse(localStorage.getItem(KEY)||'null')||f.empty())}
 preview.onclick=()=>{approved=null;commit.disabled=true;try{const rows=JSON.parse(area.value),checks=b.preview(read(),rows);output.textContent=checks.map(x=>(x.index+1)+'. '+(x.valid?'OK '+x.type+' '+x.direction:'BLOCCATO '+x.error)).join('\n');if(checks.every(x=>x.valid)){approved=area.value;commit.disabled=false}}catch(e){output.textContent='Errore: '+e.message}};
 area.addEventListener('input',()=>{approved=null;commit.disabled=true});
 commit.onclick=()=>{if(!approved||approved!==area.value)return;try{const result=b.importBatch(read(),JSON.parse(approved),'DEMO',new Date().toISOString());localStorage.setItem(KEY,JSON.stringify(result.state));output.textContent='Importati '+result.imported+' documenti TEST. Aggiornare il riepilogo con un ricaricamento.';approved=null;commit.disabled=true;}catch(e){output.textContent='Importazione annullata: '+e.message}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window!=='undefined'?window:globalThis);
