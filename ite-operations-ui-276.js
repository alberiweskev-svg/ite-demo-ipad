/* I.T.E. 4.0.276 — unified synthetic worklist. Read-only, no client records uploaded. */
(function(){"use strict";
function init(){const d=globalThis.ITEDossier269,ops=globalThis.ITEOperations276;if(!d||!ops)return;const host=document.querySelector("#ite-report-bridge-274")||document.querySelector(".wrap");if(!host)return;
const panel=document.createElement("section");panel.className="panel";panel.id="ite-operations-276";
const title=document.createElement("h2");title.textContent="4.0.276 · Agenda, rapportini e preventivi — riconciliazione TEST";panel.append(title);
const hint=document.createElement("p");hint.className="hint";hint.textContent="Riepilogo in sola lettura degli appuntamenti, operatori, rapportini e preventivi sintetici presenti in questo browser. Nessuna trasmissione di dati.";panel.append(hint);
const operator=document.createElement("input");operator.placeholder="Filtra operatore TEST (facoltativo)";operator.setAttribute("aria-label","Filtro operatore");panel.append(operator);
const button=document.createElement("button");button.type="button";button.textContent="Verifica dossier TEST";panel.append(button);
const result=document.createElement("div");result.setAttribute("aria-live","polite");panel.append(result);
function refresh(){result.replaceChildren();try{const view=ops.snapshot(d.load(localStorage),{operator:operator.value.trim()||undefined});const p=document.createElement("p");p.textContent=view.rows.length+" appuntamenti · "+view.issues.length+" anomalie da verificare";result.append(p);
for(const [name,summary] of Object.entries(view.byOperator)){const line=document.createElement("p");line.textContent=name+": "+summary.appointments+" appuntamenti, "+summary.plannedMinutes+" minuti previsti, "+summary.actualMinutes+" minuti registrati, "+summary.closed+" chiusi";result.append(line);}
for(const row of view.rows){const line=document.createElement("p");line.textContent=row.appointmentId+" · "+row.interventionStatus+" · rapportino "+row.reportStatus+" · preventivi "+row.quoteIds.length;result.append(line);}
for(const issue of view.issues){const line=document.createElement("p");line.textContent="Da verificare: "+issue.code+" — "+(issue.appointmentId||issue.reportId);result.append(line);}
}catch(err){result.textContent="Verifica non disponibile: "+err.message;}}
button.addEventListener("click",refresh);host.insertAdjacentElement("afterend",panel);refresh();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
