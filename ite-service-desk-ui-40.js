/* I.T.E. 4.0.63 — integrated service desk, TEST records only. */
(function(root){
"use strict";
const R=root.ITEServiceRegistry40,W=root.ITEServiceWorkflow40;
if(!R||!W||typeof document==="undefined")return;
const KEY="ite40_service_registry_TEST_v1";
const $=(tag,parent,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(parent)parent.appendChild(e);return e;};
const id=()=> "TEST-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
const now=()=>new Date().toISOString().slice(0,16);
const initial=()=>{let db=R.blank();db=R.add(db,"clients",{id:"TEST-CLIENT-1",name:"Cliente dimostrativo"});db=R.add(db,"sites",{id:"TEST-SITE-1",clientId:"TEST-CLIENT-1",name:"Sede dimostrativa",address:"Via Esempio 1"});db=R.add(db,"plants",{id:"TEST-PLANT-1",siteId:"TEST-SITE-1",name:"Impianto termico TEST"});db=R.add(db,"equipment",{id:"TEST-EQUIP-1",plantId:"TEST-PLANT-1",name:"Caldaia TEST",model:"Modello fittizio"});db=R.add(db,"operators",{id:"TEST-OP-1",name:"Tecnico TEST"});return db;};
let db;try{db=R.importJSON(localStorage.getItem(KEY)||"");}catch(_){db=initial();}
const section=$("section",document.querySelector(".wrap")||document.body);section.id="ite-service-desk-40";section.className="panel";$("h2",section,"I.T.E. 4.0.63 — Anagrafiche, calendario e interventi TEST");$("p",section,"Archivio dimostrativo separato. Nessun dato reale: salvataggio solo nel browser.").className="hint";
const status=$("p",section);status.setAttribute("role","status");
const tools=$("div",section);tools.className="actions";
const body=$("div",section);
function notify(t){status.textContent=t;}
function save(next){R.check(next);localStorage.setItem(KEY,R.exportJSON(next));db=next;render();notify("Archivio TEST aggiornato.");}
function button(parent,title,fn){const b=$("button",parent,title);b.type="button";b.addEventListener("click",()=>{try{fn();}catch(e){notify("Operazione non eseguita: "+e.message);}});return b;}
function field(parent,title,type="text",value=""){const label=$("label",parent,title),e=$("input",label);e.type=type;e.value=value;e.required=true;return e;}
function choice(parent,title,rows,label){const l=$("label",parent,title),s=$("select",l);for(const r of rows){const o=$("option",s,label(r));o.value=r.id;}return s;}
function group(title){const box=$("div",body);box.className="panel";$("h3",box,title);return box;}
function create(kind,parentKey,parents){const b=group("Nuovo "+({clients:"cliente",sites:"sede",plants:"impianto",equipment:"apparecchiatura",operators:"operatore"}[kind]));const name=field(b,"Nome / descrizione");let parent=null;if(parentKey)parent=choice(b,"Collegamento",db[parents],r=>r.name||r.address||r.id);const address=kind==="sites"?field(b,"Indirizzo"):null;const model=kind==="equipment"?field(b,"Modello"):null;button(b,"Salva "+kind,()=>{if(!name.value.trim())throw Error("Nome obbligatorio");const row={id:id(),name:name.value.trim()};if(parentKey){if(!parent.value)throw Error("Creare prima il livello superiore");row[parentKey]=parent.value;}if(address)row.address=address.value.trim();if(model)row.model=model.value.trim();save(R.add(db,kind,row));});}
function render(){body.replaceChildren();
const summary=group("Archivio e gerarchia");for(const kind of ["clients","sites","plants","equipment","operators","appointments","interventions"])$("p",summary,kind+": "+db[kind].length);
create("clients");create("sites","clientId","clients");create("plants","siteId","sites");create("equipment","plantId","plants");create("operators");
const a=group("Programma appuntamento");const eq=choice(a,"Apparecchiatura",db.equipment,r=>r.name+" — "+r.model);const op=choice(a,"Tecnico",db.operators,r=>r.name);const start=field(a,"Inizio","datetime-local",now()),end=field(a,"Fine","datetime-local",now());button(a,"Inserisci appuntamento",()=>{if(!eq.value||!op.value)throw Error("Apparecchiatura e tecnico obbligatori");save(R.appointment(db,{id:id(),equipmentId:eq.value,operatorId:op.value,start:start.value,end:end.value}));});
const agenda=group("Calendario e rapporti");const filter=choice(agenda,"Filtro tecnico",[{id:"",name:"Tutti"},...db.operators],r=>r.name);const rows=$("div",agenda);
function refresh(){rows.replaceChildren();const all=W.schedule(db,"2000-01-01T00:00","2100-01-01T00:00",filter.value||undefined);for(const r of all){const item=$("div",rows);item.className="item";$("strong",item,r.appointment.start+" — "+r.client.name);$("p",item,r.site.address+" · "+r.equipment.name+" · "+r.operator.name+" · "+(r.intervention?.status||"programmato"));const job=r.intervention;const when=field(item,"Data/ora operazione","datetime-local",now());if(!job){button(item,"Sono arrivato",()=>save(W.work(db,r.appointment.id,"arrive",r.operator.id,when.value,"")));button(item,"Riprogramma +1 ora",()=>{const plus=x=>new Date(Date.parse(x)+3600000).toISOString().slice(0,16);save(W.reschedule(db,r.appointment.id,plus(r.appointment.start),plus(r.appointment.end),r.operator.id));});}else{if(job.status==="arrived"||job.status==="revised"){const notes=field(item,"Lavoro aggiuntivo / note");button(item,"Registra lavoro aggiuntivo",()=>save(W.extraWork(db,r.appointment.id,r.operator.id,when.value,notes.value)));button(item,"Chiudi intervento",()=>save(job.status==="revised"?W.finishRevision(db,r.appointment.id,r.operator.id,when.value,"Chiusura revisione"):W.work(db,r.appointment.id,"close",r.operator.id,when.value,"")));}if(job.status==="closed")button(item,"Riapri per revisione",()=>save(W.work(db,r.appointment.id,"revise",r.operator.id,when.value,"Revisione richiesta")));const rep=W.report(db,r.appointment.id);$("p",item,"Durata: "+(rep.minutes===null?"in corso":rep.minutes+" minuti")+" · Eventi storico: "+job.audit.length);for(const e of job.audit)$("small",item,e.at+" · "+e.action+" · "+(e.details||""));}}
}filter.addEventListener("change",refresh);refresh();
}
button(tools,"Esporta backup JSON",()=>{const blob=new Blob([R.exportJSON(db)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ite-4-service-TEST-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
const importLabel=$("label",tools,"Importa archivio TEST JSON");const file=$("input",importLabel);file.type="file";file.accept=".json,application/json";file.addEventListener("change",async()=>{try{const f=file.files?.[0];if(!f||f.size>1000000)throw Error("File assente o troppo grande");const next=R.importJSON(await f.text());if(!confirm("Sostituire l'archivio TEST locale? Esportare prima un backup."))return;save(next);}catch(e){notify("Importazione bloccata: "+e.message);}file.value="";});
button(tools,"Ripristina dati fittizi",()=>{if(confirm("Azzerare solo l'archivio TEST?"))save(initial());});
render();root.ITEServiceDesk40={getArchive:()=>JSON.parse(R.exportJSON(db))};
})(typeof globalThis!=="undefined"?globalThis:this);
