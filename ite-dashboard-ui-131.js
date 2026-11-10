/* I.T.E. 4.0.131 — synchronized touch dashboard, no new state or persistence. */
(function(){"use strict";
function mount(){
 const S=window.ITE_UnifiedSession129,D=window.ITE_Dashboard131;
 if(!S||!D||document.getElementById("ite-dashboard-131"))return;
 const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;};
 const panel=el("section");panel.id="ite-dashboard-131";panel.className="panel";
 panel.append(el("h2","I.T.E. 4.0.131 — Cruscotto integrato TEST"),el("p","Vista sincronizzata con inserimento guidato e console TEST. Solo dati fittizi; nessun salvataggio permanente o invio di documenti."));
 const filters=el("div");filters.style.cssText="display:flex;flex-wrap:wrap;gap:12px;align-items:end";
 const client=el("select"),operator=el("select"),date=el("input"),status=el("select");date.type="date";
 const filter=(title,input)=>{const l=el("label",title);l.style.cssText="display:flex;flex-direction:column;gap:5px;min-width:140px;flex:1";input.style.minHeight="44px";l.append(input);filters.append(l);};
 filter("Cliente",client);filter("Giorno",date);filter("Tecnico",operator);filter("Stato appuntamento",status);
 const reset=el("button","Azzera filtri");reset.type="button";reset.onclick=()=>{client.value="";date.value="";operator.value="";status.value="";render();};filters.append(reset);
 const summary=el("p"),body=el("div"),error=el("p");error.setAttribute("aria-live","polite");
 panel.append(filters,summary,error,body);
 const choices=(select,items,previous)=>{select.replaceChildren();const blank=el("option","Tutti");blank.value="";select.append(blank);for(const item of items){const o=el("option",item.label);o.value=item.value;select.append(o);}select.value=items.some(x=>x.value===previous)?previous:"";};
 function table(title,columns,rows){const h=el("h3",title);body.append(h);if(!rows.length){body.append(el("p","Nessun elemento per i filtri selezionati."));return;}const wrapper=el("div");wrapper.style.cssText="overflow-x:auto;max-width:100%";const t=el("table");t.style.cssText="width:100%;border-collapse:collapse;min-width:460px";const head=el("thead"),hr=el("tr");for(const [label] of columns){const th=el("th",label);th.style.cssText="text-align:left;padding:8px;border-bottom:1px solid #999";hr.append(th);}head.append(hr);t.append(head);const tb=el("tbody");for(const r of rows){const tr=el("tr");for(const [,key] of columns){const td=el("td",String(typeof key==="function"?key(r):r[key]??""));td.style.cssText="padding:8px;border-bottom:1px solid #ddd";tr.append(td);}tb.append(tr);}t.append(tb);wrapper.append(t);body.append(wrapper);}
 function render(){try{
 const s=S.get(),c=s.field.catalog,oldC=client.value,oldO=operator.value,oldSt=status.value;
 choices(client,c.clients.map(x=>({value:x.id,label:x.name||x.id})),oldC);
 choices(operator,c.operators.map(x=>({value:x.id,label:x.name||x.id})),oldO);
 choices(status,[...new Set(c.appointments.map(x=>x.status))].map(x=>({value:x,label:x})),oldSt);
 const v=D.view(s,{clientId:client.value,date:date.value,operatorId:operator.value,status:status.value});
 summary.textContent="Revisione "+v.revision+" · Clienti "+v.counts.clients+" · Sedi "+v.counts.sites+" · Impianti "+v.counts.systems+" · Apparecchiature "+v.counts.equipment+" · Interventi "+v.counts.interventions;
 error.textContent="";body.replaceChildren();
 table("Agenda e interventi",[["Inizio","startAt"],["Cliente","client"],["Sede","site"],["Tecnico","operator"],["Stato","status"],["Intervento","intervention"]],v.appointments);
 table("Preventivi",[["Codice","id"],["Stato","status"],["Totale IVA inclusa",x=>x.totals.gross]],v.estimates);
 table("Lavori Extra",[["Codice","id"],["Appuntamento","appointmentId"],["Totale IVA inclusa",x=>x.totals.gross]],v.extras);
 table("Documenti fiscali TEST",[["Codice","id"],["Tipo","type"],["Totale IVA inclusa",x=>x.totals.gross]],v.invoices);
 if(v.dossier){const d=v.dossier;body.append(el("p","Fascicolo: "+d.sites.length+" sedi · "+d.systems.length+" impianti · "+d.equipment.length+" apparecchiature · "+d.interventions.length+" interventi"));}
 }catch(e){error.textContent="Errore verifica dati: "+e.message;body.replaceChildren();}}
 for(const x of [client,date,operator,status])x.addEventListener("change",render);
 S.subscribe(render);(document.querySelector("main")||document.body).append(panel);
}
let tries=0;function wait(){if(window.ITE_UnifiedSession129&&window.ITE_Dashboard131)mount();else if(++tries<80)setTimeout(wait,100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wait);else wait();
})();
