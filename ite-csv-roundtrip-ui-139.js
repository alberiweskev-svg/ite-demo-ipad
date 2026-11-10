/* I.T.E. 4.0.139 — local TEST CSV export, no uploads. */
(function(){"use strict";
function mount(){
 if(document.getElementById("ite-csv-export-139")||!window.ITE_CsvRoundtrip139||!window.ITE_UnifiedSession129)return;
 const S=window.ITE_UnifiedSession129,E=window.ITE_CsvRoundtrip139;
 const section=document.createElement("section");section.id="ite-csv-export-139";section.className="panel";
 const h=document.createElement("h2");h.textContent="4.0.139 — Esporta anagrafiche TEST CSV";section.appendChild(h);
 const note=document.createElement("p");note.textContent="Solo dati fittizi. Il file viene creato nel browser, senza invio in rete. Non utilizzare dati reali nella demo pubblica.";section.appendChild(note);
 const selector=document.createElement("select");selector.setAttribute("aria-label","Separatore CSV");for(const [v,label] of [[";","Punto e virgola"],[",","Virgola"],["\t","TAB"]]){const o=document.createElement("option");o.value=v;o.textContent=label;selector.appendChild(o);}section.appendChild(selector);
 const actions=document.createElement("div");actions.style.cssText="display:flex;gap:10px;flex-wrap:wrap";section.appendChild(actions);
 const verify=document.createElement("button");verify.textContent="Controlla gerarchia e conversione";verify.type="button";actions.appendChild(verify);
 const save=document.createElement("button");save.textContent="Esporta CSV TEST";save.type="button";save.disabled=true;actions.appendChild(save);
 for(const b of [verify,save])b.style.minHeight="44px";
 const out=document.createElement("pre");out.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";out.setAttribute("aria-live","polite");section.appendChild(out);
 let verified=null;const invalidate=()=>{verified=null;save.disabled=true;};
 selector.addEventListener("change",invalidate);S.subscribe(invalidate);
 verify.onclick=()=>{try{const state=S.get(),a=E.audit(state),r=E.roundtrip(state,window.ITE_CsvImport138,selector.value);if(!a.ok||!r.ok)throw Error(a.issues.join(",")||"CONVERSIONE_NON_REVERSIBILE");verified={revision:state.revision,sep:selector.value};save.disabled=false;out.textContent="Verifica OK: "+r.rows+" righe, "+r.bytes+" caratteri. Nessun dato inviato.";}catch(e){invalidate();out.textContent="Verifica non superata: "+e.message;}};
 save.onclick=()=>{try{if(!verified||verified.revision!==S.get().revision||verified.sep!==selector.value)throw Error("RIPETERE_VERIFICA");const csv=E.exportCsv(S.get(),selector.value);const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ITE_4.0.139_anagrafiche_TEST.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);out.textContent="Esportazione locale avviata. Conservare il file solo in ambiente TEST.";invalidate();}catch(e){invalidate();out.textContent=e.message;}};
 (document.querySelector("main")||document.body).appendChild(section);
}
function wait(n=0){if(window.ITE_CsvRoundtrip139&&window.ITE_CsvImport138&&window.ITE_UnifiedSession129)mount();else if(n<100)setTimeout(()=>wait(n+1),100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>wait());else wait();
})();
