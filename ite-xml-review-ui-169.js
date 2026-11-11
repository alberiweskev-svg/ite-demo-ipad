/* I.T.E. 4.0.169 — reviewed XML import in the existing invoices workspace. */
(function(root){"use strict";let tries=0;
function mount(){
 const host=document.getElementById("ite-invoices-151"),S=root.ITE_UnifiedSession129,M=root.ITE_XmlReview169;
 if(!host||!S||!M){if(++tries<80)setTimeout(mount,150);return;}
 if(document.getElementById("ite-xml-review-169"))return;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const label=(t,input)=>{const l=el("label",t);l.append(input);return l;};
 const section=el("section");section.id="ite-xml-review-169";section.className="panel";
 section.append(el("h2","Riconciliazione XML e registrazione controllata — TEST 4.0.169"),el("p","Importazione locale di metadati XML fittizi: i documenti già presenti o in conflitto non vengono registrati. Conferma manuale obbligatoria."));
 const file=el("input");file.type="file";file.accept=".xml,text/xml,application/xml";file.multiple=true;
 const actor=el("input");actor.value="Operatore TEST";const vat=el("input");vat.value="03857941201";
 const rows=el("div"),status=el("p"),button=el("button","Registra solo i nuovi documenti TEST");
 button.type="button";button.disabled=true;status.setAttribute("role","status");
 section.append(label("Seleziona XML",file),label("Operatore",actor),label("Partita IVA aziendale",vat),rows,button,status);
 let plan=null,checks=[];
 function reset(){plan=null;checks=[];rows.replaceChildren();button.disabled=true;}
 function ready(){button.disabled=!(plan&&plan.eligible.length&&checks.length===plan.eligible.length&&checks.every(x=>x.checked));}
 for(const input of [actor,vat])input.addEventListener("input",reset);
 S.subscribe(()=>{if(plan){reset();status.textContent="Archivio aggiornato: ripetere la verifica."; }});
 file.onchange=async()=>{reset();try{
  const selected=Array.from(file.files||[]);
  if(!selected.length||selected.length>50||selected.some(f=>f.size>2000000))throw Error("NUMERO_O_DIMENSIONE_FILE_NON_VALIDI");
  const inputs=await Promise.all(selected.map(async f=>({name:f.name,text:await f.text()})));
  plan=M.review(S.get(),inputs,vat.value);
  plan.reconciliation.results.forEach((r,i)=>{
   const card=el("div");card.className="item";
   card.append(el("strong",plan.extracted[i].fileName),el("p",r.number+" — "+r.date+" — "+r.type+" — "+r.direction+" — "+r.status));
   if(r.status==="NUOVO"){
    const check=el("input");check.type="checkbox";check.style.width="auto";
    check.addEventListener("change",ready);checks.push(check);card.append(label("Confermo la verifica del documento nuovo",check));
   }else card.append(el("small","Escluso dalla registrazione: verificare manualmente il conflitto."));
   rows.append(card);
  });
  status.textContent="Nuovi: "+plan.eligible.length+"; già presenti o in conflitto: "+plan.blocked.length+".";
  ready();
 }catch(err){reset();status.textContent="Verifica respinta: "+err.message;}};
 button.onclick=()=>{try{
  if(!plan||!checks.every(x=>x.checked))throw Error("CONFERME_MANCANTI");
  const out=M.register(S.get(),plan,checks.map(x=>x.checked),actor.value,vat.value);
  S.restore(out.state,actor.value);reset();file.value="";
  status.textContent="Registrati "+out.imported+" documenti TEST nuovi nel registro condiviso.";
 }catch(err){reset();status.textContent="Registrazione respinta: "+err.message;}};
 host.append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
