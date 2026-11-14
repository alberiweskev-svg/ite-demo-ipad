/* I.T.E. 4.0.221 — integrated technical document workflow. SYNTHETIC TEST ONLY. */
(function(root){"use strict";
function init(){
 const d=root.document,host=d.getElementById("ite-field-workspace-172");
 const Store=root.ITEWorkspaceStore209,Intake=root.ITEDocumentIntake217,W=root.ITETechnicalWorkflow220;
 if(!host||!Store||!Intake||!W||d.getElementById("ite-technical-register-219"))return;
 const panel=d.createElement("section");panel.id="ite-technical-register-219";panel.className="panel";host.append(panel);
 const title=d.createElement("h3");title.textContent="Documenti tecnici — flusso TEST integrato 4.0.221";panel.append(title);
 const warning=d.createElement("p");warning.className="hint";warning.textContent="Solo dati fittizi. I PDF sono letti localmente per la sola intestazione: nessun file o contenuto PDF viene salvato o inviato.";panel.append(warning);
 const controls=d.createElement("div");controls.className="grid";panel.append(controls);
 const actions=d.createElement("div");actions.className="actions";panel.append(actions);
 const status=d.createElement("p");status.setAttribute("role","status");panel.append(status);
 const output=d.createElement("div");panel.append(output);
 function el(tag,text,parent){const e=d.createElement(tag);if(text!==undefined)e.textContent=text;parent.append(e);return e;}
 function field(label,choices){const l=el("label",label,controls),e=d.createElement(choices?"select":"input");l.append(e);if(choices)setOptions(e,choices);return e;}
 function setOptions(e,items){const previous=e.value;e.replaceChildren();for(const [value,label] of items){const o=el("option",label,e);o.value=value;}if(items.some(x=>x[0]===previous))e.value=previous;}
 function button(label,callback,parent=actions){const b=el("button",label,parent);b.type="button";b.addEventListener("click",callback);return b;}
 const type=field("Tipologia",Intake.TYPES.map(x=>[x,x]));
 const client=field("Cliente TEST",[]),site=field("Sede TEST",[]),intervention=field("Intervento TEST",[]);
 const state=field("Stato",Intake.STATES.map(x=>[x,x]));
 const note=field("Nota sintetica");note.maxLength=300;
 const pdf=field("Controllo intestazione PDF (facoltativo)");pdf.type="file";pdf.accept=".pdf,application/pdf";
 const bulkStatus=field("Stato per modifica multipla",Intake.STATES.map(x=>[x,x]));
 const filter=field("Filtro registro",[["","Tutti"],...Intake.TYPES.map(x=>[x,x])]);
 const seed={clients:[{id:"C-TEST",name:"Cliente dimostrativo"}],sites:[{id:"S-TEST",clientId:"C-TEST",name:"Immobile demo"}],systems:[{id:"SYS-TEST",siteId:"S-TEST",name:"Impianto demo"}],equipment:[{id:"E-TEST",systemId:"SYS-TEST",name:"Generatore demo"}],operators:[{id:"OP-TEST",name:"Tecnico demo"}],appointments:[],interventions:[]};
 const store=Store.create(root.localStorage,seed,{extras:[],quotes:[]});let inspected=0,seq=0;const selected=new Set();
 try{store.restore();}catch(e){status.textContent="Archivio non leggibile: "+e.message;}
 function snapshot(){return store.snapshot();}
 function choices(){const f=snapshot().field;setOptions(client,[["","Nessuno"],...f.clients.map(x=>[x.id,x.name||x.id])]);refreshSite();}
 function refreshSite(){const f=snapshot().field;setOptions(site,[["","Nessuna"],...W.options(f,client.value,"").sites.map(x=>[x.id,x.name])]);refreshIntervention();}
 function refreshIntervention(){const f=snapshot().field;setOptions(intervention,[["","Nessuno"],...W.options(f,client.value,site.value).interventions.map(x=>[x.id,x.name])]);}
 client.addEventListener("change",()=>{site.value="";refreshSite();});
 site.addEventListener("change",refreshIntervention);
 filter.addEventListener("change",render);
 function transact(op){try{W.apply(store,op);status.textContent="Operazione salvata nell'archivio locale TEST.";render();return true;}catch(e){status.textContent="Operazione respinta: "+e.message+". Se un'altra scheda ha modificato l'archivio, ricaricarlo.";return false;}}
 button("Registra documento TEST",()=>{
  const id="TD-TEST-"+Date.now().toString(36)+"-"+(++seq);
  const meta={id,type:type.value,status:state.value,label:"Documento sintetico "+id,note:note.value,size:inspected,clientId:client.value||null,siteId:site.value||null,interventionId:intervention.value||null,created:"TEST-"+new Date().toISOString().slice(0,10)};
  if(transact({action:"add",patch:meta})){note.value="";pdf.value="";inspected=0;}
 });
 button("Applica stato ai selezionati",()=>{
  const ids=[...selected].filter(id=>snapshot().technicalDocuments.some(x=>x.id===id));
  if(!ids.length){status.textContent="Selezionare almeno un documento.";return;}
  if(transactBatch(ids.map(id=>({action:"update",id,patch:{status:bulkStatus.value}}))))selected.clear();
 });
 button("Elimina selezionati TEST",()=>{
  const ids=[...selected].filter(id=>snapshot().technicalDocuments.some(x=>x.id===id));
  if(!ids.length){status.textContent="Selezionare almeno un documento.";return;}
  if(!root.confirm("Eliminare "+ids.length+" registrazioni TEST?"))return;
  if(transactBatch(ids.map(id=>({action:"remove",id}))))selected.clear();
 });
 function transactBatch(operations){try{const result=W.applyBatch(store,operations);status.textContent="Lotto salvato: "+operations.length+" modifiche, revisione "+result.revision+".";render();return true;}catch(e){status.textContent="Lotto annullato integralmente: "+e.message;return false;}}
 button("Anteprima lotto selezionato",()=>{const ids=[...selected].filter(id=>snapshot().technicalDocuments.some(x=>x.id===id));if(!ids.length){status.textContent="Selezionare documenti per l’anteprima.";return;}try{const p=W.preview(store,ids.map(id=>({action:"update",id,patch:{status:bulkStatus.value}})));status.textContent="Anteprima senza salvataggio: "+ids.length+" documenti, stato "+bulkStatus.value+", revisione "+p.revision+".";}catch(e){status.textContent="Anteprima respinta: "+e.message;}});
 button("Esporta registro TEST JSON",()=>{try{const p=snapshot();const raw=JSON.stringify({schema:"ITE_TECHNICAL_EXPORT_223",mode:"SYNTHETIC_TEST_ONLY",revision:p.revision,technicalDocuments:p.technicalDocuments},null,2);const blob=new Blob([raw],{type:"application/json"});const url=URL.createObjectURL(blob);const a=d.createElement("a");a.href=url;a.download="ite-documenti-tecnici-test.json";a.click();root.setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent="Esportati soltanto metadati TEST, nessun PDF.";}catch(e){status.textContent="Esportazione non riuscita: "+e.message;}});
 button("Ricarica archivio",()=>{try{store.restore();render();status.textContent="Archivio locale riletto.";}catch(e){status.textContent=e.message;}});
 pdf.addEventListener("change",async()=>{
  inspected=0;const file=pdf.files&&pdf.files[0];if(!file)return;
  if(file.size<8||file.size>25000000){pdf.value="";status.textContent="PDF fuori dai limiti.";return;}
  try{const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());const header=String.fromCharCode(...bytes);
   if(!/^%PDF-(1\.[0-7]|2\.0)/.test(header))throw Error("FIRMA_PDF_NON_VALIDA");
   inspected=file.size;status.textContent="Intestazione riconosciuta; contenuto e autenticità NON verificati.";
  }catch(e){pdf.value="";status.textContent="PDF non riconosciuto: "+e.message;}
 });
 function render(){
  const previousClient=client.value,previousSite=site.value,previousIntervention=intervention.value;
  let p;try{p=snapshot();}catch(e){status.textContent=e.message;return;}
  choices();if([...client.options].some(x=>x.value===previousClient)){client.value=previousClient;refreshSite();if([...site.options].some(x=>x.value===previousSite)){site.value=previousSite;refreshIntervention();if([...intervention.options].some(x=>x.value===previousIntervention))intervention.value=previousIntervention;}}output.replaceChildren();const report=W.report(p);
  for(const id of [...selected])if(!p.technicalDocuments.some(x=>x.id===id))selected.delete(id);
  el("h4","Registro tecnico TEST: "+report.total+" documenti",output);
  el("p","Da classificare/verificare: "+report.pending.length+" · Non associati: "+report.unlinked.length,output);
  for(const doc of p.technicalDocuments.filter(x=>!filter.value||x.type===filter.value)){
   const item=el("div",undefined,output);item.className="item";
   const choose=el("label","Seleziona per operazione multipla",item),check=el("input",undefined,choose);
   check.type="checkbox";check.style.width="auto";check.checked=selected.has(doc.id);
   check.addEventListener("change",()=>{if(check.checked)selected.add(doc.id);else selected.delete(doc.id);});
   el("strong",doc.type+" — "+doc.id,item);
   el("p",doc.status+" · "+(doc.clientId||"non associato")+" · "+doc.size+" byte",item);
   const editor=el("select",undefined,item);
   setOptions(editor,Intake.STATES.map(x=>[x,x]));editor.value=doc.status;
   const typeEditor=el("select",undefined,item);setOptions(typeEditor,Intake.TYPES.map(x=>[x,x]));typeEditor.value=doc.type;
   const labelEditor=el("input",undefined,item);labelEditor.value=doc.label;labelEditor.maxLength=120;labelEditor.setAttribute("aria-label","Descrizione documento");
   const noteEditor=el("textarea",undefined,item);noteEditor.value=doc.note;noteEditor.maxLength=300;noteEditor.setAttribute("aria-label","Note documento");
   const clientEditor=el("select",undefined,item),siteEditor=el("select",undefined,item),interventionEditor=el("select",undefined,item);
   const f=p.field;
   setOptions(clientEditor,[["","Nessuno"],...f.clients.map(x=>[x.id,x.name||x.id])]);clientEditor.value=doc.clientId||"";
   function updateSites(keep){const old=keep?(doc.siteId||""):"";setOptions(siteEditor,[["","Nessuna"],...W.options(f,clientEditor.value,"").sites.map(x=>[x.id,x.name])]);siteEditor.value=old;updateInterventions(keep);}
   function updateInterventions(keep){const old=keep?(doc.interventionId||""):"";setOptions(interventionEditor,[["","Nessuno"],...W.options(f,clientEditor.value,siteEditor.value).interventions.map(x=>[x.id,x.name])]);interventionEditor.value=old;}
   clientEditor.addEventListener("change",()=>updateSites(false));siteEditor.addEventListener("change",()=>updateInterventions(false));updateSites(true);
   button("Salva modifiche",()=>transact({action:"update",id:doc.id,patch:{type:typeEditor.value,status:editor.value,label:labelEditor.value,note:noteEditor.value,clientId:clientEditor.value||null,siteId:siteEditor.value||null,interventionId:interventionEditor.value||null}}),item);
   button("Elimina TEST",()=>transact({action:"remove",id:doc.id}),item).className="danger";
  }
 }
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init);else init();}
})(typeof globalThis!=="undefined"?globalThis:this);
