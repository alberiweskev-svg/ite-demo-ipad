/* I.T.E. 4.0.133 — accessible, printable reconciliation view; no data transmission. */
(function(){"use strict";
function mount(){
 const S=window.ITE_UnifiedSession129,R=window.ITE_Reconcile133;
 if(!S||!R||document.getElementById("ite-reconcile-133"))return;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const section=el("section");section.id="ite-reconcile-133";section.className="panel";
 section.append(el("h2","I.T.E. 4.0.133 — Riconciliazione per intervento TEST"),el("p","Documenti attribuiti all'intervento separati dai documenti generici della sede. Nessun dato reale, invio o salvataggio."));
 const bar=el("div");bar.style.cssText="display:flex;flex-wrap:wrap;gap:12px";
 const client=el("select"),operator=el("select"),from=el("input"),to=el("input");from.type=to.type="date";
 for(const [name,control] of [["Cliente",client],["Tecnico",operator],["Dal",from],["Al",to]]){const label=el("label",name);label.style.cssText="display:flex;flex-direction:column;flex:1;min-width:140px";control.style.minHeight="44px";label.append(control);bar.append(label);}
 const print=el("button","Stampa riepilogo TEST");print.type="button";print.addEventListener("click",()=>window.print());
 const notice=el("p"),issues=el("p"),list=el("div");issues.setAttribute("aria-live","polite");section.append(bar,print,notice,issues,list);
 const options=(select,items)=>{const prev=select.value;select.replaceChildren();const all=el("option","Tutti");all.value="";select.append(all);for(const item of items){const o=el("option",item.name||item.id);o.value=item.id;select.append(o);}select.value=items.some(x=>x.id===prev)?prev:"";};
 const euro=n=>Number(n).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 function render(){try{
  const state=S.get(),c=state.field.catalog;options(client,c.clients);options(operator,c.operators);
  const report=R.reconcile(state,{clientId:client.value,operatorId:operator.value,from:from.value,to:to.value});
  const invalid=R.checkLinks(state);issues.textContent=invalid.length?"Collegamenti da correggere: "+invalid.map(x=>x.group+"/"+x.id).join(", "):"";
  notice.textContent=report.notice+" · Revisione "+report.revision+" · Interventi "+report.count;list.replaceChildren();
  for(const job of report.jobs){const d=el("details"),h=el("summary",job.startAt+" · "+job.client+" · "+job.site+" · "+job.operator);h.style.cssText="padding:12px;cursor:pointer;min-height:44px";d.append(h);
   const r=job.reconciliation,t=r.totals;
   d.append(el("p","Intervento: "+(job.intervention?.status||"non avviato")+" · "+job.equipment));
   d.append(el("p","Preventivi attribuiti: "+(r.estimates.map(x=>x.id).join(", ")||"nessuno")+" · Fatture attribuite: "+(r.invoices.map(x=>x.id+" ("+x.type+")").join(", ")||"nessuna")));
   d.append(el("p","Preventivi "+euro(t.estimate.gross)+" · Extra approvati "+euro(t.approvedExtras.gross)+" · Vendite "+euro(t.sales.gross)+" · TD04 "+euro(t.credits.gross)+" · Fatturato netto "+euro(t.netBilled)+" · Differenza indicativa "+euro(t.difference)));
   d.append(el("p","Solo sede, non attribuiti: preventivi "+(r.siteUnassigned.estimates.join(", ")||"nessuno")+"; documenti "+(r.siteUnassigned.invoices.join(", ")||"nessuno")));
   if(r.warnings.length)d.append(el("p","Verificare: "+r.warnings.join(", ")));
   d.style.cssText="border-bottom:1px solid #aaa;padding:5px";list.append(d);
  }
  if(!report.jobs.length)list.append(el("p","Nessun intervento nel filtro."));
 }catch(e){issues.textContent="Errore: "+e.message;list.replaceChildren();}}
 for(const control of [client,operator,from,to])control.addEventListener("change",render);
 S.subscribe(render);(document.querySelector("main")||document.body).append(section);
}
let tries=0;function wait(){if(window.ITE_UnifiedSession129&&window.ITE_Reconcile133)mount();else if(++tries<100)setTimeout(wait,100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wait);else wait();
})();
