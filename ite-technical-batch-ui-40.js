/* I.T.E. 4.0.70 — batch intake in the single TEST demo. No PDF bytes or uploads. */
(function(root){
"use strict";
if(typeof document==="undefined")return;
const R=root.ITEServiceRegistry40,T=root.ITETechnicalDossier40,B=root.ITETechnicalBatch40;
if(!R||!T||!B)return;
const SERVICE_KEY="ite40_service_registry_TEST_v1",TECH_KEY="ITE40_TECH_DOSSIER_TEST_1";
const el=(tag,parent,label)=>{const node=document.createElement(tag);if(label!==undefined)node.textContent=label;if(parent)parent.append(node);return node;};
function mount(){
 const host=document.getElementById("importazioni")||document.querySelector(".wrap");if(!host)return;
 const section=el("section",host);section.className="panel";section.id="ite-batch-intake-40";
 el("h2",section,"Importazione multipla fascicoli tecnici — TEST 4.0.70");
 el("p",section,"Solo metadati sintetici di PDF: non vengono letti, caricati o archiviati file reali. Di.Co., Di.Ri., GAS, POS e CAD 2.7.5 restano invariati.").className="hint";
 const msg=el("p",section);msg.setAttribute("role","status");
 const form=el("form",section);form.className="grid";
 const field=(title,kind)=>{const l=el("label",form,title),x=el(kind==="select"?"select":"input",l);if(kind!=="select")x.type=kind||"text";return x;};
 const ap=field("Appuntamento TEST","select"),type=field("Tipologia documento","select"),title=field("Titolo TEST"),date=field("Data documento","date"),operator=field("Operatore TEST");
 operator.value="TEST-OP-1";date.value=new Date().toISOString().slice(0,10);title.value="Documento tecnico dimostrativo";
 for(const value of T.TYPES){const o=el("option",type,value);o.value=value;}
 const filename=field("Nome PDF sintetico (non selezionare file reali)");filename.value="documento-test.pdf";
 const size=field("Dimensione PDF simulata in byte","number");size.value="1024";size.min="1";size.max="25000000";
 const hash=field("SHA-256 sintetico (64 caratteri esadecimali)");hash.value="a".repeat(64);
 const queue=el("div",section),actions=el("div",section);actions.className="actions";
 const preview=el("pre",section);preview.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";
 const staged=[];
 const read=()=>{
  const service=R.importJSON(root.localStorage.getItem(SERVICE_KEY)||"");
  const bridge=root.ITEServiceTechnicalBridge40;
  if(!bridge)throw Error("Collegamento tecnico non disponibile");
  const hierarchy=bridge.hierarchy(service);
  const raw=root.localStorage.getItem(TECH_KEY);
  const archive=raw?T.importJson(raw,hierarchy):T.empty();
  return {service,hierarchy,archive};
 };
 const refresh=()=>{const {service}=read();const old=ap.value;ap.replaceChildren();for(const a of service.appointments){const o=el("option",ap,a.id);o.value=a.id;}if([...ap.options].some(x=>x.value===old))ap.value=old;};
 const render=()=>{queue.replaceChildren();el("h3",queue,"Coda: "+staged.length+" documenti");for(const x of staged)el("p",queue,x.id+" · "+x.type+" · "+x.appointmentId+" · "+x.attachments[0].name);};
 const action=(label,fn)=>{const b=el("button",actions,label);b.type="button";b.addEventListener("click",()=>{try{fn();}catch(e){msg.textContent="Operazione rifiutata: "+e.message;}});};
 let seq=0;
 form.addEventListener("submit",e=>{e.preventDefault();try{
  if(staged.length>=50)throw Error("Massimo 50 documenti");
  if(!/^TEST-[A-Z0-9-]{2,60}$/.test(ap.value))throw Error("Selezionare un appuntamento TEST");
  const suffix=(Date.now().toString(36)+"-"+String(++seq).padStart(4,"0")).toUpperCase(),name=filename.value.trim();
  if(!/^[-a-zA-Z0-9_. ]{1,176}\.pdf$/i.test(name)||!name.toLowerCase().includes("test"))throw Error("Il nome PDF deve essere sintetico e contenere TEST");
  const item={id:"TEST-BATCH-DOC-"+suffix,appointmentId:ap.value,type:type.value,title:title.value.trim(),date:date.value,
   attachments:[{id:"TEST-BATCH-PDF-"+suffix,name,mime:"application/pdf",bytes:Number(size.value),sha256:hash.value.trim().toLowerCase()}]};
  B.validateBatch([...staged,item]);staged.push(item);render();msg.textContent="Documento TEST aggiunto alla coda";
 }catch(err){msg.textContent=err.message;}});
 const submit=el("button",form,"Aggiungi alla coda");submit.type="submit";
 action("Verifica l'intero lotto",()=>{const {service,archive}=read();const r=B.preview(service,archive,staged,operator.value.trim());preview.textContent=JSON.stringify(r,null,2);msg.textContent=r.ok?"Lotto valido, nessun salvataggio effettuato":r.error;});
 action("Registra lotto TEST",()=>{const {service,hierarchy,archive}=read();const r=B.apply(service,archive,staged,operator.value.trim());
  const serialized=T.exportJson(r.archive,hierarchy);
  // Single localStorage write after complete validation. No PDF bytes, URLs or customer names.
  root.localStorage.setItem(TECH_KEY,serialized);
  staged.length=0;render();preview.textContent=JSON.stringify({added:r.added,attachments:r.attachments,warnings:r.warnings},null,2);
  document.dispatchEvent(new CustomEvent("ite:technical-dossier-updated"));msg.textContent="Metadati TEST registrati nel fascicolo condiviso";});
 action("Svuota coda",()=>{staged.length=0;render();preview.textContent="";msg.textContent="Coda svuotata, archivio invariato";});
 action("Aggiorna appuntamenti",()=>{refresh();msg.textContent="Appuntamenti TEST aggiornati";});
 document.addEventListener("ite:service-registry-updated",()=>{try{refresh();}catch(e){msg.textContent=e.message;}});
 try{refresh();}catch(e){msg.textContent="Prima creare appuntamenti nel registro TEST: "+e.message;}
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})(typeof window!=="undefined"?window:globalThis);
