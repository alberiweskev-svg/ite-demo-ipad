/* 4.0.274: bridge UI — works only with synthetic local archives. */
(function(){ "use strict";
function init(){const d=globalThis.ITEDossier269,b=globalThis.ITEReportBridge274,r=globalThis.ITEFieldReport273,e=globalThis.ITEDossier270;if(!d||!b||!r||!e)return;
const section=document.createElement("section");section.className="panel";section.id="ite-report-bridge-274";
const heading=document.createElement("h2");heading.textContent="4.0.274 · Rapportino → preventivo (solo dati fittizi)";section.append(heading);
const note=document.createElement("p");note.className="hint";note.textContent="Utilizza esclusivamente appuntamenti TEST già salvati nel dossier dimostrativo. Nessuna fattura viene emessa.";section.append(note);
const select=document.createElement("select");select.setAttribute("aria-label","Appuntamento sintetico");section.append(select);
const price=document.createElement("input");price.type="number";price.min="0";price.step="0.01";price.placeholder="Prezzo unitario € per attività (es. 50)";section.append(price);
const output=document.createElement("pre");output.style.whiteSpace="pre-wrap";output.setAttribute("aria-live","polite");
let report=null;
function refresh(){select.replaceChildren();try{const s=d.load(localStorage);for(const a of s.appointments){const opt=document.createElement("option");opt.value=a.id;opt.textContent=a.id+" · "+a.operator;select.append(opt);}}catch(err){output.textContent=err.message;}}
function button(label,handler){const x=document.createElement("button");x.textContent=label;x.type="button";x.style.margin="6px";x.addEventListener("click",()=>{try{output.textContent=handler();}catch(err){output.textContent="Errore: "+err.message;}});section.append(x);}
button("Aggiorna appuntamenti",()=>{refresh();return "Elenco aggiornato";});
button("Apri rapportino",()=>{const s=d.load(localStorage),a=s.appointments.find(x=>x.id===select.value);if(!a)throw Error("Nessun appuntamento TEST");report=b.start(s,a.id,a.start);return "Rapportino "+report.id+" avviato";});
button("Aggiungi posa",()=>{if(!report)throw Error("Aprire prima un rapportino");report=r.addActivity(report,{type:"POSA",description:"Posa dimostrativa"});return "Attività aggiunta";});
button("Chiudi e prepara preventivo",()=>{if(!report)throw Error("Rapportino mancante");const before=d.load(localStorage),a=before.appointments.find(x=>x.id===report.appointmentId);const intervention=before.interventions.find(x=>x.appointmentId===a.id);if(!intervention)throw Error("Intervento TEST non aperto");const end=new Date(Date.parse(report.arrival)+60000).toISOString();const next=e.closeIntervention(before,intervention.id,end);const closed=r.close(report,{departure:end,otherWorkConfirmed:true});const cents=Math.round(Number(price.value)*100);if(!Number.isSafeInteger(cents)||cents<0)throw Error("Prezzo non valido");const result=b.commitQuote(next,closed,closed.activities.map(()=>cents));d.persist(localStorage,before,next);d.persist(localStorage,next,result);report=closed;return "Preventivo TEST creato: "+result.commercial.quotes.at(-1).id;});
section.append(output);document.querySelector(".wrap")?.append(section);refresh();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
