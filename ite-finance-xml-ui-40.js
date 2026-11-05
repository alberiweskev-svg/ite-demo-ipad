/* Acquisizione locale XML sintetici TEST nella stessa contabilità dimostrativa. */
(function(root){'use strict';if(!root.document||!root.ITEFinanceXML40||!root.ITEFinanceBatch40||!root.ITEFinance40)return;
const KEY='ite40-finance-test-v1',x=root.ITEFinanceXML40,b=root.ITEFinanceBatch40,f=root.ITEFinance40;
function start(){const host=document.getElementById('ite40-finance');if(!host||document.getElementById('ite40-finance-xml'))return;
const section=document.createElement('section');section.id='ite40-finance-xml';section.className='panel';
const title=document.createElement('h3');title.textContent='FatturaPA XML — importazione locale TEST';
const hint=document.createElement('p');hint.className='hint';hint.textContent='Solo XML sintetici TEST; file letto nel browser, non inviato a server. Verifica obbligatoria prima di importare. Non selezionare fatture reali.';
const file=document.createElement('input');file.type='file';file.accept='.xml,text/xml,application/xml';file.setAttribute('aria-label','Seleziona XML sintetico TEST');
const preview=document.createElement('button');preview.type='button';preview.textContent='Controlla XML';
const commit=document.createElement('button');commit.type='button';commit.textContent='Importa XML TEST';commit.disabled=true;
const output=document.createElement('pre');output.setAttribute('role','status');output.style.whiteSpace='pre-wrap';
section.append(title,hint,file,preview,commit,output);host.appendChild(section);let ready=null;
function read(){return f.validate(JSON.parse(localStorage.getItem(KEY)||'null')||f.empty())}
file.addEventListener('change',()=>{ready=null;commit.disabled=true;output.textContent=''});
preview.onclick=async()=>{ready=null;commit.disabled=true;try{const selected=file.files&&file.files[0];if(!selected||selected.size>500000||!/\.xml$/i.test(selected.name))throw Error('SELEZIONARE_XML_TEST_MAX_500KB');
const content=await selected.text(),row=x.parse(content,'TEST-XML-'+Date.now().toString(36));const checks=b.preview(read(),[row]);if(!checks[0].valid)throw Error(checks[0].error);
ready={row,file:selected};commit.disabled=false;output.textContent='Anteprima: '+row.number+' | '+row.kind+' | '+row.issuer+' | '+row.party+' | € '+row.total.toFixed(2)+' — pronto per importazione TEST';}
catch(e){output.textContent='Bloccato: '+e.message}};
commit.onclick=()=>{if(!ready||file.files[0]!==ready.file)return;try{const result=b.importBatch(read(),[ready.row],'DEMO',new Date().toISOString());localStorage.setItem(KEY,JSON.stringify(result.state));root.dispatchEvent(new CustomEvent('ite40:finance-changed',{detail:{source:'xml-test',count:1}}));output.textContent='XML TEST importato nel registro dimostrativo';ready=null;commit.disabled=true}catch(e){output.textContent='Non importato: '+e.message}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
