/* I.T.E. 4.0.92 - Revisione manifest TEST, senza contenuti PDF. */
(function(root){"use strict";
function mount(){const review=root.ITEDocumentReview92,workspace=root.ITEDocumentWorkspace91,intake=root.ITEDocumentIntake90;if(!review||!workspace||!intake||!root.document||!root.localStorage)return;
const target=root.document.getElementById("ite-document-workspace-91");if(!target||root.document.getElementById("ite-document-review-92"))return;
const section=root.document.createElement("section");section.id="ite-document-review-92";
const heading=root.document.createElement("h3");heading.textContent="Revisione documenti TEST — 4.0.92";
const help=root.document.createElement("p");help.textContent="Conferma manuale della tipologia con operatore e motivazione; cronologia separata e immutabile per aggiunta. Nessun PDF viene letto.";
const selector=root.document.createElement("select"),type=root.document.createElement("select"),operator=root.document.createElement("input"),reason=root.document.createElement("input"),approve=root.document.createElement("button"),reopen=root.document.createElement("button"),output=root.document.createElement("div"),status=root.document.createElement("p");
operator.placeholder="Operatore TEST";reason.placeholder="Motivazione obbligatoria";approve.textContent="Conferma revisione";reopen.textContent="Riapri revisione";
for(const t of review.types){const o=root.document.createElement("option");o.value=t;o.textContent=t;type.append(o);}
function render(){const manifest=workspace.load(root.localStorage),db=review.load(root.localStorage),rows=review.report(manifest,db);selector.replaceChildren();output.replaceChildren();for(const r of rows){const o=root.document.createElement("option");o.value=r.id;o.textContent=r.name+" ("+r.id+")";selector.append(o);const p=root.document.createElement("p");p.textContent=r.name+" — "+r.type+" — "+r.status+" — revisioni: "+r.events;output.append(p);}return rows;}
function run(action){try{const manifest=workspace.load(root.localStorage),id=selector.value;if(!id)throw Error("Nessun documento TEST");review.transition(root.localStorage,manifest,id,action,type.value,operator.value,reason.value);status.textContent="Revisione registrata";render();}catch(e){status.textContent=e.message;}}
approve.onclick=()=>run("REVIEWED");reopen.onclick=()=>run("REOPENED");
const refresh=root.document.createElement("button");refresh.textContent="Aggiorna elenco";refresh.onclick=()=>{try{render();}catch(e){status.textContent=e.message;}};
for(const el of [heading,help,selector,type,operator,reason,approve,reopen,refresh,status,output]){el.style.margin="5px";section.append(el);}target.append(section);try{render();}catch(e){status.textContent=e.message;}
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",mount);else mount();}
})(typeof globalThis!=="undefined"?globalThis:this);