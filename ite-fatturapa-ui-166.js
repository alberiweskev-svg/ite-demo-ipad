/* I.T.E. 4.0.166 — FatturaPA XML local preview, human-reviewed handoff to shared register. */
(function(root){"use strict";let tries=0;
function mount(){
 const S=root.ITE_UnifiedSession129,B=root.ITE_DocumentBatch165,P=root.ITE_FatturaPA166,host=document.getElementById("ite-invoices-151");
 if(!S||!B||!P||!host){if(++tries<80)setTimeout(mount,150);return;}
 if(document.getElementById("ite-fatturapa-166"))return;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n};
 const section=el("section");section.id="ite-fatturapa-166";section.className="panel";
 section.append(el("h2","Acquisizione XML FatturaPA — TEST 4.0.166"),el("p","Il file XML viene letto soltanto nel browser. Controllare tutti i campi prima della registrazione; nessun invio o emissione fiscale."));
 const file=el("input");file.type="file";file.accept=".xml,text/xml,application/xml";
 const actor=el("input");actor.value="Operatore TEST";const vat=el("input");vat.value="03857941201";
 const checked=el("input");checked.type="checkbox";checked.style.width="auto";
 const preview=el("pre"),status=el("p"),btn=el("button","Registra metadati revisionati TEST");btn.type="button";btn.disabled=true;status.setAttribute("role","status");
 const label=(name,input)=>{const l=el("label",name);l.append(input);return l};
 section.append(label("File XML FatturaPA locale",file),label("Operatore",actor),label("P.IVA aziendale",vat),preview,label("Ho verificato i dati del documento",checked),btn,status);
 let row=null,plan=null;
 function reset(){row=null;plan=null;btn.disabled=true;checked.checked=false;preview.textContent="";}
 file.onchange=async()=>{reset();try{const f=file.files?.[0];if(!f) return;if(f.size>2000000)throw Error("FILE_TROPPO_GRANDE");row=P.parse(await f.text());preview.textContent=JSON.stringify(row,null,2);status.textContent="Metadati estratti: revisione umana obbligatoria.";}catch(e){status.textContent="Acquisizione respinta: "+e.message;}};
 checked.onchange=()=>{plan=null;btn.disabled=!(row&&checked.checked);};
 vat.oninput=()=>{plan=null;btn.disabled=!(row&&checked.checked);};
 btn.onclick=()=>{try{
  if(!row||!checked.checked)throw Error("CONFERMA_OBBLIGATORIA");
  const r={...row,confirmed:true};plan=B.preview(S.get(),[r],vat.value);
  const result=B.commit(S.get(),plan,actor.value,vat.value,plan.revision);
  S.restore(result.state,actor.value);reset();file.value="";status.textContent="Metadati XML registrati nel registro TEST condiviso.";
 }catch(e){plan=null;status.textContent="Registrazione respinta: "+e.message;}};
 host.append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
