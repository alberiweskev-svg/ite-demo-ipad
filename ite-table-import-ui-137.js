/* I.T.E. 4.0.137 — no-JSON guided table paste, same TEST session. */
(function(){"use strict";
function mount(){
 if(document.getElementById("ite-table-import-137")||!window.ITE_UnifiedSession129||!window.ITE_TableImport137)return;
 const S=window.ITE_UnifiedSession129,T=window.ITE_TableImport137;
 const section=document.createElement("section");section.id="ite-table-import-137";section.className="panel";
 const add=(tag,value,parent=section)=>{const e=document.createElement(tag);e.textContent=value;parent.appendChild(e);return e;};
 add("h2","4.0.137 — Importazione tabellare anagrafiche TEST");
 add("p","Incollare righe con colonne separate da TAB (ad esempio da un foglio di calcolo). Tipi: client, site, system, equipment, operator. Massimo 100 righe; soltanto dati fittizi. Nessun file o dato viene trasmesso.");
 const actor=add("input","");actor.value="Operatore TEST";actor.setAttribute("aria-label","Operatore importazione");
 const area=add("textarea","");area.rows=9;area.style.width="100%";area.setAttribute("aria-label","Tabella TSV TEST");
 const buttons=add("div","");buttons.style.cssText="display:flex;gap:10px;flex-wrap:wrap";
 const example=add("button","Esempio fittizio",buttons),check=add("button","Verifica tabella",buttons),apply=add("button","Applica tabella TEST",buttons);
 for(const b of [example,check,apply]){b.type="button";b.style.minHeight="44px";}
 const out=add("pre","");out.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";out.setAttribute("aria-live","polite");
 const deps={batch:window.ITE_Batch136,operations:window.ITE_Operations123,audit:window.ITE_Audit124};let reviewed=null;
 example.onclick=()=>{area.value=T.example;reviewed=null;out.textContent="Esempio pronto: eseguire verifica.";};
 check.onclick=()=>{try{const p=T.preview(S.get(),area.value,actor.value,deps);reviewed={text:area.value,actor:actor.value,revision:p.baseRevision};out.textContent="Verifica superata: "+p.operations.length+" operazioni. Nessuna modifica applicata.";}catch(e){reviewed=null;out.textContent="Errore: "+e.message;}};
 apply.onclick=()=>{try{if(!reviewed||reviewed.text!==area.value||reviewed.actor!==actor.value||reviewed.revision!==S.get().revision)throw Error("RIPETERE_VERIFICA");const r=T.commit(S,area.value,actor.value,deps,reviewed.revision);reviewed=null;out.textContent="Applicate "+r.operations.length+" operazioni alla sessione TEST. Esportare backup dalla console.";}catch(e){reviewed=null;out.textContent="Non applicato: "+e.message;}};
 S.subscribe(()=>{reviewed=null;});
 (document.querySelector("main")||document.body).appendChild(section);
}
function wait(n=0){if(window.ITE_TableImport137&&window.ITE_Batch136&&window.ITE_UnifiedSession129)mount();else if(n<100)setTimeout(()=>wait(n+1),100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>wait());else wait();
})();
