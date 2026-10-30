/* I.T.E. 4.0 — verifica incrociata dei registri POS. SOLO BOZZA.
   Nessuna certificazione, firma, modifica automatica o trasmissione dati. */
(function(root){'use strict';
const KEYS=['personale','attrezzature','rischi','dpi','emergenze'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const norm=v=>clean(v).normalize('NFKC').toLocaleLowerCase('it');
function audit(values){
 if(!root.ITEPosRegisters?.parse)throw Error('Registri POS non disponibili');
 const rows={},legacy={},issues=[],links=[];
 const add=(severity,section,message,detail='')=>{
  issues.push({severity,section,message,detail});
  if(issues.length>500)throw Error('Troppi controlli POS: ridurre i dati');
 };
 for(const key of KEYS){
  if(values?.[key]!==undefined&&values?.[key]!==null&&typeof values[key]!=='string')throw Error('Il campo POS deve essere testuale');
  const raw=String(values?.[key]??'');
  if(raw.length>2000)throw Error('Registro '+key+' oltre il limite POS');
  const parsed=root.ITEPosRegisters.parse(raw);
  rows[key]=parsed.rows;legacy[key]=parsed.legacy.join('\n').trim();
  if(legacy[key])add('Informativa',key,'Testo libero da controllare manualmente','Il controllo automatico non interpreta il testo preesistente');
  if(parsed.rows.length>15)add('Prioritaria',key,'Troppe righe guidate','Massimo 15 righe per registro');
  const seen=new Set();
  for(const row of parsed.rows){
   const keyRow=norm(row[0])+'|'+norm(row[1]);
   if(seen.has(keyRow))add('Operativa',key,'Riga duplicata',row[0]+' / '+row[1]);
   seen.add(keyRow);
  }
 }
 const counts=Object.fromEntries(KEYS.map(k=>[k,rows[k].length]));
 if(!counts.personale)add('Prioritaria','personale','Personale non registrato','Verificare anche le informazioni libere e gli allegati');
 if(!counts.rischi)add('Prioritaria','rischi','Nessuna fase con rischio guidato','La valutazione dei rischi resta a cura del responsabile');
 if(!counts.dpi)add('Prioritaria','dpi','Nessun DPI o protezione guidata','Verificare misure collettive e individuali');
 if(!counts.emergenze)add('Prioritaria','emergenze','Nessuna procedura di emergenza guidata','Verificare il piano di cantiere');
 for(const r of rows.personale)if(!clean(r[2]))add('Operativa','personale','Formazione o abilitazione non descritta',r[0]);
 for(const r of rows.attrezzature)if(!clean(r[2]))add('Operativa','attrezzature','Controlli attrezzatura non descritti',r[0]);
 for(const r of rows.rischi)if(!clean(r[2]))add('Prioritaria','rischi','Misura preventiva non descritta',r[0]+' — '+r[1]);
 for(const r of rows.emergenze)if(!clean(r[2]))add('Operativa','emergenze','Referente o presidio non indicato',r[0]);
 const riskPhases=new Set(rows.rischi.map(r=>norm(r[0])).filter(Boolean));
 const dpiPhases=new Set(rows.dpi.map(r=>norm(r[0])).filter(Boolean));
 for(const r of rows.rischi){
  const matched=dpiPhases.has(norm(r[0]));
  links.push({phase:r[0],risk:r[1],measure:r[2],dpiMatched:matched});
  if(!matched)add('Operativa','rischi / dpi','Fase senza corrispondenza testuale nei DPI',r[0]+' — '+r[1]);
 }
 for(const r of rows.dpi){
  if(!clean(r[2]))add('Operativa','dpi','Protezione collettiva non descritta',r[0]);
  if(!riskPhases.has(norm(r[0])))add('Operativa','dpi / rischi','DPI senza fase omonima nel registro rischi',r[0]);
 }
 if(counts.rischi&&counts.personale)add('Informativa','mansioni','Assegnazione personale alle fasi da verificare','Le mansioni non sono collegate automaticamente alle fasi');
 if(counts.attrezzature&&counts.rischi)add('Informativa','attrezzature','Compatibilità attrezzature e rischi da verificare','L’uso previsto non attesta un controllo eseguito');
 return {counts,issues,links,legacyPresent:KEYS.filter(k=>Boolean(legacy[k])),
  summary:{prioritarie:issues.filter(x=>x.severity==='Prioritaria').length,operative:issues.filter(x=>x.severity==='Operativa').length,informative:issues.filter(x=>x.severity==='Informativa').length}};
}
function render(r){
 const count=KEYS.map(k=>'<li>'+esc(k)+': '+r.counts[k]+' righe</li>').join('');
 const items=r.issues.map(x=>'<li><strong>'+esc(x.severity)+' — '+esc(x.section)+'</strong>: '+esc(x.message)+(x.detail?' · '+esc(x.detail):'')+'</li>').join('');
 const matrix=r.links.map(x=>'<tr><td>'+esc(x.phase)+'</td><td>'+esc(x.risk)+'</td><td>'+esc(x.measure)+'</td><td>'+(x.dpiMatched?'Corrispondenza testuale':'Da verificare')+'</td></tr>').join('');
 return '<div class="panel"><h4>Controllo incrociato POS — bozza non certificativa</h4>'+
  '<p>Prioritarie '+r.summary.prioritarie+' · operative '+r.summary.operative+' · informative '+r.summary.informative+'</p>'+
  '<details><summary>Registri esaminati</summary><ul>'+count+'</ul></details>'+
  '<details open><summary>Verifiche da eseguire ('+r.issues.length+')</summary><ul>'+(items||'<li>Nessuna anomalia formale individuata: restano necessarie le verifiche sul campo.</li>')+'</ul></details>'+
  '<details><summary>Collegamenti fasi / DPI ('+r.links.length+')</summary><table><thead><tr><th>Fase</th><th>Rischio</th><th>Misura proposta</th><th>DPI</th></tr></thead><tbody>'+matrix+'</tbody></table></details>'+
  '<p class="hint">Le corrispondenze sono solo testuali: non attestano idoneità DPI, formazione, sicurezza, verifiche o conformità normativa. I testi liberi non vengono interpretati.</p></div>';
}
function csv(r){
 const lines=[['Sezione','Gravità','Controllo','Dettaglio'],...r.issues.map(x=>[x.section,x.severity,x.message,x.detail]),
  ...r.links.map(x=>['Fase / DPI',x.dpiMatched?'Testo corrispondente':'Da verificare',x.phase,x.risk])];
 const cell=v=>{let s=String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ');if(/^[\s\uFEFF]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+lines.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
function printable(r,reference=''){
 const body=render(r);
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;"><title>ITE POS — verifica interna</title>'+
 '<style>@page{size:A4;margin:17mm}body{font:12px Arial,sans-serif;color:#182d40}h1{font-size:20px}h4{font-size:15px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aab;padding:5px;vertical-align:top;overflow-wrap:anywhere}li{margin:5px 0}details{display:block;margin:12px 0}summary{font-weight:bold}.hint{font-size:11px}header{border-bottom:2px solid #385b4d;margin-bottom:15px}</style></head><body>'+
 '<header><h1>I.T.E. — verifica interna registri POS</h1><p>Riferimento: '+esc(reference||'Non indicato')+'</p><strong>BOZZA NON FIRMATA — NON ATTESTA CONFORMITÀ O SICUREZZA</strong></header>'+body+
 '<footer><p>Documento preparatorio non ufficiale. Verificare con personale competente, originali, firme e prescrizioni applicabili. File non cifrato.</p></footer></body></html>';
}
function valuesFrom(host){
 const values={};for(const key of KEYS)values[key]=host.querySelector('[data-tech-detail="'+key+'"]')?.value||'';
 return values;
}
function download(text,name,mime){
 const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function mount(){
 const form=document.getElementById('tech-form'),host=document.getElementById('tech-structured');
 if(!form||!host||form.elements.type?.value!=='POS'||host.querySelector('#ite-pos-audit'))return;
 const section=document.createElement('section');section.id='ite-pos-audit';section.className='panel';
 const heading=document.createElement('h4');heading.textContent='Verifica incrociata POS e report A4';section.append(heading);
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Analizza personale, attrezzature, rischi, DPI ed emergenze. Non modifica i campi della pratica, non salva e non certifica i controlli.';section.append(hint);
 const actions=document.createElement('div');actions.className='actions';
 const run=document.createElement('button');run.id='ite-pos-audit-run';run.type='button';run.textContent='Verifica registri';
 const exportCsv=document.createElement('button');exportCsv.id='ite-pos-audit-csv';exportCsv.type='button';exportCsv.className='secondary';exportCsv.textContent='Esporta verifiche CSV';
 const exportHtml=document.createElement('button');exportHtml.id='ite-pos-audit-a4';exportHtml.type='button';exportHtml.className='secondary';exportHtml.textContent='Scheda A4 stampabile';
 actions.append(run,exportCsv,exportHtml);section.append(actions);
 const output=document.createElement('div');output.id='ite-pos-audit-results';output.setAttribute('role','status');section.append(output);
 const report=()=>audit(valuesFrom(host));
 run.addEventListener('click',()=>{try{output.innerHTML=render(report());}catch(e){output.textContent=e.message;}});
 const exportReport=(kind)=>{
  try{
   if(!root.confirm('Il documento esportato contiene dati POS NON cifrati. Confermare?'))return;
   const r=report(),reference=form.elements.reference?.value||'';
   if(kind==='csv')download(csv(r),'ITE_POS_verifiche_bozza.csv','text/csv;charset=utf-8');
   else download(printable(r,reference),'ITE_POS_verifica_bozza_A4.html','text/html;charset=utf-8');
  }catch(e){output.textContent=e.message;}
 };
 exportCsv.addEventListener('click',()=>exportReport('csv'));
 exportHtml.addEventListener('click',()=>exportReport('html'));
 host.insertBefore(section,host.firstChild);
}
function boot(){
 mount();
 const observer=new MutationObserver(()=>mount());observer.observe(document.body,{childList:true,subtree:true});
 root.addEventListener('ite-pagechange',mount);
}
const api=Object.freeze({audit,render,csv,printable,valuesFrom});
root.ITEPosAudit=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
}
})(typeof window!=='undefined'?window:globalThis);
