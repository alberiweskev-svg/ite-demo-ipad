/* I.T.E. 4.0 — fascicolo intervento: sola lettura, non firmato. */
(function(root){'use strict';
const eq=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(a,id)=>(a||[]).find(x=>eq(x.id,id));
const clean=v=>String(v??'').slice(0,2000);
function parse(value,label,max=150){
 if(!value)return [];
 let rows;try{rows=JSON.parse(value)}catch{throw Error('Registro '+label+' non leggibile.');}
 if(!Array.isArray(rows)||rows.length>max)throw Error('Registro '+label+' non valido.');
 return rows;
}
function build(core,commerce,id){
 if(!core||!Array.isArray(core.interventi))throw Error('Archivio interventi non disponibile.');
 const job=get(core.interventi,id);
 if(!job||job.appointment!=='1')throw Error('Intervento da calendario non disponibile.');
 const client=get(core.clienti,job.client_id);
 if(!client)throw Error('Cliente intervento mancante.');
 const site=job.cantiere_id?get(core.cantieri,job.cantiere_id):null;
 if(job.cantiere_id&&(!site||!eq(site.client_id,client.id)))throw Error('Cantiere associato a cliente diverso.');
 const device=job.apparecchiatura_id?get(core.apparecchiature,job.apparecchiatura_id):null;
 if(job.apparecchiatura_id&&!device)throw Error('Apparecchiatura mancante.');
 const plant=device?get(core.impianti,device.impianto_id):job.impianto_id?get(core.impianti,job.impianto_id):null;
 if((device&&!plant)||(job.impianto_id&&!plant))throw Error('Impianto mancante.');
 if(job.impianto_id&&plant&&!eq(plant.id,job.impianto_id))throw Error('Impianto e apparecchiatura discordanti.');
 const property=plant?get(core.immobili,plant.immobile_id):job.immobile_id?get(core.immobili,job.immobile_id):null;
 if((plant&&!property)||(job.immobile_id&&!property))throw Error('Sede mancante.');
 if(property&&!eq(property.client_id,client.id))throw Error('Sede di altro cliente.');
 if(job.immobile_id&&property&&!eq(job.immobile_id,property.id))throw Error('Sede e impianto discordanti.');
 if(site?.immobile_id&&property&&!eq(site.immobile_id,property.id))throw Error('Cantiere e sede discordanti.');
 const assigned=parse(job.assigned_operators,'operatori',40),operators=[];
 for(const a of assigned){
  const p=get(core.clienti,a?.operator_id);
  if(!p||operators.some(x=>eq(x.id,p.id)))throw Error('Operatore assegnato mancante o duplicato.');
  operators.push({id:String(p.id),name:clean(p.name),role:clean(a.role||'Operatore')});
 }
 const sessions=parse(job.work_sessions,'accessi'),accesses=[];
 let minutes=0,open=0;
 for(const s of sessions){
  const p=get(core.clienti,s?.operator_id);
  if(!p||!operators.some(x=>eq(x.id,p.id))||!Number.isFinite(Date.parse(s.arrived_at)))throw Error('Accesso non coerente con gli operatori.');
  let duration=null;
  if(s.departed_at){
   const diff=Date.parse(s.departed_at)-Date.parse(s.arrived_at);
   if(!Number.isFinite(diff)||diff<0||diff>1209600000)throw Error('Orari non validi.');
   duration=Math.round(diff/60000);minutes+=duration;
  }else open++;
  accesses.push({name:clean(p.name),start:s.arrived_at,end:s.departed_at||'',minutes:duration});
 }
 const ledger=commerce?.settings?.jobMaterialUsage||[];
 if(!Array.isArray(ledger))throw Error('Registro materiali non valido.');
 const materials=[];let reversed=0;
 for(const m of ledger){
  if(!eq(m?.jobId,job.id))continue;
  if(!eq(m.clientId,client.id)||!eq(m.siteId,site?.id||''))throw Error('Materiale collegato a cliente o cantiere diverso.');
  if(!Number.isFinite(Number(m.quantity))||Number(m.quantity)<=0)throw Error('Quantità materiale non valida.');
  if(m.reversedAt){reversed++;continue;}
  materials.push({name:clean(m.articleLabel||get(commerce.articles,m.articleId)?.description||'Materiale'),quantity:Number(m.quantity),unit:clean(m.unit||'pz'),date:clean(m.date),note:clean(m.note)});
 }
 if(materials.length+reversed>300)throw Error('Troppi consumi.');
 const drafts=commerce?.settings?.technicalDrafts||[],practices=[];
 if(!Array.isArray(drafts))throw Error('Pratiche non disponibili.');
 for(const d of drafts){
  if(!eq(d?.interventionId,job.id))continue;
  if(!eq(d.clientId,client.id))throw Error('Pratica tecnica di altro cliente.');
  practices.push({type:clean(d.type||'Pratica'),reference:clean(d.reference),status:clean(d.status||'Bozza')});
 }
 if(practices.length>100)throw Error('Troppe pratiche.');
 const warnings=[];
 if(!job.description?.trim())warnings.push('Descrizione lavori assente.');
 if(!job.outcome?.trim())warnings.push('Esito da completare.');
 if(job.workflow_status!=='Chiuso')warnings.push('Intervento non chiuso: rapporto provvisorio.');
 if(!operators.length)warnings.push('Nessun operatore assegnato.');
 if(!sessions.length)warnings.push('Nessun accesso orario registrato.');
 if(open)warnings.push(open+' accessi aperti, esclusi dal totale.');
 if(!materials.length)warnings.push('Nessun consumo registrato: non equivale a consumo zero.');
 if(!practices.length)warnings.push('Nessuna pratica tecnica collegata: verificare se necessaria.');
 if(!device)warnings.push('Apparecchiatura non collegata.');
 const revision=parse(job.revision_audit,'revisioni',500).length;
 return {id:String(job.id),client:clean(client.name),address:clean(property?.name||site?.address),site:clean(site?.name),plant:clean(plant?.name),device:clean([device?.brand,device?.model,device?.serial].filter(Boolean).join(' · ')),kind:clean(job.kind),date:clean(job.date||job.scheduled_start?.slice(0,10)),status:clean(job.workflow_status),description:clean(job.description),outcome:clean(job.outcome),operators,accesses,minutes,open,materials,reversed,practices,revision,warnings};
}
function csvCell(value){let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csv(r){
 const lines=[['Sezione','Voce','Valore'],['Intervento','Numero',r.id],['Cliente','Nominativo',r.client],['Sede','Indirizzo',r.address],['Cantiere','Descrizione',r.site],['Impianto','Descrizione',r.plant],['Apparecchiatura','Modello e matricola',r.device],['Intervento','Tipologia',r.kind],['Intervento','Data',r.date],['Intervento','Stato',r.status],['Intervento','Lavori',r.description],['Intervento','Esito',r.outcome],['Tempi','Minuti completati',r.minutes],['Tempi','Accessi aperti',r.open],['Materiali','Storni',r.reversed],['Revisioni','Eventi',r.revision]];
 for(const o of r.operators)lines.push(['Operatori',o.name,o.role]);
 for(const a of r.accesses)lines.push(['Accessi',a.name,a.start+' / '+(a.end||'APERTO')+' / '+(a.minutes===null?'non conteggiato':a.minutes+' min')]);
 for(const m of r.materials)lines.push(['Materiali',m.name,m.quantity+' '+m.unit+' '+m.note]);
 for(const p of r.practices)lines.push(['Pratiche',p.type,p.reference+' · '+p.status]);
 for(const w of r.warnings)lines.push(['Da verificare','Avviso',w]);
 return '\uFEFF'+lines.map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n';
}
function printable(r){
 const row=(a,b)=>'<tr><th>'+esc(a)+'</th><td>'+esc(b||'—')+'</td></tr>';
 const table=(heads,values)=>'<table><thead><tr>'+heads.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+values.map(v=>'<tr>'+v.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;"><title>Rapporto intervento I.T.E. - BOZZA</title><style>body{font:14px Arial,sans-serif;color:#173451;margin:18mm}h1{font-size:21px;border-bottom:3px solid #008c45;padding-bottom:8px}h2{font-size:16px;margin-top:24px}table{width:100%;border-collapse:collapse;margin:10px 0}td,th{border:1px solid #b6c5bd;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eaf4ed}.warning{border:2px solid #ab6b1d;padding:12px}@media print{tr{break-inside:avoid}}</style></head><body><h1>I.T.E. - Rapporto operativo intervento #'+esc(r.id)+'</h1><p class="warning"><strong>BOZZA INTERNA NON FIRMATA.</strong> Non sostituisce rapporti di controllo, libretti, certificazioni, Di.Co., Di.Ri. o verifiche obbligatorie.</p><h2>Identificazione e lavori</h2><table>'+row('Cliente',r.client)+row('Sede',r.address)+row('Cantiere',r.site)+row('Impianto',r.plant)+row('Apparecchiatura',r.device)+row('Tipologia',r.kind)+row('Data',r.date)+row('Stato',r.status)+row('Lavori',r.description)+row('Esito',r.outcome)+'</table><h2>Operatori e accessi</h2>'+table(['Operatore','Ruolo'],r.operators.map(o=>[o.name,o.role]))+'<p>Minuti completati: '+esc(r.minutes)+'; accessi aperti: '+esc(r.open)+'</p>'+table(['Operatore','Arrivo','Uscita','Minuti'],r.accesses.map(a=>[a.name,a.start,a.end||'APERTO',a.minutes===null?'Escluso':a.minutes]))+'<h2>Materiali utilizzati</h2>'+table(['Articolo','Quantità','Data','Note'],r.materials.map(m=>[m.name,m.quantity+' '+m.unit,m.date,m.note]))+'<p>Storni esclusi: '+esc(r.reversed)+'</p><h2>Pratiche tecniche collegate</h2>'+table(['Tipo','Riferimento','Stato'],r.practices.map(p=>[p.type,p.reference,p.status]))+'<h2>Verifiche aperte</h2><ul>'+r.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul><p>Revisioni registrate: '+esc(r.revision)+'. Nessuna firma o costo interno esposto. Esportazione locale non cifrata.</p></body></html>';
}
function summary(r){return '<h4>Rapporto '+esc(r.status)+'</h4><p><strong>'+esc(r.client)+'</strong> · '+esc(r.device||r.plant||r.site)+'</p><p>Operatori: '+r.operators.length+' · minuti: '+r.minutes+' · materiali: '+r.materials.length+' · pratiche: '+r.practices.length+' · revisioni: '+r.revision+'</p><details><summary>Verifiche aperte ('+r.warnings.length+')</summary><ul>'+r.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul></details>';}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=root.document.createElement('a');a.href=url;a.download=name;root.document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function mount(){
 if(!root.document||!root.ITE||!root.ITECommerce||!root.ITEAgenda||root.ITERouter?.current?.()!=='scheda-intervento')return;
 const host=root.document.getElementById('appointment-detail'),job=root.ITEAgenda.currentIntervention?.();
 if(!host||!job||host.querySelector('#ite-intervention-dossier'))return;
 const section=root.document.createElement('section');section.id='ite-intervention-dossier';section.className='panel';
 section.innerHTML='<h3>Rapporto operativo e fascicolo intervento</h3><p class="hint">Cliente, sede, impianto, operatori, accessi, materiali e pratiche tecniche. Solo bozza.</p><div class="actions"><button type="button" data-intervention-report="preview">Verifica fascicolo</button><button type="button" class="secondary" data-intervention-report="a4">Esporta rapporto A4</button><button type="button" class="secondary" data-intervention-report="csv">Esporta riepilogo CSV</button></div><div id="ite-intervention-report-result" role="status"></div>';
 host.append(section);
}
function initialize(){
 const host=root.document.getElementById('appointment-detail');if(host)new MutationObserver(mount).observe(host,{childList:true});
 root.addEventListener('ite-pagechange',mount);
 root.document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-intervention-report]');if(!button)return;
  const out=root.document.getElementById('ite-intervention-report-result');
  try{
   const job=root.ITEAgenda?.currentIntervention?.();if(!job)throw Error('Nessun intervento aperto.');
   const r=build(root.ITE.snapshot(),root.ITECommerce.snapshot(),job.id);
   const kind=button.dataset.interventionReport;
   if(kind==='preview'){if(out)out.innerHTML=summary(r);return;}
   if(!root.confirm('Il rapporto contiene dati del cliente NON cifrati. Confermare esportazione locale?'))return;
   const name='ITE_intervento_'+r.id.replace(/[^A-Za-z0-9_-]/g,'');
   if(kind==='a4')download(printable(r),name+'_bozza_A4.html','text/html;charset=utf-8');
   if(kind==='csv')download(csv(r),name+'_riepilogo.csv','text/csv;charset=utf-8');
  }catch(error){if(out)out.textContent='Rapporto non disponibile: '+error.message;}
 });
 mount();
}
const api=Object.freeze({build,csv,printable,summary});
root.ITEInterventionDossier=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document&&root.addEventListener)root.addEventListener('ite-vault-ready',initialize);
})(typeof window!=='undefined'?window:globalThis);
