/* I.T.E. 4.0.77 - Finance intake bridge: local TEST-only batch preview and commit. */
(function(root){"use strict";
if(typeof document==="undefined"||!root.ITEFinanceBridge40||!root.ITEFinanceWorkspace40)return;
const B=root.ITEFinanceBridge40,W=root.ITEFinanceWorkspace40,KEY="ITE-4-FINANCE-WORKSPACE-TEST-1";
const parent=document.getElementById("ite-finance-workspace-test");
if(!parent)return;
const section=document.createElement("section");section.id="ite-finance-bridge-test";section.className="item";
const title=document.createElement("h3");title.textContent="4.0.77 — Importazione e controllo fatture TEST";section.append(title);
const help=document.createElement("p");help.className="hint";help.textContent="Solo dati fittizi. Importa un JSON locale con un array di documenti TEST (massimo 100). Nessun file è trasmesso. Anteprima obbligatoria prima del salvataggio.";section.append(help);
const picker=document.createElement("input");picker.type="file";picker.accept=".json,application/json";picker.setAttribute("aria-label","Seleziona lotto JSON TEST");section.append(picker);
const actions=document.createElement("div");actions.className="actions";section.append(actions);
const preview=document.createElement("button");preview.type="button";preview.textContent="Verifica lotto TEST";actions.append(preview);
const commit=document.createElement("button");commit.type="button";commit.textContent="Registra lotto verificato";commit.disabled=true;actions.append(commit);
const auditButton=document.createElement("button");auditButton.type="button";auditButton.className="secondary";auditButton.textContent="Controlla archivio TEST";actions.append(auditButton);
const status=document.createElement("p");status.setAttribute("role","status");section.append(status);
const results=document.createElement("pre");results.style.whiteSpace="pre-wrap";results.style.overflowWrap="anywhere";section.append(results);
parent.append(section);
let pending=null,original=null;
function load(){return W.importJSON(localStorage.getItem(KEY)||W.exportJSON(W.empty()));}
function appointments(a,batch){return [...new Set([...a.links.map(l=>l.appointmentId),...batch.map(d=>d.appointmentId)])].map(id=>({id}));}
function display(audit){results.textContent=JSON.stringify({documents:audit.documents,links:audit.links,credits:audit.credits,warnings:audit.warnings},null,2);}
function reset(){pending=null;original=null;commit.disabled=true;results.textContent="";}
picker.addEventListener("change",reset);
preview.addEventListener("click",async()=>{
 reset();try{
  if(!picker.files||picker.files.length!==1)throw Error("Selezionare un solo file JSON TEST");
  const file=picker.files[0];if(file.size>1024*1024)throw Error("File oltre 1 MB");
  const data=JSON.parse(await file.text());
  if(!Array.isArray(data)||data.length===0||data.length>100)throw Error("Lotto: da 1 a 100 documenti");
  const current=load(),raw=W.exportJSON(current);
  const next=B.previewMerge(current,data,appointments(current,data));
  pending=next.archive;original=raw;display(next.audit);commit.disabled=false;
  status.textContent="Anteprima pronta: "+data.length+" documenti TEST. Verificare le anomalie prima di registrare.";
 }catch(e){status.textContent="Importazione non consentita: "+e.message;}
});
commit.addEventListener("click",()=>{
 try{
  if(!pending||original===null)throw Error("Anteprima mancante");
  if(W.exportJSON(load())!==original)throw Error("Archivio modificato: ripetere la verifica");
  localStorage.setItem(KEY,W.exportJSON(pending));status.textContent="Lotto TEST registrato nell'archivio locale. Aggiornare il riepilogo finanziario.";
  reset();
 }catch(e){status.textContent="Salvataggio annullato: "+e.message;reset();}
});
auditButton.addEventListener("click",()=>{try{const a=load();display(B.audit(a,appointments(a,[])));status.textContent="Controllo archivio TEST completato";}catch(e){status.textContent=e.message;}});
})(typeof globalThis!=="undefined"?globalThis:this);
