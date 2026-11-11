/* I.T.E. 4.0.161 — CSV fornitori e bolle TEST nel magazzino condiviso; nessun upload a server. */
(function(root){"use strict";
let tries=0;
function mount(){
 const S=root.ITE_UnifiedSession129, M=root.ITE_SupplierImport160, I=root.ITE_Inventory154;
 if(!S||!M||!I||!document.getElementById("ite-inventory-155")){if(++tries<80)setTimeout(mount,150);return;}
 if(document.getElementById("ite-supplier-161"))return;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const panel=node("section");panel.id="ite-supplier-161";panel.className="panel";
 panel.append(node("h2","Listini CSV e bolle fornitori — TEST 4.0.161"),node("p","Importazione locale CSV con anteprima obbligatoria. Nessun file inviato a server. Usare soltanto dati fittizi; PDF e documenti reali non sono supportati."));
 const actor=node("input");actor.value="Operatore TEST";const source=node("input");source.placeholder="LISTINO-TEST-001";
 const file=node("input");file.type="file";file.accept=".csv,text/csv,text/plain";const delimiter=node("select");
 for(const [v,t] of [["","Automatico"],[";","Punto e virgola"],[",","Virgola"],["\t","Tabulazione"]]){const o=node("option",t);o.value=v;delimiter.append(o);}
 const label=(text,input)=>{const l=node("label",text);l.append(input);return l;};
 const grid=node("div");grid.className="grid";grid.append(label("Operatore",actor),label("Identificativo importazione univoco",source),label("File CSV locale",file),label("Separatore CSV",delimiter));panel.append(grid);
 const previewButton=node("button","Analizza CSV"),importButton=node("button","Conferma importazione TEST");previewButton.type=importButton.type="button";importButton.disabled=true;
 const actions=node("div");actions.className="actions";actions.append(previewButton,importButton);panel.append(actions);
 const report=node("div"),status=node("p");status.setAttribute("role","status");panel.append(report,status);
 let pending=null,revision=null;
 const invalidate=()=>{pending=null;revision=null;importButton.disabled=true;report.replaceChildren();};
 file.addEventListener("change",invalidate);delimiter.addEventListener("change",invalidate);source.addEventListener("input",invalidate);
 previewButton.onclick=async()=>{invalidate();try{
  const f=file.files&&file.files[0];if(!f||f.size>2000000)throw Error("FILE_ASSENTE_O_TROPPO_GRANDE");
  const text=await f.text();const p=M.preview(text,{delimiter:delimiter.value||undefined});pending=p;revision=S.get().revision;
  report.append(node("h3","Anteprima: "+p.rows.length+" articoli validi; "+p.errors.length+" errori"));
  const table=node("table"),head=node("tr");for(const x of ["Riga","Codice","Descrizione","Prezzo €","IVA"])head.append(node("th",x));table.append(head);
  for(const r of p.rows.slice(0,100)){const tr=node("tr");for(const x of [r.line,r.code,r.description,r.unitPrice,r.vatRate])tr.append(node("td",String(x)));table.append(tr);}
  report.append(table);if(p.rows.length>100)report.append(node("p","Anteprima limitata alle prime 100 righe."));
  for(const e of p.errors.slice(0,30))report.append(node("p","Riga "+e.line+": "+e.error));
  importButton.disabled=!p.valid||!p.rows.length;status.textContent=p.valid?"Anteprima valida. Confermare per aggiornare l'archivio TEST.":"Importazione bloccata: correggere gli errori CSV.";
 }catch(e){status.textContent="CSV respinto: "+e.message;}};
 importButton.onclick=()=>{try{
  if(!pending||!pending.valid||revision!==S.get().revision)throw Error("ANTEPRIMA_SCADUTA");
  const r=M.importCatalog(S.get(),pending,actor.value.trim(),revision,source.value.trim());S.restore(r.state,actor.value.trim());
  status.textContent="Listino TEST importato: "+r.created+" nuovi, "+r.updated+" aggiornati. Revisione "+r.state.revision;invalidate();
 }catch(e){status.textContent="Importazione respinta: "+e.message;importButton.disabled=true;}};
 const delivery=node("fieldset");delivery.append(node("legend","Carico da bolla TEST (righe multiple)"));
 const reference=node("input");reference.placeholder="BOLLA-TEST-001";const lines=node("div"),addLine=node("button","Aggiungi riga"),receive=node("button","Registra bolla TEST");
 addLine.type=receive.type="button";
 function add(){const row=node("div");row.className="grid";const item=node("select"),quantity=node("input");quantity.type="number";quantity.step="0.001";quantity.min="0.001";quantity.placeholder="Quantità";
 row.append(label("Articolo",item),label("Quantità",quantity));lines.append(row);fill(item);return row;}
 function fill(select){const old=select.value;select.replaceChildren();for(const i of I.overview(S.get()).items){const o=node("option",i.code+" — "+i.description);o.value=i.id;select.append(o);}if([...select.options].some(o=>o.value===old))select.value=old;}
 addLine.onclick=add;receive.onclick=()=>{try{const rows=[...lines.children].map(row=>({itemId:row.querySelector("select").value,quantity:Number(row.querySelector('input').value)}));const s=S.get(),next=M.receiveDelivery(s,{reference:reference.value.trim(),lines:rows},actor.value.trim(),s.revision);S.restore(next,actor.value.trim());status.textContent="Bolla TEST registrata: "+rows.length+" righe. Revisione "+next.revision;lines.replaceChildren();add();}catch(e){status.textContent="Bolla respinta: "+e.message;}};
 delivery.append(label("Riferimento bolla univoco",reference),lines,addLine,receive);panel.append(delivery);add();
 S.subscribe(()=>{for(const row of lines.children)fill(row.querySelector("select"));if(pending&&revision!==S.get().revision){pending=null;importButton.disabled=true;status.textContent="Archivio modificato: ripetere anteprima CSV prima dell'importazione.";}}); 
 document.getElementById("ite-inventory-155").append(panel);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
