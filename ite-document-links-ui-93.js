/* I.T.E. 4.0.93 — pannello collegamenti TEST: non acquisisce contenuti PDF. */
(function(root){"use strict";
if(!root.document)return;
const L=()=>root.ITEDocumentLinks93,D=()=>root.ITEDocumentWorkspace91,S=()=>root.ITEServiceLedger40,R=()=>root.ITEDocumentReview92;
function mount(){if(!L()||!D()||!S()||!R()||document.getElementById("ite-document-links-93"))return;
const host=document.querySelector("#main-content")||document.querySelector("main")||document.querySelector(".wrap");if(!host)return;
const section=document.createElement("section");section.id="ite-document-links-93";section.className="panel";host.append(section);
function el(tag,label,parent=section){const n=document.createElement(tag);if(label!==undefined)n.textContent=label;parent.append(n);return n;}
el("h2","Collegamento documenti al fascicolo — TEST 4.0.93");el("p","Solo metadati locali. Nessun PDF viene letto, caricato o pubblicato.");
const doc=el("select"),apt=el("select"),client=el("select"),operator=el("input");operator.placeholder="Operatore responsabile";operator.maxLength=80;
const save=el("button","Collega al fascicolo");save.type="button";const check=el("button","Verifica collegamenti");check.type="button";const msg=el("p");msg.setAttribute("role","status");const list=el("div");
function read(){const raw=localStorage.getItem("ite-40-service-workspace-test-v1");if(!raw)throw Error("Aprire prima il fascicolo TEST 4.0.82");return S().importJSON(raw);}
function option(select,value,label){const n=document.createElement("option");n.value=value;n.textContent=label;select.append(n);}
function refresh(){const m=D().load(localStorage),s=read();doc.replaceChildren();apt.replaceChildren();client.replaceChildren();option(apt,"","Nessun appuntamento");option(client,"","Seleziona cliente");m.records.forEach(d=>option(doc,d.id,d.name+" ("+d.id+")"));s.appointments.forEach(a=>option(apt,a.id,a.id+" — "+a.scheduledAt));s.clients.forEach(c=>option(client,c.id,c.name||c.id));return {m,s};}
function show(){const {m,s}=refresh(),db=L().load(localStorage),r=R().load(localStorage);list.replaceChildren();const findings=L().audit(db,m,s,r);for(const f of findings){const p=el("p",f.documentId+" — "+f.type+" — "+(f.issues.join(", ")||"Collegamento coerente"),list);p.className="item";}msg.textContent=findings.length+" documenti esaminati.";}
save.addEventListener("click",()=>{try{const m=D().load(localStorage),s=read();if(!doc.value)throw Error("Nessun documento TEST");const refs=apt.value?{appointmentId:apt.value}:{clientId:client.value};L().save(localStorage,L().link(L().load(localStorage),m,s,doc.value,refs,operator.value));show();msg.textContent="Collegamento TEST salvato e verificato.";}catch(e){msg.textContent=e.message;}});
check.addEventListener("click",()=>{try{show();}catch(e){msg.textContent=e.message;}});
try{show();}catch(e){msg.textContent=e.message;}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(typeof globalThis!=="undefined"?globalThis:this);