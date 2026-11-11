/* I.T.E. 4.0.159 — partial dispatch in shared inventory TEST panel. */
(function(root){"use strict";
let tries=0;
function mount(){
 const S=root.ITE_UnifiedSession129,P=root.ITE_PartialDispatch159;
 const host=document.getElementById("ite-dispatch-158");
 if(!S||!P||!host){if(++tries<80)setTimeout(mount,150);return;}
 if(document.getElementById("ite-partial-dispatch-159"))return;
 const el=(tag,value)=>{const x=document.createElement(tag);if(value!==undefined)x.textContent=value;return x;};
 const section=el("section");section.id="ite-partial-dispatch-159";section.className="panel";
 section.append(el("h3","Uscite parziali — TEST 4.0.159"),el("p","Scarica una parte della prenotazione; il residuo resta disponibile per una successiva uscita."));
 const estimate=el("select"),actor=el("input"),batch=el("input"),rows=el("div"),feedback=el("p"),summary=el("div");
 actor.value="Operatore TEST";batch.placeholder="LOTTO-PARZIALE-TEST";
 for(const [label,input] of [["Preventivo accettato",estimate],["Operatore",actor],["ID lotto",batch]]){const l=el("label",label);l.append(input);section.append(l);}
 section.append(rows);
 const actions=el("div");actions.className="actions";
 const check=el("button","Verifica quantità"),save=el("button","Registra uscita parziale TEST"),report=el("button","Resoconto");
 for(const b of [check,save,report]){b.type="button";actions.append(b);}section.append(actions,feedback,summary);
 function selected(){return [...rows.querySelectorAll("input[data-reservation]")].filter(x=>x.value.trim()!=="").map(x=>({reservationId:x.dataset.reservation,quantity:Number(x.value)}));}
 function renderRows(){rows.replaceChildren();const s=S.get();for(const r of s.inventory?.reservations||[]){if(r.estimateId!==estimate.value||r.status!=="ATTIVA")continue;const l=el("label",r.id+" · "+r.itemId+" · massimo "+r.quantity),input=el("input");input.type="number";input.min="0.001";input.step="0.001";input.max=String(r.quantity);input.placeholder="Quantità da scaricare";input.dataset.reservation=r.id;l.append(input);rows.append(l);}}
 function refresh(){const old=estimate.value;estimate.replaceChildren();for(const e of S.get().commercial?.estimates||[]){if(e.status!=="ACCETTATO")continue;const o=el("option",e.id);o.value=e.id;estimate.append(o);}if([...estimate.options].some(o=>o.value===old))estimate.value=old;renderRows();}
 estimate.addEventListener("change",renderRows);
 check.onclick=()=>{try{const p=P.inspect(S.get(),estimate.value,selected());feedback.textContent="Verifica superata: "+p.rows.length+" righe, revisione "+p.revision;}catch(e){feedback.textContent="Verifica respinta: "+e.message;}};
 save.onclick=()=>{try{const s=S.get(),n=P.dispatch(s,estimate.value,selected(),actor.value.trim(),s.revision,batch.value.trim());S.restore(n,actor.value.trim());feedback.textContent="Uscita parziale TEST registrata, revisione "+n.revision;}catch(e){feedback.textContent="Uscita respinta: "+e.message;}};
 report.onclick=()=>{try{const r=P.report(S.get(),estimate.value);summary.replaceChildren(el("p","Prenotazioni attive: "+r.active.length+" · uscite: "+r.dispatched.length+" · movimenti: "+r.movements.length));}catch(e){feedback.textContent=e.message;}};
 S.subscribe(refresh);host.append(section);refresh();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
