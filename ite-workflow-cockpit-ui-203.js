/* I.T.E. 4.0.203 — integrated TEST workflow cockpit; ephemeral isolated synthetic state. */
(function(root){"use strict";
function init(){
 const d=root.document,host=d&&d.getElementById("ite-field-workspace-172"),B=root.ITEOperationalBatch202;
 if(!host||!B||d.getElementById("ite-workflow-cockpit-203"))return;
 const panel=d.createElement("section");panel.className="panel";panel.id="ite-workflow-cockpit-203";
 const heading=d.createElement("h3");heading.textContent="Flusso operativo e agenda — collaudo TEST 4.0.206";
 const warning=d.createElement("p");warning.textContent="Solo dati sintetici TEST: salvataggio automatico locale sul dispositivo, senza sincronizzazione o fatturazione. Non inserire dati reali.";
 const controls=d.createElement("div"),output=d.createElement("div"),status=d.createElement("p"),integrated=d.createElement("div");status.setAttribute("role","status");
 panel.append(heading,warning,controls,status,output,integrated);host.append(panel);
 const Session=root.ITEOperationalSession206; if(!Session){status.textContent="Modulo sessione 4.0.206 non caricato.";return;} const start="2026-11-13T09:00:00+01:00",end="2026-11-13T10:00:00+01:00";
 function fresh(){return {field:{clients:[{id:"C-TEST",name:"Cliente dimostrativo"}],sites:[{id:"S-TEST",clientId:"C-TEST",name:"Immobile demo"}],systems:[{id:"SYS-TEST",siteId:"S-TEST",name:"Riscaldamento demo"}],equipment:[{id:"E-TEST",systemId:"SYS-TEST",name:"Generatore fittizio"}],operators:[{id:"OP-TEST",name:"Tecnico demo"},{id:"OP-TEST-2",name:"Secondo tecnico demo"}],appointments:[],interventions:[]},commercial:{extras:[],quotes:[]}};}
 let state=fresh(),session=Session.create(state.field,state.commercial),history=[],serial=0,persistent=null;
 function commitLocal(previous){if(!persistent)return;try{persistent.save(state,persistent.snapshot().revision);}catch(e){state=previous;session.reset(previous.field,previous.commercial);throw Error("SALVATAGGIO_AUTOMATICO_BLOCCATO: "+e.message);}}
 function changeSession(operation,message){const previous={field:JSON.parse(JSON.stringify(state.field)),commercial:JSON.parse(JSON.stringify(state.commercial))};try{const result=operation();state={field:result.state.field,commercial:result.state.commercial};commitLocal(previous);status.textContent=message;render();}catch(e){status.textContent=e.message;render();}}
 function button(label,fn){const b=d.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",fn);controls.append(b);return b;}
 function transact(actions){changeSession(()=>session.apply(actions),"Lotto confermato e salvato automaticamente: "+actions.length+" operazioni TEST.");}
 const book=button("1 · Pianifica",()=>{const n=++serial;const date=new Date(Date.parse(start)+(n-1)*86400000);const begin=date.toISOString(),finish=new Date(date.getTime()+3600000).toISOString();transact([{type:"APPOINTMENT_CREATE",id:"A-"+n,clientId:"C-TEST",siteId:"S-TEST",equipmentId:"E-TEST",operatorId:"OP-TEST",start:begin,end:finish}]);});
 button("Riprogramma appuntamento",()=>{const a=state.field.appointments.find(x=>x.status==="PIANIFICATO");if(!a){status.textContent="Nessun appuntamento riprogrammabile.";return;}const startNew=new Date(Date.parse(a.start)+7200000).toISOString(),endNew=new Date(Date.parse(a.end)+7200000).toISOString();transact([{type:"APPOINTMENT_RESCHEDULE",appointmentId:a.id,start:startNew,end:endNew}]);});
 button("Annulla appuntamento",()=>{const a=state.field.appointments.find(x=>x.status==="PIANIFICATO");if(!a){status.textContent="Nessun appuntamento annullabile.";return;}transact([{type:"APPOINTMENT_CANCEL",appointmentId:a.id}]);});
 button("Riassegna tecnico TEST",()=>{const a=state.field.appointments.find(x=>x.status==="PIANIFICATO");if(!a){status.textContent="Nessun appuntamento da riassegnare.";return;}transact([{type:"APPOINTMENT_REASSIGN",appointmentId:a.id,operatorId:a.operatorId==="OP-TEST"?"OP-TEST-2":"OP-TEST"}]);});
 button("Revisiona orario chiuso TEST",()=>{const i=state.field.interventions.find(x=>x.status==="CHIUSO");if(!i){status.textContent="Nessun intervento chiuso.";return;}const arrivedAt=new Date(Date.parse(i.arrivedAt)+60000).toISOString();transact([{type:"INTERVENTION_REVISE_TIME",interventionId:i.id,arrivedAt,exitedAt:i.exitedAt,reason:"Rettifica dimostrativa di un minuto"}]);});
 button("2 · Sono arrivato",()=>{const a=state.field.appointments.find(x=>x.status==="PIANIFICATO");if(!a){status.textContent="Nessun appuntamento pianificato.";return;}transact([{type:"ARRIVAL",appointmentId:a.id,interventionId:"I-"+a.id,at:a.start}]);});
 button("3 · Extra e preventivo",()=>{const i=state.field.interventions.find(x=>x.status==="APERTO"&&!state.commercial.extras.some(e=>e.interventionId===x.id));if(!i){status.textContent="Nessun intervento aperto senza Extra.";return;}const n=i.id,material="F-"+n,labor="P-"+n;transact([{type:"EXTRA_ADD",id:material,interventionId:n,kind:"FORNITURA",description:"Materiale dimostrativo",priceCents:15000},{type:"EXTRA_ADD",id:labor,interventionId:n,kind:"POSA",description:"Posa dimostrativa",priceCents:9000},{type:"EXTRA_APPROVE",id:material,status:"APPROVATO"},{type:"EXTRA_APPROVE",id:labor,status:"APPROVATO"},{type:"QUOTE_CREATE",id:"Q-"+n,interventionId:n,extraIds:[material,labor]},{type:"QUOTE_DECIDE",id:"Q-"+n,status:"ACCETTATO"}]);});
 button("4 · Chiudi intervento",()=>{const i=state.field.interventions.find(x=>x.status==="APERTO");if(!i){status.textContent="Nessun intervento aperto.";return;}const a=state.field.appointments.find(x=>x.id===i.appointmentId);transact([{type:"CLOSE",interventionId:i.id,at:a.end}]);});
 button("Esegui ciclo completo",()=>{const n=++serial,a="A-"+n,i="I-"+n,base=Date.parse(start)+(n-1)*86400000,t1=new Date(base).toISOString(),t2=new Date(base+3600000).toISOString();transact([{type:"APPOINTMENT_CREATE",id:a,clientId:"C-TEST",siteId:"S-TEST",equipmentId:"E-TEST",operatorId:"OP-TEST",start:t1,end:t2},{type:"ARRIVAL",appointmentId:a,interventionId:i,at:t1},{type:"EXTRA_ADD",id:"F-"+n,interventionId:i,kind:"FORNITURA",description:"Fornitura TEST",priceCents:15000},{type:"EXTRA_ADD",id:"P-"+n,interventionId:i,kind:"POSA",description:"Posa TEST",priceCents:9000},{type:"EXTRA_APPROVE",id:"F-"+n,status:"APPROVATO"},{type:"EXTRA_APPROVE",id:"P-"+n,status:"APPROVATO"},{type:"QUOTE_CREATE",id:"Q-"+n,interventionId:i,extraIds:["F-"+n,"P-"+n]},{type:"QUOTE_DECIDE",id:"Q-"+n,status:"ACCETTATO"},{type:"CLOSE",interventionId:i,at:t2}]);});
 button("Annulla ultimo lotto TEST",()=>{changeSession(()=>session.undo(),"Lotto annullato e archivio TEST aggiornato.");});
 button("Ripristina lotto TEST",()=>{changeSession(()=>session.redo(),"Lotto ripristinato e archivio TEST aggiornato.");});
 button("Azzera solo collaudo",()=>{changeSession(()=>session.reset(fresh().field,fresh().commercial),"Archivio TEST azzerato e salvato.");serial=0;});
 function render(){output.replaceChildren();integrated.replaceChildren();const report=B.audit(state.field,state.commercial);const summary=d.createElement("p");summary.textContent="Integrità: "+(report.valid?"OK":"ERRORI: "+report.issues.join(", "))+" · Appuntamenti: "+report.totals.appointments+" · Interventi: "+report.totals.interventions+" · Fornitura approvata: € "+(report.totals.approvedSupplyCents/100).toFixed(2)+" · Posa approvata: € "+(report.totals.approvedInstallationCents/100).toFixed(2)+" · Preventivi accettati: € "+(report.totals.acceptedQuotesCents/100).toFixed(2);output.append(summary);
 for(const a of state.field.appointments){const p=d.createElement("p");const i=state.field.interventions.find(v=>v.appointmentId===a.id);p.textContent=a.id+" · "+a.start+" · "+a.status+" · Tecnico "+a.operatorId+(i?" · "+i.status+" · "+i.durationMinutes+" minuti":"");output.append(p);}
 const log=d.createElement("p");const sessionStatus=session.status();log.textContent="Lotti TEST in memoria: "+sessionStatus.index+" / "+(sessionStatus.length-1)+" · Eventi applicati: "+sessionStatus.events+" · Annulla: "+(sessionStatus.canUndo?"sì":"no")+" · Ripristina: "+(sessionStatus.canRedo?"sì":"no");output.append(log);renderIntegrated();}
 function renderIntegrated(){
 const W=root.ITEIntegratedWorkspace207;
 if(!W){const p=d.createElement("p");p.textContent="Fascicolo integrato 4.0.207 non caricato.";integrated.append(p);return;}
 try{
 const report=W.snapshot(state.field,state.commercial),group=W.agendaByOperator(report),amounts=W.commercialByIntervention(report);
 const h=d.createElement("h4");h.textContent="Fascicolo, agenda e commerciale integrati — TEST 4.0.208";integrated.append(h);
 const info=d.createElement("p");info.textContent="Cliente: "+report.clients.map(c=>c.name).join(", ")+" · Sedi: "+report.clients.reduce((n,c)=>n+c.sites.length,0)+" · Appuntamenti: "+report.agenda.length+" · Interventi: "+report.interventions.length;integrated.append(info);
 for(const [operator,items] of Object.entries(group)){const p=d.createElement("p");p.textContent="Tecnico "+operator+": "+items.map(a=>a.id+" ("+a.status+", "+a.start+")").join("; ");integrated.append(p);}
 for(const a of amounts){const p=d.createElement("p");p.textContent=a.interventionId+" · FORNITURA € "+(a.supplyCents/100).toFixed(2)+" · POSA € "+(a.installationCents/100).toFixed(2)+" · Preventivi accettati € "+(a.acceptedQuoteCents/100).toFixed(2);integrated.append(p);}
 function exportButton(label,content,type,filename){const b=d.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",()=>{const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=d.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});integrated.append(b);}
 exportButton("Esporta agenda CSV TEST",W.csvAgenda(report),"text/csv;charset=utf-8","agenda-test-208.csv");
 exportButton("Esporta fascicolo JSON TEST",W.exportSynthetic(report),"application/json","fascicolo-test-208.json");
 }catch(e){const p=d.createElement("p");p.textContent="Esportazione bloccata: "+e.message;integrated.append(p);}
 }
 const Store=root.ITEWorkspaceStore209;
 if(Store&&root.localStorage){
  try{
   persistent=Store.create(root.localStorage,state.field,state.commercial);
   const previous=persistent.restore();
   if(previous){state={field:previous.field,commercial:previous.commercial};session.reset(state.field,state.commercial);status.textContent="Archivio TEST locale ripristinato. Non contiene dati operativi.";}
   button("Salva archivio TEST sul dispositivo",()=>{
    try{const p=persistent.save(state,persistent.snapshot().revision);status.textContent="Archivio TEST salvato localmente · revisione "+p.revision;}
    catch(e){status.textContent="Salvataggio TEST non riuscito: "+e.message;}
   });
   button("Ricarica archivio TEST locale",()=>{
    try{const p=persistent.restore();if(!p){status.textContent="Nessun archivio TEST salvato.";return;}state={field:p.field,commercial:p.commercial};session.reset(state.field,state.commercial);status.textContent="Archivio TEST ricaricato.";render();}
    catch(e){status.textContent="Ripristino TEST bloccato: "+e.message;}
   });
   button("Elimina salvataggio TEST locale",()=>{
    try{persistent.reset();status.textContent="Solo il salvataggio TEST locale è stato eliminato. La sessione corrente resta invariata.";}
    catch(e){status.textContent=e.message;}
   });
   button("Esporta archivio TEST JSON",()=>{
    try{const content=Store.encode({...Store.synthetic(state.field,state.commercial),revision:persistent.snapshot().revision});const blob=new Blob([content],{type:"application/json"}),url=URL.createObjectURL(blob),a=d.createElement("a");a.href=url;a.download="ite-archivio-sintetico-209.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    catch(e){status.textContent="Esportazione TEST bloccata: "+e.message;}
   });
   const pick=d.createElement("input");pick.type="file";pick.accept=".json,application/json";pick.setAttribute("aria-label","Importa solo archivio sintetico TEST");controls.append(pick);
   pick.addEventListener("change",async()=>{
    try{const file=pick.files&&pick.files[0];if(!file)return;if(file.size>800000)throw Error("FILE_TROPPO_GRANDE");const raw=await file.text();const p=persistent.importJson(raw);state={field:p.field,commercial:p.commercial};session.reset(state.field,state.commercial);status.textContent="Archivio sintetico TEST importato e validato.";render();}
    catch(e){status.textContent="Importazione TEST rifiutata: "+e.message;}finally{pick.value="";}
   });
  }catch(e){status.textContent="Archivio TEST locale non disponibile: "+e.message;}
 }
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init();}
})(typeof globalThis!=="undefined"?globalThis:this);
