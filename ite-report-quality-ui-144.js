/* I.T.E. 4.0.144 — integrated technical report quality view (TEST). */
(function(){"use strict";let tries=0;
function mount(){
 const S=window.ITE_UnifiedSession129,Q=window.ITE_ReportQuality144;
 if(!S||!Q){if(++tries<100)setTimeout(mount,100);return;}
 if(document.getElementById("ite-report-quality-144"))return;
 const section=document.createElement("section");section.id="ite-report-quality-144";section.className="panel";
 const title=document.createElement("h2");title.textContent="Controllo fascicoli interventi — TEST 4.0.144";
 const note=document.createElement("p");note.textContent="Controllo di completezza e coerenza; non certifica l'esecuzione delle prove. Solo dati fittizi.";
 const filter=document.createElement("select"),refresh=document.createElement("button"),print=document.createElement("button"),out=document.createElement("div");
 refresh.textContent="Aggiorna controllo";print.textContent="Stampa riepilogo TEST";refresh.type=print.type="button";
 section.append(title,note,filter,refresh,print,out);
 let last;
 function render(){
  try{const state=S.get(),c=state.field.catalog,current=filter.value;filter.replaceChildren();
   const all=document.createElement("option");all.value="";all.textContent="Tutti i tecnici";filter.append(all);
   for(const op of c.operators||[]){const o=document.createElement("option");o.value=op.id;o.textContent=op.name||op.id;filter.append(o);}
   filter.value=current;
   last=Q.audit(state,{operatorId:filter.value});out.replaceChildren();
   const summary=document.createElement("p");summary.textContent="Appuntamenti: "+last.summary.total+" · Fascicoli pronti: "+last.summary.ready+" · Anomalie: "+last.summary.withErrors+" · Da verificare: "+last.summary.withWarnings+" · Rapporti orfani: "+last.summary.orphan;out.append(summary);
   for(const r of last.rows){const item=document.createElement("div");item.className="item";const heading=document.createElement("strong");heading.textContent=r.date+" · "+r.client+" · "+r.site;const p=document.createElement("p");p.textContent=r.operator+" · "+r.status+" · Controlli "+r.checksDone+"/"+r.checksTotal+" · "+(r.errors.concat(r.warnings).join(", ")||"Pronto");item.append(heading,p);out.append(item);}
  }catch(e){out.textContent="Controllo non disponibile: "+e.message;}
 }
 filter.addEventListener("change",render);refresh.addEventListener("click",render);
 print.addEventListener("click",()=>{if(!last)return;const blob=new Blob([Q.printable(last)],{type:"text/html;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ITE-fascicoli-TEST-144.html";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);});
 (document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);
 S.subscribe(render);render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
