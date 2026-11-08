/* 4.0.89 — strumenti backup TEST locali, senza upload a server. */
(function(){
 "use strict";
 function mount(){
  const B=window.ITEWorkspaceBundle89;if(!B||document.getElementById("ite-workspace-backup-89"))return;
  const parent=document.querySelector("main")||document.body;
  const section=document.createElement("section");section.id="ite-workspace-backup-89";
  const title=document.createElement("h3");title.textContent="Backup e ripristino archivi TEST — 4.0.89";section.append(title);
  const note=document.createElement("p");note.textContent="Solo archivi locali TEST: fascicoli, preventivi e contabilità. Prima del ripristino viene validato l'intero pacchetto; nessun invio a server.";section.append(note);
  const save=document.createElement("button");save.type="button";save.textContent="Esporta backup TEST";
  const choose=document.createElement("input");choose.type="file";choose.accept=".json,application/json";choose.setAttribute("aria-label","Seleziona backup TEST");
  const restore=document.createElement("button");restore.type="button";restore.textContent="Verifica e ripristina backup";
  const status=document.createElement("p");status.setAttribute("role","status");
  save.addEventListener("click",()=>{
   try{
    const json=B.serialize(B.snapshot(localStorage));
    const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="ITE-4.0.89-backup-TEST.json";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    status.textContent="Backup TEST esportato. Conservare il file in un luogo sicuro.";
   }catch(e){status.textContent="Esportazione non riuscita: "+e.message;}
  });
  restore.addEventListener("click",async()=>{
   try{
    const file=choose.files&&choose.files[0];if(!file)throw Error("Selezionare un file JSON");
    if(file.size>3001024)throw Error("File troppo grande");
    const bundle=B.deserialize(await file.text());
    if(!window.confirm("Sostituire tutti e tre gli archivi locali TEST? L'operazione non è annullabile senza un backup precedente."))return;
    B.restore(localStorage,bundle);
    status.textContent="Ripristino TEST completato e verificato. Ricaricare la pagina per aggiornare i pannelli.";
   }catch(e){status.textContent="Ripristino non eseguito: "+e.message;}
  });
  section.append(save,choose,restore,status);parent.append(section);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();