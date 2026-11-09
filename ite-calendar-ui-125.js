/* I.T.E. 4.0.125 — touch-friendly calendar TEST; never saves or transmits data. */
(function(){"use strict";
function mount(){
 if(!window.ITE_Calendar125||document.getElementById("ite-calendar-125"))return;
 const section=document.createElement("section");section.id="ite-calendar-125";section.className="panel";
 const h=document.createElement("h2");h.textContent="I.T.E. 4.0.125 — Calendario operativo TEST";section.appendChild(h);
 const hint=document.createElement("p");hint.textContent="Solo workspace JSON fittizio. Vista giorno, settimana, mese; filtri tecnico e stato; nessun salvataggio automatico.";section.appendChild(hint);
 const input=document.createElement("textarea");input.rows=5;input.placeholder="Incolla workspace ITE_OPERATIONS_123 TEST";input.setAttribute("aria-label","Workspace TEST");section.appendChild(input);
 const controls=document.createElement("div");controls.style.cssText="display:flex;gap:8px;flex-wrap:wrap;align-items:center";
 const date=document.createElement("input");date.type="date";date.value=new Date().toISOString().slice(0,10);date.setAttribute("aria-label","Data");
 const view=document.createElement("select");for(const [value,label] of [["day","Giorno"],["week","Settimana"],["month","Mese"]]){const o=document.createElement("option");o.value=value;o.textContent=label;view.appendChild(o);}
 const operator=document.createElement("select");operator.setAttribute("aria-label","Operatore");const status=document.createElement("select");status.setAttribute("aria-label","Stato");for(const s of ["","PROGRAMMATO","IN_CORSO","CHIUSO","ANNULLATO"]){const o=document.createElement("option");o.value=s;o.textContent=s||"Tutti gli stati";status.appendChild(o);}
 const renderButton=document.createElement("button");renderButton.type="button";renderButton.textContent="Visualizza calendario";
 const printButton=document.createElement("button");printButton.type="button";printButton.textContent="Stampa calendario";
 controls.append(date,view,operator,status,renderButton,printButton);section.appendChild(controls);
 const output=document.createElement("div");output.setAttribute("aria-live","polite");section.appendChild(output);
 let last=null;
 const render=()=>{try{
 const state=JSON.parse(input.value);const data=window.ITE_Calendar125.calendar(state,{date:date.value,view:view.value,operatorId:operator.value,status:status.value});last=data;
 const selected=operator.value;operator.replaceChildren();const all=document.createElement("option");all.value="";all.textContent="Tutti i tecnici";operator.appendChild(all);
 for(const op of data.operators){const o=document.createElement("option");o.value=op.id;o.textContent=op.name;operator.appendChild(o);}operator.value=selected;
 output.replaceChildren();const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px";
 for(const day of data.days){const card=document.createElement("div");card.style.cssText="border:1px solid #bbb;border-radius:8px;padding:10px;min-height:75px";
 const heading=document.createElement("strong");heading.textContent=day.date+" ("+day.entries.length+")";card.appendChild(heading);
 for(const e of day.entries){const item=document.createElement("div");item.style.cssText="padding:6px;margin-top:6px;border-left:4px solid #64748b;background:rgba(128,128,128,.08);overflow-wrap:anywhere";
 const op=data.operators.find(x=>x.id===e.operatorId);if(op)item.style.borderLeftColor=op.color;
 item.textContent=e.startAt.slice(11,16)+"–"+e.endAt.slice(11,16)+" · "+e.client+" · "+e.operator+" · "+e.status+" · "+e.site+(e.equipment?" · "+e.equipment:"");card.appendChild(item);}
 grid.appendChild(card);}output.appendChild(grid);
 }catch(e){last=null;output.textContent="Errore: "+e.message;}};
 renderButton.onclick=render;date.onchange=render;view.onchange=render;operator.onchange=render;status.onchange=render;
 printButton.onclick=()=>{if(!last)render();if(!last)return;const w=window.open("","_blank");if(!w){output.textContent="Stampa bloccata dal browser";return;}const title=w.document.createElement("h1");title.textContent="I.T.E. — Agenda TEST "+last.start;w.document.body.appendChild(title);for(const day of last.days){const h=w.document.createElement("h3");h.textContent=day.date;w.document.body.appendChild(h);for(const e of day.entries){const p=w.document.createElement("p");p.textContent=[e.startAt.slice(11,16),e.endAt.slice(11,16),e.client,e.site,e.operator,e.equipment,e.status].join(" | ");w.document.body.appendChild(p);}}w.print();};
 (document.querySelector("main")||document.querySelector(".wrap")||document.body).appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
