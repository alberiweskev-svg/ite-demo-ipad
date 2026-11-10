/* I.T.E. 4.0.147 — integrated lifecycle quality console; read-only TEST. */
(function(root){"use strict";
let attempts=0;
function mount(){
 const S=root.ITE_UnifiedSession129,L=root.ITE_Lifecycle146;
 if(!S||!L){if(++attempts<100)setTimeout(mount,100);return;}
 if(document.getElementById("ite-lifecycle-147"))return;
 const make=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;};
 const panel=make("section");panel.id="ite-lifecycle-147";panel.className="panel";
 panel.append(make("h2","Controllo integrato interventi — TEST 4.0.147"),make("p","Vista unificata di cliente, sede, impianto, apparecchiatura, appuntamento, operatore, rapporti, Extra e documenti commerciali. Controlli strutturali, non certificazioni tecniche. Sola lettura e nessun invio al server."));
 const controls=make("div");controls.className="grid";
 const client=make("select"),operator=make("select"),onlyIssues=make("input");onlyIssues.type="checkbox";onlyIssues.style.width="auto";
 for(const [name,field] of [["Cliente",client],["Operatore",operator],["Solo anomalie",onlyIssues]]){const label=make("label",name+" ");label.append(field);controls.append(label);}
 const summary=make("p"),list=make("div"),actions=make("div");actions.className="actions";summary.setAttribute("aria-live","polite");
 const exportButton=make("button","Esporta rapporto JSON TEST");exportButton.type="button";
 const printButton=make("button","Stampa controllo TEST");printButton.type="button";printButton.className="secondary";
 actions.append(exportButton,printButton);panel.append(controls,summary,actions,list);
 let latest=null;
 function setOptions(select,items,allLabel){const selected=select.value;select.replaceChildren();const first=make("option",allLabel);first.value="";select.append(first);for(const item of items){const opt=make("option",item.label);opt.value=item.id;select.append(opt);}select.value=items.some(x=>x.id===selected)?selected:"";}
 function render(){
  try{
   const state=S.get(),c=state.field.catalog;
   setOptions(client,c.clients.map(x=>({id:x.id,label:x.name||x.id})),"Tutti i clienti");
   setOptions(operator,c.operators.map(x=>({id:x.id,label:x.name||x.id})),"Tutti gli operatori");
   const audits=client.value?[L.build(state,client.value)]:L.all(state);
   const visible=audits.map(a=>({...a,rows:a.rows.filter(r=>(!operator.value||r.operatorId===operator.value)&&(!onlyIssues.checked||r.errors.length))})).filter(a=>a.rows.length||(!operator.value&&!onlyIssues.checked&&a.issues.length));
   latest={schema:"ITE_LIFECYCLE_CONSOLE_147",version:"4.0.147",revision:state.revision,filters:{clientId:client.value,operatorId:operator.value,onlyIssues:onlyIssues.checked},audits:visible};
   const rows=visible.flatMap(a=>a.rows),anomalies=rows.reduce((n,r)=>n+r.errors.length,0);
   summary.textContent=rows.length+" appuntamenti · "+rows.filter(r=>r.status==="CHIUSO").length+" chiusi · "+anomalies+" anomalie sugli appuntamenti · "+visible.reduce((n,a)=>n+a.issues.filter(x=>!x.appointmentId).length,0)+" anomalie senza appuntamento";
   list.replaceChildren();
   for(const a of visible){
    const box=make("div");box.className="item";const name=c.clients.find(x=>x.id===a.clientId)?.name||a.clientId;box.append(make("h3",name));
    for(const r of a.rows){
     const d=make("details");d.className="item";const site=c.sites.find(x=>x.id===r.siteId)?.name||r.siteId;
     d.append(make("summary",(r.startAt||"Data assente")+" · "+site+" · "+r.status+" · "+(r.errors.length?r.errors.length+" anomalie":"Controlli OK")));
     for(const line of ["Appuntamento: "+r.appointmentId,"Sede: "+r.siteId+" · Impianto: "+r.systemId+" · Apparecchiatura: "+(r.equipmentId||"non indicata"),"Operatore: "+r.operatorId,"Intervento: "+(r.interventionStatus||"non avviato")+" · Arrivo: "+(r.arrivedAt||"—")+" · Uscita: "+(r.departedAt||"—"),"Rapporto: "+(r.reportStatus||"mancante")+" · Extra: "+r.extraIds.length,"Anomalie: "+(r.errors.join(", ")||"nessuna")])d.append(make("p",line));
     box.append(d);
    }
    const detached=a.issues.filter(x=>!x.appointmentId);
    if(detached.length)box.append(make("p","Altre anomalie: "+detached.map(x=>x.code).join(", ")));
    list.append(box);
   }
   if(!visible.length)list.append(make("p","Nessun risultato con i filtri selezionati."));
  }catch(err){latest=null;summary.textContent="Controllo non disponibile: "+err.message;list.replaceChildren();}
 }
 client.onchange=render;operator.onchange=render;onlyIssues.onchange=render;
 exportButton.onclick=()=>{if(!latest)return;const blob=new Blob([JSON.stringify(latest,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=make("a");a.href=url;a.download="ITE-4.0.147-controllo-TEST.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 printButton.onclick=()=>root.print();
 S.subscribe(render);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(panel);render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
