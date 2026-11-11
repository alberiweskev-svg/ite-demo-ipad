/* I.T.E. 4.0.167 — integrated multi-XML local TEST console. */
(function(root){"use strict";let attempts=0;
function mount(){
 const host=document.getElementById("ite-invoices-151"),S=root.ITE_UnifiedSession129,M=root.ITE_FatturaPABatch167;
 if(!host||!S||!M){if(++attempts<80)setTimeout(mount,150);return;}
 if(document.getElementById("ite-xml-batch-167"))return;
 const e=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 const box=e("section");box.id="ite-xml-batch-167";box.className="panel";
 box.append(e("h2","Importazione multipla XML FatturaPA — TEST 4.0.167"),e("p","Fino a 50 XML locali. Solo metadati, nessun caricamento sul server. Verifica manuale obbligatoria per ogni documento."));
 const file=e("input");file.type="file";file.multiple=true;file.accept=".xml,text/xml,application/xml";
 const actor=e("input");actor.value="Operatore TEST";const vat=e("input");vat.value="03857941201";
 const rows=e("div"),status=e("p"),btn=e("button","Verifica e registra lotto TEST");btn.type="button";btn.disabled=true;status.setAttribute("role","status");
 const label=(text,node)=>{const l=e("label",text);l.append(node);return l};
 box.append(label("Seleziona XML locali",file),label("Operatore",actor),label("P.IVA aziendale",vat),rows,btn,status);
 let extracted=[],checks=[];
 function clear(){extracted=[];checks=[];rows.replaceChildren();btn.disabled=true;}
 function ready(){btn.disabled=!(extracted.length&&checks.length===extracted.length&&checks.every(c=>c.checked));}
 file.onchange=async()=>{clear();try{
  const selected=Array.from(file.files||[]);if(!selected.length)return;
  if(selected.length>50||selected.some(f=>f.size>2000000))throw Error("NUMERO_O_DIMENSIONE_FILE_NON_VALIDI");
  const input=await Promise.all(selected.map(async f=>({name:f.name,text:await f.text()})));
  extracted=M.extract(input);
  for(const r of extracted){const item=e("div");item.className="item";
   item.append(e("strong",r.fileName),e("pre",JSON.stringify({number:r.number,date:r.date,issuerVat:r.issuerVat,recipientVat:r.recipientVat,sourceType:r.sourceType,net:r.net,vat:r.vat,total:r.total},null,2)));
   const check=e("input");check.type="checkbox";check.style.width="auto";check.addEventListener("change",ready);
   item.append(label("Ho verificato questo documento",check));checks.push(check);rows.append(item);
  }
  status.textContent="Controllare i dati estratti e confermare ogni documento.";ready();
 }catch(err){clear();status.textContent="Lotto respinto: "+err.message;}};
 btn.onclick=()=>{try{
  if(!checks.length||!checks.every(c=>c.checked))throw Error("CONFERME_MANCANTI");
  const state=S.get(),plan=M.preview(state,extracted.map(r=>({...r,confirmed:true})),vat.value);
  const result=M.commit(S.get(),plan,actor.value,vat.value);
  S.restore(result.state,actor.value);clear();file.value="";
  status.textContent="Registrati "+result.imported+" metadati TEST nel registro condiviso.";
 }catch(err){status.textContent="Registrazione respinta: "+err.message;}};
 host.append(box);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
