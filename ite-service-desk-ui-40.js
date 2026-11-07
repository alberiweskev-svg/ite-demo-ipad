/* I.T.E. 4.0.64 — integrated calendar and service history, TEST records only. */
(function(root){
"use strict";
const R=root.ITEServiceRegistry40,W=root.ITEServiceWorkflow40;
if(!R||!W||typeof document==="undefined")return;
const KEY="ite40_service_registry_TEST_v1";
const $=(tag,parent,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(parent)parent.appendChild(e);return e;};
const id=()=> "TEST-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
const now=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const day=x=>String(x).slice(0,10);const shift=(d,n)=>{const x=new Date(d+"T12:00:00");x.setDate(x.getDate()+n);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
const monday=d=>shift(d,-((new Date(d+"T12:00:00").getDay()+6)%7));
const download=(name,content,type)=>{const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
const initial=()=>{let db=R.blank();db=R.add(db,"clients",{id:"TEST-CLIENT-1",name:"Cliente dimostrativo"});db=R.add(db,"sites",{id:"TEST-SITE-1",clientId:"TEST-CLIENT-1",name:"Sede dimostrativa",address:"Via Esempio 1"});db=R.add(db,"plants",{id:"TEST-PLANT-1",siteId:"TEST-SITE-1",name:"Impianto termico TEST"});db=R.add(db,"equipment",{id:"TEST-EQUIP-1",plantId:"TEST-PLANT-1",name:"Caldaia TEST",model:"Modello fittizio"});db=R.add(db,"operators",{id:"TEST-OP-1",name:"Tecnico TEST"});return db;};
let db;try{db=R.importJSON(localStorage.getItem(KEY)||"");}catch(_){db=initial();}
const section=$("section",document.querySelector(".wrap")||document.body);section.id="ite-service-desk-40";section.className="panel";$("h2",section,"I.T.E. 4.0.64 — Anagrafiche, calendario e interventi TEST");$("p",section,"Archivio dimostrativo separato. Nessun dato reale: salvataggio solo nel browser.").className="hint";
const status=$("p",section);status.setAttribute("role","status");
const tools=$("div",section);tools.className="actions";
const body=$("div",section);
function notify(t){status.textContent=t;}
function save(next){R.check(next);localStorage.setItem(KEY,R.exportJSON(next));db=next;render();document.dispatchEvent(new CustomEvent("ite:service-registry-updated"));notify("Archivio TEST aggiornato.");}
function button(parent,title,fn){const b=$("button",parent,title);b.type="button";b.addEventListener("click",()=>{try{fn();}catch(e){notify("Operazione non eseguita: "+e.message);}});return b;}
function field(parent,title,type="text",value=""){const label=$("label",parent,title),e=$("input",label);e.type=type;e.value=value;e.required=true;return e;}
function choice(parent,title,rows,label){const l=$("label",parent,title),s=$("select",l);for(const r of rows){const o=$("option",s,label(r));o.value=r.id;}return s;}
function group(title){const box=$("div",body);box.className="panel";$("h3",box,title);return box;}
function create(kind,parentKey,parents){const b=group("Nuovo "+({clients:"cliente",sites:"sede",plants:"impianto",equipment:"apparecchiatura",operators:"operatore"}[kind]));const name=field(b,"Nome / descrizione");let parent=null;if(parentKey)parent=choice(b,"Collegamento",db[parents],r=>r.name||r.address||r.id);const address=kind==="sites"?field(b,"Indirizzo"):null;const model=kind==="equipment"?field(b,"Modello"):null;button(b,"Salva "+kind,()=>{if(!name.value.trim())throw Error("Nome obbligatorio");const row={id:id(),name:name.value.trim()};if(parentKey){if(!parent.value)throw Error("Creare prima il livello superiore");row[parentKey]=parent.value;}if(address)row.address=address.value.trim();if(model)row.model=model.value.trim();save(R.add(db,kind,row));});}
function render(){body.replaceChildren();
const summary=group("Archivio e gerarchia");for(const kind of ["clients","sites","plants","equipment","operators","appointments","interventions"])$("p",summary,kind+": "+db[kind].length);
create("clients");create("sites","clientId","clients");create("plants","siteId","sites");create("equipment","plantId","plants");create("operators");
const a=group("Programma appuntamento");const eq=choice(a,"Apparecchiatura",db.equipment,r=>r.name+" — "+r.model);const op=choice(a,"Tecnico",db.operators,r=>r.name);const start=field(a,"Inizio","datetime-local",now()),end=field(a,"Fine","datetime-local",now());button(a,"Inserisci appuntamento",()=>{if(!eq.value||!op.value)throw Error("Apparecchiatura e tecnico obbligatori");save(R.appointment(db,{id:id(),equipmentId:eq.value,operatorId:op.value,start:start.value,end:end.value}));});
const agenda=group("Calendario Giorno / Settimana / Mese e rapporti");
const filter=choice(agenda,"Filtro tecnico",[{id:"",name:"Tutti"},...db.operators],r=>r.name);
const mode=choice(agenda,"Vista",[{id:"day",name:"Giorno"},{id:"week",name:"Settimana"},{id:"month",name:"Mese"}],r=>r.name);
const selected=field(agenda,"Data di riferimento","date",day(now()));
const actions=$("div",agenda);actions.className="actions";
const rows=$("div",agenda);
button(actions,"Precedente",()=>{selected.value=shift(selected.value||day(now()),mode.value==="day"?-1:mode.value==="week"?-7:-30);refresh();});
button(actions,"Successivo",()=>{selected.value=shift(selected.value||day(now()),mode.value==="day"?1:mode.value==="week"?7:30);refresh();});
button(actions,"Esporta calendario CSV",()=>{const r=range();download("ite-agenda-TEST.csv","\\uFEFF"+W.csv(db,r[0],r[1],filter.value||undefined),"text/csv;charset=utf-8");});
button(actions,"Stampa calendario",()=>window.print());
function range(){const d=selected.value||day(now());if(mode.value==="day")return [d+"T00:00",shift(d,1)+"T00:00"];if(mode.value==="week"){const m=monday(d);return [m+"T00:00",shift(m,7)+"T00:00"];}const first=d.slice(0,7)+"-01";const next=new Date(first+"T12:00:00");next.setMonth(next.getMonth()+1);return [first+"T00:00",next.getFullYear()+"-"+String(next.getMonth()+1).padStart(2,"0")+"-01T00:00"];}
function refresh(){rows.replaceChildren();const [from,to]=range();const all=W.schedule(db,from,to,filter.value||undefined);
$("p",rows,all.length+" appuntamenti · "+from.slice(0,10)+" — "+to.slice(0,10)).className="hint";
for(const r of all){const item=$("div",rows);item.className="item";
$("strong",item,r.appointment.start+" — "+r.client.name);
$("p",item,r.site.address+" · "+r.equipment.name+" · "+r.operator.name+" · "+(r.intervention?.status||"programmato"));
const job=r.intervention;const when=field(item,"Data/ora operazione","datetime-local",now());
if(!job){button(item,"Sono arrivato",()=>save(W.work(db,r.appointment.id,"arrive",r.operator.id,when.value,"")));
const newStart=field(item,"Nuovo inizio","datetime-local",r.appointment.start),newEnd=field(item,"Nuova fine","datetime-local",r.appointment.end);
const newOp=choice(item,"Nuovo tecnico",db.operators,x=>x.name);newOp.value=r.operator.id;
button(item,"Riprogramma appuntamento",()=>save(W.reschedule(db,r.appointment.id,newStart.value,newEnd.value,newOp.value)));
}else{
if(job.status==="arrived"||job.status==="revised"){
const notes=field(item,"Lavoro aggiuntivo / note");
button(item,"Registra lavoro aggiuntivo",()=>save(W.extraWork(db,r.appointment.id,r.operator.id,when.value,notes.value)));
button(item,"Chiudi intervento",()=>save(job.status==="revised"?W.finishRevision(db,r.appointment.id,r.operator.id,when.value,"Chiusura revisione"):W.work(db,r.appointment.id,"close",r.operator.id,when.value,"")));
}
if(job.status==="closed")button(item,"Riapri per revisione",()=>save(W.work(db,r.appointment.id,"revise",r.operator.id,when.value,"Revisione richiesta")));
if(job.status==="revised"){
const arrival=field(item,"Arrivo corretto","datetime-local",job.arrivedAt),departure=field(item,"Uscita corretta","datetime-local",job.leftAt||now()),reason=field(item,"Motivo correzione");
button(item,"Salva correzione orari",()=>save(W.correctTimes(db,r.appointment.id,r.operator.id,arrival.value,departure.value,reason.value,when.value)));
}
const rep=W.report(db,r.appointment.id);
$("p",item,"Durata: "+(rep.minutes===null?"in corso":rep.minutes+" minuti")+" · Eventi storico: "+job.audit.length);
for(const e of job.audit)$("small",item,e.at+" · "+e.action+" · "+(e.details||""));
}
}
}
const history=group("Storico interventi per apparecchiatura");
const equip=choice(history,"Apparecchiatura",db.equipment,x=>x.name+" — "+(x.model||""));
const list=$("div",history);
function showHistory(){list.replaceChildren();if(!equip.value)return;for(const h of R.history(db,equip.value)){const j=h.interventions[0];$("p",list,h.appointment.start+" · "+(j?.status||"programmato")+" · "+(j?R.minutes(j)??"in corso":"non iniziato")+" minuti");}}
equip.addEventListener("change",showHistory);showHistory();

filter.addEventListener("change",refresh);mode.addEventListener("change",refresh);selected.addEventListener("change",refresh);refresh();
}
button(tools,"Esporta backup JSON",()=>{const blob=new Blob([R.exportJSON(db)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ite-4-service-TEST-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
const importLabel=$("label",tools,"Importa archivio TEST JSON");const file=$("input",importLabel);file.type="file";file.accept=".json,application/json";file.addEventListener("change",async()=>{try{const f=file.files?.[0];if(!f||f.size>1000000)throw Error("File assente o troppo grande");const next=R.importJSON(await f.text());if(!confirm("Sostituire l'archivio TEST locale? Esportare prima un backup."))return;save(next);}catch(e){notify("Importazione bloccata: "+e.message);}file.value="";});
button(tools,"Ripristina dati fittizi",()=>{if(confirm("Azzerare solo l'archivio TEST?"))save(initial());});
render();root.ITEServiceDesk40={getArchive:()=>JSON.parse(R.exportJSON(db))};
})(typeof globalThis!=="undefined"?globalThis:this);
