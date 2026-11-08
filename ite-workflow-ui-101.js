/* I.T.E. 4.0.101 — integrated TEST workflow interface. No operational writes. */
(function(){
"use strict";
const API=window.ITEWorkflow100, KEY="ITE-WORKFLOW-TEST-101";
if(!API||!document.body)return;
const names={clients:"Clienti",sites:"Sedi",plants:"Impianti",devices:"Apparecchiature",operators:"Operatori",appointments:"Appuntamenti",interventions:"Interventi",quotes:"Preventivi",extras:"Extra",invoices:"Fatture",documents:"Documenti"};
const fields={
clients:[["name","Nome cliente","text"]],
sites:[["name","Indirizzo / sede","text"],["clientId","Cliente","clients"]],
plants:[["name","Impianto","text"],["clientId","Cliente","clients"],["siteId","Sede","sites"]],
devices:[["name","Apparecchiatura","text"],["clientId","Cliente","clients"],["plantId","Impianto","plants"]],
operators:[["name","Operatore","text"]],
appointments:[["clientId","Cliente","clients"],["siteId","Sede","sites"],["plantId","Impianto","plants"],["deviceId","Apparecchiatura","devices"],["operatorId","Operatore","operators"],["startsAt","Inizio appuntamento","datetime-local"]],
interventions:[["clientId","Cliente","clients"],["siteId","Sede","sites"],["plantId","Impianto","plants"],["deviceId","Apparecchiatura","devices"],["operatorId","Operatore","operators"],["appointmentId","Appuntamento","appointments"],["arrivedAt","Arrivo","datetime-local"],["leftAt","Uscita","datetime-local"]],
quotes:[["clientId","Cliente","clients"],["category","Categoria","category"],["description","Descrizione","text"],["unitCents","Prezzo unitario (€)","money"],["quantity","Quantità","number"]],
extras:[["clientId","Cliente","clients"],["quoteId","Preventivo","quotes"],["category","Categoria","category"],["description","Descrizione","text"],["unitCents","Prezzo unitario (€)","money"],["quantity","Quantità","number"]],
invoices:[["clientId","Cliente","clients"],["type","Tipo documento","invoice"],["totalCents","Totale (€)","money"]],
documents:[["clientId","Cliente","clients"],["name","Riferimento documento TEST","text"]]
};
const host=document.createElement("section");host.id="ite-workflow-101";host.className="panel";host.setAttribute("aria-label","Gestionale integrato TEST 4.0.101");
host.innerHTML='<h2>Gestionale integrato 4.0.101 — TEST</h2><p class="hint">Ambiente dimostrativo isolato. Solo dati fittizi, memorizzati su questo browser; nessuna fattura o dichiarazione ufficiale.</p><div class="grid"><label>Archivio<select id="wf-kind"></select></label><label>Operatore responsabile<input id="wf-actor" value="Operatore TEST" maxlength="80"></label></div><form id="wf-form"><div id="wf-fields" class="grid"></div><div class="actions"><button type="submit">Registra TEST</button><button type="button" id="wf-refresh" class="secondary">Aggiorna</button></div></form><p id="wf-feedback" role="status" aria-live="polite"></p><div class="actions"><button id="wf-export" type="button" class="secondary">Esporta backup JSON</button><label>Importa backup TEST<input id="wf-import" type="file" accept=".json,application/json"></label><button id="wf-reset" type="button" class="danger">Azzera archivio TEST</button></div><h3>Agenda e riepilogo</h3><div class="grid"><label>Dal<input id="wf-from" type="date"></label><label>Al<input id="wf-to" type="date"></label><label>Filtra operatore<select id="wf-operator"></select></label></div><div id="wf-summary"></div><h3>Registrazioni TEST</h3><div id="wf-records"></div>';
(document.querySelector(".wrap")||document.body).appendChild(host);
const $=id=>host.querySelector("#"+id), escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let state;try{state=API.importJSON(localStorage.getItem(KEY)||API.exportJSON(API.fresh()));}catch(_){state=API.fresh();}
function save(next){localStorage.setItem(KEY,API.exportJSON(next));state=next;}
function label(row){return row.name||row.description||row.startsAt||row.type||row.id;}
function selectOptions(kind,chosen){return '<option value="">Seleziona...</option>'+state.records[kind].map(r=>'<option value="'+escape(r.id)+'" '+(chosen===r.id?"selected":"")+'>'+escape(label(r))+' ('+escape(r.id)+')</option>').join("");}
function drawForm(){
const kind=$("wf-kind").value;
$("wf-fields").innerHTML='<label>ID TEST (univoco)<input name="id" required pattern="TEST-[A-Z0-9-]{3,60}" placeholder="TEST-CLIENTE-001" maxlength="65"></label>'+fields[kind].map(([key,title,type])=>{
let input;
if(state.records[type])input='<select name="'+key+'" required>'+selectOptions(type)+'</select>';
else if(type==="category")input='<select name="'+key+'">'+["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","ALTRO"].map(x=>'<option>'+x+'</option>').join("")+'</select>';
else if(type==="invoice")input='<select name="'+key+'">'+["ACQUISTO","VENDITA","PROFORMA","TD04"].map(x=>'<option>'+x+'</option>').join("")+'</select>';
else input='<input name="'+key+'" type="'+(type==="money"||type==="number"?"number":type)+'" '+(type==="money"?'min="0" max="1000000" step="0.01"':type==="number"?'min="1" max="10000" step="1"':'')+' '+(type==="datetime-local"?'':'required')+' maxlength="200">';
return '<label>'+escape(title)+input+'</label>';}).join("");
}
function draw(){
$("wf-kind").innerHTML=API.KINDS.map(k=>'<option value="'+k+'" '+($("wf-kind").value===k?"selected":"")+'>'+names[k]+'</option>').join("");
drawForm();
$("wf-operator").innerHTML='<option value="">Tutti</option>'+state.records.operators.map(r=>'<option value="'+escape(r.id)+'">'+escape(r.name)+'</option>').join("");
const totals=API.financial(state),money=n=>(n/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
let appointments=[];try{const from=$("wf-from").value||"2000-01-01",to=$("wf-to").value||"2099-12-31";appointments=API.agenda(state,from+"T00:00:00",to+"T23:59:59",$("wf-operator").value||null);}catch(e){$("wf-feedback").textContent=e.message;}
$("wf-summary").textContent="Appuntamenti: "+appointments.length+" | Preventivi: "+money(totals.quotesCents)+" | Extra: "+money(totals.extrasCents)+" | Vendite TEST: "+money(totals.salesCents)+" | TD04: "+money(totals.creditsCents);
$("wf-records").innerHTML=API.KINDS.map(k=>'<details><summary>'+names[k]+' ('+state.records[k].length+')</summary>'+state.records[k].map(r=>'<div class="item"><strong>'+escape(label(r))+'</strong><small>'+escape(r.id)+'</small></div>').join("")+'</details>').join("");
}
$("wf-kind").addEventListener("change",drawForm);
$("wf-form").addEventListener("submit",e=>{
e.preventDefault();try{
const kind=$("wf-kind").value, fd=new FormData(e.currentTarget),row={id:String(fd.get("id")||"").trim()};
for(const [key,,type] of fields[kind]){let v=String(fd.get(key)||"").trim();if(type==="money"){const n=Number(v);if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100))||Math.abs(n*100-Math.round(n*100))>0.000001)throw Error("Importo non valido");row[key]=Math.round(n*100);}else if(type==="number")row[key]=Number(v);else if(type==="datetime-local")row[key]=v?new Date(v).toISOString():null;else row[key]=v;}
if(kind==="documents"){row.officialReady=false;row.accounted=false;}
save(API.transact(state,kind,row,$("wf-actor").value,state.revision));$("wf-feedback").textContent="Registrazione TEST salvata. Revisione "+state.revision;draw();$("wf-form").reset();
}catch(err){$("wf-feedback").textContent="Non salvato: "+err.message;}
});
$("wf-refresh").onclick=draw;
["wf-from","wf-to","wf-operator"].forEach(id=>$(id).addEventListener("change",draw));
$("wf-export").onclick=()=>{const blob=new Blob([API.exportJSON(state)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ite-workflow-test-101.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$("wf-import").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1500000)throw Error("Backup troppo grande");const imported=API.importJSON(await file.text());if(!confirm("Sostituire esclusivamente l'archivio TEST locale?"))return;save(imported);draw();$("wf-feedback").textContent="Backup TEST importato";}catch(err){$("wf-feedback").textContent=err.message;}finally{e.target.value="";}};
$("wf-reset").onclick=()=>{if(confirm("Eliminare tutti i dati TEST locali?")){save(API.fresh());draw();}};
draw();
})();
