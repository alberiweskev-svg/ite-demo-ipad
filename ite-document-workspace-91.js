/* I.T.E. 4.0.91 - Documenti TEST: anteprima metadati, nessun upload PDF. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITEDocumentWorkspace91=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
 "use strict";
 const KEY="ite-document-manifest-91-test",LIMIT=1000000;
 const engine=()=>root.ITEDocumentIntake90;
 function load(store){
  const api=engine();if(!api)throw Error("Motore documentale assente");
  const raw=store.getItem(KEY);return raw?api.importJSON(raw):api.empty();
 }
 function save(store,m){
  const api=engine(),raw=api.exportJSON(m);
  if(raw.length>LIMIT)throw Error("Archivio oltre 1 MB");
  store.setItem(KEY,raw);return m;
 }
 function ingest(store,files,meta){
  const api=engine();let manifest=load(store),accepted=[],rejected=[];
  for(const file of Array.from(files||[])){
   try{
    if(!/\.pdf$/i.test(file.name)||file.type&&file.type!=="application/pdf")throw Error("Solo PDF");
    const id="TEST-"+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID().replace(/-/g,"").slice(0,20).toUpperCase():"DOC-"+String(Date.now())+"-"+accepted.length);
    const record=api.createRecord({id,name:file.name,size:file.size,mime:"application/pdf",text:"",issuerIsITE:meta.issuerIsITE,clientId:meta.clientId||null,appointmentId:meta.appointmentId||null});
    manifest=api.append(manifest,record);accepted.push(record);
   }catch(err){rejected.push({name:String(file.name||""),reason:String(err.message)});}
  }
  if(accepted.length)save(store,manifest);
  return {accepted,rejected,manifest};
 }
 function download(name,content){
  const url=URL.createObjectURL(new Blob([content],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function mount(target,store){
  if(!target||!store||!engine())return false;
  if(target.dataset.iteDocument91==="ready")return true;
  target.dataset.iteDocument91="ready";
  const h=document.createElement("h3");h.textContent="Archivio documenti TEST — 4.0.91";
  const note=document.createElement("p");note.textContent="Acquisizione locale dei soli metadati PDF. Il contenuto del documento non viene letto, salvato o caricato online. Classificazione da verificare prima dell'uso.";
  const form=document.createElement("div"),file=document.createElement("input"),issuer=document.createElement("select"),client=document.createElement("input"),appointment=document.createElement("input");
  file.type="file";file.accept=".pdf,application/pdf";file.multiple=true;file.setAttribute("aria-label","Seleziona PDF TEST");
  for(const [v,label] of [["unknown","Emittente da verificare"],["ite","Emessa da I.T.E."],["other","Emessa da altro soggetto"]]){const o=document.createElement("option");o.value=v;o.textContent=label;issuer.append(o);}
  client.placeholder="ID cliente TEST (facoltativo)";appointment.placeholder="ID appuntamento TEST (facoltativo)";
  const add=document.createElement("button");add.textContent="Acquisisci metadati TEST";add.type="button";
  const exp=document.createElement("button");exp.textContent="Esporta manifest TEST";exp.type="button";
  const imp=document.createElement("input");imp.type="file";imp.accept=".json,application/json";imp.setAttribute("aria-label","Importa manifest JSON TEST");
  const clear=document.createElement("button");clear.textContent="Svuota archivio TEST";clear.type="button";
  const status=document.createElement("p");status.setAttribute("role","status");
  const summary=document.createElement("p"),list=document.createElement("div");
  function render(){
   list.replaceChildren();const m=load(store),s=engine().summary(m);
   summary.textContent=s.total+" documenti TEST; "+s.review+" da revisionare.";
   for(const r of m.records){
    const p=document.createElement("p");p.textContent=r.name+" — "+r.type+" — "+(r.reviewRequired?"DA VERIFICARE":"Classificazione preliminare")+" — "+r.id;list.append(p);
   }
  }
  add.onclick=()=>{try{const result=ingest(store,file.files,{issuerIsITE:issuer.value==="unknown"?null:issuer.value==="ite",clientId:client.value,appointmentId:appointment.value});status.textContent=result.accepted.length+" acquisiti, "+result.rejected.length+" rifiutati. "+result.rejected.map(x=>x.reason).join("; ");render();}catch(e){status.textContent=e.message;}};
  exp.onclick=()=>{try{download("ite-documenti-test.json",engine().exportJSON(load(store)));}catch(e){status.textContent=e.message;}};
  imp.onchange=async()=>{try{const f=imp.files&&imp.files[0];if(!f)return;if(f.size>LIMIT)throw Error("File oltre 1 MB");const parsed=engine().importJSON(await f.text());save(store,parsed);status.textContent="Manifest TEST importato";render();}catch(e){status.textContent=e.message;}};
  clear.onclick=()=>{if(root.confirm&&root.confirm("Eliminare solo i metadati TEST?")){store.removeItem(KEY);render();}};
  for(const el of [file,issuer,client,appointment,add,exp,imp,clear]){el.style.margin="6px";form.append(el);}
  target.append(h,note,form,status,summary,list);render();return true;
 }
 function autoMount(){
  if(!root.document||!root.localStorage)return false;
  let target=root.document.getElementById("ite-document-workspace-91");
  if(!target){target=root.document.createElement("section");target.id="ite-document-workspace-91";target.className="panel";const host=root.document.querySelector("main")||root.document.querySelector(".wrap")||root.document.body;host.append(target);}
  return mount(target,root.localStorage);
 }
 if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",autoMount);else autoMount();}
 return Object.freeze({KEY,load,save,ingest,mount,autoMount});
});