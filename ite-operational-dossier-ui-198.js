/* I.T.E. 4.0.198 — operational dossier embedded in existing field workspace. */
(function(root){"use strict";
function init(){
 const d=root.document,host=d&&d.getElementById("ite-field-workspace-172"),bridge=root.ITE_FieldWorkspaceBridge174,extra=root.ITE_ExtrasWorkspaceBridge175,engine=root.ITEOperationalDossier198;
 if(!host||!bridge||!engine)return;
 const panel=d.createElement("section");panel.className="panel";panel.id="ite-operational-dossier-198";
 const h=d.createElement("h3");h.textContent="Fascicolo operativo integrato — TEST";
 const hint=d.createElement("p");hint.className="hint";hint.textContent="Cliente → Sede → Impianto → Apparecchiatura → Appuntamento → Intervento → Extra/Preventivo. Sola lettura, nessuna persistenza.";
 const selector=d.createElement("select");selector.setAttribute("aria-label","Filtra cliente");
 const refresh=d.createElement("button");refresh.type="button";refresh.textContent="Aggiorna fascicolo";
 const exportButton=d.createElement("button");exportButton.type="button";exportButton.textContent="Esporta CSV verificato";
 const status=d.createElement("p");status.setAttribute("role","status");const quality=d.createElement("div");quality.setAttribute("aria-live","polite");const output=d.createElement("div");
 panel.append(h,hint,selector,refresh,exportButton,status,quality,output);host.append(panel);
 let current=null;
 function render(){try{
  const field=bridge.snapshot(),commercial=extra&&typeof extra.snapshot==="function"?extra.snapshot():{extras:[],quotes:[]};
  const selected=selector.value;selector.replaceChildren();
  const all=d.createElement("option");all.value="";all.textContent="Tutti i clienti TEST";selector.append(all);
  for(const c of field.clients){const option=d.createElement("option");option.value=c.id;option.textContent=c.name||c.id;selector.append(option);}
  selector.value=field.clients.some(c=>c.id===selected)?selected:"";
  current=engine.build(field,commercial,{clientId:selector.value});const audit=root.ITEOperationalQuality199&&root.ITEOperationalQuality199.audit(field,commercial);exportButton.disabled=!current.valid||!audit||!audit.valid;quality.replaceChildren();const summary=d.createElement("p");summary.className="hint";summary.textContent=!audit?"Controllo qualità 4.0.199 non disponibile":audit.valid?"Qualità operativa: "+audit.totals.appointments+" appuntamenti, "+audit.totals.interventions+" interventi, "+audit.totals.overlaps+" sovrapposizioni; "+audit.warnings.length+" avvisi.":"Controllo qualità bloccante: "+audit.issues.join(" · ");quality.append(summary);
  if(audit&&audit.operatorSchedule&&audit.operatorSchedule.length){
   const heading=d.createElement("h4");heading.textContent="Agenda tecnici — controllo sovrapposizioni";quality.append(heading);
   for(const tech of audit.operatorSchedule){const section=d.createElement("details");const label=d.createElement("summary");label.textContent="Operatore "+tech.operatorId+" — "+tech.appointments.length+" appuntamenti";section.append(label);
    const list=d.createElement("ul");for(const ap of tech.appointments){const line=d.createElement("li");line.textContent=ap.id+" · "+ap.start+" → "+ap.end;list.append(line);}section.append(list);quality.append(section);}
  }
  if(audit&&audit.warnings.length){const warning=d.createElement("p");warning.className="hint";warning.textContent="Avvisi: "+audit.warnings.join(" · ");quality.append(warning);}
  status.textContent=current.valid?"Controllo valido — "+current.totals.appointments+" appuntamenti, "+current.totals.interventions+" interventi, "+current.totals.extras+" extra, "+current.totals.quotes+" preventivi.":"Anomalie: "+current.issues.join(" · ");
  output.replaceChildren();
  for(const r of current.rows){const item=d.createElement("p");item.className="item";item.textContent=[r.client,r.site,r.system,r.equipment,r.start,r.status,"Interventi: "+r.interventions.map(i=>i.id+" ("+i.status+")").join(", ")].join(" · ");output.append(item);}
 }catch(err){current=null;exportButton.disabled=true;status.textContent="Fascicolo non disponibile: "+err.message;}}
 function download(){if(!current||!current.valid||!root.ITEOperationalQuality199)return;const field=bridge.snapshot(),commercial=extra&&typeof extra.snapshot==="function"?extra.snapshot():{extras:[],quotes:[]};if(!root.ITEOperationalQuality199.audit(field,commercial).valid)return;const url=URL.createObjectURL(new Blob([engine.csv(current)],{type:"text/csv;charset=utf-8"}));const a=d.createElement("a");a.href=url;a.download="ITE-4.0.198-FASCICOLO-TEST.csv";panel.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 refresh.addEventListener("click",render);selector.addEventListener("change",render);exportButton.addEventListener("click",download);
 if(typeof bridge.subscribe==="function")bridge.subscribe(render);
 if(extra&&typeof extra.subscribe==="function")extra.subscribe(render);
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init();}
})(typeof globalThis!=="undefined"?globalThis:this);