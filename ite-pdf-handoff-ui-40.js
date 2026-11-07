/* I.T.E. 4.0.73 — integrated PDF metadata handoff. Files remain local. */
(function(root){"use strict";if(typeof document==="undefined")return;
const P=root.ITEPdfPreflight40,R=root.ITEPdfReview40,H=root.ITEPdfHandoff40,S=root.ITEServiceRegistry40,T=root.ITETechnicalDossier40,B=root.ITEServiceTechnicalBridge40;
if(!P||!R||!H||!S||!T||!B)return;
const SERVICE="ite40_service_registry_TEST_v1",TECH="ITE40_TECH_DOSSIER_TEST_1";
function mount(){const host=document.getElementById("importazioni")||document.querySelector(".wrap");if(!host||document.getElementById("ite-pdf-handoff-40"))return;
const add=(tag,parent,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent.appendChild(e);return e;};
const section=add("section",host);section.className="panel";section.id="ite-pdf-handoff-40";add("h2",section,"PDF verificati → fascicolo tecnico TEST 4.0.73");
add("p",section,"Verifica e classificazione locale, impronta SHA-256, anteprima e registrazione atomica dei soli metadati sintetici. Nessun PDF, nome originale o dato estratto viene salvato o inviato.").className="hint";
const input=add("input",section);input.type="file";input.accept=".pdf,application/pdf";input.multiple=true;input.setAttribute("aria-label","Seleziona PDF locali");
const ap=add("select",section);ap.setAttribute("aria-label","Appuntamento TEST");
const op=add("input",section);op.value="TEST-OP-1";op.setAttribute("aria-label","Operatore TEST");
const day=add("input",section);day.type="date";day.value=new Date().toISOString().slice(0,10);day.setAttribute("aria-label","Data documento");
const status=add("p",section);status.setAttribute("role","status");const rows=add("div",section),actions=add("div",section);actions.className="actions";const result=add("pre",section);result.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";
let records=[],nonce="",token=0;
function read(){const service=S.importJSON(root.localStorage.getItem(SERVICE)||"");const h=B.hierarchy(service);const raw=root.localStorage.getItem(TECH);return {service,h,archive:raw?T.importJson(raw,h):T.empty()};}
function refresh(){const old=ap.value;ap.replaceChildren();for(const a of read().service.appointments){const o=add("option",ap,a.id);o.value=a.id;}if([...ap.options].some(x=>x.value===old))ap.value=old;}
function render(){rows.replaceChildren();records.forEach((r,i)=>{const line=add("div",rows);line.className="item";add("strong",line,"PDF "+(i+1)+" · "+r.bytes+" byte");
const kind=add("select",line);kind.setAttribute("aria-label","Tipologia PDF "+(i+1));for(const k of R.allowed){const o=add("option",kind,k);o.value=k;}kind.value=r.review.kind;
const state=add("select",line);state.setAttribute("aria-label","Esito PDF "+(i+1));for(const k of ["pending","approved","rejected"]){const o=add("option",state,k);o.value=k;}state.value=r.review.status;
add("p",line,r.review.warnings.join("; ")).className="hint";
const change=()=>{try{r.review=R.decide(r.review,kind.value,state.value);result.textContent="";status.textContent="Revisione aggiornata";}catch(e){status.textContent=e.message;kind.value=r.review.kind;state.value=r.review.status;}};
kind.addEventListener("change",change);state.addEventListener("change",change);});}
function reset(){token++;records=[];nonce="";input.value="";result.textContent="";render();}
function prepare(){if(!nonce)throw Error("Selezionare PDF prima");const {service,archive,h}=read();return {service,archive,h,...H.preview(service,archive,records,ap.value,op.value.trim(),day.value,nonce)};}
function button(label,fn){const b=add("button",actions,label);b.type="button";b.addEventListener("click",()=>{try{fn();}catch(e){status.textContent=e.message;}});}
button("Verifica lotto e anteprima",()=>{const p=prepare();result.textContent=JSON.stringify({ok:p.check.ok,documents:p.items.map(x=>({type:x.type,bytes:x.attachments[0].bytes})),error:p.check.error||null},null,2);status.textContent=p.check.ok?"Lotto valido; nessun salvataggio effettuato":"Lotto non valido";});
button("Registra metadati TEST",()=>{const p=prepare();if(!p.check.ok)throw Error(p.check.error);const r=H.commit(p.service,p.archive,records,ap.value,op.value.trim(),day.value,nonce);root.localStorage.setItem(TECH,T.exportJson(r.archive,p.h));document.dispatchEvent(new CustomEvent("ite:technical-dossier-updated"));reset();status.textContent="Registrati "+r.added+" documenti TEST (solo metadati)";});
button("Cancella sessione",()=>{reset();status.textContent="Sessione cancellata";});button("Aggiorna appuntamenti",refresh);
input.addEventListener("change",async()=>{const current=++token;records=[];nonce="";result.textContent="";render();const files=[...(input.files||[])];if(!files.length||files.length>P.MAX_FILES){status.textContent="Selezionare da 1 a 30 PDF";return;}
if(!root.crypto?.subtle){status.textContent="SHA-256 non disponibile: usare HTTPS e Safari aggiornato";return;}status.textContent="Analisi locale in corso";
for(const f of files){if(current!==token)return;try{if(f.size>P.MAX)throw Error("PDF oltre 25 MB");const bytes=new Uint8Array(await f.arrayBuffer());if(current!==token)return;const inspection=P.inspect(f.name,bytes);const digest=new Uint8Array(await root.crypto.subtle.digest("SHA-256",bytes));if(current!==token)return;records.push({review:R.create(inspection),bytes:bytes.length,sha256:Array.from(digest,x=>x.toString(16).padStart(2,"0")).join("")});}catch(e){records=[];render();status.textContent="Lotto rifiutato: "+e.message;return;}}
nonce="TEST-LOT-"+Date.now().toString(36).toUpperCase();render();status.textContent="Classificare e approvare ogni PDF prima di registrare";});
try{refresh();}catch(e){status.textContent="Creare prima appuntamenti TEST: "+e.message;}document.addEventListener("ite:service-registry-updated",()=>{try{refresh();}catch(e){status.textContent=e.message;}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})(typeof window!=="undefined"?window:globalThis);