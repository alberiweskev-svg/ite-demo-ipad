/* I.T.E. 4.0 — guided multi-appointment entry; memory only, synthetic demo compatible. */
(function(root){'use strict';
const time=root.ITEFieldLocalTime||(typeof require==='function'?require('./ite-field-local-time.js'):null);
function proposal(data,form){
 if(!data||!data.catalog)throw Error('ARCHIVIO_NON_CARICATO');
 const c=data.catalog;
 const get=(key,id)=>c[key].find(x=>x.id===id);
 const client=get('clients',form.clientId),site=get('sites',form.siteId),system=get('systems',form.systemId),equipment=get('equipment',form.equipmentId),operator=get('operators',form.operatorId);
 if(!client||!site||site.clientId!==client.id||!system||system.siteId!==site.id||!equipment||equipment.systemId!==system.id||!operator||operator.active===false)throw Error('GERARCHIA_O_OPERATORE_NON_VALIDI');
 if(!form.id||!form.kind||!form.kind.trim())throw Error('ID_E_TIPOLOGIA_OBBLIGATORI');
 const startsAt=time.parseLocal(form.startsAt),endsAt=time.parseLocal(form.endsAt);
 if(Date.parse(endsAt)<=Date.parse(startsAt))throw Error('FINE_NON_SUCCESSIVA_INIZIO');
 return {id:form.id.trim(),clientId:client.id,siteId:site.id,systemId:system.id,equipmentId:equipment.id,operatorId:operator.id,kind:form.kind.trim(),startsAt,endsAt};
}
function append(data,existing,form){
 if(!Array.isArray(existing)||existing.length>=100)throw Error('MASSIMO_100_APPUNTAMENTI');
 const next=proposal(data,form);
 if(existing.some(x=>x.id===next.id)||data.appointments.some(x=>x.id===next.id))throw Error('ID_APPUNTAMENTO_DUPLICATO');
 return existing.concat([next]);
}
function mount({panel,input,getData,notify}){
 if(!root.document||!panel||!input)return;
 const section=document.createElement('section'),heading=document.createElement('h4');heading.textContent='Inserimento guidato appuntamenti';section.append(heading);
 const fields={};const choices={clientId:['clients','Cliente'],siteId:['sites','Sede'],systemId:['systems','Impianto'],equipmentId:['equipment','Apparecchiatura'],operatorId:['operators','Tecnico']};
 for(const [key,info] of Object.entries(choices)){const label=document.createElement('label');label.textContent=info[1];const select=document.createElement('select');select.setAttribute('aria-label','Gruppo '+info[1]);fields[key]=select;label.append(select);section.append(label)}
 for(const [key,label,type] of [['id','ID appuntamento','text'],['kind','Tipologia','text'],['startsAt','Inizio','datetime-local'],['endsAt','Fine','datetime-local']]){const wrap=document.createElement('label');wrap.textContent=label;const el=document.createElement('input');el.type=type;el.setAttribute('aria-label','Gruppo '+label);fields[key]=el;wrap.append(el);section.append(wrap)}
 const add=document.createElement('button');add.type='button';add.textContent='Aggiungi al gruppo';const remove=document.createElement('button');remove.type='button';remove.textContent='Rimuovi ultimo';const clear=document.createElement('button');clear.type='button';clear.textContent='Svuota gruppo';const result=document.createElement('p');result.setAttribute('role','status');section.append(add,remove,clear,result);panel.insertBefore(section,input);
 function rows(key){const data=getData();if(!data)return[];const c=data.catalog;if(key==='siteId')return c.sites.filter(x=>x.clientId===fields.clientId.value);if(key==='systemId')return c.systems.filter(x=>x.siteId===fields.siteId.value);if(key==='equipmentId')return c.equipment.filter(x=>x.systemId===fields.systemId.value);if(key==='operatorId')return c.operators.filter(x=>x.active!==false);return c.clients}
 function refresh(){for(const [key,info] of Object.entries(choices)){const previous=fields[key].value;fields[key].replaceChildren(new Option('Seleziona '+info[1],''));for(const x of rows(key))fields[key].add(new Option(x.name||x.address||x.model||x.id,x.id));if([...fields[key].options].some(x=>x.value===previous))fields[key].value=previous}}
 for(const key of ['clientId','siteId','systemId'])fields[key].addEventListener('change',refresh);
 const parse=()=>{if(!input.value.trim())return[];const list=JSON.parse(input.value);if(!Array.isArray(list))throw Error('GRUPPO_JSON_NON_VALIDO');return list};
 const write=list=>{input.value=JSON.stringify(list,null,2);input.dispatchEvent(new Event('input',{bubbles:true}));result.textContent=list.length+' appuntamenti nel gruppo. Verificare prima di applicare.'};
 add.addEventListener('click',()=>{try{write(append(getData(),parse(),Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value]))))}catch(e){result.textContent='Inserimento rifiutato: '+e.message}});
 remove.addEventListener('click',()=>{try{const list=parse();list.pop();write(list)}catch(e){result.textContent=e.message}});
 clear.addEventListener('click',()=>write([]));
 refresh();return {refresh};
}
const api=Object.freeze({proposal,append,mount});root.ITEFieldGuidedBatch=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
