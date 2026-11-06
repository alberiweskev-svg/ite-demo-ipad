/* I.T.E. 4.0.43 — agenda read-only for workflow TEST; no production records. */
(function(root){'use strict';if(typeof document==='undefined')return;
function mount(){const host=document.getElementById('calendario');if(!host||!root.ITEAgenda40||!root.ITEWorkflowBridge40||!root.ITEWorkflows40)return;
const api=root.ITEAgenda40,db=root.ITEWorkflowBridge40.create(root.localStorage,root.ITEWorkflows40);
const section=document.createElement('section');section.className='panel';section.id='ite-agenda-test';
const title=document.createElement('h3');title.textContent='Agenda integrata TEST — 4.0.43';
const note=document.createElement('p');note.className='hint';note.textContent='Viste giorno, settimana, mese e filtro operatore. Legge gli appuntamenti TEST del flusso 4.0.42, senza modificare dati operativi.';
const controls=document.createElement('div');controls.className='grid';
function field(label,tag){const l=document.createElement('label');l.textContent=label;const el=document.createElement(tag);l.append(el);controls.append(l);return el}
const date=field('Data','input');date.type='date';date.value=new Date().toISOString().slice(0,10);
const view=field('Vista','select');for(const [value,name] of [['day','Giorno'],['week','Settimana'],['month','Mese']]){const o=document.createElement('option');o.value=value;o.textContent=name;view.append(o)}view.value='week';
const operator=field('Operatore','select');const actions=document.createElement('div');actions.className='actions';const prev=document.createElement('button'),next=document.createElement('button'),print=document.createElement('button');for(const [b,s] of [[prev,'Precedente'],[next,'Successivo'],[print,'Stampa agenda TEST']]){b.type='button';b.textContent=s;actions.append(b)}
const status=document.createElement('p');status.setAttribute('aria-live','polite');const result=document.createElement('div');
function render(){try{const data=db.load();const selected=operator.value;operator.replaceChildren();const all=document.createElement('option');all.value='';all.textContent='Tutti gli operatori';operator.append(all);for(const o of data.operators){const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.name||o.id;operator.append(opt)}operator.value=data.operators.some(o=>o.id===selected)?selected:'';
const rows=api.list(data,date.value,view.value,operator.value),group=api.grouped(rows);result.replaceChildren();
const heading=document.createElement('p');heading.textContent=rows.length+' appuntamenti TEST';result.append(heading);
const [start,end]=api.range(date.value,view.value);for(let d=start;d<end;d=api.plus(d,1)){const block=document.createElement('div');block.className='item';const h=document.createElement('strong');h.textContent=d;block.append(h);for(const a of group[d]||[]){const p=document.createElement('p');p.textContent=a.start.slice(11,16)+'–'+a.end.slice(11,16)+' | '+a.clientName+' | '+a.siteName+' | '+a.equipmentName+' | '+a.operatorName+' | '+a.status;block.append(p)}result.append(block)}status.textContent='Agenda TEST aggiornata';return rows}catch(e){status.textContent='Agenda non disponibile: '+e.message;result.replaceChildren();return []}}
function shift(dir){try{const delta=view.value==='day'?dir:view.value==='week'?dir*7:0;if(view.value==='month'){const d=new Date(date.value+'T12:00:00');d.setMonth(d.getMonth()+dir);date.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}else date.value=api.plus(date.value,delta);render()}catch(e){status.textContent=e.message}}
prev.addEventListener('click',()=>shift(-1));next.addEventListener('click',()=>shift(1));for(const x of [date,view,operator])x.addEventListener('change',render);
print.addEventListener('click',()=>{const rows=render(),text=api.printable(rows);const w=root.open('','_blank');if(!w){status.textContent='Finestra stampa bloccata';return}const pre=w.document.createElement('pre');pre.textContent='AGENDA TEST I.T.E. 4.0.43\n'+text;w.document.body.append(pre);w.print()});
section.append(title,note,controls,actions,status,result);host.append(section);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);