/* I.T.E. 4.0.176 — local manual backup/restore of synthetic TEST workspace. */
(function(root){"use strict";
function init(){
 const P=root.ITE_PortableTest176,F=root.ITE_FieldWorkspaceBridge174,E=root.ITE_ExtrasWorkspaceBridge175,I=root.ITE_ArchiveIntegrity180,d=root.document;
 if(!P||!F||!E||!I||!d)return;const parent=d.getElementById("ite-field-workspace-172");if(!parent)return;
 const host=d.createElement("div");host.className="panel";host.id="ite-portable-workspace-176";
 const title=d.createElement("h3");title.textContent="Backup e ripristino manuale — sessione TEST 4.0.176";
 const note=d.createElement("p");note.className="hint";note.textContent="Esporta e ripristina esclusivamente dati fittizi. Nessun invio al server e nessun salvataggio automatico. Il ripristino sostituisce la sessione TEST corrente.";
 const status=d.createElement("p");status.setAttribute("role","status");const actions=d.createElement("div");actions.className="actions";
 const exportBtn=d.createElement("button");exportBtn.type="button";exportBtn.textContent="Esporta backup TEST JSON";
 const input=d.createElement("input");input.type="file";input.accept=".json,application/json";input.setAttribute("aria-label","Seleziona backup TEST JSON");
 const importBtn=d.createElement("button");importBtn.type="button";importBtn.textContent="Verifica e ripristina backup TEST";
 actions.append(exportBtn,input,importBtn);host.append(title,note,status,actions);parent.append(host);
 const check=d.createElement("button");check.type="button";check.textContent="Controlla integrità sessione TEST";actions.prepend(check);
 function report(field,extras){const result=I.inspect(field,extras);if(!result.valid)throw Error("INTEGRITA_NON_VALIDA: "+result.issues.slice(0,5).map(x=>x.code+" ("+x.kind+": "+x.id+")").join("; ")+(result.issues.length>5?" + altre "+(result.issues.length-5):""));return result}
 check.addEventListener("click",()=>{try{const result=report(F.snapshot(),E.snapshot());status.textContent="Integrità TEST verificata: "+Object.values(result.stats).reduce((a,b)=>a+b,0)+" record, nessuna anomalia."}catch(err){status.textContent="Integrità TEST: "+err.message}});
 exportBtn.addEventListener("click",()=>{try{const data=JSON.stringify((report(F.snapshot(),E.snapshot()),P.pack(F.snapshot(),E.snapshot())),null,2);const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));const a=d.createElement("a");a.href=url;a.download="ITE-4.0.176-SESSIONE-TEST.json";host.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent="Backup TEST preparato."}catch(err){status.textContent="Esportazione respinta: "+err.message}});
 importBtn.addEventListener("click",async()=>{const file=input.files&&input.files[0];if(!file){status.textContent="Selezionare un file JSON TEST.";return}if(file.size>2000000){status.textContent="File troppo grande (max 2 MB).";return}
 try{const parsed=P.unpack(await file.text());report(parsed.field,parsed.extras);if(!root.confirm("Sostituire l'intera sessione TEST corrente con il backup selezionato?"))return;
 // Both snapshots validated before either bridge is changed.
 const oldField=F.snapshot(),oldExtras=E.snapshot();try{F.restoreTest(parsed.field);E.restoreTest(parsed.extras);report(F.snapshot(),E.snapshot())}catch(restoreError){F.restoreTest(oldField);E.restoreTest(oldExtras);throw restoreError}status.textContent="Sessione TEST ripristinata e verificata. Nessun dato inviato al server."}
 catch(err){status.textContent="Ripristino respinto: "+err.message}});
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
