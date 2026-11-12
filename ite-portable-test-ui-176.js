/* I.T.E. 4.0.176 — local manual backup/restore of synthetic TEST workspace. */
(function(root){"use strict";
function init(){
 const P=root.ITE_PortableTest176,F=root.ITE_FieldWorkspaceBridge174,E=root.ITE_ExtrasWorkspaceBridge175,d=root.document;
 if(!P||!F||!E||!d)return;const parent=d.getElementById("ite-field-workspace-172");if(!parent)return;
 const host=d.createElement("div");host.className="panel";host.id="ite-portable-workspace-176";
 const title=d.createElement("h3");title.textContent="Backup e ripristino manuale — sessione TEST 4.0.176";
 const note=d.createElement("p");note.className="hint";note.textContent="Esporta e ripristina esclusivamente dati fittizi. Nessun invio al server e nessun salvataggio automatico. Il ripristino sostituisce la sessione TEST corrente.";
 const status=d.createElement("p");status.setAttribute("role","status");const actions=d.createElement("div");actions.className="actions";
 const exportBtn=d.createElement("button");exportBtn.type="button";exportBtn.textContent="Esporta backup TEST JSON";
 const input=d.createElement("input");input.type="file";input.accept=".json,application/json";input.setAttribute("aria-label","Seleziona backup TEST JSON");
 const importBtn=d.createElement("button");importBtn.type="button";importBtn.textContent="Verifica e ripristina backup TEST";
 actions.append(exportBtn,input,importBtn);host.append(title,note,status,actions);parent.append(host);
 exportBtn.addEventListener("click",()=>{try{const data=JSON.stringify(P.pack(F.snapshot(),E.snapshot()),null,2);const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));const a=d.createElement("a");a.href=url;a.download="ITE-4.0.176-SESSIONE-TEST.json";host.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent="Backup TEST preparato."}catch(err){status.textContent="Esportazione respinta: "+err.message}});
 importBtn.addEventListener("click",async()=>{const file=input.files&&input.files[0];if(!file){status.textContent="Selezionare un file JSON TEST.";return}if(file.size>2000000){status.textContent="File troppo grande (max 2 MB).";return}
 try{const parsed=P.unpack(await file.text());if(!root.confirm("Sostituire l'intera sessione TEST corrente con il backup selezionato?"))return;
 // Both snapshots validated before either bridge is changed.
 F.restoreTest(parsed.field);E.restoreTest(parsed.extras);status.textContent="Sessione TEST ripristinata. Nessun dato inviato al server."}
 catch(err){status.textContent="Ripristino respinto: "+err.message}});
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
