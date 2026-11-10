/* I.T.E. 4.0.138 — guided CSV/TSV TEST import, shared session. */
(function(){"use strict";
function mount(){
 if(document.getElementById("ite-csv-138")||!window.ITE_CsvImport138||!window.ITE_UnifiedSession129)return;
 const S=window.ITE_UnifiedSession129,T=window.ITE_CsvImport138;
 const section=document.createElement("section");section.id="ite-csv-138";section.className="panel";
 const add=(tag,label,parent=section)=>{const e=document.createElement(tag);if(label)e.textContent=label;parent.appendChild(e);return e;};
 add("h2","4.0.138 — Importazione CSV / TSV gerarchica TEST");
 add("p","Incollare dati fittizi CSV o TSV, anche con righe non ordinate e campi tra virgolette. Verifica atomica prima dell'applicazione. Nessun caricamento di file o invio in rete.");
 const actor=add("input");actor.value="Operatore TEST";actor.setAttribute("aria-label","Operatore");
 const sep=add("select");for(const [v,label] of [["","Automatico (TAB o punto e virgola)"],[";","Punto e virgola"],[",","Virgola"],["\t","TAB"]]){const o=add("option",label,sep);o.value=v;}sep.setAttribute("aria-label","Separatore");
 const area=add("textarea");area.rows=9;area.style.width="100%";area.setAttribute("aria-label","Dati CSV o TSV fittizi");
 const actions=add("div");actions.style.cssText="display:flex;flex-wrap:wrap;gap:10px";
 const sample=add("button","Esempio fittizio",actions),check=add("button","Verifica CSV",actions),apply=add("button","Applica alla sessione TEST",actions);
 for(const b of [sample,check,apply]){b.type="button";b.style.minHeight="44px";}
 const output=add("pre");output.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";output.setAttribute("aria-live","polite");
 const deps={batch:window.ITE_Batch136,operations:window.ITE_Operations123,audit:window.ITE_Audit124};
 let verified=null;const snapshot=()=>JSON.stringify([area.value,actor.value,sep.value]);
 sample.onclick=()=>{area.value=T.example;sep.value=";";verified=null;output.textContent="Esempio pronto. Verificare prima di applicare.";};
 check.onclick=()=>{try{const p=T.preview(S.get(),area.value,actor.value,deps,sep.value);verified={fingerprint:snapshot(),revision:p.baseRevision};output.textContent="Verifica superata: "+p.operations.length+" operazioni; revisione "+p.baseRevision+". Nessuna modifica applicata.";}catch(e){verified=null;output.textContent="Verifica fallita: "+e.message;}};
 apply.onclick=()=>{try{if(!verified||verified.fingerprint!==snapshot()||verified.revision!==S.get().revision)throw Error("RIPETERE_VERIFICA");const r=T.commit(S,area.value,actor.value,deps,verified.revision,sep.value);verified=null;output.textContent="Applicate "+r.operations.length+" operazioni alla sessione TEST. Esportare il backup dalla console.";}catch(e){verified=null;output.textContent="Nessuna modifica: "+e.message;}};
 S.subscribe(()=>{verified=null;});(document.querySelector("main")||document.body).appendChild(section);
}
function wait(n=0){if(window.ITE_CsvImport138&&window.ITE_Batch136&&window.ITE_UnifiedSession129)mount();else if(n<100)setTimeout(()=>wait(n+1),100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>wait());else wait();
})();
