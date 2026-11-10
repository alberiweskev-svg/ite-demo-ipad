/* I.T.E. 4.0.127 — single touch-first slot booking panel, synthetic data only. */
(function(){"use strict";
function mount(){
 if(!window.ITE_QuickCalendar127||document.getElementById("ite-quick-calendar-127"))return;
 const section=document.createElement("section");section.id="ite-quick-calendar-127";section.className="panel";
 const heading=document.createElement("h2");heading.textContent="I.T.E. 4.0.127 — Calendario rapido TEST";section.append(heading);
 const hint=document.createElement("p");hint.textContent="Dati esclusivamente fittizi. Caricare un workspace ITE_OPERATIONS_123 o backup ITE_126_TEST_EXPORT. Nessun salvataggio automatico.";section.append(hint);
 const area=document.createElement("textarea");area.rows=3;area.placeholder="Workspace JSON TEST";area.setAttribute("aria-label","Workspace JSON TEST");section.append(area);
 const form=document.createElement("div");form.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px";
 function input(label,type="text"){const l=document.createElement("label");l.textContent=label;l.style.cssText="display:flex;flex-direction:column;gap:4px";const x=document.createElement("input");x.type=type;x.style.minHeight="44px";l.append(x);form.append(l);return x;}
 function select(label){const l=document.createElement("label");l.textContent=label;l.style.cssText="display:flex;flex-direction:column;gap:4px";const x=document.createElement("select");x.style.minHeight="44px";l.append(x);form.append(l);return x;}
 const date=input("Data","date"),operator=select("Tecnico"),client=select("Cliente"),site=select("Sede"),system=select("Impianto"),equipment=select("Apparecchiatura"),actor=input("Operatore registrazione"),id=input("ID appuntamento"),kind=select("Tipo"),notes=input("Note");
 ["MANUTENZIONE_CALDAIA","RIPARAZIONE","CLIMATIZZAZIONE","IDRICO","ELETTRICO","SOPRALLUOGO","ALTRO"].forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=k.replaceAll("_"," ");kind.append(o);});
 const controls=document.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0";
 const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:8px;margin:12px 0";
 const out=document.createElement("pre");out.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";out.setAttribute("aria-live","polite");
 let state=null;
 function button(label,fn,parent=controls){const b=document.createElement("button");b.type="button";b.textContent=label;b.style.minHeight="44px";b.onclick=()=>{try{fn();}catch(e){out.textContent="Errore: "+e.message;}};parent.append(b);return b;}
 function options(el,items){const previous=el.value;el.replaceChildren();const blank=document.createElement("option");blank.value="";blank.textContent="Seleziona";el.append(blank);items.forEach(item=>{const o=document.createElement("option");o.value=item.id;o.textContent=item.label;el.append(o);});if(items.some(x=>x.id===previous))el.value=previous;}
 function refresh(){if(!state)return;const c=window.ITE_Booking126.choices(state,client.value,site.value,system.value);options(client,c.clients);options(site,c.sites);options(system,c.systems);options(equipment,c.equipment);options(operator,c.operators);}
 function render(){if(!state)throw Error("CARICA_WORKSPACE");grid.replaceChildren();const rows=window.ITE_QuickCalendar127.slots(state,{date:date.value,operatorId:operator.value});rows.forEach(slot=>{const b=button(slot.startAt.slice(11)+" – "+slot.endAt.slice(11)+(slot.available?" · Libero":" · Occupato"),()=>{if(!slot.available)throw Error("FASCIA_OCCUPATA");state=window.ITE_QuickCalendar127.bookSlot(state,{slot,id:id.value,clientId:client.value,siteId:site.value,systemId:system.value,equipmentId:equipment.value,operatorId:operator.value,kind:kind.value,notes:notes.value},actor.value);out.textContent="Appuntamento TEST creato. Revisione "+state.revision+". Esportare il backup.";render();},grid);b.disabled=!slot.available;b.setAttribute("aria-label",slot.available?"Prenota "+slot.startAt:"Occupato "+slot.startAt);});}
 client.onchange=()=>{site.value="";system.value="";equipment.value="";refresh();};site.onchange=()=>{system.value="";equipment.value="";refresh();};system.onchange=()=>{equipment.value="";refresh();};
 button("Carica workspace",()=>{const raw=JSON.parse(area.value);state=raw.format==="ITE_126_TEST_EXPORT"?window.ITE_Booking126.importBackup(raw):window.ITE_Operations123.restore(raw);if(!window.ITE_Audit124.audit(state).ok)throw Error("AUDIT_NON_SUPERATO");refresh();out.textContent="Workspace TEST caricato. Revisione "+state.revision;});
 button("Mostra fasce",render);
 button("Esporta backup TEST",()=>{if(!state)throw Error("CARICA_WORKSPACE");area.value=window.ITE_Booking126.exportBackup(state);out.textContent="Backup nel campo testo: copiarlo prima di chiudere la pagina.";});
 section.append(controls,form,grid,out);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
