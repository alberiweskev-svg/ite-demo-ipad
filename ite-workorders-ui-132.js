/* I.T.E. 4.0.132 — read-only work-order console, shared TEST session. */
(function(){"use strict";
function mount(){
 const S=window.ITE_UnifiedSession129,W=window.ITE_WorkOrders132;
 if(!S||!W||document.getElementById("ite-workorders-132"))return;
 const el=(tag,t)=>{const x=document.createElement(tag);if(t!==undefined)x.textContent=t;return x;};
 const panel=el("section");panel.id="ite-workorders-132";panel.className="panel";
 panel.append(el("h2","I.T.E. 4.0.132 — Fascicoli intervento TEST"),el("p","Vista unica su appuntamenti, interventi, Extra approvati e riferimenti commerciali. Nessun PDF reale, nessun salvataggio o invio."));
 const filters=el("div");filters.style.cssText="display:flex;flex-wrap:wrap;gap:10px";
 const client=el("select"),operator=el("select"),from=el("input"),to=el("input");from.type=to.type="date";
 for(const [label,input] of [["Cliente",client],["Tecnico",operator],["Dal",from],["Al",to]]){const l=el("label",label);l.style.cssText="display:flex;flex-direction:column;gap:5px;min-width:145px;flex:1";input.style.minHeight="44px";l.append(input);filters.append(l);}
 const summary=el("p"),output=el("div"),error=el("p");error.setAttribute("aria-live","polite");panel.append(filters,summary,error,output);
 const choices=(select,items)=>{const old=select.value;select.replaceChildren();const all=el("option","Tutti");all.value="";select.append(all);for(const item of items){const o=el("option",item.name||item.id);o.value=item.id;select.append(o);}select.value=items.some(x=>x.id===old)?old:"";};
 function render(){try{
  const state=S.get(),c=state.field.catalog;choices(client,c.clients);choices(operator,c.operators);
  const data=W.build(state,{clientId:client.value,operatorId:operator.value,from:from.value,to:to.value});
  summary.textContent="Revisione "+data.revision+" · Appuntamenti "+data.count+" · Senza intervento "+data.summary.withoutIntervention+" · Con Extra "+data.summary.withExtras+" · Con fatture collegate alla sede "+data.summary.withInvoices;
  error.textContent="";output.replaceChildren();
  for(const job of data.jobs){const details=el("details"),heading=el("summary",job.startAt+" · "+job.client+" · "+job.operator+" · "+job.status);heading.style.cssText="padding:12px;cursor:pointer";details.append(heading);
   const p=el("p",job.site+" · "+job.system+" · "+job.equipment+" · "+job.kind);details.append(p);
   details.append(el("p","Intervento: "+(job.intervention?.status||"Non avviato")+" · Preventivi sede: "+job.estimates.map(x=>x.id).join(", ")+" · Extra: "+job.extras.map(x=>x.id).join(", ")+" · Fatture sede: "+job.invoices.map(x=>x.id).join(", ")));
   if(job.warnings.length)details.append(el("p","Da verificare: "+job.warnings.join(", ")));
   details.style.cssText="border-bottom:1px solid #bbb;padding:4px";output.append(details);}
  if(!data.jobs.length)output.append(el("p","Nessun appuntamento per i filtri scelti."));
 }catch(e){error.textContent="Errore fascicolo: "+e.message;output.replaceChildren();}}
 for(const input of [client,operator,from,to])input.addEventListener("change",render);
 S.subscribe(render);(document.querySelector("main")||document.body).append(panel);
}
let tries=0;function wait(){if(window.ITE_UnifiedSession129&&window.ITE_WorkOrders132)mount();else if(++tries<80)setTimeout(wait,100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wait);else wait();
})();
