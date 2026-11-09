/* I.T.E. 4.0.124 — read-only TEST audit and printable agenda. */
(function(){"use strict";function mount(){if(!window.ITE_Audit124||document.getElementById("ite-audit-124"))return;
const A=window.ITE_Audit124,section=document.createElement("section");section.id="ite-audit-124";section.className="panel";
const h=document.createElement("h2");h.textContent="I.T.E. 4.0.124 — Verifica integrità e agenda stampabile TEST";section.appendChild(h);
const p=document.createElement("p");p.className="hint";p.textContent="Solo dati fittizi. Incollare un backup JSON del workspace 4.0.123; nessun invio al server, nessun salvataggio automatico.";section.appendChild(p);
const input=document.createElement("textarea");input.rows=6;input.setAttribute("aria-label","Workspace TEST JSON");input.placeholder='{"schema":"ITE_OPERATIONS_123", ...}';section.appendChild(input);
const date=document.createElement("input");date.type="date";date.setAttribute("aria-label","Data agenda");section.appendChild(date);
const operator=document.createElement("input");operator.placeholder="ID operatore (facoltativo)";operator.setAttribute("aria-label","Filtro operatore");section.appendChild(operator);
const out=document.createElement("pre");out.style.whiteSpace="pre-wrap";out.style.overflowWrap="anywhere";out.setAttribute("aria-live","polite");
const action=(label,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=()=>{try{fn(JSON.parse(input.value));}catch(e){out.textContent="Errore: "+e.message;}};section.appendChild(b);};
action("Controlla integrità",s=>{out.textContent=JSON.stringify(A.audit(s),null,2);});
action("Anteprima agenda",s=>{out.textContent=JSON.stringify(A.report(s,{date:date.value,operatorId:operator.value.trim()}),null,2);});
action("Prepara backup verificato",s=>{out.textContent=JSON.stringify(A.snapshot(s),null,2);});
action("Stampa agenda",s=>{const r=A.report(s,{date:date.value,operatorId:operator.value.trim()});const w=window.open("","_blank");if(!w)throw Error("FINESTRA_BLOCCATA");const pre=w.document.createElement("pre");pre.textContent=r.appointments.map(a=>[a.when,a.until,a.client,a.site,a.operator,a.status,a.equipment].join(" | ")).join("\n");const title=w.document.createElement("h1");title.textContent="I.T.E. — Agenda TEST";w.document.body.append(title,pre);w.print();});
section.appendChild(out);(document.querySelector("main")||document.querySelector(".wrap")||document.body).appendChild(section);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();})();
