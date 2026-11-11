/* I.T.E. 4.0.158 — TEST dispatch console integrated into inventory. */
(function(root){"use strict";
let attempts=0;
function mount(){
const S=root.ITE_UnifiedSession129,D=root.ITE_Dispatch158;
if(!S||!D){if(++attempts<60)setTimeout(mount,150);return;}
if(document.getElementById("ite-dispatch-158"))return;
const el=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;};
const panel=el("section");panel.id="ite-dispatch-158";panel.className="panel";
panel.append(el("h2","Uscita materiali per cantiere — TEST 4.0.158"),el("p","Seleziona un preventivo accettato e le prenotazioni da scaricare. Il lotto viene validato integralmente prima di aggiornare la sessione TEST."));
const form=el("div"),estimate=el("select"),actor=el("input"),batch=el("input");
actor.value="Operatore TEST";batch.placeholder="USCITA-TEST-001";
for(const [label,input] of [["Preventivo",estimate],["Operatore",actor],["ID uscita",batch]]){const l=el("label",label);l.append(input);form.append(l);}
const reservations=el("div"),summary=el("div"),status=el("p");status.setAttribute("role","status");
const buttons=el("div");buttons.className="actions";
const verify=el("button","Verifica uscita"),execute=el("button","Conferma uscita TEST"),report=el("button","Resoconto cantiere");
for(const b of [verify,execute,report]){b.type="button";buttons.append(b);}
panel.append(form,el("h3","Prenotazioni attive"),reservations,buttons,summary,status);
function selected(){return [...reservations.querySelectorAll("input[type=checkbox]:checked")].map(x=>x.value);}
function renderReservations(){reservations.replaceChildren();const s=S.get();for(const r of s.inventory?.reservations||[]){if(r.estimateId!==estimate.value||r.status!=="ATTIVA")continue;const l=el("label"),c=el("input");c.type="checkbox";c.value=r.id;c.checked=true;l.append(c,document.createTextNode(" "+r.id+" · "+r.quantity+" · "+r.itemId));reservations.append(l);}}
function refresh(){const old=estimate.value;estimate.replaceChildren();for(const e of S.get().commercial?.estimates||[]){if(e.status!=="ACCETTATO")continue;const o=el("option",e.id);o.value=e.id;estimate.append(o);}if([...estimate.options].some(o=>o.value===old))estimate.value=old;renderReservations();}
estimate.onchange=renderReservations;
verify.onclick=()=>{try{const p=D.inspect(S.get(),estimate.value,selected());summary.replaceChildren();summary.append(el("p","Pronte "+p.rows.length+" prenotazioni · revisione "+p.revision));status.textContent="Verifica superata.";}catch(e){status.textContent="Verifica respinta: "+e.message;}};
execute.onclick=()=>{try{const s=S.get(),next=D.dispatchAll(s,estimate.value,selected(),actor.value.trim(),s.revision,batch.value.trim());S.restore(next,actor.value.trim());status.textContent="Uscita TEST registrata; revisione "+next.revision;}catch(e){status.textContent="Uscita respinta: "+e.message;}};
report.onclick=()=>{try{const r=D.report(S.get(),estimate.value);summary.replaceChildren();summary.append(el("p","Attive: "+r.active.length+" · Scaricate: "+r.dispatched.length+" · Annullate: "+r.cancelled.length));for(const row of r.dispatched)summary.append(el("p",row.reservationId+" → "+row.movementId));}catch(e){status.textContent="Resoconto non disponibile: "+e.message;}};
S.subscribe(refresh);(document.getElementById("ite-inventory-155")||document.querySelector("main")||document.body).append(panel);refresh();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
