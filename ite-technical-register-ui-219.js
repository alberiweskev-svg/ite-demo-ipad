/* I.T.E. 4.0.219 — integrated synthetic technical register, Safari touch UI. */
(function(root){"use strict";
function init(){
 const d=root.document,host=d.getElementById("ite-field-workspace-172"),Store=root.ITEWorkspaceStore209,Intake=root.ITEDocumentIntake217,Workflow=root.ITETechnicalWorkflow220;
 if(!host||!Store||!Intake||!Workflow||d.getElementById("ite-technical-register-219"))return;
 const panel=d.createElement("section");panel.id="ite-technical-register-219";panel.className="panel";
 const title=d.createElement("h3");title.textContent="Documenti tecnici — archivio TEST integrato 4.0.219";
 const warning=d.createElement("p");warning.className="hint";warning.textContent="Solo metadati sintetici. Non inserire nomi o documenti reali. Il PDF selezionato viene controllato localmente solo nell'intestazione; non viene salvato né caricato.";
 const controls=d.createElement("div");controls.className="grid";const actions=d.createElement("div");actions.className="actions";const status=d.createElement("p");status.setAttribute("role","status");const output=d.createElement("div");
 panel.append(title,warning,controls,actions,status,output);host.append(panel);
 function el(tag,label,parent){const e=d.createElement(tag);if(label)e.textContent=label;parent.append(e);return e;}
 function field(name,options){const l=el("label",name,controls);const e=d.createElement(options?"select":"input");if(options)for(const [value,label] of options){const o=el("option",label,e);o.value=value;}l.append(e);return e;}
 const kind=field("Tipologia",Intake.TYPES.map(x=>[x,x]));
 const client=field("Cliente TEST",[]),site=field("Sede TEST",[]),intervention=field("Intervento TEST",[]);
 const state=field("Stato",Intake.STATES.map(x=>[x,x]));
 const pdf=field("Verifica intestazione PDF (facoltativo)");pdf.type="file";pdf.accept=".pdf,application/pdf";
 const note=field("Nota sintetica (facoltativa)");note.maxLength=300;
 let inspected=0,seq=0;
 const seed={clients:[{id:"C-TEST",name:"Cliente dimostrativo"}],sites:[{id:"S-TEST",clientId:"C-TEST",name:"Immobile demo"}],systems:[{id:"SYS-TEST",siteId:"S-TEST",name:"Impianto demo"}],equipment:[{id:"E-TEST",systemId:"SYS-TEST",name:"Generatore demo"}],operators:[{id:"OP-TEST",name:"Tecnico demo"}],appointments:[],interventions:[]};
 const store=Store.create(root.localStorage,seed,{extras:[],quotes:[]});
 function current(){return store.snapshot();}\n try{store.restore();}catch(e){status.textContent="Archivio non leggibile: "+e.message;}
 function options(select,items,empty){select.replaceChildren();const o=el("option",empty,select);o.value="";for(const x of items){const a=el("option",x.name||x.id,select);a.value=x.id;}}
 function refreshSelectors(){const p=current(),f=p.field;options(client,f.clients,"Nessuno");const c=client.value;const choices=Workflow.options(f,c,site.value);options(site,choices.sites,"Nessuna");options(intervention,choices.interventions,"Nessuno");}
 client.addEventListener("change",()=>{const f=current().field;const choices=Workflow.options(f,client.value,"");options(site,choices.sites,"Nessuna");options(intervention,choices.interventions,"Nessuno");});\n site.addEventListener("change",()=>{const f=current().field;options(intervention,Workflow.options(f,client.value,site.value).interventions,"Nessuno");});
 function transact(operation){try{Workflow.apply(store,operation);status.textContent="Archivio TEST aggiornato.";render();}catch(e){status.textContent="Operazione non eseguita: "+e.message+" — ricaricare l’archivio se modificato in un’altra scheda.";}}
 function button(label,cb){const b=el("button",label,actions);b.type="button";b.addEventListener("click",cb);}
 button("Registra documento TEST",()=>{
  const id="TD-TEST-"+Date.now().toString(36)+"-"+(++seq);
  const meta={id,type:kind.value,status:state.value,label:"Documento sintetico "+id,note:note.value,size:inspected,clientId:client.value||null,siteId:site.value||null,interventionId:intervention.value||null,created:"TEST-2026-11-13"};
  return [...p.technicalDocuments,meta];
 }));
 button("Ricarica archivio da dispositivo",()=>{try{store.restore();render();status.textContent="Archivio locale riletto."; }catch(e){status.textContent=e.message;}});
 pdf.addEventListener("change",async()=>{
  inspected=0;const file=pdf.files&&pdf.files[0];if(!file)return;
  if(file.size>25000000||file.size<8){status.textContent="PDF fuori dai limiti.";pdf.value="";return;}
  try{const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
   // pdfSignature validates full byte length; validate header using a small synthetic buffer only.
   const header=String.fromCharCode(...bytes);
   if(!/^%PDF-(1\.[0-7]|2\.0)/.test(header))throw Error("FIRMA_PDF_NON_VALIDA");
   inspected=file.size;status.textContent="Intestazione PDF riconosciuta (controllo preliminare, non verifica del contenuto).";
  }catch(e){pdf.value="";status.textContent="PDF non riconosciuto: "+e.message;}
 });
 function render(){let p;try{p=current();}catch(e){status.textContent="Archivio non leggibile: "+e.message;return;}
  const oldClient=client.value,oldSite=site.value,oldIntervention=intervention.value;refreshSelectors();if([...client.options].some(x=>x.value===oldClient))client.value=oldClient;const choices=Workflow.options(p.field,client.value,oldSite);options(site,choices.sites,"Nessuna");if([...site.options].some(x=>x.value===oldSite))site.value=oldSite;options(intervention,Workflow.options(p.field,client.value,site.value).interventions,"Nessuno");if([...intervention.options].some(x=>x.value===oldIntervention))intervention.value=oldIntervention;
  output.replaceChildren();const summary=Workflow.report(p);el("h4","Registro tecnico TEST ("+summary.total+")",output);el("p","Da classificare/verificare: "+summary.pending.length+" · Non associati: "+summary.unlinked.length,output);
  for(const doc of p.technicalDocuments){const box=el("div","",output);box.className="item";
   el("strong",doc.type+" — "+doc.id,box);el("small",doc.status+" · "+(doc.clientId||"non associato")+" · "+doc.size+" byte",box);
   const change=el("button","Segna da verificare",box);change.type="button";change.className="secondary";
   change.addEventListener("click",()=>transact({action:"update",id:doc.id,patch:{status:"DA_VERIFICARE"}}));
   const del=el("button","Elimina TEST",box);del.type="button";del.className="danger";
   del.addEventListener("click",()=>transact({action:"remove",id:doc.id}));
  }
 }
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init);else init();}
})(typeof globalThis!=="undefined"?globalThis:this);
