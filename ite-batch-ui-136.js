/* I.T.E. 4.0.136 — touch batch preview and atomic TEST apply in shared session. */
(function(){"use strict";
function mount(){
 if(document.getElementById("ite-batch-136")||!window.ITE_Batch136||!window.ITE_UnifiedSession129)return;
 const S=window.ITE_UnifiedSession129,B=window.ITE_Batch136;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const section=el("section");section.id="ite-batch-136";section.className="panel";
 section.append(el("h2","4.0.136 — Inserimento multiplo TEST"),el("p","Anteprima e conferma atomica di più operazioni. Usare esclusivamente dati fittizi; nessun PDF, caricamento remoto o salvataggio automatico."));
 const actor=el("input");actor.value="Operatore TEST";actor.setAttribute("aria-label","Operatore lotto");
 const input=el("textarea");input.rows=12;input.setAttribute("aria-label","Lotto JSON fittizio");
 const result=el("pre");result.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;max-height:300px;overflow:auto";result.setAttribute("aria-live","polite");
 const label=(title,node)=>{const l=el("label",title);l.style.cssText="display:flex;flex-direction:column;gap:6px;margin:8px 0";l.append(node);section.append(l);};
 label("Operatore",actor);label("Comandi JSON TEST (massimo 100)",input);
 const controls=el("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:10px";
 const example=el("button","Carica esempio fittizio"),preview=el("button","Controlla lotto"),apply=el("button","Conferma lotto TEST");
 for(const b of [example,preview,apply]){b.type="button";b.style.minHeight="44px";controls.append(b);}
 let reviewed=null;
 example.onclick=()=>{input.value=JSON.stringify({format:"ITE_136_TEST_BATCH",expectedRevision:S.get().revision,commands:[{type:"ADD_CLIENT",record:{id:"C-136",name:"Cliente TEST 136"}},{type:"ADD_SITE",record:{id:"S-136",clientId:"C-136",address:"Via Fittizia 136"}}]},null,2);reviewed=null;result.textContent="Esempio fittizio pronto; verificare prima di applicare.";};
 const deps={operations:window.ITE_Operations123,audit:window.ITE_Audit124};
 preview.onclick=()=>{try{const p=B.preview(S.get(),input.value,actor.value,deps);reviewed={raw:input.value,actor:actor.value,revision:p.baseRevision};result.textContent="ANTEPRIMA OK: "+p.operations.length+" operazioni, revisione "+p.baseRevision+" → "+p.nextRevision+". Nessuna modifica applicata."; }catch(e){reviewed=null;result.textContent="Errore: "+e.message;}};
 apply.onclick=()=>{try{if(!reviewed||reviewed.raw!==input.value||reviewed.actor!==actor.value||reviewed.revision!==S.get().revision)throw Error("RIPETERE_ANTEPRIMA");const r=B.commit(S,input.value,actor.value,deps);reviewed=null;result.textContent="LOTTO TEST APPLICATO: "+r.operations.length+" operazioni; revisione "+r.revision+". Esportare backup dalla console unica."; }catch(e){reviewed=null;result.textContent="Nessuna conferma: "+e.message;}};
 S.subscribe(()=>{reviewed=null;});
 section.append(controls,result);(document.querySelector("main")||document.body).append(section);
}
function wait(n=0){if(window.ITE_Batch136&&window.ITE_UnifiedSession129)mount();else if(n<100)setTimeout(()=>wait(n+1),100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>wait());else wait();
})();
