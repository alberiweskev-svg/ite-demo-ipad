/* I.T.E. 4.0.142 — technical dossier read-only, shared TEST session. */
(function(){"use strict";
let attempts=0;
function mount(){
 const S=window.ITE_UnifiedSession129,T=window.ITE_Technical142;
 if(!S||!T){if(++attempts<100)setTimeout(mount,100);return;}
 if(document.getElementById("ite-technical-142"))return;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const section=el("section");section.id="ite-technical-142";section.className="panel";
 section.append(el("h2","Fascicoli tecnici interventi — TEST 4.0.142"),el("p","Controllo anagrafiche, tecnico, sovrapposizioni, tempi, documenti commerciali e checklist indicative. Sola lettura; nessun documento reale o salvataggio server."));
 const bar=el("div");bar.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px";section.append(bar);
 function field(label){const l=el("label",label),s=el("select");l.append(s);bar.append(l);return s;}
 const clients=field("Cliente"),operators=field("Tecnico"),summary=el("p"),list=el("div");summary.setAttribute("aria-live","polite");section.append(summary,list);
 const print=el("button","Stampa fascicoli TEST");print.type="button";print.onclick=()=>window.print();section.append(print);
 function opts(node,items){const current=node.value;node.replaceChildren();const blank=el("option","Tutti");blank.value="";node.append(blank);for(const x of items){const o=el("option",x.label);o.value=x.id;node.append(o);}node.value=items.some(x=>x.id===current)?current:"";}
 function render(){const state=S.get(),c=state.field.catalog;opts(clients,c.clients.map(x=>({id:x.id,label:x.name||x.id})));opts(operators,c.operators.map(x=>({id:x.id,label:x.name||x.id})));
 const report=T.build(state,{clientId:clients.value,operatorId:operators.value});summary.textContent=report.summary.total+" interventi · "+report.summary.ready+" senza anomalie strutturali · "+report.summary.withWarnings+" da verificare · "+report.summary.overlaps+" con sovrapposizioni";
 list.replaceChildren();
 for(const item of report.items){const d=el("details");d.className="item";const s=el("summary",item.startAt+" · "+item.client+" · "+item.kind+" · "+(item.ready?"Controlli OK":"Da verificare"));s.style.cursor="pointer";d.append(s);
 for(const line of [item.site+" · "+item.system+" · "+item.equipment,"Tecnico: "+item.operator+" · Stato: "+item.status,"Intervento: "+(item.intervention?.status||"non avviato"),"Extra collegati: "+item.extras.length+" · Fatture collegate: "+item.invoices.length,"Controlli: "+item.checks.map(x=>x.code+" "+(x.ok?"OK":"MANCANTE")).join(" · "),"Anomalie: "+(item.warnings.join(", ")||"nessuna"),"Checklist indicativa: "+item.checklist.join(" • ")]){const p=el("p",line);p.style.overflowWrap="anywhere";d.append(p);}list.append(d);}
 }
 clients.onchange=render;operators.onchange=render;S.subscribe(render);(document.querySelector("main")||document.body).append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
